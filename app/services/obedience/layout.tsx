import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "Obedience Training",
  description:
    "Private and group obedience training in Montreal. Level 1 and Level 2 group classes, plus private one-on-one sessions for specialized obedience work.",
  alternates: { canonical: "https://mtlcaninetraining.com/services/obedience" },
}

export default function ObedienceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Obedience Dog Training — Montreal",
          description: "Private and group obedience classes in Montreal. Level 1 basics, Level 2 advanced work with pack walks and high distractions, plus private one-on-one sessions.",
          url: "https://mtlcaninetraining.com/services/obedience",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
