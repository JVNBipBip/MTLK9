import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AboutContent } from "./about-content"

export const metadata = {
  title: "About Us — Montreal Canine Training",
  description:
    "Meet the team behind Montreal Canine Training. We believe training is about the human, not the dog — force-free, science-based methods, real-world sessions, and support until it clicks.",
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
