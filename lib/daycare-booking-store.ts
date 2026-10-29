import { createHash, randomBytes } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import {
  DaycareError,
  passBalance,
  requireId,
  torontoTime,
  validateSlot,
  type DaycarePass,
  type DaycareSlot,
} from "./daycare-booking";
import { DAYCARE_MAX_DOGS_PER_DAY } from "./daycare-rules";

export const daycareHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function daycareAccount(db: Firestore, token: string) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new DaycareError("unauthorized", 401);
  const accessHash = daycareHash(token);
  const access = (
    await db.collection("daycare_access").doc(accessHash).get()
  ).data();
  if (!access?.applicationId) throw new DaycareError("unauthorized", 401);
  const app = (
    await db.collection("daycare_applications").doc(access.applicationId).get()
  ).data();
  if (
    !app ||
    app.isTest ||
    app.status !== "approved" ||
    app.accessHash !== accessHash
  )
    throw new DaycareError("unauthorized", 401);
  return {
    id: access.applicationId as string,
    accessHash,
    dogName: String(app.answers.dogName),
    ownerEmail: String(app.answers.ownerEmail),
    locale: app.locale === "fr" ? ("fr" as const) : ("en" as const),
    secondDog: !!app.secondDogOf,
  };
}
export async function issueDaycareAccess(
  db: Firestore,
  id: string,
  staffName: string,
  primaryId?: string,
) {
  if (!/^[a-f0-9]{64}$/.test(id) || staffName.trim().length < 2)
    throw new DaycareError("invalid_request");
  const token = randomBytes(32).toString("hex"),
    accessHash = daycareHash(token);
  const ref = db.collection("daycare_applications").doc(id);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref),
      app = snap.data();
    if (!app || app.isTest || app.status !== "approved")
      throw new DaycareError("approval_required", 409);
    const email = String(app.answers.ownerEmail).trim().toLowerCase();
    const household = db
      .collection("daycare_households")
      .doc(daycareHash(email));
    const householdData = (await tx.get(household)).data();
    if (primaryId) {
      if (!/^[a-f0-9]{64}$/.test(primaryId) || primaryId === id)
        throw new DaycareError("invalid_primary");
      const primary = (
        await tx.get(db.collection("daycare_applications").doc(primaryId))
      ).data();
      if (
        !primary ||
        primary.isTest ||
        primary.status !== "approved" ||
        primary.secondDogOf ||
        !primary.accessHash ||
        String(primary.answers.ownerEmail).trim().toLowerCase() !== email
      )
        throw new DaycareError("same_household_required");
      if (householdData?.secondDogId && householdData.secondDogId !== id)
        throw new DaycareError("second_dog_already_set", 409);
    } else if (app.secondDogOf) {
      throw new DaycareError("keep_primary_link");
    }
    const now = new Date().toISOString();
    tx.create(db.collection("daycare_access").doc(accessHash), {
      applicationId: id,
      createdAtIso: now,
    });
    if (app.accessHash)
      tx.delete(db.collection("daycare_access").doc(app.accessHash));
    tx.update(ref, {
      accessHash,
      accessIssuedAtIso: now,
      accessEmailStatus: "pending",
      secondDogOf: primaryId || null,
    });
    if (primaryId) tx.set(household, { primaryId, secondDogId: id });
    tx.create(ref.collection("review_history").doc(), {
      from: "approved",
      to: "access_issued",
      staffName,
      createdAtIso: now,
    });
    return { email, locale: app.locale, dogName: String(app.answers.dogName) };
  });
  return { ...result, token, accessHash };
}

