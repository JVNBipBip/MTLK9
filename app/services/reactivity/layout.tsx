import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "Reactivity Training",
  description:
    "Private and group reactivity training in Montreal. Structured protocols for lunging, barking, fear, and shutting down — using humane, evidence-guided methods.",
  alternates: { canonical: "https://mtlcaninetraining.com/services/reactivity" },
}

export default function ReactivityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Reactivity Dog Training — Montreal",
          description: "Private and group reactivity training for dogs who lunge, bark, or shut down. Structured protocols using humane, evidence-guided methods.",
          url: "https://mtlcaninetraining.com/services/reactivity",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
