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
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const account = await currentDaycareAccount(request),
      db = getAdminDb();
    const passes = await db
      .collection("daycare_passes")
      .where("applicationId", "==", account.id)
      .get();
    const bookings = await db
      .collection("daycare_bookings")
      .where("applicationId", "==", account.id)
      .get();
    const dates = Array.from({ length: 91 }, (_, i) =>
      addDays(torontoDate(), i),
    ).filter(operatingDay);
    const days = await db.getAll(
      ...dates.map((d) => db.collection("daycare_days").doc(d)),
    );
    return daycareJson({
      dogName: account.dogName,
      secondDog: account.secondDog,
      passes: passes.docs
        .map((d) => {
          const p = d.data() as DaycarePass;
          return {
            id: d.id,
            stay: p.stay,
            addOns: p.addOns,
            visits: p.visits,
            status: p.status,
            subtotalCents: p.subtotalCents,
            totalCents: p.totalCents,
            ...passBalance(p),
            checkoutUrl: p.status === "pending" ? p.checkoutUrl : undefined,
            createdAtIso: p.createdAtIso,
          };
        })
        .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
      bookings: bookings.docs
        .map((d) => {
          const b = d.data();
          return {
            id: d.id,
            passId: b.passId,
            date: b.date,
            arrival: b.arrival,
            departure: b.departure,
            status: b.status,
            stay: b.stay,
            addOns: b.addOns,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
      availability: dates.map((date, i) => ({
        date,
        remaining: Math.max(
          0,
          15 - Object.keys(days[i].data()?.occupants || {}).length,
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
    const account = await currentDaycareAccount(request);
    if (body.action === "checkout")
      return daycareJson(await createDaycareCheckout(account, body));
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
