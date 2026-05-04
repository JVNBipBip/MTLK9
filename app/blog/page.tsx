import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { buildLocalizedMetadata } from "@/lib/seo"
import { BlogContent } from "./blog-content"

export function generateMetadata() {
  return buildLocalizedMetadata({
    path: "/blog",
    title: {
      en: "Dog Training Blog",
      fr: "Conseils d'entraînement canin",
    },
    description: {
      en: "Tips, stories, and science-backed guidance for Montreal dog owners. Real advice from real trainers.",
      fr: "Conseils, histoires et explications fondées sur la science pour les propriétaires de chiens à Montréal.",
    },
  })
}

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <BlogContent />
      <Footer />
    </main>
  )
}
