"use client"

import type { AppLocale } from "@/lib/i18n/config"
import { daycareMoney, daycareRates, quoteDaycare, type DaycareAddOn } from "@/lib/daycare-pricing"
import { frenchDollars, PUBLISHED_PRICES, usd, type PriceId } from "@/lib/prices"
import { useDraftPrices } from "@/lib/site-editing/use-draft-prices"
import { PriceTag } from "@/components/price-tag"

/**
 * Prices inside server-rendered pages. Visitors get exactly the published
 * price (rendered on the server as before), with the Sale treatment when he
 * set a compare-at price; inside the Website editor they follow his drafts.
 */

/** "{price} CAD + tax" with the price filled in for the locale. */
export function LivePriceText({ id, locale, en, fr }: { id: PriceId; locale: AppLocale; en: string; fr: string }) {
  const book = useDraftPrices() ?? PUBLISHED_PRICES
  const amount = (value: (id: PriceId) => number) => (locale === "fr" ? frenchDollars(id, value) : usd(id, value))
  const compareAt = book.compareAt(id)
  return (
    <PriceTag
      locale={locale}
      price={(locale === "fr" ? fr : en).replace("{price}", amount(book.price))}
      compareAt={compareAt === null ? null : amount(() => compareAt)}
    />
  )
}

const ALL_ADD_ONS: DaycareAddOn[] = ["training", "treadmill", "individual"]

/** A daycare amount: a stay, an add-on, or a stay with every add-on ("allHalf" / "allFull"). */
export function DaycareLivePrice({ of, locale }: { of: "half" | "full" | DaycareAddOn | "allHalf" | "allFull"; locale: AppLocale }) {
  const rates = daycareRates(useDraftPrices() ?? PUBLISHED_PRICES)
  if (of === "allHalf" || of === "allFull") {
    return <>{daycareMoney(quoteDaycare(of === "allHalf" ? "half" : "full", ALL_ADD_ONS, 1, false, Date.now(), rates).totalCents, locale)}</>
  }
  const cents = of === "half" || of === "full" ? rates.base[of] : rates.addOns[of]
  const compareAt = rates.compareAt[of]
  return <PriceTag locale={locale} price={daycareMoney(cents, locale)} compareAt={compareAt === null ? null : daycareMoney(compareAt, locale)} />
}
