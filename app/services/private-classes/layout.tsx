import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

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

export default async function PrivateClassesLayout({
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
              ? "Cours privés pour chiens — Montréal"
              : "Private Dog Training Classes — Montreal",
          description:
            locale === "fr"
              ? "Forfaits d'entraînement individuels pour la modification du comportement, la réactivité, l'agressivité, la confiance, l'anxiété de séparation et la protection des ressources."
              : "One-on-one dog training packages for behaviour modification, reactivity, aggression, confidence building, separation anxiety, and resource guarding.",
          path: "/services/private-classes",
          locale,
          price: "349",
        })}
      />
      {children}
    </>
  )
}
