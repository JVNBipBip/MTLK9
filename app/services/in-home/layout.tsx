import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/services/in-home",
    title: {
      en: "In-Home Dog Training in Montreal",
      fr: "Entraînement canin à domicile à Montréal",
    },
    description: {
      en: "In-home dog training in Montreal for behaviour, door manners, leash skills, and routines at home.",
      fr: "Entraînement à domicile à Montréal pour le comportement, la laisse et les routines familiales.",
    },
    image: "/images/Classes images/in-home.webp",
  })
}

export default async function InHomeLayout({
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
              ? "Entraînement canin à domicile — Montréal"
              : "In-Home Dog Training — Montreal",
          description:
            locale === "fr"
              ? "Entraînement à domicile débutant par une consultation et un programme personnalisé. Modification du comportement avec horaire flexible, chez vous."
              : "In-home dog training starting with a consultation and customized program. Behaviour modification with flexible scheduling in your own home.",
          path: "/services/in-home",
          locale,
          price: "349",
        })}
      />
      {children}
    </>
  )
}
