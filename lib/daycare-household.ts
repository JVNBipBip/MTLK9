import { createHash } from "node:crypto";
import type {
  DocumentReference,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import {
  DaycareError,
  passBalance,
  requireId,
  validDate,
  validateSlot,
  type DaycarePass,
  type DaycareSlot,
} from "./daycare-booking";
import { DAYCARE_MAX_DOGS_PER_DAY } from "./daycare-rules";

export type DaycarePrincipal = { id: string; accessHash: string };
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const emailOf = (app: any) =>
  String(app?.answers?.ownerEmail || "")
    .trim()
    .toLowerCase();
const active = (app: any) =>
  app &&
  !app.isTest &&
  app.status === "approved" &&
  typeof app.accessHash === "string" &&
  !!app.accessHash;
const member = (id: string, app: any) => ({
  id,
  accessHash: String(app.accessHash),
  dogName: String(app.answers.dogName),
  ownerEmail: String(app.answers.ownerEmail),
  ownerName: String(app.answers.ownerName || ""),
  locale: app.locale === "fr" ? ("fr" as const) : ("en" as const),
  secondDog: !!app.secondDogOf,
});

/** Expand only an explicitly staff-verified pair, never every contact with the same email.
 * Rechecking inside write transactions also protects against revocation/relinking races.
 * Existing individual codes continue to work; either approved dog's code opens the pair.
 */
export async function daycareHouseholdAccounts(
  db: Firestore,
  principal: DaycarePrincipal,
  tx?: Transaction,
) {
  const read = (ref: DocumentReference) => (tx ? tx.get(ref) : ref.get());
  const app = (
    await read(db.collection("daycare_applications").doc(principal.id))
  ).data();
  if (!active(app) || app!.accessHash !== principal.accessHash)
    throw new DaycareError("unauthorized", 401);
  const own = member(principal.id, app);
  const email = emailOf(app);
  if (!email) return [own];
  const household = (
    await read(db.collection("daycare_households").doc(hash(email)))
  ).data();
  const ids = [household?.primaryId, household?.secondDogId];
  if (
    ids.some((id) => typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)) ||
    ids[0] === ids[1] ||
    !ids.includes(principal.id)
  )
    return [own];
  const apps = await Promise.all(
    ids.map(async (id) =>
      (await read(db.collection("daycare_applications").doc(id))).data(),
    ),
  );
  const loginApp = apps[ids.indexOf(principal.id)];
  if (!active(loginApp) || loginApp!.accessHash !== principal.accessHash)
    throw new DaycareError("unauthorized", 401);
  if (
    !apps[0] ||
    !apps[1] ||
    apps[0].secondDogOf ||
    apps[1].secondDogOf !== ids[0] ||
    apps.some((value) => emailOf(value) !== email)
  )
    return [own];
  return apps.flatMap((value, index) =>
    active(value) ? [member(ids[index], value)] : [],
  );
}

export type DaycareReservation = {
  applicationId: string;
  passId: string;
  slot: DaycareSlot;
};

export function parseDaycareReservations(value: unknown): DaycareReservation[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 40)
    throw new DaycareError("invalid_request");
  const reservations = value.map((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.applicationId !== "string" ||
      !/^[a-f0-9]{64}$/.test(item.applicationId)
    )
      throw new DaycareError("invalid_request");
    const passId = requireId(item.passId);
    const slot = item.slot;
    if (
      !slot ||
      !validDate(slot.date) ||
      typeof slot.arrival !== "string" ||
      typeof slot.departure !== "string" ||
      !/^\d\d:\d\d$/.test(slot.arrival) ||
      !/^\d\d:\d\d$/.test(slot.departure)
    )
      throw new DaycareError("invalid_request");
    return {
      applicationId: item.applicationId,
      passId,
      slot: {
        date: slot.date,
        arrival: slot.arrival,
        departure: slot.departure,
      },
    };
  });
  const dogs = new Map<string, string>(),
    dates = new Set<string>(),
    dogDates = new Set<string>();
  for (const r of reservations) {
    const key = r.applicationId + ":" + r.slot.date;
    if (
      dogDates.has(key) ||
      (dogs.has(r.applicationId) && dogs.get(r.applicationId) !== r.passId)
    )
      throw new DaycareError("invalid_request");
    dogDates.add(key);
    dogs.set(r.applicationId, r.passId);
    dates.add(r.slot.date);
  }
  // A linked pair reserves the same set of dates, each using its own pass.
  if (
    dogs.size > 2 ||
    dates.size > 20 ||
    new Set(dogs.values()).size !== dogs.size ||
    reservations.length !== dogs.size * dates.size
  )
    throw new DaycareError("invalid_request");
  return reservations.sort(
    (a, b) =>
      a.slot.date.localeCompare(b.slot.date) ||
      a.applicationId.localeCompare(b.applicationId),
  );
}

