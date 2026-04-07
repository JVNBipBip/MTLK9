import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "High-Risk Behaviors",
  description:
    "When safety is on the line, you need more than YouTube advice. Specialized support for aggression, resource guarding, bite history, and cases other trainers have turned away.",
  alternates: { canonical: "https://mtlcaninetraining.com/services/high-risk" },
}

export default function HighRiskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "High-Risk Behavior Dog Training",
          description: "Specialized support for aggression, resource guarding, bite history, and cases other trainers have turned away.",
          url: "https://mtlcaninetraining.com/services/high-risk",
          price: "699",
        })}
      />
      {children}
    </>
  )
}
