import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

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

export default async function ObedienceLayout({
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
            locale === "fr" ? "Obéissance canine — Montréal" : "Obedience Dog Training — Montreal",
          description:
            locale === "fr"
              ? "Cours d'obéissance privés et de groupe à Montréal. Niveau 1 pour les bases, niveau 2 avancé avec marches de meute et distractions élevées, plus séances individuelles."
              : "Private and group obedience classes in Montreal. Level 1 basics, Level 2 advanced work with pack walks and high distractions, plus private one-on-one sessions.",
          path: "/services/obedience",
          locale,
          price: "349",
        })}
      />
      {children}
    </>
  )
}
