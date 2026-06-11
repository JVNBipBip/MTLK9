import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/services/reactivity",
    title: {
      en: "Reactive Dog Training in Montreal",
      fr: "Entraînement pour chiens réactifs à Montréal",
    },
    description: {
      en: "Reactivity dog training in Montreal for barking, lunging, fear, and calmer walks.",
      fr: "Programmes privés et de groupe pour les chiens qui jappent, se lancent ou figent face aux déclencheurs.",
    },
    image: "/images/Classes images/reactivity.webp",
  })
}

export default async function ReactivityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getRequestLocale()

  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name:
            locale === "fr"
              ? "Entraînement pour chiens réactifs — Montréal"
              : "Reactivity Dog Training — Montreal",
          description:
            locale === "fr"
              ? "Programmes privés et de groupe pour les chiens qui jappent, se lancent ou figent face aux déclencheurs. Protocoles structurés et méthodes humaines."
              : "Private and group reactivity training for dogs who lunge, bark, or shut down. Structured protocols using humane, evidence-guided methods.",
          path: "/services/reactivity",
          locale,
          price: "349",
        })}
      />
      {children}
    </>
  )
}
