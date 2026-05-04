"use client"

import { useEffect } from "react"
import type { AppLocale } from "@/lib/i18n/config"

export function ClientLocaleEffects({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
