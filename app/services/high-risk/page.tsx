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
  "Your dog has bitten or attempted to bite.",
  "They guard food, toys, or spaces aggressively.",
  "Other trainers have refused the case.",
  "You're afraid of what might happen next.",
  "You've been told to surrender your dog.",
]

const trainingGoals = [
  "Safety assessment",
  "Management protocol",
  "Bite prevention",
  "Resource guarding modification",
  "Controlled socialization",
  "Risk reduction plan",
]

const faqItems = [
  {
    q: "Will you take my dog's case?",
    a: "We evaluate each case individually. We don't turn away dogs because they've bitten — we assess severity, context, and whether we can create a safe, effective plan. If we're not the right fit, we'll refer you to someone who might be. We're honest about what we can and can't help with.",
  },
  {
    q: "Is my dog dangerous?",
    a: "Dangerous is a loaded word. What matters is risk level and manageability. We conduct a thorough safety assessment to understand triggers, history, and context. From there, we create a realistic plan. Some dogs need lifelong management; others make significant progress. We'll be direct with you.",
  },
  {
    q: "Has a dog ever been too far gone?",
    a: "Yes. In rare cases, the risk is too high or the dog's welfare can't be improved. When that happens, we're honest. We've also worked with many dogs others gave up on — and helped them live safely and happily. Every case is different.",
  },
  {
    q: "What if my landlord is threatening eviction?",
    a: "We understand the urgency. We can often fast-track a safety evaluation and create an immediate management plan to reduce risk. Documenting a professional assessment and active training can sometimes help with landlord discussions. We'll work with you on timeline.",
  },
  {
    q: "Do I need a muzzle?",
    a: "It depends. For some dogs, a muzzle is a temporary safety tool while we work on underlying issues. For others, it may be part of long-term management. We'll assess your situation and teach proper muzzle conditioning — a muzzle should never be punishment. We use them when they keep everyone safe.",
  },
]

export default function HighRiskPage() {
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
              For dogs with aggression, resource guarding, bite history
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              When safety is on the line, you need more than YouTube advice.
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              Specialized support for the cases other trainers turn away.
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
                    i === 1 ? "animation-delay-200" : i === 2 ? "animation-delay-400" : i === 3 ? "animation-delay-200" : i === 4 ? "animation-delay-600" : ""
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
            <div className="grid md:grid-cols-3 gap-8">
              <div className="reveal opacity-0 rounded-3xl border border-border/50 bg-card p-8 shadow-lg">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Safety Evaluation</h3>
                <p className="text-3xl font-semibold text-primary mb-4">$150</p>
                <p className="text-sm text-muted-foreground mb-6">90 minutes</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                  <li>• Risk assessment</li>
                  <li>• Management recommendations</li>
                  <li>• Program fit discussion</li>
                </ul>
                <Link href="/booking">
                  <Button className="w-full rounded-full" variant="outline">Book Evaluation</Button>
                </Link>
              </div>
              <div className="reveal opacity-0 animation-delay-200 rounded-3xl border border-border/50 bg-card p-8 shadow-lg">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">High-Risk Intensive</h3>
                <p className="text-3xl font-semibold text-primary mb-4">$699</p>
                <p className="text-sm text-muted-foreground mb-6">6 private sessions</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                  <li>• Safety & management protocol</li>
                  <li>• Bite prevention</li>
                  <li>• Resource guarding modification</li>
                </ul>
                <Link href="/booking">
                  <Button className="w-full rounded-full">Get Started</Button>
                </Link>
              </div>
              <div className="reveal opacity-0 animation-delay-400 rounded-3xl border-2 border-primary/30 bg-card p-8 shadow-lg relative">
                <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most comprehensive
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">High-Risk Extended</h3>
                <p className="text-3xl font-semibold text-primary mb-4">$1,199</p>
                <p className="text-sm text-muted-foreground mb-6">12 sessions + emergency support line</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                  <li>• Everything in Intensive</li>
                  <li>• Controlled socialization</li>
                  <li>• Risk reduction plan</li>
                  <li>• Emergency support line</li>
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
              Every case is unique. We set realistic, individualized milestones based on your dog&apos;s 
              history and your situation. Many dogs with bite histories can be managed safely with the 
              right protocol — reduced triggers, clear management, and a plan you can follow. We will 
              always be honest about prognosis. We never promise outcomes we can&apos;t deliver.
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
                  <span className="text-sm font-medium">Video: Cooper&apos;s high-risk journey</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Cooper, 4-year-old mixed breed</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cooper had bitten twice and was guarding food and his bed. Two trainers had declined the case. 
                  We started with a safety evaluation and management protocol. Over 12 sessions, we addressed 
                  resource guarding, built a predictable routine, and created a risk reduction plan. Cooper 
                  now lives safely with his family — no more bites, clear boundaries, and a household that 
                  knows how to manage his triggers. His owner says it saved their dog&apos;s life.
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
              Ready to get a clear safety plan?
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              Start with a safety evaluation. We&apos;ll assess your dog, discuss your situation, and 
              determine the right path forward — no judgment, no pressure.
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
