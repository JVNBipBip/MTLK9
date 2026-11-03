import {
  addDays,
  DaycareError,
  operatingDay,
  torontoDate,
  validDate,
} from "./daycare-booking";
import { DAYCARE_BUNDLE_WEEKS } from "./daycare-rules";
import type { DaycareVisits } from "./daycare-pricing";

export type DaycareDateWindow = {
  visits: DaycareVisits;
  firstVisitDate?: string | null;
  expiresOn?: string | null;
  lastVisitDate?: string | null;
};

export function lastBundleDay(pass: DaycareDateWindow, firstSelected: string) {
  const anchor =
    pass.firstVisitDate && pass.firstVisitDate < firstSelected
      ? pass.firstVisitDate
      : firstSelected;
  const end =
    pass.visits === 1
      ? anchor
      : addDays(anchor, DAYCARE_BUNDLE_WEEKS[pass.visits] * 7 - 1);
  return pass.expiresOn && pass.expiresOn < end ? pass.expiresOn : end;
}

/** A wishlist for an unpaid checkout, never a reservation or proof of payment. */
export function parseDaycarePlan(
  input: unknown,
  visits: DaycareVisits,
  today = torontoDate(),
): string[] {
  if (input === undefined) return [];
  if (
    !Array.isArray(input) ||
    input.length > visits ||
    !input.every(
      (d) =>
        validDate(d) &&
        operatingDay(d) &&
        d >= today &&
        d <= addDays(today, 180),
    ) ||
    new Set(input).size !== input.length
  )
    throw new DaycareError("invalid_request");
  const sorted = [...input].sort() as string[];
  if (
    sorted.length &&
    sorted[sorted.length - 1] > lastBundleDay({ visits }, sorted[0])
  )
    throw new DaycareError("bundle_window");
  return sorted;
}
