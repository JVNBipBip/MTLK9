"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  daycareMoney,
  DAYCARE_BASE_CENTS, DAYCARE_ADD_ON_CENTS, DAYCARE_DISCOUNT_PERCENT,
  quoteDaycare,
  type DaycareStay,
  type DaycareAddOn,
  type DaycareVisits,
} from "@/lib/daycare-pricing";
import { torontoDate, torontoTime, type DaycareSlot } from "@/lib/daycare-booking";
import { DAYCARE_BUNDLE_WEEKS } from "@/lib/daycare-policy";
import { DaycareDatePicker, DaycareSelect } from "./daycare-date-picker";
import { bookableDaycarePasses, type DaycarePortal as Portal, type DaycarePortalBooking, type DaycarePortalDog } from "@/lib/daycare-portal-types";
import { DaycareHouseholdReservationForm } from "./daycare-household-reservation-form";
type Booking = DaycarePortalBooking & { applicationId: string; dogName: string };
const errors: Record<string, [string, string]> = {
  unauthorized: [
    "Enter your current booking code. Contact Nick if it was revoked or replaced.",
    "Entrez votre code actuel. Contactez Nick s’il a été révoqué ou remplacé.",
  ],
  rate_limited: [
    "Too many attempts. Please try again in 15 minutes.",
    "Trop de tentatives. Réessayez dans 15 minutes.",
  ],
  notice_24h: [
    "Please book at least 24 hours before arrival.",
    "Réservez au moins 24 heures avant l’arrivée.",
  ],
  day_full: [
    "There aren’t enough spots for the selected dogs. No new reservations were saved. Please select another day.",
    "Il ne reste pas assez de places pour les chiens sélectionnés. Aucune nouvelle réservation n’a été enregistrée. Choisissez un autre jour.",
  ],
  already_booked: [
    "One of the selected dogs already has a visit on that date. Check your upcoming visits below.",
    "Un des chiens sélectionnés a déjà une visite à cette date. Vérifiez vos prochaines visites ci-dessous.",
  ],
  no_visits: [
    "There are no visits left on this pass.",
    "Il ne reste aucune visite dans ce forfait.",
  ],
  bundle_window: [
    "All visits must fit inside the bundle’s validity period from the first visit.",
    "Toutes les visites doivent respecter la validité du forfait à partir de la première visite.",
  ],
  stay_duration: [
    "Half day: up to 6 hours. Full day: more than 6, up to 11 hours.",
    "Demi-journée : jusqu’à 6 h. Journée complète : plus de 6 h, jusqu’à 11 h.",
  ],
  outside_hours: [
    "Choose an arrival and departure between 7:30 AM and 6:30 PM.",
    "Choisissez une arrivée et un départ entre 7 h 30 et 18 h 30.",
  ],
  late_reschedule: [
    "Less than 24 hours remain. Cancelling now forfeits this visit; a new visit is needed to book another day.",
    "Il reste moins de 24 heures. Une annulation fera perdre cette visite; une nouvelle visite sera nécessaire pour une autre date.",
  ],
  closed_date: [
    "Please select an available Monday or Tuesday.",
    "Choisissez un lundi ou mardi disponible.",
  ],
  payment_required: [
    "Payment must be confirmed before booking. Refresh payments or contact Nick.",
    "Le paiement doit être confirmé avant la réservation. Actualisez les paiements ou contactez Nick.",
  ],
};
export function DaycareBookingPortal({ locale }: { locale: "en" | "fr" }) {
  const fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en);
  const [data, setData] = useState<Portal | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [code, setCode] = useState(""),
    [selectedDogId, setSelectedDogId] = useState(""),
    [stay, setStay] = useState<DaycareStay>("full"),
    [visits, setVisits] = useState<DaycareVisits>(1),
    [addOns, setAddOns] = useState<DaycareAddOn[]>([]);
  const [purchaseId, setPurchaseId] = useState("");
  const [plannedDates,setPlannedDates] = useState<string[]>([]);
  const [showAll,setShowAll] = useState(false);
  // null = follow the account: book when a paid balance exists, otherwise buy first.
  const [step, setStep] = useState<"buy" | "book" | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null),
    [slot, setSlot] = useState<DaycareSlot>({
      date: "",
      arrival: "07:30",
      departure: "18:30",
    });
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (message) {
      messageRef.current?.focus({ preventScroll: true });
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [message]);
  const fail = (key: string) =>
    setMessage(
      errors[key]?.[fr ? 1 : 0] ||
        t(
          "We couldn’t confirm the result. Refresh before retrying, or call Nick at 514 826 9558.",
          "Impossible de confirmer le résultat. Actualisez avant de réessayer, ou appelez Nick au 514 826 9558.",
        ),
    );
  async function post(body: object) {
    const r = await fetch("/api/daycare/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await r.json();
    if (!r.ok) throw new Error(result.error);
    return result;
  }
  async function load() {
    const r = await fetch("/api/daycare/portal", { cache: "no-store" });
    if (r.status === 401) {
      setData(null);
      return;
    }
    const body = await r.json();
    if (!r.ok) throw new Error(body.error);
    setData(body);
    setSelectedDogId(current => body.dogs.some((dog: { id: string }) => dog.id === current) ? current : body.defaultDogId);
    return body as Portal;
  }
  useEffect(() => {
    load().then(async initial=>{
      const url = new URL(window.location.href);
      if (!initial || url.searchParams.get("checkout") !== "returned") return;
      // This URL authorizes nothing. Only reconciled Square payments unlock credits.
      url.searchParams.delete("checkout");
      window.history.replaceState(window.history.state,"",url.pathname+url.search+url.hash);
      await Promise.all(initial.dogs.filter(d=>d.passes.some(p=>p.status==="pending")).map(d=>post({action:"refresh",applicationId:d.id})));
      await load();
      setMessage(t("Back from Square. Check your balance and confirm your dates below; payment alone does not book a place.","De retour de Square. Vérifiez votre solde et confirmez vos dates ci-dessous; le paiement seul ne réserve pas de place."));
    })
      .catch((e) => fail(e.message))
      .finally(() => setLoading(false));
  }, []); // No analytics, storage or URL tokens.
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (e) {
      fail(e instanceof Error ? e.message : "unavailable");
    } finally {
      setBusy(false);
    }
  }
  const field =
    "mt-2 w-full rounded-xl border border-border bg-background p-3 text-base focus:outline-2 focus:outline-primary";
  const button =
    "inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50";
  const money = (cents: number) => daycareMoney(cents, locale);
  const dateLabel = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString(fr ? "fr-CA" : "en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/Toronto",
    });
  const selectedDog = data?.dogs.find(dog => dog.id === selectedDogId) || data?.dogs[0];
  const quote = quoteDaycare(stay, addOns, visits, selectedDog?.secondDog);
  const today = torontoDate();
  const upcoming =
    data?.dogs.flatMap(dog => dog.bookings.map(b => ({ ...b, applicationId: dog.id, dogName: dog.dogName }))).filter((b) => b.status === "booked" && b.date >= today).sort((a,b)=>a.date.localeCompare(b.date) || a.arrival.localeCompare(b.arrival)) ||
    [];
  const selectedPass = data?.dogs.find(dog => dog.id === editing?.applicationId)?.passes.find(
    (p) => p.id === editing?.passId,
  );
  const hasBalance = !!data?.dogs.some(dog => bookableDaycarePasses(dog, today).length > 0);
  const activeStep = editing ? "book" : step ?? (hasBalance ? "book" : "buy");
  const addOnLabel = (key: DaycareAddOn) => ({
    training: t("Complete training", "Entraînement complet"),
    treadmill: t("Treadmill exercise", "Exercice sur tapis roulant"),
    individual: t("One-on-one play", "Jeux individuels"),
  })[key];
  const dogStatus = (dog: DaycarePortalDog) => {
    const passes = bookableDaycarePasses(dog, today);
    const left = passes.reduce((sum, p) => sum + p.remaining, 0);
    const next = upcoming.find(b => b.applicationId === dog.id);
    const useBy = passes.map(p => p.expiresOn).filter(Boolean).sort()[0];
    const detail = next
      ? `${t("Next visit:", "Prochaine visite :")} ${dateLabel(next.date)}`
      : left
        ? t("Ready to book your dates", "Prêt à réserver vos dates")
        : dog.passes.some(p => p.status === "pending")
          ? t("Payment being confirmed", "Paiement en cours de confirmation")
          : t("No paid visits yet", "Aucune visite payée");
    return { left, detail: useBy ? `${detail} · ${t("use by", "à utiliser avant le")} ${dateLabel(useBy)}` : detail };
  };
  const tile =
    "flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary";
  const tileInput = "mt-0.5 size-5 shrink-0 accent-primary";
  return (
    <div className="ph-no-capture space-y-7" data-private>
      {message && (
        <p
          ref={messageRef}
          tabIndex={-1}
          role="status"
          className="scroll-mt-28 rounded-xl border border-primary/30 bg-primary/5 p-4 leading-relaxed outline-none"
        >
          {message}
        </p>
      )}
      {loading ? (
        <p>{t("Loading your portal…", "Chargement du portail…")}</p>
      ) : !data ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <form
          className="rounded-3xl border bg-background p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await post({ action: "login", code });
              setCode("");
              await load();
            });
          }}
        >
          <h2 className="text-2xl font-semibold">
            {t("Already approved? Come on in.", "Déjà approuvé? Bienvenue.")}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t(
              "Use the personal booking code Nick sent you. If our team has approved and linked both dogs in your household, either active code opens both profiles. Each dog keeps its own visit balance.",
              "Utilisez le code personnel envoyé par Nick. Si notre équipe a approuvé et lié les deux chiens de votre foyer, un des codes actifs ouvre les deux profils. Chaque chien garde son propre solde de visites.",
            )}
          </p>
          <label className="mt-6 block font-medium">
            {t("Your booking code", "Votre code de réservation")}
            <input
              className={field}
              type="password"
              autoComplete="current-password"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={100}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <button className={`${button} mt-5 w-full`} disabled={busy}>
            {t("Open my booking portal", "Accéder à mes réservations")}
          </button>
          <a
            className="mt-5 block text-center underline underline-offset-4"
            href={`/${locale}/daycare/apply`}
          >
            {t(
              "New here? Apply for admission",
              "Nouveau? Faire une demande d’admission",
            )}
          </a>
        </form>
        <section className="rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
          <h2 className="text-xl font-semibold">{t("How it works", "Comment ça fonctionne")}</h2>
          <ol className="mt-5 space-y-5">
            {[
              [t("Get approved", "Faites-vous approuver"), t("Apply and meet us for an evaluation. Nick then sends your personal booking code.", "Faites une demande et passez l’évaluation. Nick vous envoie ensuite votre code personnel.")],
              [t("Buy visits", "Achetez des visites"), t("Pick half or full days, add-ons and a bundle. Pay securely with Square.", "Choisissez demi-journées ou journées, options et forfait. Payez de façon sécurisée avec Square.")],
              [t("Book your dates", "Réservez vos dates"), t("Choose your Mondays and Tuesdays, all at once. Move a visit with 24 hours’ notice.", "Choisissez vos lundis et mardis en une fois. Déplacez une visite avec 24 heures d’avis.")],
            ].map(([title, body], index) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 font-semibold">{index + 1}</span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed opacity-85">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        </div>
      ) : selectedDog && (
        <>
          <section className="rounded-3xl border bg-background p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {t(
                    "Mondays & Tuesdays · 7:30 AM–6:30 PM",
                    "Lundis et mardis · 7 h 30 à 18 h 30",
                  )}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {data.dogs.length > 1 ? t("Your daycare household", "Votre foyer à la garderie") : <>{t("A great day for", "Une belle journée pour")} {selectedDog.dogName}</>}
                </h2>
              </div>
              <button
                className="min-h-11 text-sm font-medium underline underline-offset-4"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await post({ action: "logout" });
                    setData(null);
                  })
                }
              >
                {t("Sign out", "Déconnexion")}
              </button>
            </div>
            <div className={`mt-5 grid gap-3 ${data.dogs.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {data.dogs.map(dog => {
                const status = dogStatus(dog);
                return (
                  <div key={dog.id} className="flex items-center justify-between gap-4 rounded-2xl bg-secondary/25 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="font-semibold break-words">
                        {dog.dogName}
                        {dog.secondDog && <span className="ml-2 whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{t("2nd dog −30%", "2e chien −30 %")}</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{status.detail}</p>
                    </div>
                    <p className="shrink-0 text-right">
                      <span className="block text-2xl font-semibold tabular-nums leading-none">{status.left}</span>
                      <span className="text-xs text-muted-foreground">{t("visits left", "visites restantes")}</span>
                    </p>
                  </div>
                );
              })}
            </div>
            {data.dogs.length > 1 && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("One login for both approved dogs. Reserve together or individually, with separate visit balances.", "Un seul accès pour vos deux chiens approuvés. Réservez ensemble ou séparément, avec des soldes de visites distincts.")}</p>}
          </section>

          {upcoming.length > 0 && (
            <section className="rounded-3xl border bg-background p-6 sm:p-8">
              <h3 className="text-xl font-semibold">
                {t("Your upcoming visits", "Vos prochaines visites")}
              </h3>
              <ul className="mt-4 divide-y divide-border">
                {(showAll ? upcoming : upcoming.slice(0,4)).map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                    <div>
                      <p className="font-semibold">{dateLabel(b.date)}{data.dogs.length > 1 && <span className="font-normal text-muted-foreground"> · {b.dogName}</span>}</p>
                      <p className="text-sm text-muted-foreground">{b.arrival}–{b.departure}</p>
                    </div>
                    <div className="flex gap-4 text-sm font-medium">
                      <button
                        className="min-h-11 underline underline-offset-4"
                        disabled={busy}
                        onClick={() => {
                          setEditing(b);
                          setSlot({ date: b.date, arrival: b.arrival, departure: b.departure });
                          document.getElementById("reserve-daycare")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        {t("Reschedule", "Déplacer")}
                      </button>
                      <button className="min-h-11 underline underline-offset-4" disabled={busy} onClick={() => setCancelling(b)}>
                        {t("Cancel", "Annuler")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {upcoming.length>4 && <button type="button" aria-expanded={showAll} onClick={()=>setShowAll(!showAll)} className="mt-2 min-h-11 text-sm font-semibold underline underline-offset-4">{showAll?t("Show fewer visits","Afficher moins de visites"):t("Show all "+upcoming.length+" visits","Afficher les "+upcoming.length+" visites")}</button>}
              {cancelling && (
                <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                  <p className="leading-relaxed">
                    {t(
                      "Cancel this visit? With less than 24 hours’ notice, it is forfeited. Otherwise it returns to this dog’s balance. No automatic cash refund.",
                      "Annuler cette visite? À moins de 24 heures d’avis, elle sera perdue. Sinon, elle revient au solde de ce chien. Aucun remboursement automatique.",
                    )}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await post({ action: "cancel", applicationId: cancelling.applicationId, passId: cancelling.passId, bookingId: cancelling.id });
                          setCancelling(null);
                          setEditing(null);
                          await load();
                          setMessage(t("Cancellation saved.", "Annulation enregistrée."));
                        })
                      }
                    >
                      {t("Confirm cancellation", "Confirmer l’annulation")}
                    </button>
                    <button className="min-h-11 underline underline-offset-4" disabled={busy} onClick={() => setCancelling(null)}>
                      {t("Keep my visit", "Garder ma visite")}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <div role="tablist" aria-label={t("Booking steps", "Étapes de réservation")} className="grid grid-cols-2 gap-1.5 rounded-2xl border bg-background p-1.5">
            {(["buy", "book"] as const).map((key, index) => (
              <button
                key={key}
                id={`daycare-step-${key}`}
                type="button"
                role="tab"
                aria-selected={activeStep === key}
                aria-controls={key === "buy" ? "daycare-purchases" : "reserve-daycare"}
                onClick={() => { setStep(key); setEditing(null); }}
                className={`min-h-14 rounded-xl px-4 py-2.5 text-left transition-colors ${activeStep === key ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary/30"}`}
              >
                <span className="block text-xs font-semibold uppercase tracking-wide opacity-75">{t("Step", "Étape")} {index + 1}</span>
                <span className="block font-semibold">{key === "buy" ? t("Buy visits", "Acheter des visites") : t("Book your dates", "Réserver vos dates")}</span>
              </button>
            ))}
          </div>

          <section
            id="reserve-daycare"
            role="tabpanel"
            aria-labelledby="daycare-step-book"
            hidden={activeStep !== "book"}
            className="scroll-mt-28 rounded-3xl border bg-background p-6 sm:p-8"
            onClickCapture={(event) => {
              // The form's "add visits" link points at the purchase panel: switch steps instead of jumping to a hidden panel.
              if ((event.target as HTMLElement).closest('a[href="#daycare-purchases"]')) {
                event.preventDefault();
                setStep("buy");
              }
            }}
          >
            <h3 className="text-2xl font-semibold">
              {editing
                ? `${t("Move the visit for", "Déplacer la visite de")} ${editing.dogName}`
                : t("Book your dates", "Réservez vos dates")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(
                "Use your paid visits: book one day or your whole bundle at once. Up to 15 dogs per day; book at least 24 hours ahead.",
                "Utilisez vos visites payées : réservez une journée ou tout votre forfait en une fois. Maximum de 15 chiens par jour; réservez au moins 24 heures à l’avance.",
              )}
            </p>
            {!editing && !hasBalance && (
              <div className="mt-6 rounded-2xl bg-secondary/25 p-5 sm:p-6">
                <p className="font-semibold">{t("No paid visits yet", "Aucune visite payée pour le moment")}</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">{t("Buy visits first. Once Square confirms your payment, come back here to pick your dates.", "Achetez d’abord des visites. Dès que Square confirme votre paiement, revenez ici choisir vos dates.")}</p>
                <button type="button" className={`${button} mt-5`} onClick={() => setStep("buy")}>{t("Buy visits", "Acheter des visites")}</button>
              </div>
            )}
            {!editing && hasBalance && <DaycareHouseholdReservationForm key={data.dogs.map(dog => dog.id).join(":")} dogs={data.dogs} availability={data.availability} locale={locale} busy={busy} onBook={async (requestId, reservations) => {
              let saved = false;
              await run(async () => {
                let result;
                try {result = await post({ action: "book-household", requestId, reservations });}
                catch(e) {if (e instanceof Error && ["day_full","already_booked","bundle_window","no_visits","notice_24h"].includes(e.message)) await load();throw e;}
                await load();
                const dateCount = new Set(reservations.map(r=>r.slot.date)).size;
                setMessage(result.bookings.every((booking: { status: string }) => booking.status === "booked")
                  ? dateCount>1 ? t("Your "+dateCount+" daycare dates are confirmed.","Vos "+dateCount+" dates de garderie sont confirmées.") : reservations.length > 1 ? t("Both dogs’ visits are confirmed.", "Les visites des deux chiens sont confirmées.") : t("Your dog’s visit is confirmed.", "La visite de votre chien est confirmée.")
                  : t("This request was already processed. Your visits are up to date below.", "Cette demande a déjà été traitée. Vos visites à jour sont affichées ci-dessous."));
                saved = true;
              });
              return saved;
            }} />}
            {editing && <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await post({ action: "reschedule", applicationId: editing.applicationId, passId: editing.passId, bookingId: editing.id, slot });
                  setEditing(null);
                  await load();
                  setMessage(t("Your visit is confirmed.", "Votre visite est confirmée."));
                });
              }}
            >
              {selectedPass && (
                <p className="text-sm text-muted-foreground">
                  {selectedPass.stay === "half"
                    ? t("Half day: up to 6 hours, including exactly 6 hours.", "Demi-journée : jusqu’à 6 heures, incluant exactement 6 heures.")
                    : t("Full day: more than 6 hours, up to 11 hours.", "Journée complète : plus de 6 heures, jusqu’à 11 heures.")}
                </p>
              )}
              <label className="block font-medium">
                {t("Date", "Date")}
                <DaycareSelect required className={field} value={slot.date} onChange={(e) => setSlot((s) => ({ ...s, date: e.target.value }))}>
                  <option value="">{t("Choose a day", "Choisir un jour")}</option>
                  {data.availability.map((d) => (
                    <option key={d.date} value={d.date} disabled={d.remaining === 0 && editing?.date !== d.date}>
                      {dateLabel(d.date)} · {d.remaining} {t("spots left", "places")}
                    </option>
                  ))}
                </DaycareSelect>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(["arrival", "departure"] as const).map((key) => (
                  <label key={key} className="block font-medium">
                    {key === "arrival" ? t("Drop-off", "Arrivée") : t("Pick-up", "Départ")}
                    <input type="time" required min="07:30" max="18:30" step="900" className={field} value={slot[key]} onChange={(e) => setSlot((s) => ({ ...s, [key]: e.target.value }))} />
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button className={button} disabled={busy}>
                  {t("Save new date", "Confirmer la nouvelle date")}
                </button>
                <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setEditing(null)}>
                  {t("Keep current visit", "Garder la visite actuelle")}
                </button>
              </div>
            </form>}
          </section>

          <section id="daycare-purchases" role="tabpanel" aria-labelledby="daycare-step-buy" hidden={activeStep !== "buy"} className="scroll-mt-28 rounded-3xl border bg-background p-6 sm:p-8">
            <h3 className="text-2xl font-semibold">
              {t("Add visits for", "Ajouter des visites pour")}{" "}{selectedDog.dogName}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(
                "Pay securely with Square, then come back to step 2 to book your dates. Paying doesn’t hold a spot, so check the dates below first if you like.",
                "Payez de façon sécurisée avec Square, puis revenez à l’étape 2 pour réserver vos dates. Le paiement ne retient pas de place : vérifiez les dates ci-dessous au besoin.",
              )}
            </p>
            {data.dogs.length > 1 && <label className="mt-5 block max-w-md font-medium">{t("Which dog are these visits for?", "Pour quel chien sont ces visites?")}
              <DaycareSelect className={field} disabled={busy} value={selectedDog.id} onChange={event => { setSelectedDogId(event.target.value); setPurchaseId("");setPlannedDates([]); }}>
                {data.dogs.map(dog => <option key={dog.id} value={dog.id}>{dog.dogName}{dog.secondDog ? t(" · second dog 30% off", " · deuxième chien : −30 %") : ""}</option>)}
              </DaycareSelect>
            </label>}
            {selectedDog.secondDog && (
              <p className="mt-4 rounded-xl bg-primary/5 p-3 text-sm font-medium">
                {t(
                  "Your second-dog price includes an extra 30% off after bundle savings.",
                  "Votre prix pour le deuxième chien inclut 30 % de rabais supplémentaire après le rabais du forfait.",
                )}
              </p>
            )}
            <form
              className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
              onChange={() => setPurchaseId("")}
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  const requestId = purchaseId || crypto.randomUUID();
                  setPurchaseId(requestId);
                  const result = await post({ action: "checkout", applicationId: selectedDog.id, requestId, stay, addOns, visits, plannedDates });
                  if (result.url) window.location.assign(result.url);
                  else await load();
                });
              }}
            >
              <div className="min-w-0 space-y-7">
                <fieldset>
                  <legend className="mb-3 font-semibold">{t("Day length", "Durée")}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["half", "full"] as const).map(key => (
                      <label key={key} className={tile}>
                        <input type="radio" name="daycare-stay" className={tileInput} checked={stay === key} onChange={() => setStay(key)} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap justify-between gap-x-3 font-semibold">
                            <span>{key === "half" ? t("Half day", "Demi-journée") : t("Full day", "Journée complète")}</span>
                            <span className="tabular-nums">{money(DAYCARE_BASE_CENTS[key])}</span>
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">{key === "half" ? t("Up to 6 hours", "Jusqu’à 6 h") : t("More than 6, up to 11 hours", "Plus de 6 h, jusqu’à 11 h")}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-3 font-semibold">{t("Add-ons included with each visit", "Options incluses à chaque visite")}</legend>
                  <div className="grid gap-3">
                    {(["training", "treadmill", "individual"] as DaycareAddOn[]).map(key => (
                      <label key={key} className={tile}>
                        <input
                          type="checkbox"
                          className={tileInput}
                          checked={addOns.includes(key)}
                          onChange={(e) => setAddOns((a) => e.target.checked ? [...a, key] : a.filter((v) => v !== key))}
                        />
                        <span className="flex min-w-0 flex-1 flex-wrap justify-between gap-x-3">
                          <span className="font-medium">{addOnLabel(key)}</span>
                          <span className="tabular-nums text-muted-foreground">+{money(DAYCARE_ADD_ON_CENTS[key])}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {addOns.includes("training") && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("Complete Training takes place during daycare. You don’t need to book a separate trainer time.","L’entraînement complet a lieu pendant la garderie. Vous n’avez pas à réserver une heure avec un entraîneur.")}</p>}
                </fieldset>
                <fieldset>
                  <legend className="mb-3 font-semibold">{t("Number of visits", "Nombre de visites")}</legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {([1, 5, 10, 20] as const).map((n) => (
                      <label key={n} className={`${tile} flex-col gap-1.5`}>
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="font-semibold">{n} {n === 1 ? t("visit", "visite") : t("visits", "visites")}</span>
                          <input type="radio" name="daycare-visits" className="size-5 shrink-0 accent-primary" checked={visits === n} onChange={() => { setVisits(n as DaycareVisits); setPlannedDates([]); }} />
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {n === 1 ? t("Single visit", "Visite unique") : <>−{DAYCARE_DISCOUNT_PERCENT[n]}% · {DAYCARE_BUNDLE_WEEKS[n]} {t("weeks", "semaines")}</>}
                        </span>
                      </label>
                    ))}
                  </div>
                  {visits > 1 && <p className="mt-3 text-sm text-muted-foreground">{t(`Use all ${visits} visits within ${DAYCARE_BUNDLE_WEEKS[visits as 5 | 10 | 20]} weeks of the first one.`, `Utilisez les ${visits} visites dans les ${DAYCARE_BUNDLE_WEEKS[visits as 5 | 10 | 20]} semaines suivant la première.`)}</p>}
                </fieldset>
                <details className="group rounded-2xl border border-border">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                    <span>{t("Check available dates before paying (optional)", "Voir les dates libres avant de payer (facultatif)")}</span>
                    <ChevronDown aria-hidden className="size-5 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-3 border-t border-border px-4 pt-3 pb-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{t("We’ll remember these dates. No spots are held: after payment, come back to confirm the dates that are still available.","Vos choix seront mémorisés. Aucune place n’est retenue : après le paiement, revenez confirmer les dates encore disponibles.")}</p>
                    <DaycareDatePicker preview availability={data.availability} windows={[{visits}]} limit={visits} dates={plannedDates} onChange={ds=>{setPlannedDates(ds);setPurchaseId("");}} locale={locale} disabled={busy}
                      canUseDay={date=>!!data.availability.find(d=>d.date===date && d.remaining>0) && !selectedDog.bookings.some(b=>b.status==="booked" && b.date===date) && torontoTime(date,stay==="half"?"18:15":"12:15")-Date.now()>=86400000}/>
                  </div>
                </details>
              </div>
              <div className="rounded-2xl bg-primary p-6 text-primary-foreground lg:sticky lg:top-28">
                <p className="text-sm opacity-80">{t("Total before GST & QST", "Total avant TPS et TVQ")}</p>
                <p className="mt-1 text-4xl font-semibold tabular-nums">{money(quote.totalCents)}</p>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3"><dt className="opacity-80">{visits} × {stay === "half" ? t("half day", "demi-journée") : t("full day", "journée complète")}</dt><dd className="tabular-nums">{money(quote.perVisitCents)} {t("each", "chacune")}</dd></div>
                  {quote.savingsCents > 0 && <div className="flex justify-between gap-3 font-semibold"><dt>{t("You save", "Vous économisez")}</dt><dd className="tabular-nums">{money(quote.savingsCents)}</dd></div>}
                </dl>
                <button disabled={busy} className="mt-6 min-h-12 w-full rounded-full bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-background/90 disabled:opacity-50">
                  {t("Continue to secure payment", "Passer au paiement sécurisé")}
                </button>
                <p className="mt-3 text-xs leading-relaxed opacity-80">
                  {t("Taxes and final total are shown on Square before you pay.", "Les taxes et le total final sont affichés sur Square avant de payer.")}
                </p>
              </div>
            </form>
          </section>

          {data.dogs.some(dog => dog.passes.length > 0) && <section className="rounded-3xl border bg-background p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">
                {t("Payments & visit balances", "Paiements et soldes de visites")}
              </h3>
              <button
                disabled={busy}
                className="min-h-11 text-sm font-medium underline underline-offset-4"
                onClick={() =>
                  run(async () => {
                    await Promise.all(data.dogs.map(dog => post({ action: "refresh", applicationId: dog.id })));
                    await load();
                    setMessage(t("Payment status refreshed. Paid visits are ready to reserve.", "État des paiements actualisé. Vous pouvez réserver les visites payées."));
                  })
                }
              >
                {t("Refresh payments after checkout", "Actualiser après le paiement")}
              </button>
            </div>
            <div className={`mt-4 grid gap-4 ${data.dogs.length > 1 ? "md:grid-cols-2" : ""}`}>
              {data.dogs.map(dog => <div key={dog.id} className="min-w-0 rounded-2xl border border-border p-4 sm:p-5">
                <h4 className="font-semibold break-words">{dog.dogName}</h4>
                {!dog.passes.length && <p className="mt-2 text-sm text-muted-foreground">{t("No visits purchased for this dog yet.", "Aucune visite achetée pour ce chien pour le moment.")}</p>}
                {dog.passes.length > 0 && <ul className="mt-2 divide-y divide-border">
                  {dog.passes.map((p) => (
                    <li className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3 text-sm" key={p.id}>
                      <div>
                        <p className="font-medium">
                          {p.visits} {p.visits === 1 ? t("visit", "visite") : t("visits", "visites")} · {p.stay === "half" ? t("Half day", "Demi-journée") : t("Full day", "Journée complète")}
                          {p.addOns.length > 0 && <span className="font-normal text-muted-foreground"> · {p.addOns.map(addOnLabel).join(", ")}</span>}
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {p.status === "paid"
                            ? `${p.remaining} ${t("left", "restantes")}`
                            : p.status === "pending"
                              ? t("Payment not confirmed", "Paiement non confirmé")
                              : t("Contact Nick: payment review", "Contactez Nick : vérification du paiement")}
                          {p.expiresOn ? ` · ${t("Use by", "À utiliser avant le")} ${dateLabel(p.expiresOn)}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tabular-nums">{money(p.totalCents)}</p>
                        {p.status === "pending" && p.checkoutUrl && (
                          <a className="mt-1 inline-block font-medium text-primary underline underline-offset-4" href={p.checkoutUrl}>
                            {t("Resume payment", "Reprendre le paiement")}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>}
              </div>)}
            </div>
          </section>}
        </>
      )}
      <aside className="rounded-3xl border border-border/70 bg-background/60 p-6 text-sm leading-relaxed text-muted-foreground sm:p-8">
        <h3 className="mb-2 font-semibold text-foreground">
          {t("A few important details", "Quelques détails importants")}
        </h3>
        <p>
          {t(
            "Bundles start at the first visit: 5 visits within 4 weeks, 10 within 7 weeks, 20 within 12 weeks. Each dog has its own balance. With at least 24 hours’ notice, move a visit without penalty. With less notice, a cancelled visit is forfeited; single visits are non-refundable. For billing questions, call Nick at 514 826 9558.",
            "Les forfaits commencent à la première visite : 5 visites en 4 semaines, 10 en 7 semaines et 20 en 12 semaines. Chaque chien a son propre solde. Avec au moins 24 heures d’avis, déplacez une visite sans pénalité. Avec moins d’avis, la visite annulée est perdue; les visites individuelles sont non remboursables. Questions de facturation : Nick au 514 826 9558.",
          )}
        </p>
      </aside>
    </div>
  );
}
