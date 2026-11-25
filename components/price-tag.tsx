import type { ReactNode } from "react"

/**
 * A price, and when it's on sale: the regular ("compare at") price small and
 * crossed out, the sale price bold in the sale colour, and a "Save 33%" badge
 * (Économisez 33 % in French). No compare-at = just the price, exactly as before.
 * Works in server and client components.
 */
export function PriceTag({
  price,
  compareAt,
  percentOff,
  locale,
  onDark = false,
}: {
  price: ReactNode
  compareAt?: ReactNode | null
  /** Whole-number percent saved; the badge says "Sale" when it's unknown or under 1%. */
  percentOff?: number | null
  locale: "en" | "fr"
  /** On a dark photo or background: white prices (the badge keeps its colour). */
  onDark?: boolean
}) {
  if (!compareAt) return <>{price}</>
  return (
    <span className="inline-flex flex-wrap items-baseline justify-end gap-x-2 gap-y-1">
      <SaleBadge locale={locale} percentOff={percentOff} />
      <s className={`text-[0.85em] font-normal decoration-[1.5px] ${onDark ? "text-white/70" : "text-muted-foreground/80"}`}>{compareAt}</s>
      <span className={`font-semibold ${onDark ? "text-white" : "text-sale"}`}>{price}</span>
    </span>
  )
}

export function SaleBadge({ locale, percentOff }: { locale: "en" | "fr"; percentOff?: number | null }) {
  const off = percentOff && percentOff >= 1 ? Math.round(percentOff) : null
  const label = off ? (locale === "fr" ? `Économisez ${off} %` : `Save ${off}%`) : locale === "fr" ? "Promo" : "Sale"
  return (
    <span className="inline-block self-center rounded-full bg-sale px-2.5 py-0.5 text-[11px] font-bold uppercase leading-tight tracking-wide text-sale-foreground">
      {label}
    </span>
  )
}

/** Percent saved, from the regular and sale amounts (same unit). */
export function percentOff(compareAt: number | null | undefined, price: number) {
  return compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null
}
