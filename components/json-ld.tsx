export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://mtlcaninetraining.com",
  name: "Montreal Canine Training",
  alternateName: "MTL K9",
  description:
    "Real-world dog training in Montreal. Calm walks, confident dogs, and clear plans — through humane, evidence-guided methods.",
  url: "https://mtlcaninetraining.com",
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
  image: "https://mtlcaninetraining.com/images/MTLK9_Logo.webp",
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

export function buildServiceJsonLd({
  name,
  description,
  url,
  price,
}: {
  name: string
  description: string
  url: string
  price: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    provider: {
      "@type": "LocalBusiness",
      name: "Montreal Canine Training",
      telephone: "+1-514-826-9558",
      address: {
        "@type": "PostalAddress",
        streetAddress: "7770 Boul Henri-Bourassa E",
        addressLocality: "Anjou",
        addressRegion: "QC",
        addressCountry: "CA",
      },
    },
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
