import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata } from "@/lib/seo"

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

export default function PuppyTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Puppy Training — Montreal",
          description: "Puppy group socialization, teen puppy classes, and private sessions in Montreal. Confidence building, basic commands, and a strong foundation from the start.",
          url: "https://mtlcaninetraining.com/services/puppy-training",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
