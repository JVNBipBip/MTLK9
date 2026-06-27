"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { FocusedSupportLinksSection } from "@/components/focused-support-links-section"
import { ServiceForYouSection } from "@/components/service-for-you-section"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check } from "lucide-react"
import { ProgramSignupLink } from "@/components/booking-form-provider"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { IN_FACILITY_PRICING_SECTIONS } from "@/lib/in-facility-training-pricing"

const privatePackageRows =
  IN_FACILITY_PRICING_SECTIONS.find((section) => section.title === "Private Classes")?.rows.slice(0, 3) ?? []

const privateClassTopics = [
  "Leash Reactivity",
  "Aggression, Resource guarding, Separation anxiety",
  "Puppy Training",
  "Obedience Training",
  "Specialized training upon client request",
]

const forYouIf = [
  "You want a trainer's full attention on your specific situation.",
  "You've tried group classes and your dog needs something more tailored.",
  "You're dealing with reactivity, anxiety, aggression, or guarding.",
  "You want a clear plan built around your dog — not a generic curriculum.",
]

const focusedPrivateSupportLinks = [
  {
    href: "/services/aggression",
    title: {
      en: "Aggressive dog training",
      fr: "Chien agressif",
    },
    body: {
      en: "Private behaviour work for growling, snapping, biting, resource guarding, and safety concerns.",
      fr: "Travail comportemental privé pour grognements, morsures, protection des ressources et enjeux de sécurité.",
    },
  },
  {
    href: "/services/separation-anxiety",
    title: {
      en: "Separation anxiety training",
      fr: "Anxiété de séparation",
    },
    body: {
      en: "A calmer plan for dogs who bark, panic, destroy, or struggle when left alone.",
      fr: "Un plan plus calme pour les chiens qui jappent, paniquent, détruisent ou supportent mal d'être seuls.",
    },
  },
  {
    href: "/services/reactivity",
    title: {
      en: "Reactive dog training",
      fr: "Entraînement pour chiens réactifs",
    },
    body: {
      en: "Structured support for lunging, barking, freezing, or leash conflict around triggers.",
      fr: "Soutien structuré pour les chiens qui se lancent, jappent, figent ou réagissent en laisse.",
    },
  },
]

export default function PrivateClassesPage() {
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
          style={{ backgroundImage: "url('/images/Classes%20images/private.webp')" }}
        >
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
              {t("Most Popular Option — 3, 5, or 7 Session Packages")}
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              {t("Private Dog Training in Montreal")}
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              {t("One-on-one sessions designed to provide personalized, hands-on training tailored specifically to your dog's needs.")}
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

        <section className="py-20 lg:py-28 px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <div className="lg:col-span-5 lg:sticky lg:top-32">
                <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
                  {t("Our most popular program")}
                </p>
                <h2 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground text-balance mb-6">
                  {t("Private classes")}
                </h2>
                <div className="reveal opacity-0 animation-delay-400 relative aspect-[3/4] rounded-2xl overflow-hidden border border-border/50 shadow-md">
                  <Image
                    src="/images/yul_image.jpg"
                    alt={t("Private dog training session in Montreal")}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 400px"
                  />
                </div>
              </div>

              <div className="lg:col-span-7">
                <article className="reveal opacity-0 animation-delay-200 bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 p-8 md:p-10">
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                    {t(
                      "Each session is tailored to the dog's specific needs while gradually introducing controlled distractions to help build confidence and set the dog up for success. As training progresses, we will meet in different environments to make the training more realistic and applicable to everyday life. Whether you need help with basic puppy training or need help with behavioural problems, private classes is the most ideal and productive route for training.",
                    )}
                  </p>

                  <div className="mt-8 pt-8 border-t border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {t("Typical topics covered in private classes:")}
                    </p>
                    <ul className="space-y-3">
                      {privateClassTopics.map((topic) => (
                        <li key={topic} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="text-muted-foreground text-base md:text-lg leading-relaxed">{t(topic)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-8 border-t border-border/50 space-y-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-secondary font-semibold">
                      {t("Our packages")}
                    </p>
                    {privatePackageRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4"
                      >
                        <p className="font-display text-lg md:text-xl tracking-tight text-foreground">{t(row.label)}</p>
                        <p className="text-muted-foreground text-base md:text-lg whitespace-nowrap tabular-nums shrink-0">
                          {row.price}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-border/50">
                    <p className="text-xs uppercase tracking-[0.16em] text-secondary font-semibold mb-3">
                      {t("Our goal")}
                    </p>
                    <p className="font-display text-xl md:text-2xl tracking-tight leading-snug text-foreground">
                      {t(
                        "Our goal is to successfully transition the dog into a group setting or help the owner achieve their desired training goals.",
                      )}
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <ServiceForYouSection items={forYouIf} />

        <FocusedSupportLinksSection
          eyebrow={{
            en: "Focused behaviour support",
            fr: "Soutien comportemental ciblé",
          }}
          title={{
            en: "Need help with a specific behaviour problem?",
            fr: "Besoin d'aide pour un problème précis?",
          }}
          intro={{
            en: "Private training is the core path, and these focused pages explain how we approach the problems Montreal dog owners search for most.",
            fr: "Les cours privés sont le parcours principal, et ces pages ciblées expliquent comment nous abordons les problèmes les plus recherchés par les propriétaires de chiens à Montréal.",
          }}
          links={focusedPrivateSupportLinks}
        />

        {/* CTA */}
        <section className="pt-10 pb-20 lg:pt-14 lg:pb-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6">
              {t("Your dog deserves a plan built for them.")}
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              {t("Start with a free 15-minute discovery call. Tell us what's going on and we'll recommend the right package — no pressure, no commitment.")}
            </p>
            <div className="reveal opacity-0 animation-delay-300">
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
