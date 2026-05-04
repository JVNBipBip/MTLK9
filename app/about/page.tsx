import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { buildLocalizedMetadata } from "@/lib/seo"
import { AboutContent } from "./about-content"

export function generateMetadata() {
  return buildLocalizedMetadata({
    path: "/about",
    title: {
      en: "About Montreal Canine Training",
      fr: "À propos d'Entraînement Canin Montréal",
    },
    description: {
      en: "Meet the Montreal Canine Training team and our practical, relationship-first approach to dog training.",
      fr: "Découvrez notre équipe, notre philosophie et nos méthodes d'entraînement canin humaines et concrètes.",
    },
  })
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <AboutContent />
      <Footer />
    </main>
  )
}
