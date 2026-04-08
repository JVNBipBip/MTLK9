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

const faqItems = [
  {
    q: "What ages are the group classes for?",
    a: "Puppy Group Socialization is for puppies 10–20 weeks. It's focused on interactive play, confidence, and early development. Teen Puppy Group is for dogs 5–9 months — the adolescent phase where basic obedience, marker training, and focus around other dogs become critical.",
  },
  {
    q: "Can I do puppy training privately instead?",
    a: "Yes. Private sessions let us focus entirely on your puppy's specific needs — whether that's biting, fearfulness, house training, or anything else. It's one-on-one with a trainer in your environment.",
  },
  {
    q: "Is it safe to socialise my puppy before all vaccinations?",
    a: "We follow veterinary guidelines and create controlled environments where risk is minimised. The socialisation window (8–16 weeks) is critical — waiting too long can create more problems than it prevents. We'll work within your vet's recommendations.",
  },
  {
    q: "My puppy is biting constantly. Is that normal?",
    a: "Completely normal — but it needs to be addressed early. Bite inhibition training teaches your puppy to control their mouth. Most puppies improve dramatically within a couple of weeks of consistent practice.",
  },
  {
    q: "What's the difference between puppy and teen puppy classes?",
    a: "Puppy classes (10–20 weeks) are about safe exploration, play, and building confidence. Teen classes (5–9 months) shift to structured obedience — six basic commands, marker application, and focus around real-world distractions. Think of it as the foundation vs. the first floor.",
  },
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
          style={{ backgroundImage: "url('/images/stats/Community%20Walk.webp')" }}
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
                  <span className="text-sm font-medium">Video: Charlie&apos;s puppy journey</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Charlie, 5-month-old Golden Retriever</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Charlie was a land shark — biting everything and everyone, zero recall, and his owners
                  were overwhelmed. He started in puppy socialisation and graduated to teen group classes.
                  He now comes when called, greets people without jumping, and plays calmly with other dogs.
                  His owners say it&apos;s the best investment they&apos;ve made.
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