/** All dates and both dogs commit together. Each day and each pass is read/written once. */
export async function bookDaycareHousehold(
  db: Firestore,
  principal: DaycarePrincipal,
  requestId: string,
  value: unknown,
  now = Date.now(),
) {
  if (
    typeof requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      requestId,
    )
  )
    throw new DaycareError("invalid_request");
  const reservations = parseDaycareReservations(value);
  const signature = JSON.stringify(reservations);
  const requestRef = db
    .collection("daycare_booking_requests")
    .doc(hash(`${principal.id}:${requestId}`));
  return db.runTransaction(async (tx) => {
    const accounts = await daycareHouseholdAccounts(db, principal, tx);
    const dates = [...new Set(reservations.map((r) => r.slot.date))];
    const selected = reservations.map((r) => {
      const account = accounts.find((a) => a.id === r.applicationId);
      if (!account) throw new DaycareError("unauthorized", 401);
      // Preserve the original one-day IDs so pre-deployment requests can still be retried.
      const id = hash(
        requestRef.id +
          ":" +
          r.applicationId +
          (dates.length === 1 ? "" : ":" + r.slot.date),
      );
      return {
        ...r,
        id,
        account,
        bookingRef: db.collection("daycare_bookings").doc(id),
      };
    });
    const previous = (await tx.get(requestRef)).data();
    if (previous) {
      if (previous.signature !== signature)
        throw new DaycareError("request_conflict", 409);
      const bookings = await Promise.all(
        selected.map(async (r) => {
          const record = (await tx.get(r.bookingRef)).data();
          if (
            !record ||
            record.applicationId !== r.applicationId ||
            record.passId !== r.passId
          )
            throw new DaycareError("request_conflict", 409);
          return { id: r.id, status: String(record.status), repeated: true };
        }),
      );
      return { bookings };
    }
    const passes = await Promise.all(
      [...new Set(selected.map((r) => r.passId))].map(async (id) => {
        const ref = db.collection("daycare_passes").doc(id);
        const pass = (await tx.get(ref)).data() as DaycarePass | undefined;
        const rows = selected.filter((r) => r.passId === id);
        if (!pass || pass.applicationId !== rows[0].applicationId)
          throw new DaycareError("not_found", 404);
        if (pass.status !== "paid")
          throw new DaycareError("payment_required", 409);
        const prior = passBalance(pass, pass.allocations, now);
        const allocations = { ...pass.allocations };
        for (const r of rows) {
          validateSlot(r.slot, pass.stay, now);
          allocations[r.id] = { ...r.slot, status: "booked" };
        }
        const balance = passBalance(
          {
            ...pass,
            lockedFirstVisitDate: prior.lockedFirstVisitDate || undefined,
          },
          allocations,
          now,
        );
        if (balance.remaining < 0) throw new DaycareError("no_visits", 409);
        return { ref, pass, allocations, balance, rows };
      }),
    );
    const days = await Promise.all(
      dates.map(async (date) => {
        const ref = db.collection("daycare_days").doc(date);
        const occupants: Record<string, string> = {
          ...(await tx.get(ref)).data()?.occupants,
        };
        for (const r of selected.filter((r) => r.slot.date === date)) {
          if (occupants[r.applicationId])
            throw new DaycareError("already_booked", 409);
          occupants[r.applicationId] = r.id;
        }
        if (Object.keys(occupants).length > DAYCARE_MAX_DOGS_PER_DAY)
          throw new DaycareError("day_full", 409);
        return { ref, occupants };
      }),
    );
    const updatedAtIso = new Date(now).toISOString();
    for (const { ref, pass, allocations, balance, rows } of passes) {
      tx.update(ref, {
        allocations,
        firstVisitDate: balance.firstVisitDate,
        expiresOn: balance.expiresOn,
        lockedFirstVisitDate: balance.lockedFirstVisitDate,
        updatedAtIso,
      });
      for (const r of rows) {
        tx.create(r.bookingRef, {
          ...r.slot,
          status: "booked",
          id: r.id,
          applicationId: r.applicationId,
          passId: r.passId,
          dogName: r.account.dogName,
          ownerName: r.account.ownerName,
          ownerEmail: r.account.ownerEmail,
          stay: pass.stay,
          addOns: pass.addOns,
          householdRequestId: requestRef.id,
          updatedAtIso,
          createdAtIso: updatedAtIso,
          notificationStatus: "pending",
        });
        tx.create(r.bookingRef.collection("history").doc(), {
          action: "book",
          slot: r.slot,
          status: "booked",
          by: "customer",
          householdRequestId: requestRef.id,
          createdAtIso: updatedAtIso,
        });
      }
    }
    for (const day of days)
      tx.set(day.ref, { occupants: day.occupants, updatedAtIso });
    tx.create(requestRef, {
      signature,
      bookingIds: selected.map((r) => r.id),
      createdAtIso: updatedAtIso,
    });
    return {
      bookings: selected.map((r) => ({
        id: r.id,
        status: "booked",
        repeated: false,
      })),
    };
  });
}
