import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { BookingLink } from "@/components/booking-form-provider"
import { FaqAccordion } from "@/components/faq-accordion"

export const metadata = {
  title: "FAQ — Montreal Canine Training",
  description:
    "Methods, costs, timelines, safety — everything you need to know before booking dog training in Montreal.",
}

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background">
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
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl bg-primary/5 border border-primary/10 p-8 md:p-10 text-center animate-fade-up">
            <p className="text-lg md:text-xl text-foreground font-medium mb-6">
              Still have a question? Book a free 15-minute call and we&apos;ll answer
              it personally.
            </p>
            <BookingLink>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 gap-2"
              >
                Book a Free Call
                <ArrowRight className="w-4 h-4" />
              </Button>
            </BookingLink>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
