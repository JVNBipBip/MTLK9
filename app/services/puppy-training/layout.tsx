import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "Puppy Training",
  description:
    "Puppy training in Montreal — group socialization for 10–20 weeks, teen puppy classes for 5–9 months, and private one-on-one sessions. Build confidence, manners, and a strong foundation.",
  alternates: { canonical: "https://mtlcaninetraining.com/services/puppy-training" },
}

export default function PuppyTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Puppy Training — Montreal",
          description: "Puppy group socialization, teen puppy classes, and private sessions in Montreal. Confidence building, basic commands, and a strong foundation from the start.",
          url: "https://mtlcaninetraining.com/services/puppy-training",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
