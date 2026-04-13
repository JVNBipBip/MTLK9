import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Phone } from "lucide-react"
import { FreeCallLink } from "@/components/booking-form-provider"
import { FaqAccordion } from "@/components/faq-accordion"
import { faqData } from "@/lib/faq-data"
import { JsonLd, buildFaqJsonLd } from "@/components/json-ld"

export const metadata = {
  title: "FAQ",
  description:
    "Methods, costs, timelines, safety — everything you need to know before booking dog training in Montreal.",
  alternates: { canonical: "https://mtlcaninetraining.com/faq" },
}

export default function FaqPage() {
  const allFaqItems = faqData.flatMap((cat) => cat.items)

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={buildFaqJsonLd(allFaqItems)} />
      <Header />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4 animate-fade-up">
            The Questions Every Montreal Dog Owner Asks
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 md:mb-16 animate-fade-up animation-delay-200">
            Methods, costs, timelines, safety — everything you need to know before
            booking.
          </p>
          <FaqAccordion />
        </div>
      </section>
      <section className="px-6 lg:px-8 pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[48px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
            <div className="relative px-8 lg:px-16 py-16 lg:py-24 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
                Still Have Questions?
              </p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground text-balance mb-6 max-w-3xl mx-auto">
                Book a free 15-minute discovery call
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto leading-relaxed mb-10">
                We&apos;ll answer your questions personally and help you figure out the right path for your dog.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <FreeCallLink>
                  <Button
                    size="lg"
                    className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 py-6 text-base group"
                  >
                    Book Your Free Call
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </FreeCallLink>
                <a href="tel:+15148269558">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 py-6 text-base border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground bg-transparent"
                  >
                    <Phone className="mr-2 w-4 h-4" />
                    514 826 9558
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
