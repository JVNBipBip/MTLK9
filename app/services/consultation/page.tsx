"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { ServiceForYouSection } from "@/components/service-for-you-section"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check } from "lucide-react"
import { BookingLink } from "@/components/booking-form-provider"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"

const consultationCovers = [
  "Meet and Greet",
  "Full assessment of dog/puppy",
  "Immediate hands-on training",
  "Explanation of our services and pricing",
  "Creating a training program suited for your dog",
  "Reassure and motivate you to develop a stronger connection with your dog.",
]

const forYouIf = [
  "You're a first-time dog owner and don't know where to start.",
  "You're unsure whether private lessons or a group series would suit your dog best.",
  "You've tried tips from friends, videos, or apps and want a professional read on what's happening.",
  "You want time to explain the full picture — routines, triggers, and what you've already tried.",
  "You're ready for an in-person evaluation so we can recommend the safest, most realistic next step.",
]

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
                "Meet with a trainer, clarify your goals and expectations, and let us create a personalized program designed to help you achieve the results you need.",
              )}
            </p>
            <div className="reveal opacity-0 animation-delay-600 mt-8">
              <BookingLink>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-5 text-sm md:text-base group shine-effect animate-shine">
                  {t("Send an Inquiry")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </BookingLink>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <div className="lg:col-span-5 lg:sticky lg:top-32">
                <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
                  {t("Initial 75-minute consultation")}
                </p>
                <h2 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground text-balance mb-6">
                  {t("What we'll cover")}
                </h2>
                <div className="reveal opacity-0 animation-delay-400 space-y-6">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {t("What we will cover during this initial 75-minute consultation session:")}
                  </p>
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/50 shadow-md">
                    <Image
                      src="/images/park_image.jpg"
                      alt={t("Dog training consultation in a Montreal park")}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 400px"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <article className="reveal opacity-0 animation-delay-200 bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 p-8 md:p-10">
                  <div className="mb-8 pb-8 border-b border-border/50 space-y-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-secondary font-semibold mb-1">
                      {t("Pricing")}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
                      <p className="font-display text-lg md:text-xl tracking-tight text-foreground">
                        {t("Puppy (2 months–5 months)")}
                      </p>
                      <p className="text-muted-foreground text-base md:text-lg">
                        {t("$135+tx | 75 minutes")}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
                      <p className="font-display text-lg md:text-xl tracking-tight text-foreground">
                        {t("Adolescent/Adult (5 months +)")}
                      </p>
                      <p className="text-muted-foreground text-base md:text-lg">
                        {t("$145+tx | 75 minutes")}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {consultationCovers.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-muted-foreground text-base md:text-lg leading-relaxed">{t(item)}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          </div>
        </section>

        <ServiceForYouSection items={forYouIf} />

        {/* CTA */}
        <section className="pt-10 pb-20 lg:pt-14 lg:pb-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6">
              {t("Ready to schedule your consultation?")}
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              {t(
                "Choose a convenient time online, bring your dog, and we'll take it from there. If email works better first, you'll find that option inside the booking flow too.",
              )}
            </p>
            <div className="reveal opacity-0 animation-delay-300">
              <BookingLink>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group">
                  {t("Send an Inquiry")}
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
