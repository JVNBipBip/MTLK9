import type { Metadata } from "next"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/services",
    title: {
      en: "Dog Training Programs in Montreal",
      fr: "Programmes d'entraînement canin à Montréal",
    },
    description: {
      en: "Explore dog training programs in Montreal for reactivity, obedience, puppies, private lessons, and in-home support.",
      fr: "Choisissez le bon parcours pour votre chien : réactivité, cours privés, obéissance, chiots ou entraînement à domicile.",
    },
  })
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
