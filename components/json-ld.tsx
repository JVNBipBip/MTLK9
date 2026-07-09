import { localizedUrl } from "@/lib/seo"
import type { AppLocale } from "@/lib/i18n/config"
import type { BlogPost } from "@/lib/blog/types"

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
    streetAddress: "7770 Boulevard Henri-Bourassa E",
    addressLocality: "Montreal",
    addressRegion: "QC",
    postalCode: "H1E 1P2",
    addressCountry: "CA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 45.6221191,
    longitude: -73.5857889,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "20:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "10:00",
      closes: "18:00",
    },
  ],
  areaServed: [
    { "@type": "City", name: "Montreal" },
    { "@type": "City", name: "Laval" },
    { "@type": "Place", name: "West Island" },
  ],
  priceRange: "$$",
  image: `${SITE_URL}/images/MTLK9_Logo.webp`,
  // aggregateRating intentionally omitted: self-serving review markup without
  // on-page user reviews violates Google's structured-data policy. Re-add only
  // alongside a live on-page Google-reviews embed.
  sameAs: [
    "https://www.google.com/maps?cid=8369243989789283109",
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
  areaServed,
}: {
  name: string
  description: string
  /** Locale-less route path, e.g. "/services/reactivity". */
  path: string
  locale: AppLocale
  /** Omit for pages without a fixed package price — no Offer node is emitted. */
  price?: string
  /** Override for the default Montreal service area (e.g. location pages). */
  areaServed?: { "@type": "City" | "Place"; name: string }[]
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: localizedUrl(locale, path),
    inLanguage: locale === "fr" ? "fr-CA" : "en-CA",
    provider: { "@id": ORGANIZATION_ID },
    areaServed: areaServed ?? { "@type": "City", name: "Montreal" },
    offers: price
      ? {
          "@type": "Offer",
          price,
          priceCurrency: "CAD",
          availability: "https://schema.org/InStock",
        }
      : undefined,
  }
}

export function buildPersonJsonLd({
  name,
  jobTitle,
  description,
  path,
  locale,
  image,
  knowsAbout,
}: {
  name: string
  jobTitle: string
  description: string
  /** Locale-less route path, e.g. "/booking/nick". */
  path: string
  locale: AppLocale
  image?: string | null
  knowsAbout: string[]
}) {
  const url = localizedUrl(locale, path)

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#person`,
    name,
    jobTitle,
    description,
    url,
    image: image ? new URL(image.startsWith("/") ? image : `/${image}`, SITE_URL).toString() : undefined,
    worksFor: { "@id": ORGANIZATION_ID },
    knowsAbout,
    areaServed: [
      { "@type": "City", name: "Montreal" },
      { "@type": "Place", name: "Anjou" },
      { "@type": "City", name: "Laval" },
    ],
  }
}

export function buildArticleJsonLd({
  post,
  locale,
  url,
}: {
  post: BlogPost
  locale: AppLocale
  /** Absolute localized URL of the article page. */
  url: string
}) {
  const copy = post.content[locale]
  // Same @id convention as buildPersonJsonLd so the author node connects to
  // the trainer's Person entity on /booking/<slug>.
  const authorUrl = localizedUrl(locale, `/booking/${post.author.slug}`)

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: copy.title,
    description: copy.excerpt,
    image: new URL(post.image.startsWith("/") ? post.image : `/${post.image}`, SITE_URL).toString(),
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    inLanguage: locale === "fr" ? "fr-CA" : "en-CA",
    author: {
      "@type": "Person",
      "@id": `${authorUrl}#person`,
      name: post.author.name,
      url: authorUrl,
    },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: url,
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
