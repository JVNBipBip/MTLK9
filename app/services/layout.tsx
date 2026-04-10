import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Training Programs",
  description:
    "Choose your training path: Reactivity Training, Private Classes, Obedience, Puppy Training, or In-Home Training. Every dog is different — we help you find the right program.",
  alternates: { canonical: "https://mtlcaninetraining.com/services" },
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
