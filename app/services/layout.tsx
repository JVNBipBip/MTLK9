import type { Metadata } from "next"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/services",
    title: {
      en: "Dog Training Montreal | Programs & Classes",
      fr: "Entraînement canin Montréal | Programmes",
    },
    description: {
      en: "Dog training in Montreal for puppies, reactivity, obedience, private lessons, group classes, and in-home support.",
      fr: "Entraînement canin à Montréal pour chiots, réactivité, obéissance, cours privés, cours de groupe et soutien à domicile.",
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
