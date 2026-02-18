import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Day Training — Montreal Canine Training",
  description:
    "Your dog trains while you work. Professional training during working hours with owner handoff sessions — faster results for busy Montreal dog owners.",
}

export default function DayTrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
