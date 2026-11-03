import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  daycareAccount,
  changeDaycareBooking,
} from "@/lib/daycare-booking-store";
import {
  addDays,
  DaycareError,
  operatingDay,
  passBalance,
  requireId,
  torontoDate,
  type DaycarePass,
} from "@/lib/daycare-booking";
import {
  currentDaycareAccount,
  DAYCARE_COOKIE,
  daycareBody,
  daycareFailure,
  daycareJson,
  daycareLoginLimit,
} from "@/lib/daycare-http";
import {
  createDaycareCheckout,
  reconcileDaycarePass,
} from "@/lib/daycare-payments";
import { notifyDaycareBooking } from "@/lib/daycare-booking-notification";
import { notifyDaycareItinerary } from "@/lib/daycare-itinerary-notification";
import { DAYCARE_MAX_DOGS_PER_DAY } from "@/lib/daycare-rules";
import { bookDaycareHousehold, daycareHouseholdAccounts, parseDaycareReservations } from "@/lib/daycare-household";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const account = await currentDaycareAccount(request),
      db = getAdminDb();
    const accounts = await daycareHouseholdAccounts(db, account);
    const dogs = await Promise.all(accounts.map(async dog => {
      const [passes, bookings] = await Promise.all([
        db.collection("daycare_passes").where("applicationId", "==", dog.id).get(),
        db.collection("daycare_bookings").where("applicationId", "==", dog.id).get(),
      ]);
      return {
        id: dog.id, dogName: dog.dogName, secondDog: dog.secondDog,
        passes: passes.docs.map(d => {
          const p = d.data() as DaycarePass;
          return { id: d.id, stay: p.stay, addOns: p.addOns, visits: p.visits, status: p.status, subtotalCents: p.subtotalCents, totalCents: p.totalCents, ...passBalance(p), plannedDates: p.plannedDates || [], checkoutUrl: p.status === "pending" ? p.checkoutUrl : undefined, createdAtIso: p.createdAtIso };
        }).sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
        bookings: bookings.docs.map(d => {
          const b = d.data();
          return { id: d.id, passId: b.passId, date: b.date, arrival: b.arrival, departure: b.departure, status: b.status, stay: b.stay, addOns: b.addOns };
        }).sort((a, b) => a.date.localeCompare(b.date)),
      };
    }));
    const today = torontoDate();
    const dates = Array.from({ length: 181 }, (_, i) =>
      addDays(today, i),
    ).filter(operatingDay);
    const days = await db.getAll(
      ...dates.map((d) => db.collection("daycare_days").doc(d)),
    );
    return daycareJson({
      // Keep the original single-dog fields for clients open during deployment.
      ...dogs.find(dog => dog.id === account.id),
      dogs,
      defaultDogId: account.id,
      availability: dates.map((date, i) => ({
        date,
        remaining: Math.max(
          0,
          DAYCARE_MAX_DOGS_PER_DAY - Object.keys(days[i].data()?.occupants || {}).length,
        ),
      })),
    });
  } catch (error) {
    return daycareFailure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await daycareBody(request),
      db = getAdminDb();
    if (body.action === "logout") {
      const response = daycareJson({ ok: true });
      response.cookies.set(DAYCARE_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    if (body.action === "login") {
      await daycareLoginLimit(request);
      const code =
        typeof body.code === "string"
          ? body.code.replace(/\s/g, "").toLowerCase()
          : "";
      await daycareAccount(db, code);
      const response = daycareJson({ ok: true });
      response.cookies.set(DAYCARE_COOKIE, code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 86400,
      });
      return response;
    }
    const principal = await currentDaycareAccount(request);
    const accounts = await daycareHouseholdAccounts(db, principal);
    if (body.action === "book-household") {
      const reservations = parseDaycareReservations(body.reservations);
      const distinctPasses = [...new Map(reservations.map(r=>[r.passId,r])).values()];
      for (const reservation of distinctPasses) {
        if (!accounts.some(a => a.id === reservation.applicationId)) throw new DaycareError("unauthorized", 401);
        const pass = await db.collection("daycare_passes").doc(reservation.passId).get();
        if (pass.data()?.applicationId !== reservation.applicationId) throw new DaycareError("not_found", 404);
      }
      await Promise.all(distinctPasses.map(r => reconcileDaycarePass(r.passId)));
      const result = await bookDaycareHousehold(db, principal, body.requestId, reservations);
      if (reservations[0].slot.date !== reservations[reservations.length-1].slot.date)
        await notifyDaycareItinerary(db, result.bookings.map(b=>b.id)).catch(()=>{});
      else await Promise.all(result.bookings.map(b => notifyDaycareBooking(db, b.id).catch(() => {})));
      return daycareJson(result);
    }
    const account = accounts.find(a => a.id === (body.applicationId || principal.id));
    if (!account) throw new DaycareError("unauthorized", 401);
    if (body.action === "checkout")
      return daycareJson(await createDaycareCheckout({ ...account, principal }, body));
    if (body.action === "refresh") {
      const passes = await db
        .collection("daycare_passes")
        .where("applicationId", "==", account.id)
        .get();
      // Refresh only recent pending purchases; webhooks also reconcile paid/refunded orders.
      for (const pass of passes.docs
        .filter((d) => d.data().status === "pending")
        .sort((a, b) =>
          b.data().createdAtIso.localeCompare(a.data().createdAtIso),
        )
        .slice(0, 5))
        await reconcileDaycarePass(pass.id);
      return daycareJson({ ok: true });
    }
    if (["book", "cancel", "reschedule"].includes(body.action)) {
      if (body.action !== "cancel") {
        const pass = await db
          .collection("daycare_passes")
          .doc(requireId(body.passId))
          .get();
        if (pass.data()?.applicationId !== account.id)
          throw new DaycareError("not_found", 404);
        await reconcileDaycarePass(pass.id);
      }
      const result = await changeDaycareBooking(db, {
        applicationId: account.id,
        accessHash: account.accessHash,
        principal,
        passId: body.passId,
        bookingId: body.bookingId,
        action: body.action,
        slot: body.slot,
      });
      await notifyDaycareBooking(db, result.id).catch(() => {});
      return daycareJson(result);
    }
    throw new DaycareError("invalid_request");
  } catch (error) {
    return daycareFailure(error);
  }
}
