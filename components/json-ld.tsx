import { localizedUrl } from "@/lib/seo"
import type { AppLocale } from "@/lib/i18n/config"

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

const SITE_URL = "https://www.mtlcaninetraining.com"

export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": ORGANIZATION_ID,
  name: "Montreal Canine Training",
  alternateName: "MTL K9",
  description:
    "Real-world dog training in Montreal. Calm walks, confident dogs, and clear plans — through humane, evidence-guided methods.",
  url: SITE_URL,
  telephone: "+1-514-826-9558",
  email: "mtlcaninetraining@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "7770 Boul Henri-Bourassa E",
    addressLocality: "Anjou",
    addressRegion: "QC",
    postalCode: "",
    addressCountry: "CA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 45.5917,
    longitude: -73.5673,
  },
  areaServed: [
    { "@type": "City", name: "Montreal" },
    { "@type": "City", name: "Laval" },
    { "@type": "Place", name: "West Island" },
  ],
  priceRange: "$$",
  image: `${SITE_URL}/images/MTLK9_Logo.webp`,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "124",
    bestRating: "5",
    worstRating: "1",
  },
  sameAs: [

    "https://www.instagram.com/mtlcaninetraining/",
    "https://www.facebook.com/profile.php?id=100051498044652",
  ],
}

export function buildWebSiteJsonLd(locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: locale === "fr" ? "Entraînement Canin Montréal" : "Montreal Canine Training",
    alternateName: "MTL Canine Training",
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale === "fr" ? "fr-CA" : "en-CA",
    publisher: { "@id": ORGANIZATION_ID },
  }
}

export function buildServiceJsonLd({
  name,
  description,
  path,
  locale,
  price,
}: {
  name: string
  description: string
  /** Locale-less route path, e.g. "/services/reactivity". */
  path: string
  locale: AppLocale
  price: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: localizedUrl(locale, path),
    inLanguage: locale === "fr" ? "fr-CA" : "en-CA",
    provider: { "@id": ORGANIZATION_ID },
    areaServed: { "@type": "City", name: "Montreal" },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
    },
  }
}

export function buildFaqJsonLd(
  items: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[],
  locale: AppLocale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: localizedUrl(locale, item.path),
    })),
  }
}
