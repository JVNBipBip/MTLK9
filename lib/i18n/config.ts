export const locales = ["en", "fr"] as const

export type AppLocale = (typeof locales)[number]

export const defaultLocale: AppLocale = "en"

export const localeCookieName = "NEXT_LOCALE"

export const localeHeaderName = "x-mtl-locale"

export const pathnameHeaderName = "x-mtl-pathname"

export const localeConfig: Record<AppLocale, { htmlLang: string; intlLocale: string; openGraphLocale: string }> = {
  en: {
    htmlLang: "en",
    intlLocale: "en-CA",
    openGraphLocale: "en_CA",
  },
  fr: {
    htmlLang: "fr",
    intlLocale: "fr-CA",
    openGraphLocale: "fr_CA",
  },
}

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return locales.includes(value as AppLocale)
}

export function getIntlLocale(locale: AppLocale) {
  return localeConfig[locale].intlLocale
}

export function getPathLocale(pathname: string): AppLocale | null {
  const segment = pathname.split("/").filter(Boolean)[0]
  return isAppLocale(segment) ? segment : null
}

export function stripLocaleFromPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (isAppLocale(segments[0])) {
    const stripped = `/${segments.slice(1).join("/")}`
    return stripped === "/" ? "/" : stripped.replace(/\/$/, "") || "/"
  }
  return pathname || "/"
}

export function addLocaleToPathname(pathname: string, locale: AppLocale) {
  const stripped = stripLocaleFromPathname(pathname)
  return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`
}

export function detectLocaleFromAcceptLanguage(headerValue: string | null | undefined): AppLocale {
  if (!headerValue) return defaultLocale

  const weightedLanguages = headerValue
    .split(",")
    .map((part) => {
      const [language = "", qValue] = part.trim().split(";q=")
      const quality = qValue ? Number.parseFloat(qValue) : 1
      return {
        language: language.toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
      }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { language } of weightedLanguages) {
    if (language === "fr" || language.startsWith("fr-")) return "fr"
    if (language === "en" || language.startsWith("en-")) return "en"
  }

  return defaultLocale
}
