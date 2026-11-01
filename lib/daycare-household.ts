import { createHash } from "node:crypto";
import type { DocumentReference, Firestore, Transaction } from "firebase-admin/firestore";
import { DaycareError, passBalance, requireId, validateSlot, type DaycarePass, type DaycareSlot } from "./daycare-booking";
import { DAYCARE_MAX_DOGS_PER_DAY } from "./daycare-rules";

export type DaycarePrincipal = { id: string; accessHash: string };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const emailOf = (app: any) => String(app?.answers?.ownerEmail || "").trim().toLowerCase();
const active = (app: any) => app && !app.isTest && app.status === "approved" && typeof app.accessHash === "string" && !!app.accessHash;
const member = (id: string, app: any) => ({
  id, accessHash: String(app.accessHash), dogName: String(app.answers.dogName),
  ownerEmail: String(app.answers.ownerEmail), locale: app.locale === "fr" ? "fr" as const : "en" as const,
  secondDog: !!app.secondDogOf,
});

/** Expand only an explicitly staff-verified pair, never every contact with the same email.
 * Rechecking inside write transactions also protects against revocation/relinking races.
 * Existing individual codes continue to work; either approved dog's code opens the pair.
 */
export async function daycareHouseholdAccounts(db: Firestore, principal: DaycarePrincipal, tx?: Transaction) {
  const read = (ref: DocumentReference) => tx ? tx.get(ref) : ref.get();
  const app = (await read(db.collection("daycare_applications").doc(principal.id))).data();
  if (!active(app) || app!.accessHash !== principal.accessHash) throw new DaycareError("unauthorized", 401);
  const own = member(principal.id, app);
  const email = emailOf(app);
  if (!email) return [own];
  const household = (await read(db.collection("daycare_households").doc(hash(email)))).data();
  const ids = [household?.primaryId, household?.secondDogId];
  if (ids.some(id => typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)) || ids[0] === ids[1] || !ids.includes(principal.id)) return [own];
  const apps = await Promise.all(ids.map(async id => (await read(db.collection("daycare_applications").doc(id))).data()));
  const loginApp = apps[ids.indexOf(principal.id)];
  if (!active(loginApp) || loginApp!.accessHash !== principal.accessHash) throw new DaycareError("unauthorized", 401);
  if (!apps[0] || !apps[1] || apps[0].secondDogOf || apps[1].secondDogOf !== ids[0] || apps.some(value => emailOf(value) !== email)) return [own];
  return apps.flatMap((value, index) => active(value) ? [member(ids[index], value)] : []);
}

export type DaycareReservation = { applicationId: string; passId: string; slot: DaycareSlot };

export function parseDaycareReservations(value: unknown): DaycareReservation[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) throw new DaycareError("invalid_request");
  const reservations = value.map(item => {
    if (!item || typeof item !== "object" || typeof item.applicationId !== "string" || !/^[a-f0-9]{64}$/.test(item.applicationId)) throw new DaycareError("invalid_request");
    const passId = requireId(item.passId);
    const slot = item.slot;
    if (!slot || typeof slot.date !== "string" || typeof slot.arrival !== "string" || typeof slot.departure !== "string") throw new DaycareError("invalid_request");
    return { applicationId: item.applicationId, passId, slot: { date: slot.date, arrival: slot.arrival, departure: slot.departure } };
  });
  if (new Set(reservations.map(r => r.applicationId)).size !== reservations.length || new Set(reservations.map(r => r.passId)).size !== reservations.length || new Set(reservations.map(r => r.slot.date)).size !== 1) throw new DaycareError("invalid_request");
  return reservations.sort((a, b) => a.applicationId.localeCompare(b.applicationId));
}

