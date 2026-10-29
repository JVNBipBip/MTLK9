import type { AppLocale } from "@/lib/i18n/config"
import { DAYCARE_SECOND_DOG_DISCOUNT_PERCENT } from "@/lib/daycare-rules"

export function DaycareHouseholdOffer({ locale }: { locale: AppLocale }) {
  const fr = locale === "fr"
  return <aside className="mb-10 flex flex-col gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="daycare-household-offer">
    <div className="max-w-2xl">
      <h3 id="daycare-household-offer" className="text-xl font-semibold">{fr ? `Deux chiens à la maison? ${DAYCARE_SECOND_DOG_DISCOUNT_PERCENT} % de rabais pour le deuxième.` : `Two dogs at home? ${DAYCARE_SECOND_DOG_DISCOUNT_PERCENT}% off your second dog.`}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{fr ? "Pour deux chiens du même foyer. Le rabais supplémentaire s’applique après le rabais du forfait, à la garderie, à l’entraînement et aux options. Notre équipe confirme le lien entre vos chiens; chacun garde son propre solde de visites." : "For two dogs in the same household. The extra discount applies after bundle savings, including daycare, training and add-ons. Our team verifies the household link; each dog keeps its own visit balance."}</p>
    </div>
    <a href="tel:+15148269558" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary">{fr ? "Appeler notre équipe" : "Call our team"}</a>
  </aside>
}
