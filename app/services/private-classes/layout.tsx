import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/services/private-classes",
    title: {
      en: "Private Dog Training in Montreal",
      fr: "Cours privés pour chiens à Montréal",
    },
    description: {
      en: "One-on-one dog training in Montreal for reactivity, anxiety, aggression, confidence, and custom goals.",
      fr: "Coaching individuel pour le comportement, la réactivité, l'anxiété, l'agressivité et les objectifs personnalisés.",
    },
    image: "/images/Classes images/private.webp",
  })
}

export default function PrivateClassesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Private Dog Training Classes — Montreal",
          description: "One-on-one dog training packages for behaviour modification, reactivity, aggression, confidence building, separation anxiety, and resource guarding.",
          url: "https://mtlcaninetraining.com/services/private-classes",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
