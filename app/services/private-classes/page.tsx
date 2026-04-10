"use client"

import { useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { ServiceForYouSection } from "@/components/service-for-you-section"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import { ProgramSignupLink } from "@/components/booking-form-provider"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ServiceWorkOnSection } from "@/components/service-work-on-section"

const forYouIf = [
  "Your dog's issues don't fit neatly into a group class.",
  "You want a trainer's full attention on your specific situation.",
  "You've tried group classes and your dog needs something more tailored.",
  "You're dealing with reactivity, anxiety, aggression, or guarding.",
  "You want a clear plan built around your dog — not a generic curriculum.",
]

const trainingGoals = [
  "Behaviour modification",
  "Leash reactivity",
  "Aggression management",
  "Confidence building",
  "Handler skill development",
  "Separation anxiety protocol",
  "Resource guarding",
]

const faqItems = [
  {
    q: "What's the difference between the 3, 5, and 7 class packages?",
    a: "It depends on the complexity of your dog's issues. Three sessions work well for focused problems like leash manners or a single behaviour concern. Five is our most popular — enough to tackle reactivity or anxiety with room for real-world practice. Seven is for complex cases like aggression or multiple overlapping issues.",
  },
  {
    q: "Why private over group?",
    a: "Private classes give us full control over the environment, pace, and focus. There are no distractions from other dogs, no waiting for the group to catch up. Every minute is spent on your dog's specific needs. It's the fastest path to change for most behaviour issues.",
  },
  {
    q: "Where do private sessions take place?",
    a: "Wherever your dog's behaviour happens — your neighbourhood, local parks, busy streets, or our facility. We train in real-world environments so the skills transfer to the situations that actually matter.",
  },
  {
    q: "Can I upgrade my package if I need more sessions?",
    a: "Absolutely. Many clients start with three sessions and add more as they see progress. We'll always be honest about how many sessions we think you'll need — we'd rather under-promise than over-sell.",
  },
  {
    q: "What if my dog has aggression or a bite history?",
    a: "Private classes are the right format for these cases. We start with a thorough assessment, create a safety plan, and work at your dog's pace. We specialise in the cases other trainers turn away.",
  },
]

export default function PrivateClassesPage() {
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
          style={{ backgroundImage: "url('/images/stats/Community%20Walk.webp')" }}
        >
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
              Most Popular Option — 3, 5, or 7 Session Packages
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              Private Dog Training in Montreal
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              One-on-one sessions built entirely around your dog. No group curriculum,
              no distractions — just focused work on what matters most.
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

        {/* Testimonial */}
        <section className="py-20 lg:py-28 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-8">
              Testimonial
            </h2>
            <div className="reveal opacity-0 rounded-3xl overflow-hidden border border-border/50 bg-card">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Video: Luna&apos;s private training transformation</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Luna, 3-year-old German Shepherd Mix</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Luna&apos;s owner had tried two group classes before coming to us. The problem wasn&apos;t Luna&apos;s
                  ability to learn — it was that she couldn&apos;t focus with other dogs around. In private sessions,
                  we worked on her specific triggers at her pace. By session five, she was walking calmly through
                  the park. Her owner says it&apos;s like having a different dog.
                </p>
              </div>
            </div>
            <div className="reveal opacity-0 animation-delay-200 mt-10 text-center">
              <ProgramSignupLink>
                <Button className="rounded-full px-6 py-5 text-sm md:text-base group">
                  Start Program Sign-Up
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </ProgramSignupLink>
            </div>
          </div>
        </section>

        <ServiceForYouSection items={forYouIf} />

        {/* FAQ */}
        <section className="py-20 lg:py-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-12">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="reveal opacity-0">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-border/50">
                  <AccordionTrigger className="text-left py-5 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="pt-10 pb-20 lg:pt-14 lg:pb-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6">
              Your dog deserves a plan built for them.
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              Book a free 15-minute discovery call. Tell us what&apos;s going on and we&apos;ll recommend
              the right package — no pressure, no commitment.
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
