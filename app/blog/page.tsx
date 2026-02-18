import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlogContent } from "./blog-content"

export const metadata: Metadata = {
  title: "Blog — Montreal Canine Training",
  description:
    "Tips, stories, and science-backed guidance for Montreal dog owners. Real advice from real trainers.",
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
