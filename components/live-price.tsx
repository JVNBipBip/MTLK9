"use client"

import type { AppLocale } from "@/lib/i18n/config"
import { daycareMoney, daycareRates, quoteDaycare, type DaycareAddOn } from "@/lib/daycare-pricing"
import { frenchDollars, priceOf, usd, type PriceId } from "@/lib/prices"
import { useDraftPrices } from "@/lib/site-editing/use-draft-prices"

/**
 * Prices inside server-rendered pages. Visitors get exactly the published
 * price (rendered on the server as before); inside the Website editor the
 * text follows his unsaved prices as he types them.
 */

/** "{price} CAD + tax" with the price filled in for the locale. */
export function LivePriceText({ id, locale, en, fr }: { id: PriceId; locale: AppLocale; en: string; fr: string }) {
  const price = useDraftPrices() ?? priceOf
  return <>{locale === "fr" ? fr.replace("{price}", frenchDollars(id, price)) : en.replace("{price}", usd(id, price))}</>
}

const ALL_ADD_ONS: DaycareAddOn[] = ["training", "treadmill", "individual"]

/** A daycare amount: a stay, an add-on, or a stay with every add-on ("allHalf" / "allFull"). */
export function DaycareLivePrice({ of, locale }: { of: "half" | "full" | DaycareAddOn | "allHalf" | "allFull"; locale: AppLocale }) {
  const draftPrices = useDraftPrices()
  const rates = daycareRates(draftPrices ?? priceOf)
  const cents =
    of === "half" || of === "full"
      ? rates.base[of]
      : of === "allHalf" || of === "allFull"
        ? quoteDaycare(of === "allHalf" ? "half" : "full", ALL_ADD_ONS, 1, false, Date.now(), rates).totalCents
        : rates.addOns[of]
  return <>{daycareMoney(cents, locale)}</>
}
