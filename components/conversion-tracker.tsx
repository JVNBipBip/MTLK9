"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import posthog from "posthog-js"
import { useAppLocale } from "@/components/locale-provider"

export function ConversionTracker() {
  const locale = useAppLocale()
  const pathname = usePathname() || "/"

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const link = event.target.closest<HTMLAnchorElement>('a[href^="tel:"]')
      if (!link) return

      posthog.capture("phone_link_clicked", {
        locale,
        location: link.dataset.conversionLocation || "site",
        path: pathname,
        link_text: link.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) || "",
      })
    }

    document.addEventListener("click", handleClick, { capture: true })
    return () => document.removeEventListener("click", handleClick, { capture: true })
  }, [locale, pathname])

  return null
}
