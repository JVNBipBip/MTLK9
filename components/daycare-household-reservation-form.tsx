"use client";
import { useRef, useState } from "react";
import { torontoDate } from "@/lib/daycare-booking";
import type { DaycareReservation } from "@/lib/daycare-household";
import { bookableDaycarePasses, type DaycarePortal } from "@/lib/daycare-portal-types";

export function DaycareHouseholdReservationForm({ dogs, availability, locale, busy, onBook }: {
  dogs: DaycarePortal["dogs"]; availability: DaycarePortal["availability"];
  locale: "en" | "fr"; busy: boolean;
  onBook: (requestId: string, reservations: DaycareReservation[]) => Promise<boolean>;
}) {
  const fr = locale === "fr", t = (en: string, french: string) => fr ? french : en;
  const [selected, setSelected] = useState(() => dogs.map(dog => dog.id));
  const [date, setDate] = useState("");
  const [choices, setChoices] = useState<Record<string, { passId?: string; arrival?: string; departure?: string }>>({});
  const [error, setError] = useState("");
  const request = useRef<{ signature: string; id: string } | null>(null);
  const today = torontoDate();
  const field = "mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3 py-3 text-base focus:outline-2 focus:outline-primary disabled:opacity-50";
  const picked = dogs.filter(dog => selected.includes(dog.id));
  const choiceFor = (dog: DaycarePortal["dogs"][number]) => {
    const passes = bookableDaycarePasses(dog, today);
    const choice = choices[dog.id] || {};
    const passId = choice.passId ?? (passes.length === 1 ? passes[0].id : "");
    const pass = passes.find(p => p.id === passId);
    return { passes, pass, passId, arrival: choice.arrival || "07:30", departure: choice.departure || (pass?.stay === "half" ? "13:30" : "18:30") };
  };
  const updateChoice = (id: string, values: typeof choices[string]) => setChoices(current => ({ ...current, [id]: { ...current[id], ...values } }));
  return <form className="mt-5 space-y-6" aria-busy={busy} onSubmit={async event => {
    event.preventDefault();
    setError("");
    if (busy) return;
    if (!picked.length) { setError(t("Select at least one dog.", "Choisissez au moins un chien.")); return; }
    if (!date || picked.some(dog => !choiceFor(dog).pass)) { setError(t("Choose a date and a paid balance for each selected dog.", "Choisissez une date et un solde payé pour chaque chien sélectionné.")); return; }
    const reservations = picked.map(dog => {
      const choice = choiceFor(dog);
      return { applicationId: dog.id, passId: choice.passId, slot: { date, arrival: choice.arrival, departure: choice.departure } };
    });
    const signature = JSON.stringify(reservations);
    if (request.current?.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
    if (await onBook(request.current.id, reservations)) { setDate(""); request.current = null; }
  }}>
    {dogs.length > 1 && <fieldset disabled={busy}>
      <legend className="mb-3 font-semibold">{t("Who’s coming?", "Qui vient?")}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{dogs.map(dog => <label key={dog.id} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
        <input type="checkbox" className="size-5 shrink-0 accent-primary" checked={selected.includes(dog.id)} onChange={event => { setSelected(ids => event.target.checked ? [...ids, dog.id] : ids.filter(id => id !== dog.id)); setError(""); }} />
        <span className="min-w-0 break-words font-medium">{dog.dogName}</span>
      </label>)}</div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("Select both dogs to reserve together, or just one. Each dog uses its own paid visits.", "Sélectionnez les deux chiens pour réserver ensemble, ou un seul. Chaque chien utilise ses propres visites payées.")}</p>
    </fieldset>}
    <label className="block font-medium">{t("Visit date", "Date de la visite")}
      <select className={field} required disabled={busy} value={date} onChange={event => setDate(event.target.value)}>
        <option value="">{t("Choose a day", "Choisir un jour")}</option>
        {availability.map(day => <option key={day.date} value={day.date} disabled={day.remaining < picked.length || picked.some(dog => dog.bookings.some(b => b.status === "booked" && b.date === day.date))}>
          {new Date(`${day.date}T12:00:00Z`).toLocaleDateString(fr ? "fr-CA" : "en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Toronto" })} · {day.remaining} {t("spots available", "places disponibles")}
        </option>)}
      </select>
    </label>
    {picked.map(dog => {
      const choice = choiceFor(dog);
      return <fieldset key={dog.id} disabled={busy} className="min-w-0 rounded-2xl border border-border p-4 sm:p-5">
        <legend className="max-w-full px-1 text-lg font-semibold break-words">{dog.dogName}</legend>
        {!choice.passes.length ? <p className="text-sm leading-relaxed">{t("This dog needs paid visits before booking.", "Ce chien a besoin de visites payées avant de réserver.")} <a className="font-semibold text-primary underline underline-offset-4" href="#daycare-purchases">{t("Add visits below", "Ajouter des visites ci-dessous")}</a></p> : <>
          <label className="block font-medium">{t("Use a paid visit", "Utiliser une visite payée")}
            <select className={field} required value={choice.passId} onChange={event => updateChoice(dog.id, { passId: event.target.value, departure: undefined })}>
              <option value="">{t("Select a balance", "Choisir un solde")}</option>
              {choice.passes.map(pass => <option value={pass.id} key={pass.id}>{pass.stay === "half" ? t("Half day", "Demi-journée") : t("Full day", "Journée complète")} · {pass.remaining} {t("left", "restantes")}{pass.addOns.length ? ` · ${pass.addOns.join(", ")}` : ""}{pass.expiresOn ? ` · ${t("until", "jusqu’au")} ${pass.expiresOn}` : ""}</option>)}
            </select>
          </label>
          {choice.pass && <p className="mt-2 text-sm text-muted-foreground">{choice.pass.stay === "half" ? t("Up to 6 hours, including exactly 6 hours.", "Jusqu’à 6 heures, incluant exactement 6 heures.") : t("More than 6 hours, up to 11 hours.", "Plus de 6 heures, jusqu’à 11 heures.")}</p>}
          <div className="mt-4 grid grid-cols-2 gap-3">{(["arrival", "departure"] as const).map(key => <label key={key} className="min-w-0 font-medium">{key === "arrival" ? t("Drop-off", "Arrivée") : t("Pick-up", "Départ")}
            <input type="time" className={`${field} min-w-0`} required min="07:30" max="18:30" step="900" value={choice[key]} onChange={event => updateChoice(dog.id, { [key]: event.target.value })} />
          </label>)}</div>
        </>}
      </fieldset>;
    })}
    {picked.length > 1 && <p className="rounded-xl bg-primary/5 p-4 text-sm leading-relaxed">{t("Both reservations are saved together. If either dog cannot be booked, neither reservation is saved and no visits are deducted.", "Les deux réservations sont enregistrées ensemble. Si un chien ne peut pas être réservé, aucune réservation n’est enregistrée et aucune visite n’est déduite.")}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={busy || !picked.length || picked.some(dog => !choiceFor(dog).passes.length)} className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-center font-semibold text-primary-foreground disabled:opacity-50">
      {busy ? t("Saving…", "Enregistrement…") : picked.length > 1 ? t("Confirm both dogs’ visits", "Confirmer les visites des deux chiens") : t("Confirm my dog’s visit", "Confirmer la visite de mon chien")}
    </button>
  </form>;
}
