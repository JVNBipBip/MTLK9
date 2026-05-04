import type { Metadata } from "next"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/results",
    title: {
      en: "Dog Training Results in Montreal",
      fr: "Résultats d'entraînement canin à Montréal",
    },
    description: {
      en: "Real dogs. Real Montreal. Real results. See transformation stories from our training programs.",
      fr: "De vrais chiens, de vrais progrès et des histoires de transformation à Montréal.",
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
