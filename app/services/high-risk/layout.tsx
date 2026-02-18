import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "High-Risk Behaviors — Montreal Canine Training",
  description:
    "When safety is on the line, you need more than YouTube advice. Specialized support for aggression, resource guarding, bite history, and cases other trainers have turned away.",
}

export default function HighRiskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
