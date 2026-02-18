import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Training Programs — Montreal Canine Training",
  description:
    "Choose your training path: Puppy Foundations, City Manners, Reactivity & Anxiety, High-Risk Behaviors, or Day Training. Every dog is different — we help you find the right program.",
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
