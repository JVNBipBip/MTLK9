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
  "Your dog knows 'sit' at home but ignores you everywhere else.",
  "You want a well-mannered dog you can take anywhere in Montreal.",
  "You're ready to move beyond basics and build real-world reliability.",
  "Your dog pulls on leash, ignores recall, or has zero impulse control outside.",
  "You want your dog to walk calmly past distractions, dogs, and people.",
]

const trainingGoals = [
  "The Three D's — Duration, Distance, Distraction",
  "Engagement and relationship building",
  "Reliable recall in real environments",
  "Impulse control and focus under pressure",
  "Pack walks and new environments",
  "Advanced commands in high-distraction settings",
]

const faqItems = [
  {
    q: "What's the difference between Level 1 and Level 2?",
    a: "Level 1 is for dogs 9 months and older who need to apply basic obedience in real-world settings. We focus on the Three D's, building engagement, and preparing your dog for more advanced work. Level 2 picks up where Level 1 ends — pack walks, high distractions, new environments, and advanced reliability.",
  },
  {
    q: "Can I do obedience training privately instead of in a group?",
    a: "Absolutely. Private sessions let us tailor everything to your dog — pace, environment, and focus areas. It's ideal if your dog struggles with other dogs nearby, or if you have specific goals that don't fit a group format.",
  },
  {
    q: "My dog already knows basic commands. Should I skip Level 1?",
    a: "Knowing commands at home and executing them reliably in the real world are two different things. Most dogs benefit from Level 1 even if they know the basics — it's about proofing those skills under distraction, not just repeating them in your living room.",
  },
  {
    q: "How old does my dog need to be?",
    a: "Level 1 group classes are for dogs 9 months and older. Level 2 requires dogs to be at least 12 months. For younger dogs, check out our Puppy Training program. Private obedience sessions have no age minimum.",
  },
  {
    q: "Will my dog be off-leash during group classes?",
    a: "Not in Level 1. We build reliable leash skills first. Level 2 introduces more freedom as your dog demonstrates consistent focus and recall. Safety always comes first.",
  },
]

export default function ObediencePage() {
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
              Private &amp; Group Classes — Level 1 &amp; Level 2
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              Obedience Training in Montreal
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              Commands that actually work where they matter — on Montreal sidewalks,
              in busy parks, and around real-world distractions.
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
                  <span className="text-sm font-medium">Video: Milo&apos;s obedience transformation</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Milo, 2-year-old French Bulldog</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Milo knew every command in the kitchen — and ignored all of them outside.
                  Through Level 1 group classes, he learned to hold focus around other dogs and
                  distractions. By Level 2, he was walking off-leash on pack walks and responding
                  to recall in new environments. His owner finally has a dog she can take anywhere.
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
              Ready for a dog that actually listens?
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              Book a free 15-minute discovery call. We&apos;ll help you pick the right level
              and format — group or private — for where your dog is right now.
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
