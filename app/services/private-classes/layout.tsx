import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "Private Classes",
  description:
    "One-on-one dog training in Montreal. Flexible private class packages for behaviour modification, leash reactivity, aggression, separation anxiety, and more.",
  alternates: { canonical: "https://mtlcaninetraining.com/services/private-classes" },
}

export default function PrivateClassesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Private Dog Training Classes — Montreal",
          description: "One-on-one dog training packages for behaviour modification, reactivity, aggression, confidence building, separation anxiety, and resource guarding.",
          url: "https://mtlcaninetraining.com/services/private-classes",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
