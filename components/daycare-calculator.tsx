"use client"

import { useState } from "react"
import { Check, Plus } from "lucide-react"
import { DAYCARE_ADD_ON_CENTS, DAYCARE_BASE_CENTS, DAYCARE_DISCOUNT_PERCENT, daycareMoney, quoteDaycare, type DaycareAddOn, type DaycareStay, type DaycareVisits } from "@/lib/daycare-pricing"
import { daycareBundleWindow, daycareStayDuration } from "@/lib/daycare-policy"
import type { AppLocale } from "@/lib/i18n/config"

const options = [
  { key: "training", en: "Complete Training", fr: "Entraînement complet", detailEn: "Obedience, manners and your own training goals.", detailFr: "Obéissance, bonnes manières et vos objectifs." },
  { key: "treadmill", en: "Treadmill Exercise", fr: "Exercice sur tapis roulant", detailEn: "Supervised exercise adapted to your dog.", detailFr: "Exercice supervisé, adapté à votre chien." },
  { key: "individual", en: "One-on-One Play", fr: "Jeux individuels", detailEn: "Personal attention, play and enrichment.", detailFr: "Attention personnalisée, jeux et enrichissement." },
] as const

export function DaycareCalculator({ locale }: { locale: AppLocale }) {
  const fr = locale === "fr"
  const [stay, setStay] = useState<DaycareStay>("full")
  const [addOns, setAddOns] = useState<DaycareAddOn[]>([])
  const [visits, setVisits] = useState<DaycareVisits>(1)
  const quote = quoteDaycare(stay, addOns, visits)
  const bundleWindow = daycareBundleWindow(visits, locale)
  const money = (cents: number) => daycareMoney(cents, locale)
  const choice = "relative flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-primary"

  return <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-4 text-lg font-semibold">{fr ? "1. La durée de la journée" : "1. Choose your day"}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["half", "full"] as const).map(value => <label key={value} className={choice}>
            <input type="radio" name="daycare-stay" value={value} checked={stay === value} onChange={() => setStay(value)} className="size-4 accent-primary" />
            <span className="flex-1"><span className="block font-semibold">{value === "half" ? (fr ? "Demi-journée" : "Half day") : (fr ? "Journée complète" : "Full day")}</span><span className="mt-1 block text-sm text-muted-foreground">{daycareStayDuration(value, locale)}</span></span>
            <strong className="whitespace-nowrap">{money(DAYCARE_BASE_CENTS[value])}</strong>
          </label>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-4 text-lg font-semibold">{fr ? "2. Les petits extras (facultatif)" : "2. Make it their kind of day (optional)"}</legend>
        <div className="space-y-3">{options.map(option => <label key={option.key} className={choice}>
          <input type="checkbox" checked={addOns.includes(option.key)} onChange={event => setAddOns(current => event.target.checked ? [...current, option.key] : current.filter(key => key !== option.key))} className="size-5 shrink-0 accent-primary" />
          <span className="flex-1"><span className="block font-semibold">{fr ? option.fr : option.en}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{fr ? option.detailFr : option.detailEn}</span></span>
          <span className="flex items-center gap-1 whitespace-nowrap font-semibold"><Plus className="size-3" aria-hidden />{money(DAYCARE_ADD_ON_CENTS[option.key])}</span>
        </label>)}</div>
      </fieldset>
      <fieldset>
        <legend className="mb-4 text-lg font-semibold">{fr ? "3. Une visite ou un forfait" : "3. One visit or a bundle"}</legend>
        <div className="grid grid-cols-2 gap-3">
          {([1, 5, 10, 20] as const).map(value => <label key={value} className={choice}>
            <input type="radio" name="daycare-visits" checked={visits === value} onChange={() => setVisits(value)} className="size-4 accent-primary" />
            <span className="flex-1"><span className="block font-semibold">{value} {fr ? (value === 1 ? "visite" : "visites") : (value === 1 ? "visit" : "visits")}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{value === 1 ? (fr ? "À la carte" : "Pay per visit") : (fr ? `−${DAYCARE_DISCOUNT_PERCENT[value]} %` : `Save ${DAYCARE_DISCOUNT_PERCENT[value]}%`)}</span>
              {value !== 1 && <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{daycareBundleWindow(value, locale)}</span>}
              {value === 20 && <span className="mt-2 block text-xs font-semibold text-primary">{fr ? "Meilleur prix" : "Best value"}</span>}
            </span>
          </label>)}
        </div>
      </fieldset>
    </div>
    <div className="self-start rounded-3xl bg-primary p-7 text-primary-foreground sm:p-9 lg:sticky lg:top-32" aria-live="polite" aria-atomic="true">
      <p className="text-sm font-medium text-primary-foreground/75">{fr ? "Votre journée, à votre façon" : "A day designed around your dog"}</p>
      <h3 className="mt-3 text-2xl font-semibold">{fr ? "Votre estimation" : "Your estimate"}</h3>
      <dl className="mt-7 space-y-4 text-sm">
        <div className="flex justify-between gap-4"><dt>{fr ? "Prix régulier par visite" : "Regular price per visit"}</dt><dd>{money(quote.regularPerVisitCents)}</dd></div>
        <div className="flex justify-between gap-4"><dt>{fr ? "Nombre de visites" : "Number of visits"}</dt><dd>{visits}</dd></div>
        <div className="flex justify-between gap-4"><dt>{fr ? "Rabais du forfait" : "Bundle discount"}</dt><dd>{quote.discountPercent}{fr ? " %" : "%"}</dd></div>
        {quote.savingsCents > 0 && <div className="flex justify-between gap-4 font-semibold"><dt>{fr ? "Vous économisez" : "You save"}</dt><dd>{money(quote.savingsCents)}</dd></div>}
        <div className="border-t border-white/20 pt-6"><dt className="text-primary-foreground/75">{fr ? "Total avant taxes" : "Total before tax"}</dt><dd className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{money(quote.totalCents)}</dd></div>
      </dl>
      <p className="mt-4 flex items-center gap-2 text-sm"><Check className="size-4" aria-hidden />{money(quote.perVisitCents)} {fr ? "par visite" : "per visit"}</p>
      {bundleWindow && <p className="mt-4 text-sm font-medium">{bundleWindow}</p>}
      <p className="mt-7 border-t border-white/20 pt-5 text-xs leading-relaxed text-primary-foreground/80">{fr ? "En dollars canadiens, taxes en sus. Les rabais s’appliquent au prix de base et aux options choisies, sans cumul. Cette estimation n’est pas une réservation. Approbation de notre équipe requise." : "Canadian dollars, plus applicable taxes. Bundle savings apply to daycare and selected add-ons; discounts cannot be combined. This estimate is not a reservation. Team approval is required."}</p>
      <a href="#daycare-policy" className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4">{fr ? "Voir les conditions de réservation" : "View booking & cancellation terms"}</a>
    </div>
  </div>
}
