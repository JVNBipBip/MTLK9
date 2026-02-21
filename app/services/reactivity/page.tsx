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
  "You cross the street when you see another dog.",
  "You've stopped going to the park entirely.",
  "You walk at 6 AM to avoid triggers.",
  "You've tried three harnesses and a head halter.",
  "You love your dog but secretly resent what your life has become.",
]

const trainingGoals = [
  "Trigger identification and management",
  "Counter-conditioning protocol",
  "Threshold work",
  "Relaxation protocols",
  "Owner handling skills",
  "Separation anxiety protocol",
]

const faqItems = [
  {
    q: "Is my dog aggressive or reactive?",
    a: "Reactivity is an emotional overreaction — lunging, barking, pulling — often driven by fear or frustration. Aggression involves intent to harm. Many reactive dogs never bite; they're just overwhelmed. We assess each case individually and design protocols accordingly.",
  },
  {
    q: "Will my dog ever be 'normal'?",
    a: "Many reactive dogs learn to stay calm around their triggers with consistent work. 'Normal' looks different for every dog — some will always need management, others become genuinely relaxed. We set realistic goals and celebrate progress at every step.",
  },
  {
    q: "Can I still take my dog to parks?",
    a: "It depends on your dog and the park. Some dogs progress to off-leash parks; others do best with structured, low-traffic areas. We'll help you find safe environments and build skills gradually. Rushing into high-stress situations sets progress back.",
  },
  {
    q: "What if my dog has bitten another dog?",
    a: "We take bite history seriously. We'll assess the situation, create a safety plan, and work within your dog's capacity. Many dogs with bite history can be managed safely with the right protocol — we'll be honest about what's possible.",
  },
  {
    q: "Is reactivity my fault?",
    a: "Reactivity usually comes from genetics, early experiences, or lack of exposure — not from something you did wrong. Blame doesn't help; a clear plan does. We focus on what we can change, not on guilt.",
  },
]

export default function ReactivityPage() {
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
        <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto">
            <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
              For dogs who lunge, bark, or shut down around triggers
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              Stop planning your life around your dog&apos;s triggers.
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              A clear protocol. Measurable progress. Your life back.
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
            <div className="grid md:grid-cols-2 gap-8">
              <div className="reveal opacity-0 rounded-3xl border border-border/50 bg-card p-8 shadow-lg">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Reactivity Foundation</h3>
                <p className="text-3xl font-semibold text-primary mb-4">$599</p>
                <p className="text-sm text-muted-foreground mb-6">6 private sessions</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                  <li>• Trigger identification & management</li>
                  <li>• Counter-conditioning protocol</li>
                  <li>• Threshold work</li>
                  <li>• Relaxation foundations</li>
                </ul>
                <Link href="/booking">
                  <Button className="w-full rounded-full">Get Started</Button>
                </Link>
              </div>
              <div className="reveal opacity-0 animation-delay-200 rounded-3xl border-2 border-primary/30 bg-card p-8 shadow-lg relative">
                <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most popular
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Reactivity Comprehensive</h3>
                <p className="text-3xl font-semibold text-primary mb-4">$999</p>
                <p className="text-sm text-muted-foreground mb-6">12 sessions + video check-ins + between-session support</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                  <li>• Everything in Foundation</li>
                  <li>• Separation anxiety protocol</li>
                  <li>• Video check-ins between sessions</li>
                  <li>• Between-session support</li>
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
              Most reactive dogs show measurable threshold improvement within 3–4 sessions — they can get 
              closer to triggers before reacting. Full behavior change typically takes 8–16 sessions depending 
              on severity and history. We track progress with clear milestones and adjust the plan as needed. 
              We never promise a &quot;fixed&quot; dog; we promise a clear path forward.
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
                  <span className="text-sm font-medium">Video: Bella&apos;s reactivity journey</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Bella, 2-year-old Shepherd mix</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Bella would lose it at the sight of another dog — lunging, barking, impossible to redirect. 
                  Her owner had stopped walking her in daylight. After 8 sessions of threshold work and 
                  counter-conditioning, Bella could pass dogs on the same sidewalk without reacting. 
                  By session 12, she was calmly sitting at a distance while other dogs played. Her owner 
                  finally has her life back.
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
              Ready to take back your walks?
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              Book a free 15-minute discovery call. We&apos;ll discuss your dog&apos;s triggers, your goals, 
              and whether this program is the right fit — no pressure.
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
