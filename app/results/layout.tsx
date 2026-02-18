import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Real Results — Montreal Canine Training",
  description:
    "Real dogs. Real Montreal. Real results. See transformation stories from our training programs.",
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
