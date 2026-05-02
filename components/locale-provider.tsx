"use client"

import { createContext, useContext } from "react"
import type { AppLocale } from "@/lib/i18n/config"

const LocaleContext = createContext<AppLocale>("en")

export function LocaleProvider({
  children,
  locale,
}: {
  children: React.ReactNode
  locale: AppLocale
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useAppLocale() {
  return useContext(LocaleContext)
}
