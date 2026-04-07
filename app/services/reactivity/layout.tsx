import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "Reactivity & Anxiety",
  description:
    "Stop planning your life around your dog's triggers. Structured protocols for leash reactivity, fear, anxiety, and separation anxiety — humane, evidence-guided methods.",
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
          name: "Reactivity & Anxiety Dog Training",
          description: "Structured protocols for leash reactivity, fear, anxiety, and separation anxiety — humane, evidence-guided methods.",
          url: "https://mtlcaninetraining.com/services/reactivity",
          price: "599",
        })}
      />
      {children}
    </>
  )
}
