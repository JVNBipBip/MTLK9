"use client"

import { useCallback } from "react"
import { useAppLocale } from "@/components/locale-provider"
import { frenchTextTranslations } from "@/lib/i18n/dom-translations"

export function useLocalizedText() {
  const locale = useAppLocale()

  return useCallback(
    (text: string) => {
      if (locale !== "fr") return text
      return frenchTextTranslations[text] ?? text
    },
    [locale],
  )
}
