import type { ReactNode } from "react"

/**
 * A price, and when it's on sale the "compare at" price crossed out before it
 * plus a Sale badge (Promo in French). No compare-at = just the price, exactly
 * as before. Works in server and client components.
 */
export function PriceTag({ price, compareAt, locale }: { price: ReactNode; compareAt?: ReactNode | null; locale: "en" | "fr" }) {
  if (!compareAt) return <>{price}</>
  return (
    <>
      <s className="mr-1.5 font-normal opacity-60">{compareAt}</s>
      {price}
      <SaleBadge locale={locale} />
    </>
  )
}

export function SaleBadge({ locale }: { locale: "en" | "fr" }) {
  return (
    <span className="ml-2 inline-block rounded-full bg-primary px-2 py-0.5 align-middle text-[11px] font-semibold leading-tight text-primary-foreground">
      {locale === "fr" ? "Promo" : "Sale"}
    </span>
  )
}
