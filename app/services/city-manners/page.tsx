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
  "Every walk is a battle — you dread going outside.",
  "Your dog drags you down the street on every walk.",
  "Jumps on every person who passes by.",
  "Ignores you the moment you step outside.",
  "You've tried harnesses, treats, YouTube — nothing stuck.",
]

const trainingGoals = [
  "Loose leash walking",
  "Door manners",
  "Greeting strangers calmly",
  "Recall in distracting environments",
  "Impulse control",
  "Settle in public spaces",
]

const faqItems = [
  {
    q: "How long until my dog stops pulling?",
    a: "Most dogs achieve reliable loose leash walking within 4–6 sessions when we work consistently. Progress depends on your dog's history, breed, and how much practice happens between sessions. We'll give you a realistic timeline during your discovery call.",
  },
  {
    q: "Do you use special equipment?",
    a: "We start with standard equipment — flat collar or harness — and add tools only when they help. We don't rely on prong collars or e-collars for basic manners. Our focus is teaching your dog to choose calm behavior, not to avoid discomfort.",
  },
  {
    q: "Can an older dog learn new manners?",
    a: "Absolutely. Dogs of any age can learn. Older dogs sometimes take a bit longer to unlearn habits, but they're often more focused than puppies. We've worked with dogs from 1 to 12 years old — age is rarely the limiting factor.",
  },
  {
    q: "What if my dog is fine at home but terrible outside?",
    a: "That's exactly what we specialize in. Dogs who listen indoors but fall apart outside need proofing in real-world environments. We train where the problems happen — sidewalks, parks, busy streets — not in a sterile classroom.",
  },
  {
    q: "Will I need to keep training forever?",
    a: "Skills need maintenance, but it gets easier. Once your dog has solid foundations, a few minutes of practice on walks keeps everything sharp. We teach you how to maintain progress so training becomes part of your routine, not a chore.",
  },
]

export default function CityMannersPage() {
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
              For dogs of any age who need urban life skills
            </p>
            <h1 className="reveal opacity-0 animation-delay-200 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground text-balance mb-6">
              Make every walk the best part of your day.
            </h1>
            <p className="reveal opacity-0 animation-delay-400 text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              Calm, focused walks in the real world — not just in your living room.
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
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Manners Package</h3>
                <p className="text-3xl font-semibold text-primary mb-4">$449</p>
                <p className="text-sm text-muted-foreground mb-6">5 private sessions</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                  <li>• Loose leash walking focus</li>
                  <li>• Door & greeting manners</li>
                  <li>• Impulse control foundations</li>
                  <li>• Real-world environments</li>
                </ul>
                <Link href="/booking">
                  <Button className="w-full rounded-full">Get Started</Button>
                </Link>
              </div>
              <div className="reveal opacity-0 animation-delay-200 rounded-3xl border-2 border-primary/30 bg-card p-8 shadow-lg relative">
                <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most popular
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Manners Intensive</h3>
                <p className="text-3xl font-semibold text-primary mb-4">$749</p>
                <p className="text-sm text-muted-foreground mb-6">10 sessions + between-session support</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-8">
                  <li>• Everything in Manners Package</li>
                  <li>• Recall in distracting environments</li>
                  <li>• Settle in public spaces</li>
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
              Most dogs achieve reliable loose leash walking within 4–6 sessions when we work consistently. 
              Full urban manners — calm greetings, recall around distractions, settle in cafés — typically 
              take 8–10 sessions. Every dog is different; we set milestones based on your dog&apos;s 
              starting point and your goals.
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
                  <span className="text-sm font-medium">Video: Max&apos;s city manners journey</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2">Max, 3-year-old Labrador</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Max pulled so hard his owner had given up on walks. Within 5 sessions, he was walking on a loose 
                  leash through Plateau Mont-Royal. By session 10, he was settling calmly at outdoor cafés and 
                  coming when called even with other dogs nearby. His owner now looks forward to every walk.
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
              Ready for calmer walks?
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground mb-8">
              Book a free 15-minute discovery call. We&apos;ll discuss your dog, your walks, and whether 
              this program is the right fit — no pressure.
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