/** One transaction for both dogs: two credits and two places, or no changes at all. */
export async function bookDaycareHousehold(db: Firestore, principal: DaycarePrincipal, requestId: string, value: unknown, now = Date.now()) {
  if (typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(requestId)) throw new DaycareError("invalid_request");
  const reservations = parseDaycareReservations(value);
  const signature = JSON.stringify(reservations);
  const requestRef = db.collection("daycare_booking_requests").doc(hash(`${principal.id}:${requestId}`));
  return db.runTransaction(async tx => {
    const accounts = await daycareHouseholdAccounts(db, principal, tx);
    const selected = reservations.map(r => {
      const account = accounts.find(a => a.id === r.applicationId);
      if (!account) throw new DaycareError("unauthorized", 401);
      const id = hash(`${requestRef.id}:${r.applicationId}`);
      return { ...r, id, account, passRef: db.collection("daycare_passes").doc(r.passId), bookingRef: db.collection("daycare_bookings").doc(id) };
    });
    const previous = (await tx.get(requestRef)).data();
    const records = await Promise.all(selected.map(async r => {
      const [passSnap, bookingSnap, appSnap] = await Promise.all([tx.get(r.passRef), tx.get(r.bookingRef), tx.get(db.collection("daycare_applications").doc(r.applicationId))]);
      return { ...r, pass: passSnap.data() as DaycarePass | undefined, existing: bookingSnap.data(), app: appSnap.data()! };
    }));
    if (previous) {
      if (previous.signature !== signature || records.some(r => !r.existing || r.existing.applicationId !== r.applicationId || r.existing.passId !== r.passId)) throw new DaycareError("request_conflict", 409);
      return { bookings: records.map(r => ({ id: r.id, status: r.existing!.status as string, repeated: true })) };
    }
    const planned = records.map(r => {
      if (r.existing) throw new DaycareError("request_conflict", 409);
      if (!r.pass || r.pass.applicationId !== r.applicationId) throw new DaycareError("not_found", 404);
      if (r.pass.status !== "paid") throw new DaycareError("payment_required", 409);
      validateSlot(r.slot, r.pass.stay, now);
      const prior = passBalance(r.pass, r.pass.allocations, now);
      const allocations = { ...r.pass.allocations, [r.id]: { ...r.slot, status: "booked" as const } };
      const balance = passBalance({ ...r.pass, lockedFirstVisitDate: prior.lockedFirstVisitDate || undefined }, allocations, now);
      if (balance.remaining < 0) throw new DaycareError("no_visits", 409);
      return { ...r, allocations, balance };
    });
    const date = reservations[0].slot.date;
    const dayRef = db.collection("daycare_days").doc(date);
    const occupants: Record<string, string> = { ...((await tx.get(dayRef)).data()?.occupants || {}) };
    if (planned.some(r => occupants[r.applicationId])) throw new DaycareError("already_booked", 409);
    if (Object.keys(occupants).length + planned.length > DAYCARE_MAX_DOGS_PER_DAY) throw new DaycareError("day_full", 409);
    const updatedAtIso = new Date(now).toISOString();
    for (const r of planned) {
      occupants[r.applicationId] = r.id;
      tx.update(r.passRef, { allocations: r.allocations, firstVisitDate: r.balance.firstVisitDate, expiresOn: r.balance.expiresOn, lockedFirstVisitDate: r.balance.lockedFirstVisitDate, updatedAtIso });
      tx.create(r.bookingRef, { ...r.slot, status: "booked", id: r.id, applicationId: r.applicationId, passId: r.passId, dogName: r.app.answers.dogName, ownerName: r.app.answers.ownerName, ownerEmail: r.app.answers.ownerEmail, stay: r.pass!.stay, addOns: r.pass!.addOns, householdRequestId: requestRef.id, updatedAtIso, createdAtIso: updatedAtIso, notificationStatus: "pending" });
      tx.create(r.bookingRef.collection("history").doc(), { action: "book", slot: r.slot, status: "booked", by: "customer", householdRequestId: requestRef.id, createdAtIso: updatedAtIso });
    }
    tx.set(dayRef, { occupants, updatedAtIso });
    tx.create(requestRef, { signature, bookingIds: planned.map(r => r.id), createdAtIso: updatedAtIso });
    return { bookings: planned.map(r => ({ id: r.id, status: "booked", repeated: false })) };
  });
}
