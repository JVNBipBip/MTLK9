import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Real Results",
  description:
    "Real dogs. Real Montreal. Real results. See transformation stories from our training programs.",
  alternates: { canonical: "https://mtlcaninetraining.com/results" },
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
