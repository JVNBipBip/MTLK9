import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/services/in-home",
    title: {
      en: "In-Home Dog Training in Montreal",
      fr: "Entraînement canin à domicile à Montréal",
    },
    description: {
      en: "In-home dog training in Montreal for behaviour, door manners, leash skills, and routines at home.",
      fr: "Entraînement à domicile à Montréal pour le comportement, la laisse et les routines familiales.",
    },
    image: "/images/Classes images/in-home.webp",
  })
}

export default function InHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "In-Home Dog Training — Montreal",
          description: "In-home dog training starting with a consultation and customized program. Behaviour modification with flexible scheduling in your own home.",
          url: "https://mtlcaninetraining.com/services/in-home",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
