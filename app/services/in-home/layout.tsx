import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "In-Home Training",
  description:
    "In-home dog training in Montreal. Starts with a consultation, then 3, 5, or 7 session packages — behaviour modification, flexible scheduling, and one-on-one expert attention in your home.",
  alternates: { canonical: "https://mtlcaninetraining.com/services/in-home" },
}

export default function InHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "In-Home Dog Training — Montreal",
          description: "In-home dog training starting with a consultation and customized program. Behaviour modification with flexible scheduling in your own home.",
          url: "https://mtlcaninetraining.com/services/in-home",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
