import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "City Manners",
  description:
    "Make every walk the best part of your day. Urban life skills for dogs: loose leash walking, door manners, recall in distracting environments, and impulse control.",
  alternates: { canonical: "https://mtlcaninetraining.com/services/city-manners" },
}

export default function CityMannersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "City Manners Dog Training",
          description: "Urban life skills for dogs: loose leash walking, door manners, recall in distracting environments, and impulse control.",
          url: "https://mtlcaninetraining.com/services/city-manners",
          price: "449",
        })}
      />
      {children}
    </>
  )
}
