import type { AppLocale } from "@/lib/i18n/config"
import { DAYCARE_NOTICE_HOURS, daycareBundleWindow } from "@/lib/daycare-policy"

export function DaycarePolicy({ locale }: { locale: AppLocale }) {
  const fr = locale === "fr"
  const t = (en: string, french: string) => fr ? french : en
  const policies = [
    {
      title: t("Booking ahead", "Réserver à l’avance"),
      text: t(`Book at least ${DAYCARE_NOTICE_HOURS} hours before your scheduled visit.`, `Réservez au moins ${DAYCARE_NOTICE_HOURS} heures avant votre visite.`),
    },
    {
      title: t("Single visits", "Visites à la carte"),
      text: t(`Cancellations or rescheduling requests made less than ${DAYCARE_NOTICE_HOURS} hours before your scheduled visit are non-refundable.`, `Les annulations ou demandes de report faites moins de ${DAYCARE_NOTICE_HOURS} heures avant votre visite ne sont pas remboursables.`),
    },
    {
      title: t("Prepaid, pre-booked bundles", "Forfaits prépayés et préréservés"),
      text: t(`Visits cancelled or rescheduled less than ${DAYCARE_NOTICE_HOURS} hours in advance are forfeited, deducted from your bundle and cannot be made up.`, `Toute visite annulée ou reportée moins de ${DAYCARE_NOTICE_HOURS} heures à l’avance est perdue, déduite de votre forfait et ne peut pas être reprise.`),
    },
  ]

  return <section id="daycare-policy" className="scroll-mt-28 border-b border-border px-5 py-14 md:px-8 lg:py-20" aria-labelledby="daycare-policy-heading">
    <div className="mx-auto max-w-6xl">
      <p className="mb-3 text-sm font-semibold text-primary">{t("Before you book", "Avant de réserver")}</p>
      <h2 id="daycare-policy-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">{t("Booking, changes & bundle terms", "Réservations, changements et forfaits")}</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">{policies.map(policy => <div key={policy.title} className="rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold">{policy.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{policy.text}</p>
      </div>)}</div>
      <p className="mt-6 rounded-2xl bg-primary/5 px-6 py-5 font-medium leading-relaxed">{t(`With at least ${DAYCARE_NOTICE_HOURS} hours’ notice, you may reschedule your visit without penalty.`, `Avec un préavis d’au moins ${DAYCARE_NOTICE_HOURS} heures, vous pouvez reporter votre visite sans pénalité.`)}</p>
      <h3 className="mt-9 text-xl font-semibold">{t("Bundle completion windows", "Délais pour utiliser les forfaits")}</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">{([5, 10, 20] as const).map(visits => <li key={visits} className="border-l-2 border-primary/30 pl-4">
        <span className="block font-semibold">{visits} {t("visits", "visites")}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{daycareBundleWindow(visits, locale)}</span>
      </li>)}</ul>
    </div>
  </section>
}
