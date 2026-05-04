"use client"

import { useEffect } from "react"
import { trackFBPurchase } from "@/lib/facebook-pixel"

export function FacebookCheckoutSuccessEvent({
  checkoutType,
  recordId,
}: {
  checkoutType?: string
  recordId?: string
}) {
  useEffect(() => {
    const eventKey = `fb_purchase_${checkoutType || "evaluation"}_${recordId || "unknown"}`
    try {
      if (sessionStorage.getItem(eventKey)) return
      sessionStorage.setItem(eventKey, "1")
    } catch {
      // If browser storage is unavailable, still allow the pixel event to fire.
    }

    trackFBPurchase({
      content_name: checkoutType === "program-signup" ? "Program Signup" : "Evaluation Deposit",
      content_category: "Dog Training Checkout",
      content_ids: recordId ? [recordId] : undefined,
      currency: "CAD",
    })
  }, [checkoutType, recordId])

  return null
}
