import { DAYCARE_BUNDLE_WEEKS } from "./daycare-rules";
import type {
  DaycareAddOn,
  DaycareStay,
  DaycareVisits,
} from "./daycare-pricing";

export class DaycareError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export type DaycareSlot = { date: string; arrival: string; departure: string };
export type DaycareAllocation = DaycareSlot & {
  status: "booked" | "forfeited" | "cancelled";
};
export type DaycarePass = {
  id: string;
  applicationId: string;
  stay: DaycareStay;
  addOns: DaycareAddOn[];
  visits: DaycareVisits;
  status: "pending" | "paid" | "payment_review";
  allocations: Record<string, DaycareAllocation>;
  lockedFirstVisitDate?: string;
  firstVisitDate?: string | null;
  expiresOn?: string | null;
  subtotalCents: number;
  totalCents: number;
  secondDog: boolean;
  createdAtIso: string;
  orderId?: string;
  checkoutUrl?: string;
  paymentLinkId?: string;
  paidAtIso?: string;
};
export function validDate(date: unknown): date is string {
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T12:00:00Z`)) &&
    new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date
  );
}
export function addDays(date: string, days: number) {
  if (!validDate(date)) throw new DaycareError("invalid_date");
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function torontoDate(now = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}
export function torontoTime(date: string, time: string) {
  if (!validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    throw new DaycareError("invalid_time");
  // Operating hours never cross Toronto's DST transition at 02:00.
  const noon = new Date(`${date}T12:00:00Z`);
  const offset = new Intl.DateTimeFormat("en", {
    timeZone: "America/Toronto",
    timeZoneName: "shortOffset",
  })
    .formatToParts(noon)
    .find((p) => p.type === "timeZoneName")!.value;
  const hours = Number(offset.replace("GMT", ""));
  return Date.parse(`${date}T${time}:00Z`) - hours * 3600000;
}
export function operatingDay(date: string) {
  if (!validDate(date) || date < "2026-11-01") return false;
  return [1, 2].includes(new Date(`${date}T12:00:00Z`).getUTCDay());
}
export function validateSlot(
  slot: DaycareSlot,
  stay: DaycareStay,
  now = Date.now(),
) {
  if (
    !slot ||
    !operatingDay(slot.date) ||
    slot.date > addDays(torontoDate(now), 180)
  )
    throw new DaycareError("closed_date");
  const start = torontoTime(slot.date, slot.arrival),
    end = torontoTime(slot.date, slot.departure);
  if (slot.arrival < "07:30" || slot.departure > "18:30" || end <= start)
    throw new DaycareError("outside_hours");
  if (start - now < 86400000) throw new DaycareError("notice_24h");
  const hours = (end - start) / 3600000;
  if (hours > 11 || (stay === "half" ? hours > 6 : hours <= 6))
    throw new DaycareError("stay_duration");
}
/** Compute expiry from the earliest visit, locking it once that visit starts. */
export function passBalance(
  pass: DaycarePass,
  allocations = pass.allocations,
  now = Date.now(),
) {
  const used = Object.values(allocations).filter(
    (a) => a.status !== "cancelled",
  );
  const started = used
    .filter((a) => torontoTime(a.date, a.arrival) <= now)
    .map((a) => a.date)
    .sort()[0];
  const locked = [pass.lockedFirstVisitDate, started]
    .filter(Boolean)
    .sort()[0] as string | undefined;
  const first = [locked, ...used.map((a) => a.date)]
    .filter(Boolean)
    .sort()[0] as string | undefined;
  const weeks = pass.visits === 1 ? null : DAYCARE_BUNDLE_WEEKS[pass.visits];
  const expiresOn = first && weeks ? addDays(first, weeks * 7 - 1) : null;
  if (expiresOn && used.some((a) => a.date > expiresOn))
    throw new DaycareError("bundle_window");
  return {
    remaining: pass.visits - used.length,
    firstVisitDate: first || null,
    expiresOn,
    lockedFirstVisitDate: locked || null,
  };
}
export function requireId(value: unknown) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{10,80}$/.test(value))
    throw new DaycareError("invalid_id");
  return value;
}
