"use client"

import { useCallback } from "react"
import { useAppLocale } from "@/components/locale-provider"
import { getLocalizedText } from "@/lib/i18n/localized-text"

export function useLocalizedText() {
  const locale = useAppLocale()

  return useCallback(
    (text: string) => getLocalizedText(locale, text),
    [locale],
  )
}
