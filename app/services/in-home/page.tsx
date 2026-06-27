"use client"

import { useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { FocusedSupportLinksSection } from "@/components/focused-support-links-section"
import { ServiceForYouSection } from "@/components/service-for-you-section"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ProgramSignupLink } from "@/components/booking-form-provider"
import { ServiceWorkOnSection } from "@/components/service-work-on-section"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"

const forYouIf = [
  "Your dog's biggest issues happen at home — door manners, guests, anxiety.",
  "You want training in the exact environment where behaviour breaks down.",
  "Your schedule makes it hard to attend classes at a fixed location.",
  "You prefer one-on-one attention from an expert in your own space.",
  "You've tried facility-based training and the skills didn't transfer home.",
]

const trainingGoals = [
  "In-home consultation and assessment",
  "Customised behaviour modification plan",
  "Door manners and guest greeting",
  "Separation anxiety protocol",
  "House training and structure",
  "Leash skills in your neighbourhood",
  "Handler coaching and follow-through",
]

const relatedHomeSupportLinks = [
  {
    href: "/services/separation-anxiety",
    title: {
      en: "Separation anxiety training",
      fr: "Anxiété de séparation",
    },
    body: {
      en: "Support for dogs who panic, bark, destroy, or cannot settle when left alone at home.",
      fr: "Soutien pour les chiens qui paniquent, jappent, détruisent ou n'arrivent pas à se calmer seuls à la maison.",
    },
  },
  {
    href: "/services/private-classes",
    title: {
      en: "Private dog training",
      fr: "Cours privés",
    },
    body: {
      en: "One-on-one behaviour coaching when the issue needs a trainer's full attention.",
      fr: "Coaching comportemental individuel lorsqu'un problème exige toute l'attention d'un entraîneur.",
    },
  },
  {
    href: "/services/aggression",
    title: {
      en: "Aggressive dog training",
      fr: "Chien agressif",
    },
    body: {
      en: "Safety-first help when home behaviour includes guarding, growling, snapping, or bite risk.",
      fr: "Aide axée sur la sécurité lorsque le comportement à la maison inclut protection, grognements, morsures ou risques.",
    },
  },
]

export default function InHomePage() {
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
          style={{ backgroundImage: "url('/images/Classes%20images/in-home.webp')" }}
        >
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
              {t("Consultation + 3, 5, or 7 session packages")}
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              {t("In-Home Dog Training — Montreal")}
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              {t("Training where it matters most — in your home, in your neighbourhood, on your schedule. Every program starts with a personalised consultation.")}
            </p>
            <div className="reveal opacity-0 animation-delay-600 mt-8">
              <ProgramSignupLink>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-5 text-sm md:text-base group shine-effect animate-shine">
                  {t("Start Program Sign-Up")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </ProgramSignupLink>
            </div>
          </div>
        </section>

        <ServiceWorkOnSection goals={trainingGoals} />

        <ServiceForYouSection items={forYouIf} />

        <FocusedSupportLinksSection
          eyebrow={{
            en: "Home behaviour support",
            fr: "Soutien comportemental à domicile",
          }}
          title={{
            en: "When the problem happens inside the home",
            fr: "Quand le problème se produit à la maison",
          }}
          intro={{
            en: "Home routines, door behaviour, alone time, and safety concerns often need a focused private plan before they improve in daily life.",
            fr: "Les routines à la maison, les comportements à la porte, le temps seul et les enjeux de sécurité demandent souvent un plan privé ciblé.",
          }}
          links={relatedHomeSupportLinks}
        />

        {/* CTA */}
        <section className="pt-10 pb-20 lg:pt-14 lg:pb-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6">
              {t("Training that comes to you.")}
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              {t("Start with a free 15-minute discovery call. We'll learn about your dog, your home, and your goals — then recommend the right package to get started.")}
            </p>
            <div className="reveal opacity-0 animation-delay-400">
              <ProgramSignupLink>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
                >
                  {t("Start Program Sign-Up")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </ProgramSignupLink>
            </div>
          </div>
        </section>

        <TrustStrip />
      </div>

      <Footer />
    </main>
  )
}
