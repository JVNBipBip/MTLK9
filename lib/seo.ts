import type { Metadata } from "next"
import { headers } from "next/headers"
import { defaultLocale, isAppLocale, localeConfig, localeHeaderName, type AppLocale } from "@/lib/i18n/config"

export const SITE_URL = "https://www.mtlcaninetraining.com"

type LocalizedValue = string | Record<AppLocale, string>

type LocalizedMetadataInput = {
  path: string
  title: LocalizedValue
  description: LocalizedValue
  image?: string
  robots?: Metadata["robots"]
  /** OpenGraph object type — blog posts pass "article". */
  ogType?: "website" | "article"
}

function valueForLocale(value: LocalizedValue, locale: AppLocale) {
  return typeof value === "string" ? value : value[locale]
}

export async function getRequestLocale(): Promise<AppLocale> {
  const headerStore = await headers()
  const locale = headerStore.get(localeHeaderName)
  return isAppLocale(locale) ? locale : defaultLocale
}

export function localizedPath(locale: AppLocale, path: string) {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`
  return `/${locale}${normalizedPath}`
}

export function localizedUrl(locale: AppLocale, path: string) {
  return `${SITE_URL}${localizedPath(locale, path)}`
}

/** Sitewide fallback OG/Twitter image — page-level `openGraph` replaces the
 * root layout's wholesale, so every page needs an image of its own.
 * 1200x630 JPEG generated from the private-training photo. */
const DEFAULT_OG_IMAGE = "/images/og-default.jpg"

const OG_SITE_NAME = "MTL Canine Training"

export async function buildLocalizedMetadata({
  path,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  robots,
  ogType = "website",
}: LocalizedMetadataInput): Promise<Metadata> {
  const locale = await getRequestLocale()
  const otherLocale: AppLocale = locale === "fr" ? "en" : "fr"
  const pageTitle = valueForLocale(title, locale)
  const pageDescription = valueForLocale(description, locale)
  const url = localizedUrl(locale, path)
  const imageUrl = image
    ? new URL(image.startsWith("/") ? image : `/${image}`, SITE_URL).toString()
    : undefined

  return {
    title: {
      absolute: pageTitle,
    },
    description: pageDescription,
    alternates: {
      canonical: url,
      languages: {
        en: localizedUrl("en", path),
        fr: localizedUrl("fr", path),
        "x-default": localizedUrl(defaultLocale, path),
      },
    },
    // Page-level openGraph/twitter replace the root layout's wholesale, so
    // mirror siteName/type/locale/card here — otherwise subpages drop them.
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      siteName: OG_SITE_NAME,
      type: ogType,
      locale: localeConfig[locale].openGraphLocale,
      alternateLocale: [localeConfig[otherLocale].openGraphLocale],
      images: imageUrl ? [imageUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots,
  }
}

export function noIndexMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  }
}
