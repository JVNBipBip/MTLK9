import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

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

export default async function ConsultationLayout({
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
              ? "Consultation en entraînement canin — Montréal"
              : "Dog Training Consultation — Montreal",
          description:
            locale === "fr"
              ? "Consultation en personne : vos objectifs, le comportement de votre chien, le choix entre cours privés et cours de groupe, et la réservation de votre évaluation."
              : "In-person training consultation covering your goals, your dog's behaviour, program fit between private lessons and group classes, and booking your evaluation.",
          path: "/services/consultation",
          locale,
          price: "199",
        })}
      />
      {children}
    </>
  )
}
