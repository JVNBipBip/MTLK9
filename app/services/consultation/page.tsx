"use client"

import { useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { ServiceForYouSection } from "@/components/service-for-you-section"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { BookingLink } from "@/components/booking-form-provider"
import { ServiceWorkOnSection } from "@/components/service-work-on-section"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"

const consultationGoals = [
  "Your goals & priorities",
  "Your dog's behaviour day to day",
  "Stress, safety & quality of life",
  "Private vs group program fit",
  "Your questions, answered plainly",
]

const forYouIf = [
  "You're new to structured training and want clarity before committing to a package.",
  "You're unsure whether private lessons or a group series would suit your dog best.",
  "You've tried tips from friends, videos, or apps and want a professional read on what's happening.",
  "You want time to explain the full picture — routines, triggers, and what you've already tried.",
  "You're ready for an in-person evaluation so we can recommend the safest, most realistic next step.",
]

const goalCarouselBody =
  "In a consultation, we prioritize listening — then outline clear options so you leave with direction, not guesswork."

export default function ConsultationPage() {
  const t = useLocalizedText()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = contentRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div ref={contentRef}>
        {/* Hero */}
        <section
          className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 px-6 lg:px-8 bg-primary text-primary-foreground bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/Classes%20images/obedience.webp')" }}
        >
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
              {t("In-person evaluation — where every training path begins")}
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              {t("Dog Training Consultations in Montreal")}
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              {t(
                "Meet a trainer, clarify your goals, and get a personalised recommendation — private training, group classes, or a combination — before you purchase a larger package.",
              )}
            </p>
            <div className="reveal opacity-0 animation-delay-600 mt-8">
              <BookingLink>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-5 text-sm md:text-base group shine-effect animate-shine">
                  {t("Book a Consultation")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </BookingLink>
            </div>
          </div>
        </section>

        <ServiceWorkOnSection goals={consultationGoals} ctaMode="book_consultation" goalCardBodyText={goalCarouselBody} />

        <ServiceForYouSection items={forYouIf} ctaMode="book_consultation" />

        {/* CTA */}
        <section className="pt-10 pb-20 lg:pt-14 lg:pb-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6">
              {t("Ready to schedule your consultation?")}
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              {t(
                "Choose a convenient time online, bring your dog, and we'll take it from there. If email works better first, you'll find that option inside the booking flow too.",
              )}
            </p>
            <div className="reveal opacity-0 animation-delay-400">
              <BookingLink>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group">
                  {t("Book a Consultation")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </BookingLink>
            </div>
          </div>
        </section>

        <TrustStrip />
      </div>

      <Footer />
    </main>
  )
}
