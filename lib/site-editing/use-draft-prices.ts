"use client"

import { useMemo } from "react"
import { useEditDrafts } from "@/lib/site-editing/edit-store"
import { isUsablePrice, priceOf, type PriceSource } from "@/lib/prices"

/**
 * The owner's unsaved prices while he edits in the Website editor, as a price
 * source (his draft where he has one, else the published price).
 *
 * `null` for every visitor and whenever he has no price drafts, so pages keep
 * using their pre-built price text and nothing re-renders. Only pages inside
 * the editor's frame ever get a source and rebuild their prices from it.
 */
export function useDraftPrices(): PriceSource | null {
  const drafts = useEditDrafts()?.prices
  return useMemo(() => {
    if (!drafts || !Object.keys(drafts).length) return null
    return (id) => {
      const draft = drafts[id]
      return isUsablePrice(draft) ? draft : priceOf(id)
    }
  }, [drafts])
}
