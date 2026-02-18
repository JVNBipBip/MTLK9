"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { TrustStrip } from "@/components/trust-strip"
import { Button } from "@/components/ui/button"
import { ArrowRight, Heart, Sparkles } from "lucide-react"

const trainers = [
  {
    name: "Nick Azzuolo",
    title: "Founder & Behavioral Rehabilitation Specialist",
    years: "15+ years",
    specialty: "Complex cases, aggression, behavioral rehab",
    origin:
      "Nick started in rescue and shelter work, where he saw too many dogs given up because their people didn't have the right support. He built Montreal Canine Training to be the kind of team he wished existed back then.",
    superpower: "Takes on cases other trainers have turned away — and gets results.",
    personal: "When he's not training, he's hiking with his own pack or reading the latest behavior research.",
    photoDesc: "Nick working with a dog on a calm loose-leash walk in a Montreal park",
  },
  {
    name: "Shanya Ingwersen",
    title: "Puppy Development Specialist",
    years: "8+ years",
    specialty: "Puppy socialization, foundation work",
    origin:
      "Shanya fell in love with puppy development after fostering litters and seeing how much early experiences shape a dog's future. She's obsessed with getting the first months right.",
    superpower: "Turns chaotic puppies into calm, confident dogs before bad habits take root.",
    personal: "She has a soft spot for senior dogs and volunteers at a local rescue on weekends.",
    photoDesc: "Shanya guiding a puppy through a socialization exercise in a controlled outdoor setting",
  },
  {
    name: "Tyson Jerome White",
    title: "Reactivity & Leash Work Specialist",
    years: "10+ years",
    specialty: "High-distraction environments, leash reactivity",
    origin:
      "Tyson came from a background in competitive dog sports before pivoting to behavior work. He knows what it takes to build focus and impulse control when the world is full of triggers.",
    superpower: "Makes high-distraction urban walks feel manageable — and even enjoyable.",
    personal: "He runs with his own dog every morning and believes movement is medicine for both species.",
    photoDesc: "Tyson coaching an owner through a reactive moment on a busy Montreal street",
  },
  {
    name: "Jessica Banks",
    title: "Anxiety & Confidence Building Specialist",
    years: "7+ years",
    specialty: "Separation anxiety, fearful dogs",
    origin:
      "Jessica's own dog struggled with severe anxiety. When she couldn't find the right help, she became the help — and now specializes in the cases that require patience, empathy, and science.",
    superpower: "Helps fearful dogs find their confidence without force or flooding.",
    personal: "She's a certified fear-free professional and advocates for mental health — for dogs and their people.",
    photoDesc: "Jessica sitting calmly with a nervous dog in a quiet, low-stimulus environment",
  },
]

