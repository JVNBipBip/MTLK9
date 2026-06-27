import type { Metadata } from "next"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/group-classes",
    title: {
      en: "Dog Training Classes Montreal | Group Classes",
      fr: "Cours de dressage chien Montréal | Groupe",
    },
    description: {
      en: "Group dog training classes in Montreal for puppies, obedience, and reactivity with trainer-approved placement.",
      fr: "Cours de groupe pour chiens à Montréal : chiots, obéissance et réactivité avec placement approuvé par un entraîneur.",
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
