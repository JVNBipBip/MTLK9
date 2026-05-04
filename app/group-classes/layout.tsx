import type { Metadata } from "next"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/group-classes",
    title: {
      en: "Dog Group Classes in Montreal",
      fr: "Cours de groupe pour chiens à Montréal",
    },
    description: {
      en: "Small-group puppy, obedience, and reactivity classes in Montreal with trainer-approved placement.",
      fr: "Cours de groupe pour chiots, obéissance et réactivité à Montréal, avec placement approuvé.",
    },
    image: "/images/Classes images/puppy_social.jpg",
  })
}

export default function GroupClassesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
