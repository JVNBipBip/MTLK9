import type { Metadata } from "next"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/results",
    title: {
      en: "Dog Training Before & After Stories in Montreal | MTL Canine Training",
      fr: "Avant et après : résultats d'entraînement canin à Montréal | MTL Canine Training",
    },
    description: {
      en: "Video stories from real Montreal dog owners, from reactive walks and puppy struggles to calm, confident dogs. See what changed and how we trained them.",
      fr: "Témoignages vidéo de vrais propriétaires à Montréal, de la réactivité en promenade aux défis du chiot, jusqu’à un chien calme et confiant. Voyez ce qui a changé et comment.",
    },
  })
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
