"use client"

import { usePathname } from "next/navigation"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname, type AppLocale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

function localeHref(pathname: string, locale: AppLocale) {
  return addLocaleToPathname(pathname || "/", locale)
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname()
  const activeLocale = useAppLocale()

  return (
    <div className={cn("inline-flex items-center rounded-full border border-black/10 bg-white/20 p-1 text-xs font-semibold", className)}>
      {(["en", "fr"] as const).map((locale) => (
        <a
          key={locale}
          href={localeHref(pathname, locale)}
          hrefLang={locale}
          aria-current={activeLocale === locale ? "true" : undefined}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            activeLocale === locale ? "bg-black text-white" : "text-black/70 hover:text-black",
          )}
        >
          {locale.toUpperCase()}
        </a>
      ))}
    </div>
  )
}
