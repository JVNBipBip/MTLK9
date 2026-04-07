import type { Metadata } from "next"
import { JsonLd, buildServiceJsonLd } from "@/components/json-ld"

export const metadata: Metadata = {
  title: "Puppy Foundations",
  description:
    "Raise the dog you'll be proud to live with. Puppy training for 8–20 weeks: bite inhibition, house training, socialization, leash introduction, and calm foundations.",
  alternates: { canonical: "https://mtlcaninetraining.com/services/puppy-foundations" },
}

export default function PuppyFoundationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: "Puppy Foundations Training",
          description: "Puppy training for 8–20 weeks: bite inhibition, house training, socialization, leash introduction, and calm foundations.",
          url: "https://mtlcaninetraining.com/services/puppy-foundations",
          price: "349",
        })}
      />
      {children}
    </>
  )
}
