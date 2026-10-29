"use client";
import { useEffect, useState } from "react";
import {
  daycareMoney,
  quoteDaycare,
  type DaycareStay,
  type DaycareAddOn,
  type DaycareVisits,
} from "@/lib/daycare-pricing";
import { torontoDate, type DaycareSlot } from "@/lib/daycare-booking";

type Pass = {
  id: string;
  stay: DaycareStay;
  addOns: DaycareAddOn[];
  visits: number;
  status: string;
  remaining: number;
  expiresOn: string | null;
  checkoutUrl?: string;
  totalCents: number;
};
type Booking = DaycareSlot & { id: string; passId: string; status: string };
type Portal = {
  dogName: string;
  secondDog: boolean;
  passes: Pass[];
  bookings: Booking[];
  availability: { date: string; remaining: number }[];
};
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
    "That date just filled up. Please select another day.",
    "Cette date vient d’être remplie. Choisissez un autre jour.",
  ],
  already_booked: [
    "Your dog already has a visit on that date.",
    "Votre chien a déjà une visite à cette date.",
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
    [stay, setStay] = useState<DaycareStay>("full"),
    [visits, setVisits] = useState<DaycareVisits>(1),
    [addOns, setAddOns] = useState<DaycareAddOn[]>([]);
  const [purchaseId, setPurchaseId] = useState(""),
    [passId, setPassId] = useState(""),
    [bookingId, setBookingId] = useState("");
  const [editing, setEditing] = useState<Booking | null>(null),
    [slot, setSlot] = useState<DaycareSlot>({
      date: "",
      arrival: "07:30",
      departure: "18:30",
    });
  const [cancelling, setCancelling] = useState<Booking | null>(null);
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
  }
  useEffect(() => {
    load()
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
  const quote = quoteDaycare(stay, addOns, visits, data?.secondDog);
  const today = torontoDate();
  const upcoming =
    data?.bookings.filter((b) => b.status === "booked" && b.date >= today) ||
    [];
  const selectedPass = data?.passes.find(
    (p) => p.id === (editing?.passId || passId),
  );
  return (
    <div className="ph-no-capture space-y-7" data-private>
      {message && (
        <p
          role="status"
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 leading-relaxed"
        >
          {message}
        </p>
      )}
      {loading ? (
        <p>{t("Loading your portal…", "Chargement du portail…")}</p>
      ) : !data ? (
        <form
          className="max-w-xl rounded-3xl border bg-background p-6 sm:p-8"
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
              "Use the personal booking code Nick sent you after your dog’s evaluation. Each dog has its own code and visit balance.",
              "Utilisez le code personnel envoyé par Nick après l’évaluation de votre chien. Chaque chien a son code et son solde de visites.",
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
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">
                {t("A great day for", "Une belle journée pour")} {data.dogName}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t(
                  "Mondays & Tuesdays · 7:30 AM–6:30 PM · Montréal time",
                  "Lundis et mardis · 7 h 30 à 18 h 30 · Heure de Montréal",
                )}
              </p>
            </div>
            <button
              className="min-h-11 underline"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await post({ action: "logout" });
                  setData(null);
                })
              }
            >
              {t("Sign out / switch dog", "Déconnexion / autre chien")}
            </button>
          </div>
          <section className="rounded-3xl border bg-background p-6 sm:p-8">
            <h3 className="text-xl font-semibold">
              {t("Your upcoming visits", "Vos prochaines visites")}
            </h3>
            {!upcoming.length && (
              <p className="mt-4 text-muted-foreground">
                {t(
                  "No visits reserved yet. Buy a visit or bundle below, then choose your dates.",
                  "Aucune visite réservée. Achetez une visite ou un forfait ci-dessous, puis choisissez vos dates.",
                )}
              </p>
            )}
            <div className="mt-4 space-y-3">
              {upcoming.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-secondary/30 p-4"
                >
                  <div>
                    <strong>{dateLabel(b.date)}</strong>
                    <p className="mt-1 text-sm">
                      {b.arrival}–{b.departure}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button
                      className="min-h-11 underline"
                      disabled={busy}
                      onClick={() => {
                        setEditing(b);
                        setSlot({
                          date: b.date,
                          arrival: b.arrival,
                          departure: b.departure,
                        });
                        document
                          .getElementById("reserve-daycare")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {t("Reschedule", "Déplacer")}
                    </button>
                    <button
                      className="min-h-11 underline"
                      disabled={busy}
                      onClick={() => setCancelling(b)}
                    >
                      {t("Cancel", "Annuler")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {cancelling && (
              <div className="mt-5 rounded-xl border border-primary/30 p-5">
                <p>
                  {t(
                    "Cancel this visit? With less than 24 hours’ notice, it is forfeited. Otherwise it returns to this dog’s balance. No automatic cash refund.",
                    "Annuler cette visite? À moins de 24 heures d’avis, elle sera perdue. Sinon, elle revient au solde de ce chien. Aucun remboursement automatique.",
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <button
                    className={button}
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await post({
                          action: "cancel",
                          passId: cancelling.passId,
                          bookingId: cancelling.id,
                        });
                        setCancelling(null);
                        setEditing(null);
                        await load();
                        setMessage(
                          t("Cancellation saved.", "Annulation enregistrée."),
                        );
                      })
                    }
                  >
                    {t("Confirm cancellation", "Confirmer l’annulation")}
                  </button>
                  <button
                    className="min-h-11 underline"
                    disabled={busy}
                    onClick={() => setCancelling(null)}
                  >
                    {t("Keep my visit", "Garder ma visite")}
                  </button>
                </div>
              </div>
            )}
          </section>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section
              id="reserve-daycare"
              className="scroll-mt-28 rounded-3xl border bg-background p-6 sm:p-8"
            >
              <h3 className="text-2xl font-semibold">
                {editing
                  ? t("Move your visit", "Déplacer votre visite")
                  : t("Reserve a date", "Réserver une date")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(
                  "Up to 15 dogs per day. Book at least 24 hours ahead. Availability is confirmed when you save your reservation.",
                  "Maximum de 15 chiens par jour. Réservez au moins 24 heures à l’avance. La place est confirmée à l’enregistrement de la réservation.",
                )}
              </p>
              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const id = bookingId || crypto.randomUUID();
                    setBookingId(id);
                    await post({
                      action: editing ? "reschedule" : "book",
                      passId: editing?.passId || passId,
                      bookingId: editing?.id || id,
                      slot,
                    });
                    setEditing(null);
                    setBookingId("");
                    await load();
                    setMessage(
                      t(
                        "Your visit is confirmed.",
                        "Votre visite est confirmée.",
                      ),
                    );
                  });
                }}
              >
                {!editing && (
                  <label className="block font-medium">
                    {t("Use a paid visit", "Utiliser une visite payée")}
                    <select
                      required
                      className={field}
                      value={passId}
                      onChange={(e) => {
                        setPassId(e.target.value);
                        const p = data.passes.find(
                          (p) => p.id === e.target.value,
                        );
                        setSlot((s) => ({
                          ...s,
                          departure: p?.stay === "half" ? "13:30" : "18:30",
                        }));
                      }}
                    >
                      <option value="">
                        {t("Select a balance", "Choisir un solde")}
                      </option>
                      {data.passes
                        .filter(
                          (p) =>
                            p.status === "paid" &&
                            p.remaining > 0 &&
                            (!p.expiresOn || p.expiresOn >= today),
                        )
                        .map((p) => (
                          <option value={p.id} key={p.id}>
                            {p.stay === "half"
                              ? t("Half day", "Demi-journée")
                              : t("Full day", "Journée complète")}{" "}
                            · {p.remaining} {t("left", "restantes")}
                            {p.addOns.length ? ` · ${p.addOns.join(", ")}` : ""}
                            {p.expiresOn
                              ? ` · ${t("until", "jusqu’au")} ${p.expiresOn}`
                              : ""}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {selectedPass && (
                  <p className="text-sm">
                    {selectedPass.stay === "half"
                      ? t(
                          "Up to 6 hours, including exactly 6 hours.",
                          "Jusqu’à 6 heures, incluant exactement 6 heures.",
                        )
                      : t(
                          "More than 6 hours, up to 11 hours.",
                          "Plus de 6 heures, jusqu’à 11 heures.",
                        )}
                  </p>
                )}
                <label className="block font-medium">
                  {t("Date", "Date")}
                  <select
                    required
                    className={field}
                    value={slot.date}
                    onChange={(e) =>
                      setSlot((s) => ({ ...s, date: e.target.value }))
                    }
                  >
                    <option value="">
                      {t("Choose a day", "Choisir un jour")}
                    </option>
                    {data.availability.map((d) => (
                      <option
                        key={d.date}
                        value={d.date}
                        disabled={d.remaining === 0 && editing?.date !== d.date}
                      >
                        {dateLabel(d.date)} · {d.remaining}{" "}
                        {t("spots available", "places disponibles")}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(["arrival", "departure"] as const).map((key) => (
                    <label key={key} className="block font-medium">
                      {key === "arrival"
                        ? t("Drop-off", "Arrivée")
                        : t("Pick-up", "Départ")}
                      <input
                        type="time"
                        required
                        min="07:30"
                        max="18:30"
                        step="900"
                        className={field}
                        value={slot[key]}
                        onChange={(e) =>
                          setSlot((s) => ({ ...s, [key]: e.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <button
                  className={`${button} w-full`}
                  disabled={busy || (!passId && !editing)}
                >
                  {editing
                    ? t("Save new date", "Confirmer la nouvelle date")
                    : t("Confirm my visit", "Confirmer ma visite")}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="min-h-11 underline"
                    onClick={() => setEditing(null)}
                  >
                    {t("Keep current visit", "Garder la visite actuelle")}
                  </button>
                )}
              </form>
            </section>
            <section className="rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
              <h3 className="text-2xl font-semibold">
                {t(
                  "Add visits to your balance",
                  "Ajouter des visites à votre solde",
                )}
              </h3>
              <p className="mt-3 text-sm leading-relaxed opacity-85">
                {t(
                  "Pay securely through Square, return here, then reserve your dates. Purchasing visits does not reserve a place. Check the available dates in this portal before paying.",
                  "Payez de façon sécurisée avec Square, puis revenez réserver vos dates. L’achat de visites ne réserve pas une place. Vérifiez les disponibilités avant de payer.",
                )}
              </p>
              {data.secondDog && (
                <p className="mt-4 rounded-xl bg-white/15 p-3 font-medium">
                  {t(
                    "Your second-dog price includes an extra 30% off after bundle savings.",
                    "Votre prix pour le deuxième chien inclut 30 % de rabais supplémentaire après le rabais du forfait.",
                  )}
                </p>
              )}
              <form
                className="mt-5 space-y-5"
                onChange={() => setPurchaseId("")}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const requestId = purchaseId || crypto.randomUUID();
                    setPurchaseId(requestId);
                    const result = await post({
                      action: "checkout",
                      requestId,
                      stay,
                      addOns,
                      visits,
                    });
                    if (result.url) window.location.assign(result.url);
                    else await load();
                  });
                }}
              >
                <label className="block font-medium">
                  {t("Day length", "Durée")}
                  <select
                    className={`${field} text-foreground`}
                    value={stay}
                    onChange={(e) => setStay(e.target.value as DaycareStay)}
                  >
                    <option value="half">
                      {t(
                        "Half day · up to 6 hours",
                        "Demi-journée · jusqu’à 6 h",
                      )}
                    </option>
                    <option value="full">
                      {t(
                        "Full day · more than 6 hours",
                        "Journée complète · plus de 6 h",
                      )}
                    </option>
                  </select>
                </label>
                <fieldset>
                  <legend className="mb-3 font-medium">
                    {t(
                      "Add-ons included with each visit",
                      "Options incluses à chaque visite",
                    )}
                  </legend>
                  {(
                    [
                      [
                        "training",
                        t("Complete training", "Entraînement complet"),
                      ],
                      [
                        "treadmill",
                        t("Treadmill exercise", "Exercice sur tapis roulant"),
                      ],
                      ["individual", t("One-on-one play", "Jeux individuels")],
                    ] as [DaycareAddOn, string][]
                  ).map(([key, label]) => (
                    <label className="mb-3 flex items-center gap-3" key={key}>
                      <input
                        type="checkbox"
                        className="size-5"
                        checked={addOns.includes(key)}
                        onChange={(e) =>
                          setAddOns((a) =>
                            e.target.checked
                              ? [...a, key]
                              : a.filter((v) => v !== key),
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                <label className="block font-medium">
                  {t("Number of visits", "Nombre de visites")}
                  <select
                    className={`${field} text-foreground`}
                    value={visits}
                    onChange={(e) =>
                      setVisits(Number(e.target.value) as DaycareVisits)
                    }
                  >
                    {[1, 5, 10, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} {t("visit(s)", "visite(s)")}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="border-t border-white/25 pt-5">
                  <p className="text-sm opacity-80">
                    {t("Before GST & QST", "Avant TPS et TVQ")}
                  </p>
                  <p className="mt-2 text-4xl font-semibold">
                    {money(quote.totalCents)}
                  </p>
                  <p className="mt-3 text-sm">
                    {t(
                      "Taxes and final total are shown on Square before you pay.",
                      "Les taxes et le total final sont affichés sur Square avant de payer.",
                    )}
                  </p>
                </div>
                <button
                  disabled={busy}
                  className="min-h-12 w-full rounded-full bg-background px-6 py-3 font-semibold text-foreground disabled:opacity-50"
                >
                  {t(
                    "Continue to secure payment",
                    "Passer au paiement sécurisé",
                  )}
                </button>
              </form>
            </section>
          </div>
          <section className="rounded-3xl border bg-background p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">
                {t(
                  "Payments & visit balances",
                  "Paiements et soldes de visites",
                )}
              </h3>
              <button
                disabled={busy}
                className="min-h-11 underline"
                onClick={() =>
                  run(async () => {
                    await post({ action: "refresh" });
                    await load();
                    setMessage(
                      t(
                        "Payment status refreshed. Paid visits are ready to reserve.",
                        "État des paiements actualisé. Vous pouvez réserver les visites payées.",
                      ),
                    );
                  })
                }
              >
                {t(
                  "Refresh payments after checkout",
                  "Actualiser après le paiement",
                )}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {data.passes.map((p) => (
                <div
                  className="flex flex-wrap justify-between gap-4 border-t pt-4"
                  key={p.id}
                >
                  <div>
                    <p className="font-medium">
                      {p.visits} {t("visit(s)", "visite(s)")} ·{" "}
                      {p.stay === "half"
                        ? t("Half day", "Demi-journée")
                        : t("Full day", "Journée complète")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.status === "paid"
                        ? `${p.remaining} ${t("remaining", "restantes")}`
                        : p.status === "pending"
                          ? t("Payment not confirmed", "Paiement non confirmé")
                          : t(
                              "Contact Nick: payment review",
                              "Contactez Nick : vérification du paiement",
                            )}
                      {p.expiresOn
                        ? ` · ${t("Use by", "À utiliser avant la fin du")} ${p.expiresOn}`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p>{money(p.totalCents)}</p>
                    {p.status === "pending" && p.checkoutUrl && (
                      <a
                        className="mt-2 inline-block underline"
                        href={p.checkoutUrl}
                      >
                        {t("Resume payment", "Reprendre le paiement")}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      <aside className="rounded-2xl bg-secondary/40 p-6 text-sm leading-relaxed">
        <h3 className="mb-3 font-semibold">
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