export function AboutContent() {
  const wrapperRef = useRef<HTMLDivElement>(null)

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

    const elements = wrapperRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapperRef}>
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
            Training That Protects the Bond
          </h1>
          <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Who we are, what we believe, and why we train the way we do.
          </p>
        </div>
      </section>

      {/* Section 1: Our Philosophy */}
      <section className="py-16 lg:py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-10">
            Our Philosophy
          </h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="reveal opacity-0 animation-delay-200">
              We believe training is really about the human, not the dog. Your dog is already doing
              what makes sense to them. Our job is to help you understand why — and give you the
              tools to guide them without breaking the trust between you.
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              We train in the real world because that&apos;s where your dog lives — not in a training
              room. Parks, sidewalks, cafés, your own home. That&apos;s where behavior happens, and
              that&apos;s where we work.
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              Every dog deserves to be understood, not just corrected. We don&apos;t mask symptoms with
              quick fixes. We get to the root of what&apos;s driving the behavior, and we build from
              there.
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              We don&apos;t just hand you techniques. We give you a plan, support between sessions,
              and someone in your corner until it clicks. Because training isn&apos;t a one-off — it&apos;s
              a partnership.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Methods Statement */}
      <section className="py-16 lg:py-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
            Our Methods
          </h2>
          <p className="reveal opacity-0 animation-delay-200 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-8">
            Force-free, science-based, transparent
          </p>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="reveal opacity-0 animation-delay-200">
              <strong className="text-foreground">Our approach:</strong> We use force-free,
              science-based methods rooted in modern learning theory. We do not use fear, pain, or
              intimidation. We do not use prong collars, choke chains, or e-collars. We build
              behavior through positive reinforcement, clear communication, and management that keeps
              everyone safe while we work.
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              <strong className="text-foreground">What to expect in a session:</strong> We meet you
              and your dog where you are — literally and figuratively. Sessions happen in real
              environments: your neighborhood, a park, your home. We observe, we teach, we practice.
              You leave with homework, and we support you between sessions with check-ins and
              guidance.
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              <strong className="text-foreground">Your dog&apos;s emotional wellbeing:</strong> We
              believe a dog who feels safe learns faster and bonds deeper. We never push a dog past
              their threshold. We work at their pace, and we prioritize their emotional state in
              every decision we make.
            </p>
            <p className="reveal opacity-0 animation-delay-200 text-sm text-muted-foreground/90">
              Dog training is unregulated in Canada. Anyone can call themselves a trainer. We hold
              ourselves to a higher standard: our methods are transparent, our credentials are
              verifiable, and we&apos;re committed to continuing education in animal behavior science.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Team Bios */}
      <section className="py-16 lg:py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
<h2 className="reveal opacity-0 font-display text-2xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Meet the Team
            </h2>
            <p className="reveal opacity-0 animation-delay-200 text-muted-foreground max-w-xl mx-auto">
              Four specialists. One mission: help you and your dog thrive together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-12">
            {trainers.map((trainer, index) => (
              <div
                key={trainer.name}
                className={`reveal opacity-0 ${
                  index === 1 ? "animation-delay-200" : index === 2 ? "animation-delay-400" : index === 3 ? "animation-delay-600" : ""
                }`}
              >
                <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col">
                  {/* Photo placeholder */}
                  <div
                    className="aspect-[4/3] bg-gradient-to-br from-primary/20 via-secondary/10 to-muted flex items-center justify-center"
                    aria-label={trainer.photoDesc}
                  >
                    <div className="text-center px-6">
                      <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-2" />
                      <span className="text-xs text-muted-foreground italic">
                        {trainer.photoDesc}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 lg:p-8 flex flex-col flex-grow">
                    <div className="flex items-baseline gap-2 mb-2">
                      <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                        {trainer.name}
                      </h3>
                      <span className="text-sm text-primary font-medium">{trainer.years}</span>
                    </div>
                    <p className="text-sm font-medium text-secondary mb-4">{trainer.title}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {trainer.origin}
                    </p>
                    <p className="text-foreground text-sm font-medium mb-2 flex items-start gap-2">
                      <Heart className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {trainer.superpower}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed mt-auto">
                      {trainer.personal}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* CTA Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-lg bg-gradient-to-br from-primary via-primary/90 to-secondary">
            <div className="relative px-8 lg:px-16 py-16 lg:py-24 text-center">
              <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
                Ready to Meet Us?
              </p>
              <h2 className="reveal opacity-0 animation-delay-200 font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-primary-foreground text-balance mb-6 max-w-3xl mx-auto">
                Book a free discovery call and start your dog&apos;s plan
              </h2>
              <p className="reveal opacity-0 animation-delay-400 text-lg text-primary-foreground/80 max-w-xl mx-auto leading-relaxed mb-10">
                Tell us about your dog. We&apos;ll listen, answer your questions, and figure out the
                right path together.
              </p>
              <div className="reveal opacity-0 animation-delay-600">
                <Link href="/booking">
                  <Button
                    size="lg"
                    className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 py-6 text-base group"
                  >
                    Book Your Free Call
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
