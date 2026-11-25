"use client"

import { useMemo } from "react"
import { useEditDrafts } from "@/lib/site-editing/edit-store"
import { compareAtOf, isUsablePrice, priceOf, type PriceBook, type PriceId } from "@/lib/prices"

/**
 * The owner's unsaved prices (and sale "compare at" prices) while he edits in
 * the Website editor: his draft where he has one, else the published value.
 *
 * `null` for every visitor and whenever he has no price drafts, so pages keep
 * using their pre-built price text and nothing re-renders. Only pages inside
 * the editor's frame ever get a book and rebuild their prices from it.
 */
export function useDraftPrices(): PriceBook | null {
  const drafts = useEditDrafts()
  const prices = drafts?.prices
  const compareAt = drafts?.compareAt
  return useMemo(() => {
    const hasPrices = prices && Object.keys(prices).length > 0
    const hasCompare = compareAt && Object.keys(compareAt).length > 0
    if (!hasPrices && !hasCompare) return null
    const price = (id: PriceId) => {
      const draft = prices?.[id]
      return isUsablePrice(draft) ? draft : priceOf(id)
    }
    return {
      price,
      compareAt: (id: PriceId) => {
        if (!compareAt || !(id in compareAt)) return compareAtOf(id, price)
        const draft = compareAt[id]
        return isUsablePrice(draft) && draft > price(id) ? draft : null
      },
    }
  }, [prices, compareAt])
}
