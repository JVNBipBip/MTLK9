import type { Firestore } from "firebase-admin/firestore";
import { sendClientFacingEmail, sendEmail } from "./email";
import {
  clientFacingEmailShell,
  escapeHtmlForEmail,
  CLIENT_EMAIL_ACCENT_PRIMARY,
} from "./client-email-layout";

/** A 20-visit bundle should produce one itinerary, not 20 emails. Individual
 * booking versions still drive staff retries and subsequent cancellation/changes. */
export async function notifyDaycareItinerary(db: Firestore, ids: string[]) {
  if (ids.length < 2 || ids.length > 40 || new Set(ids).size !== ids.length)
    return;
  const attempt = Date.now();
  const refs = ids.map((id) => db.collection("daycare_bookings").doc(id));
  const claim = await db.runTransaction(async (tx) => {
    const rows = await Promise.all(
      refs.map(async (ref) => ({ ref, data: (await tx.get(ref)).data() })),
    );
    const group = rows[0].data?.householdRequestId;
    if (
      !group ||
      rows.some((r) => !r.data || r.data.householdRequestId !== group)
    )
      return;
    const pending = rows.flatMap(({ ref, data: b }) =>
      b &&
      b.status === "booked" &&
      b.updatedAtIso === b.createdAtIso &&
      b.notificationStatus !== "sent"
        ? [{ ref, b }]
        : [],
    );
    if (
      !pending.length ||
      pending.some(
        ({ b }) =>
          b.notificationStatus === "sending" &&
          attempt - Number(b.notificationAttemptAt || 0) < 120000,
      )
    )
      return;
    const apps = await Promise.all(
      [...new Set(pending.map(({ b }) => b.applicationId as string))].map(
        async (id) =>
          (await tx.get(db.collection("daycare_applications").doc(id))).data(),
      ),
    );
    const email = String(apps[0]?.answers?.ownerEmail || "")
      .trim()
      .toLowerCase();
    if (
      !email ||
      apps.some(
        (a) =>
          !a ||
          a.isTest ||
          String(a.answers?.ownerEmail || "")
            .trim()
            .toLowerCase() !== email,
      ) ||
      pending.some(
        ({ b }) =>
          String(b.ownerEmail || "")
            .trim()
            .toLowerCase() !== email,
      )
    )
      return;
    for (const { ref } of pending)
      tx.update(ref, {
        notificationStatus: "sending",
        notificationAttemptAt: attempt,
      });
    return { pending, email, fr: apps[0]?.locale === "fr" };
  });
  if (!claim) return;
  const { pending, email, fr } = claim;
  const customerRows = pending.filter(
    ({ b }) => b.customerNotifiedVersion !== b.updatedAtIso,
  );
  const staffRows = pending.filter(
    ({ b }) => b.staffNotifiedVersion !== b.updatedAtIso,
  );
  const list = (items: typeof pending) =>
    "<ul>" +
    items
      .map(
        ({ b }) =>
          "<li>" +
          [b.date, b.dogName, b.arrival + "–" + b.departure]
            .map((v) => escapeHtmlForEmail(String(v)))
            .join(" · ") +
          "</li>",
      )
      .join("") +
    "</ul>";
  const headline = fr
    ? "Vos visites en garderie sont confirmées"
    : "Your daycare dates are confirmed";
  const [customerSent, staffSent] = await Promise.all([
    !customerRows.length ||
      sendClientFacingEmail({
        to: email,
        subject: headline,
        html: clientFacingEmailShell({
          headline,
          preheader: headline,
          accentRgb: CLIENT_EMAIL_ACCENT_PRIMARY,
          htmlLang: fr ? "fr" : "en",
          innerHtml:
            list(customerRows) +
            '<p><a href="https://www.mtlcaninetraining.com/' +
            (fr ? "fr" : "en") +
            '/daycare/book">' +
            (fr ? "Gérer mes visites" : "Manage my visits") +
            "</a></p>",
        }),
      })
        .then((r) => r.sent)
        .catch(() => false),
    !staffRows.length ||
      sendEmail({
        to: "mtlcaninetraining@gmail.com",
        subject: "Daycare itinerary confirmed",
        html:
          list(staffRows) +
          '<p><a href="https://mltk-9-admin.vercel.app/daycare-bookings?date=' +
          encodeURIComponent(String(staffRows[0]?.b.date)) +
          '">View daycare calendar</a></p>',
      })
        .then((r) => r.sent)
        .catch(() => false),
  ]);
  await db.runTransaction(async (tx) => {
    const current = await Promise.all(pending.map(({ ref }) => tx.get(ref)));
    pending.forEach(({ ref, b }, i) => {
      const fresh = current[i].data();
      if (
        fresh?.updatedAtIso !== b.updatedAtIso ||
        fresh?.notificationAttemptAt !== attempt
      )
        return;
      const customer =
        b.customerNotifiedVersion === b.updatedAtIso || customerSent;
      const staff = b.staffNotifiedVersion === b.updatedAtIso || staffSent;
      tx.update(ref, {
        notificationStatus: customer && staff ? "sent" : "failed",
        ...(customer ? { customerNotifiedVersion: b.updatedAtIso } : {}),
        ...(staff ? { staffNotifiedVersion: b.updatedAtIso } : {}),
      });
    });
  });
}
