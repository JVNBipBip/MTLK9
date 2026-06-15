import type { Metadata } from "next"
import { BookingPageRedirect } from "./booking-page-redirect"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

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

export default async function BookingPage() {
  const locale = await getRequestLocale()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <h1 className="text-2xl font-semibold">
        {locale === "fr"
          ? "Réserver une évaluation en entraînement canin à Montréal"
          : "Book a Dog Training Assessment in Montreal"}
      </h1>
      <BookingPageRedirect />
    </main>
  )
}
