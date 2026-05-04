import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/services/obedience",
    title: {
      en: "Obedience Dog Training in Montreal",
      fr: "Obéissance canine à Montréal",
    },
    description: {
      en: "Private and group obedience training in Montreal for reliable recall, leash skills, and focus.",
      fr: "Compétences fiables dans la vraie vie : rappel, marche en laisse, impulsions et distractions.",
    },
    image: "/images/Classes images/obedience.webp",
  })
}

export default function ObedienceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Obedience Dog Training — Montreal",
          description: "Private and group obedience classes in Montreal. Level 1 basics, Level 2 advanced work with pack walks and high distractions, plus private one-on-one sessions.",
          url: "https://mtlcaninetraining.com/services/obedience",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
