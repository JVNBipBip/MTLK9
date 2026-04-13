"use client"

import { useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { ServiceForYouSection } from "@/components/service-for-you-section"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ProgramSignupLink } from "@/components/booking-form-provider"
import { ServiceWorkOnSection } from "@/components/service-work-on-section"

const forYouIf = [
  "Your puppy is biting everything — hands, furniture, ankles.",
  "You're not sure how to socialise safely without overwhelming them.",
  "Your teen pup is hitting the 'selective hearing' phase.",
  "You want to build good habits before bad ones take root.",
  "You want a confident, well-adjusted dog — not just a trained one.",
]

const trainingGoals = [
  "Confidence building through guided play",
  "Controlled socialisation with other puppies",
  "Engagement, focus, and relationship development",
  "Obstacle courses and novel experiences",
  "Introduction to the six basic commands",
  "Marker training and distraction exposure",
  "Bite inhibition and impulse control",
]

export default function PuppyTrainingPage() {
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
          style={{ backgroundImage: "url('/images/Classes%20images/puppy.webp')" }}
        >
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
              Private &amp; Group Classes — Puppies &amp; Teens
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              Puppy Training in Montreal
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              The first few months shape the next ten years. Build confidence, manners,
              and a strong bond from the very beginning.
            </p>
            <div className="reveal opacity-0 animation-delay-600 mt-8">
              <ProgramSignupLink>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-5 text-sm md:text-base group shine-effect animate-shine">
                  Start Program Sign-Up
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </ProgramSignupLink>
            </div>
          </div>
        </section>

        <ServiceWorkOnSection goals={trainingGoals} />

        <ServiceForYouSection items={forYouIf} />

        {/* CTA */}
        <section className="pt-10 pb-20 lg:pt-14 lg:pb-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6">
              Start your puppy off right.
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              Book a free 15-minute discovery call. We&apos;ll help you figure out which class
              — socialisation, teen group, or private — is the right fit for your puppy&apos;s age and needs.
            </p>
            <div className="reveal opacity-0 animation-delay-400">
              <ProgramSignupLink>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
                >
                  Start Program Sign-Up
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
