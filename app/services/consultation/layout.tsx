import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/services/consultation",
    title: {
      en: "Dog Training Consultation in Montreal",
      fr: "Consultation en entraînement canin à Montréal",
    },
    description: {
      en: "Book an in-person dog training consultation in Montreal — goals, behaviour review, and a clear path to private or group training.",
      fr:
        "Réservez une consultation en personne à Montréal : objectifs, analyse du comportement et recommandation pour l'entraînement privé ou en groupe.",
    },
    image: "/images/Classes images/obedience.webp",
  })
}

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Dog Training Consultation — Montreal",
          description:
            "In-person training consultation covering your goals, your dog's behaviour, program fit between private lessons and group classes, and booking your evaluation.",
          url: "https://mtlcaninetraining.com/services/consultation",
          price: "199",
        })}
      />
      {children}
    </>
  )
}
