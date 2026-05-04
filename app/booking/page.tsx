import type { Metadata } from "next"
import { BookingPageRedirect } from "./booking-page-redirect"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: "/booking",
    title: {
      en: "Book a Dog Training Assessment",
      fr: "Réserver une évaluation d'entraînement canin",
    },
    description: {
      en: "Contact us for a free dog training discovery call or assessment in Montreal.",
      fr: "Appelez-nous ou écrivez-nous pour parler de votre chien et trouver le bon parcours d'entraînement.",
    },
  })
}

export default function BookingPage() {
  return <BookingPageRedirect />
}
