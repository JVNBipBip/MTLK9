import type { Firestore } from "firebase-admin/firestore";
import { addDays, torontoDate } from "./daycare-booking";
import { sendClientFacingEmail } from "./email";
import {
  clientFacingEmailShell,
  escapeHtmlForEmail,
  CLIENT_EMAIL_ACCENT_PRIMARY,
} from "./client-email-layout";

const dayLabel = (date: string, fr: boolean) =>
  new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));

/** Daily cron. Visits two days out get one email per household, sent while there
 * is still time to cancel or move them before the 24-hour forfeit cutoff. */
export async function sendDaycareReminders(db: Firestore, now = Date.now()) {
  const date = addDays(torontoDate(now), 2);
  const households = new Map<string, string[]>();
  for (const doc of (
    await db.collection("daycare_bookings").where("date", "==", date).get()
  ).docs) {
    const b = doc.data();
    const email = String(b.ownerEmail || "")
      .trim()
      .toLowerCase();
    if (b.status !== "booked" || b.reminderSentFor === date || !email)
      continue;
    households.set(email, [...(households.get(email) || []), doc.id]);
  }
  let sent = 0,
    failed = 0;
  for (const [email, ids] of households) {
    const result = await remindHousehold(db, date, email, ids);
    if (result === true) sent++;
    if (result === false) failed++;
  }
  return { date, sent, failed };
}

async function remindHousehold(
  db: Firestore,
  date: string,
  email: string,
  ids: string[],
) {
  const attempt = Date.now();
  const refs = ids.map((id) => db.collection("daycare_bookings").doc(id));
  const claim = await db.runTransaction(async (tx) => {
    const rows = await Promise.all(
      refs.map(async (ref) => ({ ref, b: (await tx.get(ref)).data() })),
    );
    const due = rows.flatMap(({ ref, b }) =>
      b &&
      b.status === "booked" &&
      b.date === date &&
      b.reminderSentFor !== date &&
      String(b.ownerEmail || "")
        .trim()
        .toLowerCase() === email
        ? [{ ref, b }]
        : [],
    );
    if (
      !due.length ||
      due.some(
        ({ b }) =>
          b.reminderStatus === "sending" &&
          attempt - Number(b.reminderAttemptAt || 0) < 120000,
      )
    )
      return;
    const apps = await Promise.all(
      [...new Set(due.map(({ b }) => b.applicationId as string))].map(
        async (id) =>
          (await tx.get(db.collection("daycare_applications").doc(id))).data(),
      ),
    );
    if (
      apps.some(
        (a) =>
          !a ||
          a.isTest ||
          String(a.answers?.ownerEmail || "")
            .trim()
            .toLowerCase() !== email,
      )
    )
      return;
    for (const { ref } of due)
      tx.update(ref, { reminderStatus: "sending", reminderAttemptAt: attempt });
    return { due, fr: apps[0]?.locale === "fr" };
  });
  if (!claim) return;
  const { due, fr } = claim;
  const t = (en: string, french: string) => (fr ? french : en);
  const day = dayLabel(date, fr);
  // Moving or cancelling is free until 24 hours before the earliest drop-off.
  const deadline = `${dayLabel(addDays(date, -1), fr)} ${t("at", "à")} ${
    due.map(({ b }) => String(b.arrival)).sort()[0]
  }`;
  const headline = t(
    `Reminder: daycare on ${day}`,
    `Rappel : garderie le ${day}`,
  );
  const visits =
    "<ul>" +
    due
      .map(
        ({ b }) =>
          "<li>" +
          [b.dogName, b.arrival + "–" + b.departure]
            .map((v) => escapeHtmlForEmail(String(v)))
            .join(" · ") +
          "</li>",
      )
      .join("") +
    "</ul>";
  const sent = await sendClientFacingEmail({
    to: email,
    subject: headline,
    html: clientFacingEmailShell({
      headline,
      preheader: headline,
      accentRgb: CLIENT_EMAIL_ACCENT_PRIMARY,
      htmlLang: fr ? "fr" : "en",
      innerHtml:
        visits +
        "<p>" +
        escapeHtmlForEmail(
          t(
            `Need to cancel or reschedule? Do it in your portal before ${deadline} (Montréal time). Less than 24 hours before drop-off, the visit is forfeited and not refunded.`,
            `Besoin d’annuler ou de déplacer? Faites-le dans votre portail avant le ${deadline} (heure de Montréal). À moins de 24 heures de l’arrivée, la visite est perdue et non remboursée.`,
          ),
        ) +
        '</p><p><a href="https://www.mtlcaninetraining.com/' +
        (fr ? "fr" : "en") +
        '/daycare/book">' +
        t("Manage my visits", "Gérer mes visites") +
        "</a></p>",
    }),
  })
    .then((r) => r.sent)
    .catch(() => false);
  await db.runTransaction(async (tx) => {
    const current = await Promise.all(due.map(({ ref }) => tx.get(ref)));
    due.forEach(({ ref }, i) => {
      // A reschedule or cancellation rewrites the booking; leave that version alone.
      if (current[i].data()?.reminderAttemptAt !== attempt) return;
      tx.update(ref, {
        reminderStatus: sent ? "sent" : "failed",
        ...(sent ? { reminderSentFor: date } : {}),
      });
    });
  });
  return sent;
}
