import Link from "next/link"
import { ArrowRight, Tag } from "lucide-react"
import { DAYCARE_PROMO, daycarePromoActive } from "@/lib/daycare-pricing"
import { localizedPath } from "@/lib/seo"
import type { AppLocale } from "@/lib/i18n/config"

/** Renders only while the daycare sale is running (pages using it are dynamic, so this is request time). */
export function DaycarePromoBanner({ locale, now = Date.now(), linkToDaycare = true, className = "" }: { locale: AppLocale; now?: number; linkToDaycare?: boolean; className?: string }) {
  if (!daycarePromoActive(now)) return null
  const fr = locale === "fr"
  const { discountPercent: p } = DAYCARE_PROMO
  const title = fr ? `${DAYCARE_PROMO.fr} à la garderie : jusqu’à ${p[20]} % de rabais` : `${DAYCARE_PROMO.en} daycare sale: up to ${p[20]}% off`
  const detail = fr
    ? `${p[5]} % sur 5 visites, ${p[10]} % sur 10 visites, ${p[20]} % sur 20 visites. Appliqué automatiquement, aucun code requis. Jusqu’au dimanche 29 novembre à minuit.`
    : `${p[5]}% off 5 visits, ${p[10]}% off 10 visits, ${p[20]}% off 20 visits. Applied automatically, no code needed. Ends Sunday, November 29 at midnight.`
  const body = <>
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15"><Tag className="size-5" aria-hidden /></span>
    <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm leading-relaxed text-primary-foreground/85">{detail}</span></span>
    {linkToDaycare && <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold underline underline-offset-4">{fr ? "Voir les forfaits" : "See bundles"}<ArrowRight className="size-4" aria-hidden /></span>}
  </>
  const box = `flex flex-col gap-4 rounded-3xl bg-primary px-6 py-5 text-primary-foreground sm:flex-row sm:items-center ${className}`
  return linkToDaycare
    ? <Link href={`${localizedPath(locale, "/daycare")}#daycare-pricing`} className={`${box} transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary`}>{body}</Link>
    : <div role="note" className={box}>{body}</div>
}
