import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Puppy Foundations — Montreal Canine Training",
  description:
    "Raise the dog you'll be proud to live with. Puppy training for 8–20 weeks: bite inhibition, house training, socialization, leash introduction, and calm foundations.",
}

export default function PuppyFoundationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
