"use client"

import { useEffect, useState } from "react"

/**
 * Current time for client price displays, refreshed every minute so an open page
 * switches into and out of a sale on time. Seed it with the server's time to avoid
 * a hydration mismatch. Checkout re-prices on the server, so this is display only.
 */
export function useDaycareNow(initialNow?: number) {
  const [now, setNow] = useState(() => initialNow ?? Date.now())
  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return now
}
