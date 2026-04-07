import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "Day Training",
  description:
    "Your dog trains while you work. Professional training during working hours with owner handoff sessions — faster results for busy Montreal dog owners.",
  alternates: { canonical: "https://mtlcaninetraining.com/services/day-training" },
}

export default function DayTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Day Training for Dogs",
          description: "Professional training during working hours with owner handoff sessions — faster results for busy Montreal dog owners.",
          url: "https://mtlcaninetraining.com/services/day-training",
          price: "799",
        })}
      />
      {children}
    </>
  )
}
