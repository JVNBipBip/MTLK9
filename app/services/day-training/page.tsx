"use client"

import { useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Check } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const forYouIf = [
  "You work full time and can't commit to weekday sessions.",
  "Your dog needs more practice reps than you can give.",
  "You want professional-level training but need flexibility.",
  "You're willing to invest for faster results.",
]

const trainingGoals = [
  "Leash manners",
  "Impulse control",
  "Socialization",
  "Obedience foundations",
  "Real-world proofing",
  "Owner skill transfer",
]

const faqItems = [
  {
    q: "What does a typical day training day look like?",
    a: "We pick up your dog (or you drop off) in the morning. They spend the day with us — training sessions broken into short bursts, real-world practice in parks and streets, rest periods, and socialization when appropriate. We bring them back in the afternoon. You get a brief update and homework for the evening.",
  },
  {
    q: "Where does training happen?",
    a: "In the real world — sidewalks, parks, quiet streets, sometimes our facility. We don't train in a sterile room. Your dog learns where life happens, so skills transfer to your daily routine. Locations vary based on your dog's needs and our schedule.",
  },
  {
    q: "Will my dog bond more with the trainer than me?",
    a: "No. Dogs form different relationships with different people. Your bond with your dog is built on living together, not just training. We're the practice coach; you're the one they go home to. Owner handoff sessions ensure you learn the skills and maintain the connection.",
  },
  {
    q: "How do skills transfer to me?",
    a: "We include dedicated owner handoff sessions where we teach you exactly what we've been working on. You practice with us, get feedback, and leave with clear homework. Day training accelerates your dog's learning; handoff sessions ensure you can maintain and build on it.",
  },
  {
    q: "Is day training right for puppies?",
    a: "Yes, with some considerations. Puppies have shorter attention spans and need more rest. We adapt the schedule — shorter sessions, more naps, age-appropriate socialization. The Puppy Complete package is often a better fit for very young puppies; day training works well from 4–5 months up.",
  },
]

export default function DayTrainingPage() {
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
        <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto">
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
              For busy owners who need professional training during working hours
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              Your dog trains while you work. We handle the hard part.
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              Professional training during the day. Owner handoff when you're home.
            </p>
          </div>
        </section>

        {/* This is for you if */}
        <section className="py-20 lg:py-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-8">
              This is for you if…
            </h2>
            <ul className="space-y-4">
              {forYouIf.map((item, i) => (
                <li
                  key={i}
                  className={`reveal opacity-0 flex items-start gap-3 ${
                    i === 1 ? "animation-delay-200" : i === 2 ? "animation-delay-400" : i === 3 ? "animation-delay-600" : ""
                  }`}
                >
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* What we'll work on */}
        <section className="py-20 lg:py-28 px-6 lg:px-8 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-8">
              What we&apos;ll work on
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {trainingGoals.map((goal, i) => (
                <li
                  key={goal}
                  className={`reveal opacity-0 flex items-center gap-2 rounded-2xl bg-background border border-border/50 px-4 py-3 ${
                    i === 1 ? "animation-delay-200" : i === 2 ? "animation-delay-400" : i === 3 ? "animation-delay-200" : i >= 4 ? "animation-delay-600" : ""
                  }`}
                >
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 lg:py-28 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-12 text-center">
              Transparent pricing
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="reveal opacity-0 rounded-3xl border border-border/50 bg-card p-8 shadow-lg">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Day Training Starter</h3>
                <p className="text-3xl font-semibold text-primary mb-4">$799</p>
                <p className="text-sm text-muted-foreground mb-6">2 weeks / 8 sessions</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                  <li>• Daily professional training</li>
                  <li>• Leash manners & impulse control</li>
                  <li>• Real-world proofing</li>
                  <li>• 2 owner handoff sessions</li>
                </ul>
                <Link href="/booking">
                  <Button className="w-full rounded-full">Get Started</Button>
                </Link>
              </div>
              <div className="reveal opacity-0 animation-delay-200 rounded-3xl border-2 border-primary/30 bg-card p-8 shadow-lg relative">
                <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most popular
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Day Training Complete</h3>
                <p className="text-3xl font-semibold text-primary mb-4">$1,499</p>
                <p className="text-sm text-muted-foreground mb-6">4 weeks / 16 sessions + owner handoff sessions</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                  <li>• Everything in Starter</li>
                  <li>• Socialization & obedience foundations</li>
                  <li>• Extended proofing</li>
                  <li>• 4 owner handoff sessions</li>
                </ul>
                <Link href="/booking">
                  <Button className="w-full rounded-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What success looks like */}
        <section className="py-20 lg:py-28 px-6 lg:px-8 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-8">
              What success looks like
            </h2>
            <p className="reveal opacity-0 text-muted-foreground leading-relaxed mb-6">
              Day training accelerates progress because your dog gets daily professional practice. 
              Most dogs complete their core training goals within 2–4 weeks. Owner handoff sessions 
              ensure skills transfer to you — we teach you what we&apos;ve been working on so you can 
              maintain and build on the progress. You get results faster; your dog gets a head start.
            </p>
          </div>
        </section>

        {/* Case study */}
        <section className="py-20 lg:py-28 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-8">
              A transformation story
            </h2>
            <div className="reveal opacity-0 rounded-3xl overflow-hidden border border-border/50 bg-card">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Video: Charlie&apos;s day training journey</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Charlie, 1-year-old Border Collie</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Charlie&apos;s owner worked 9–5 and couldn&apos;t do weekday sessions. Charlie had endless 
                  energy and zero impulse control. After 4 weeks of day training, he was walking calmly on 
                  leash, settling on cue, and responding reliably to recall. The owner handoff sessions 
                  taught his owner how to maintain everything — and Charlie&apos;s bond with his owner only 
                  got stronger. His owner says it was the best investment they could have made.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 lg:py-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-12">
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
        <section className="py-20 lg:py-28 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
              Ready to accelerate your dog&apos;s training?
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              Book a free 15-minute discovery call. We&apos;ll discuss your schedule, your dog&apos;s needs, 
              and whether day training is the right fit — no pressure.
            </p>
            <div className="reveal opacity-0 animation-delay-400">
              <Link href="/booking">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
                >
                  Book a Free Discovery Call
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <TrustStrip />
      </div>

      <Footer />
    </main>
  )
}
