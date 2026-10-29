import type { Firestore } from "firebase-admin/firestore";
import { sendClientFacingEmail, sendEmail } from "./email";
import {
  clientFacingEmailShell,
  escapeHtmlForEmail,
  CLIENT_EMAIL_ACCENT_PRIMARY,
} from "./client-email-layout";

/** Retryable delivery, separate from the committed booking. Never undo a reservation because SMTP is down. */
export async function notifyDaycareBooking(db: Firestore, id: string) {
  const ref = db.collection("daycare_bookings").doc(id);
  const claimed = await db.runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data();
    if (
      !data ||
      data.notificationStatus === "sent" ||
      (data.notificationStatus === "sending" &&
        Date.now() - Number(data.notificationAttemptAt || 0) < 120000)
    )
      return null;
    tx.update(ref, {
      notificationStatus: "sending",
      notificationAttemptAt: Date.now(),
    });
    return data;
  });
  if (!claimed) return;
  let customerSent = claimed.customerNotifiedVersion === claimed.updatedAtIso;
  let staffSent = claimed.staffNotifiedVersion === claimed.updatedAtIso;
  try {
    const app = (
      await db
        .collection("daycare_applications")
        .doc(claimed.applicationId)
        .get()
    ).data();
    if (!app || app.isTest) throw new Error("Invalid notification target");
    const fr = app.locale === "fr",
      cancelled = claimed.status !== "booked";
    const headline = cancelled
      ? fr
        ? "Visite en garderie annulée"
        : "Daycare visit cancelled"
      : fr
        ? "Votre visite en garderie est confirmée"
        : "Your daycare visit is confirmed";
    const innerHtml = `<p>${escapeHtmlForEmail(String(claimed.dogName))} · ${escapeHtmlForEmail(claimed.date)}</p><p>${escapeHtmlForEmail(claimed.arrival)}–${escapeHtmlForEmail(claimed.departure)} (${fr ? "heure de Montréal" : "Montréal time"})</p><p>${claimed.status === "forfeited" ? (fr ? "La visite est perdue selon la politique d’annulation de moins de 24 heures." : "This visit is forfeited under the less-than-24-hours cancellation policy.") : cancelled ? (fr ? "La visite est retournée à votre solde, selon la validité de votre forfait." : "The visit has returned to your balance, subject to your bundle’s validity period.") : fr ? "Vous pouvez déplacer ou annuler cette visite dans votre portail. Un préavis d’au moins 24 heures est requis pour éviter de perdre la visite." : "You can reschedule or cancel in your portal. At least 24 hours’ notice is required to avoid forfeiting the visit."}</p><p><a href="https://www.mtlcaninetraining.com/${fr ? "fr" : "en"}/daycare/book">${fr ? "Ouvrir mon portail" : "Open my portal"}</a></p>`;
    if (!customerSent)
      customerSent = (
        await sendClientFacingEmail({
          to: app.answers.ownerEmail,
          subject: headline,
          html: clientFacingEmailShell({
            headline,
            preheader: headline,
            accentRgb: CLIENT_EMAIL_ACCENT_PRIMARY,
            innerHtml,
            htmlLang: fr ? "fr" : "en",
          }),
        })
      ).sent;
    if (!staffSent)
      staffSent = (
        await sendEmail({
          to: "mtlcaninetraining@gmail.com",
          subject: `Daycare ${cancelled ? "cancellation" : "reservation"} · ${claimed.date}`,
          html: `<p>A daycare reservation was ${cancelled ? "cancelled" : "saved"}.</p><p><a href="https://mltk-9-admin.vercel.app/daycare-bookings?date=${claimed.date}">Open the daycare calendar</a></p>`,
        })
      ).sent;
  } catch {
    /* Staff can retry failed alerts from the saved booking. */
  }
  await db.runTransaction(async (tx) => {
    const current = (await tx.get(ref)).data();
    if (current?.updatedAtIso !== claimed.updatedAtIso) return;
    tx.update(ref, {
      notificationStatus: customerSent && staffSent ? "sent" : "failed",
      ...(customerSent
        ? { customerNotifiedVersion: claimed.updatedAtIso }
        : {}),
      ...(staffSent ? { staffNotifiedVersion: claimed.updatedAtIso } : {}),
    });
  });
}
