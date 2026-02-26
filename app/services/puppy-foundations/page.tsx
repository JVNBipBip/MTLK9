"use client"

import { useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { ServiceForYouSection } from "@/components/service-for-you-section"
import Link from "next/link"
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
  "You just brought a puppy home and want to do it right.",
  "Your puppy is biting your hands and won't stop.",
  "Jumping on everyone who walks through the door.",
  "Accidents in the house — you're not sure if it's normal.",
  "Won't listen outside — treats work at home but not on walks.",
]

const trainingGoals = [
  "Bite inhibition",
  "House training",
  "Socialization protocol",
  "Leash introduction",
  "Settle and calm",
  "Recall foundations",
]

const faqItems = [
  {
    q: "When should I start training my puppy?",
    a: "The sooner, the better. Puppies are most receptive to learning between 8 and 16 weeks — that's when their socialization window is wide open. Starting at 8 weeks gives you the best chance to shape calm, confident behaviors before habits solidify.",
  },
  {
    q: "Is group class or private better?",
    a: "Both have value. Private sessions let us address your specific challenges (biting, house training) in your home. Group classes build socialization and focus around distractions. Our Puppy Complete package includes both for the best of both worlds.",
  },
  {
    q: "My puppy bites everything — is this normal?",
    a: "Yes. Puppies explore with their mouths and teethe until around 6 months. Bite inhibition training teaches them to use a soft mouth — it doesn't stop play, it makes it safe. Most puppies show dramatic improvement within 2 weeks of consistent work.",
  },
  {
    q: "How do I socialize safely before all vaccines?",
    a: "We use a structured socialization protocol that prioritizes safety: controlled exposures, puppy-safe environments, and gradual introductions. Your vet can advise on risk in your area — we work within your comfort level while maximizing the critical window.",
  },
  {
    q: "Will my puppy grow out of bad behaviors?",
    a: "Some behaviors lessen with age, but many get worse without guidance. Jumping, pulling, and poor impulse control typically escalate if ignored. Early training builds habits that last — and prevents problems from becoming entrenched.",
  },
]

export default function PuppyFoundationsPage() {
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
              For puppies 8–20 weeks
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              Raise the dog you&apos;ll be proud to live with.
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              The first few months set the tone for years. Get it right from the start.
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
                  <span className="text-sm font-medium">Video: Luna&apos;s puppy journey</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Luna, 12-week-old Golden Retriever</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Luna came to us at 10 weeks with intense biting and zero focus outside. Her owners were exhausted. 
                  Within 4 sessions, bite inhibition improved dramatically. By session 8, she was walking on a loose 
                  leash in the neighborhood and settling calmly when asked. Her family now enjoys stress-free walks 
                  and a puppy they&apos;re proud to have over.
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
              Ready to start your puppy&apos;s foundation?
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              Book a free 15-minute discovery call. We&apos;ll discuss your puppy, your goals, and whether 
              this program is the right fit — no pressure.
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