/** Every balance/capacity change is one transaction. The date's occupant map counts dogs, not households. */
export async function changeDaycareBooking(
  db: Firestore,
  input: {
    applicationId: string;
    accessHash?: string;
    passId: string;
    bookingId: string;
    action: "book" | "cancel" | "reschedule";
    slot?: DaycareSlot;
    staffName?: string;
  },
  now = Date.now(),
) {
  const { applicationId, passId, bookingId, action } = input;
  requireId(passId);
  requireId(bookingId);
  const appRef = db.collection("daycare_applications").doc(applicationId);
  const passRef = db.collection("daycare_passes").doc(passId);
  const bookingRef = db.collection("daycare_bookings").doc(bookingId);
  return db.runTransaction(async (tx) => {
    const [appSnap, passSnap, bookingSnap] = await Promise.all([
      tx.get(appRef),
      tx.get(passRef),
      tx.get(bookingRef),
    ]);
    const app = appSnap.data(),
      pass = passSnap.data() as DaycarePass | undefined,
      existing = bookingSnap.data();
    if (
      !app ||
      app.isTest ||
      (!input.staffName &&
        (app.status !== "approved" || app.accessHash !== input.accessHash))
    )
      throw new DaycareError("unauthorized", 401);
    if (!pass || pass.applicationId !== applicationId)
      throw new DaycareError("not_found", 404);
    if (action !== "cancel" && pass.status !== "paid")
      throw new DaycareError("payment_required", 409);
    if (
      existing &&
      (existing.applicationId !== applicationId || existing.passId !== passId)
    )
      throw new DaycareError("not_found", 404);
    if (action === "book" && existing) {
      if (
        existing.date !== input.slot?.date ||
        existing.arrival !== input.slot?.arrival ||
        existing.departure !== input.slot?.departure
      )
        throw new DaycareError("request_conflict", 409);
      return { id: bookingId, status: existing.status, repeated: true };
    }
    if (action !== "book" && !existing)
      throw new DaycareError("not_found", 404);
    if (action !== "book" && existing?.status !== "booked")
      return { id: bookingId, status: existing?.status, repeated: true };
    const old = pass.allocations[bookingId];
    const late = old && torontoTime(old.date, old.arrival) - now < 86400000;
    if (action === "reschedule" && late)
      throw new DaycareError("late_reschedule");
    if (action !== "cancel") validateSlot(input.slot!, pass.stay, now);
    // Preserve a first visit already started, even when this transaction cancels it.
    const prior = passBalance(pass, pass.allocations, now);
    const allocations = { ...pass.allocations };
    allocations[bookingId] =
      action === "cancel"
        ? { ...old, status: late ? "forfeited" : "cancelled" }
        : { ...input.slot!, status: "booked" };
    const balance = passBalance(
      {
        ...pass,
        lockedFirstVisitDate: prior.lockedFirstVisitDate || undefined,
      },
      allocations,
      now,
    );
    if (balance.remaining < 0) throw new DaycareError("no_visits", 409);
    const oldDate = old?.date,
      newDate = action === "cancel" ? undefined : input.slot!.date;
    const dates = [...new Set([oldDate, newDate].filter(Boolean))] as string[];
    const dayRefs = dates.map((date) =>
      db.collection("daycare_days").doc(date),
    );
    const daySnaps = await Promise.all(dayRefs.map((ref) => tx.get(ref)));
    const days = new Map(
      dates.map((date, i) => [
        date,
        { ...(daySnaps[i].data()?.occupants || {}) } as Record<string, string>,
      ]),
    );
    if (oldDate && days.get(oldDate)![applicationId] === bookingId)
      delete days.get(oldDate)![applicationId];
    if (newDate) {
      const day = days.get(newDate)!;
      if (day[applicationId] && day[applicationId] !== bookingId)
        throw new DaycareError("already_booked", 409);
      if (Object.keys(day).length >= DAYCARE_MAX_DOGS_PER_DAY)
        throw new DaycareError("day_full", 409);
      day[applicationId] = bookingId;
    }
    const updatedAtIso = new Date(now).toISOString(),
      allocation = allocations[bookingId];
    tx.update(passRef, {
      allocations,
      firstVisitDate: balance.firstVisitDate,
      expiresOn: balance.expiresOn,
      lockedFirstVisitDate: balance.lockedFirstVisitDate,
      updatedAtIso,
    });
    dayRefs.forEach((ref, i) =>
      tx.set(ref, { occupants: days.get(dates[i]), updatedAtIso }),
    );
    tx.set(bookingRef, {
      ...allocation,
      id: bookingId,
      applicationId,
      passId,
      dogName: app.answers.dogName,
      ownerName: app.answers.ownerName,
      ownerEmail: app.answers.ownerEmail,
      stay: pass.stay,
      addOns: pass.addOns,
      updatedAtIso,
      createdAtIso: existing?.createdAtIso || updatedAtIso,
      notificationStatus: "pending",
    });
    tx.create(bookingRef.collection("history").doc(), {
      action,
      slot: input.slot || null,
      status: allocation.status,
      by: input.staffName || "customer",
      createdAtIso: updatedAtIso,
    });
    return { id: bookingId, status: allocation.status, repeated: false };
  });
}
