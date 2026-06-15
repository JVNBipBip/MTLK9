import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/services/puppy-training",
    title: {
      en: "Puppy Training Classes in Montreal",
      fr: "Cours d'entraînement pour chiots à Montréal",
    },
    description: {
      en: "Puppy training in Montreal for socialization, confidence, manners, bite inhibition, and focus.",
      fr: "Socialisation, confiance, inhibition de la morsure et bonnes bases pour chiots et jeunes chiens.",
    },
    image: "/images/Classes images/puppy.webp",
  })
}

export default async function PuppyTrainingLayout({
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
            locale === "fr" ? "Entraînement pour chiots — Montréal" : "Puppy Training — Montreal",
          description:
            locale === "fr"
              ? "Socialisation en groupe pour chiots, cours pour jeunes chiens et séances privées à Montréal. Confiance, commandes de base et fondations solides dès le départ."
              : "Puppy group socialization, teen puppy classes, and private sessions in Montreal. Confidence building, basic commands, and a strong foundation from the start.",
          path: "/services/puppy-training",
          locale,
          price: "349",
        })}
      />
      {children}
    </>
  )
}
