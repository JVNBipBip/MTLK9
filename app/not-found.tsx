import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
            404 — Page Not Found
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            This page wandered off-leash.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            We couldn't find what you're looking for. Let's get you back on the
            right path.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 group"
              >
                Back to Home
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/services">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8"
              >
                View Training Programs
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
