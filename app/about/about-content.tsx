"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { TrustStrip } from "@/components/trust-strip"
import { Button } from "@/components/ui/button"
import { ArrowRight, Heart } from "lucide-react"
import { FreeCallLink } from "@/components/booking-form-provider"

const trainers = [
  {
    name: "Nick Azzuolo",
    title: "Owner, Founder & Head Trainer",
    years: "15+ years",
    specialty: "Pet obedience, canine sports, behavioral rehab",
    origin:
      "Nick has been handling dogs since a young age and always had a natural skill working with them. With an engineering degree and mentorship from professional trainers in canine sports and rehabilitation, he built Montreal Canine Training to combine pet obedience with sport-level techniques.",
    superpower: "Prioritizes engagement, motivation, communication, confidence, and relationship-building above all.",
    personal:
      "At home, he shares his life with two Australian Shepherds, cats, a wife, and a baby.",
    photoDesc: "Nick working with a dog on a calm loose-leash walk in a Montreal park",
    photo: "/images/team/nick.png",
    photoPosition: "object-[50%_18%]",
  },
  {
    name: "Tyson Jerome White",
    title: "Trainer",
    years: "10+ years",
    specialty: "Obedience, behavior modification, relationship building",
    origin:
      "Tyson's journey began with his first dog, Winston, an Australian Shepherd. He believes structure and consistency are essential for coexistence. He specializes in obedience training, behavior modification, and relationship building through private sessions and group classes.",
    superpower: "Makes high-distraction urban walks feel manageable — and even enjoyable.",
    personal:
      "He has two dogs of his own and lives by the philosophy that structure creates freedom.",
    photoDesc: "Tyson coaching an owner through a reactive moment on a busy Montreal street",
    photo: "/images/team/tyson.jpg",
  },
  {
    name: "Jessica Banks",
    title: "Trainer",
    years: "8+ years",
    specialty: "Confidence-building, reactivity, obedience",
    origin:
      "Animals have always been central to Jessica's life. She owns two dogs — Bones the husky and Fish the chihuahua — both raised from puppyhood. After eight years in dog grooming, she pursued training full-time, completing the MTL Canine Training Program with over 80 hours of hands-on experience.",
    superpower: "Helps fearful dogs find their confidence without force or flooding.",
    personal:
      "She specializes in confidence-building, reactivity, and obedience training.",
    photoDesc: "Jessica sitting calmly with a nervous dog in a quiet, low-stimulus environment",
    photo: "/images/team/jessica.jpg",
  },
]

export function AboutContent() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const teamScrollerRef = useRef<HTMLDivElement>(null)
  const [activeTeamIndex, setActiveTeamIndex] = useState(0)

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

  useEffect(() => {
    const scroller = teamScrollerRef.current
    if (!scroller) return

    const updateActiveIndex = () => {
      const cards = Array.from(scroller.querySelectorAll("[data-team-card]"))
      if (!cards.length) return
      const scrollLeft = scroller.scrollLeft

      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      cards.forEach((card, index) => {
        const distance = Math.abs(card.getBoundingClientRect().left - scroller.getBoundingClientRect().left)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      setActiveTeamIndex(closestIndex)
    }

    updateActiveIndex()
    scroller.addEventListener("scroll", updateActiveIndex, { passive: true })
    return () => scroller.removeEventListener("scroll", updateActiveIndex)
  }, [])

  const goToTeamSlide = (index: number) => {
    const scroller = teamScrollerRef.current
    if (!scroller) return
    const cards = Array.from(scroller.querySelectorAll("[data-team-card]"))
    const target = cards[index] as HTMLElement | undefined
    if (!target) return
    scroller.scrollTo({ left: target.offsetLeft, behavior: "smooth" })
  }

  return (
    <div ref={wrapperRef}>
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
            Training That Protects the Bond
          </h1>
          <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Who we are, what we believe, and why we train the way we do.
          </p>
        </div>
      </section>

      {/* Section 1: Team Bios */}
      <section className="reveal opacity-0 animation-delay-200 py-16 lg:py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="font-display text-2xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              Meet the Team
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three specialists. One mission: help you and your dog thrive together.
            </p>
          </div>

          <div className="mb-4 md:hidden">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground/80">
              Swipe to meet each trainer
            </p>
          </div>

          <div
            ref={teamScrollerRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 lg:gap-10 md:overflow-visible"
          >
            {trainers.map((trainer) => (
              <div
                key={trainer.name}
                data-team-card
                className="snap-center shrink-0 w-[92%] sm:w-[88%] md:w-auto md:shrink"
              >
                <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full flex flex-col">
                  {/* Photo placeholder */}
                  <div className="relative aspect-[4/3] bg-muted" aria-label={trainer.photoDesc}>
                    <Image
                      src={trainer.photo}
                      alt={trainer.photoDesc}
                      fill
                      className={`object-cover ${trainer.photoPosition ?? ""}`}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
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

          <div className="mt-6 flex items-center justify-center gap-2.5 md:hidden">
            {trainers.map((trainer, index) => (
              <button
                key={trainer.name}
                type="button"
                onClick={() => goToTeamSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeTeamIndex
                    ? "w-7 bg-primary"
                    : "w-2.5 bg-border hover:bg-muted-foreground/40"
                }`}
                aria-label={`Go to trainer ${index + 1}`}
              />
            ))}
            <span className="ml-2 text-xs font-medium tracking-wide text-muted-foreground">
              {activeTeamIndex + 1} / {trainers.length}
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: Our Philosophy */}
      <section className="py-16 lg:py-24 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-10">
            Our Philosophy
          </h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="reveal opacity-0 animation-delay-200">
              At Montreal Canine Training, we help build strong, healthy relationships between dogs
              and their owners. With a proven track record, we consistently deliver real,
              professional, and effective training solutions.
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              Every dog is assessed individually to create a personalized training plan. From
              basic/advanced obedience to severe behavioral issues, our experienced team delivers
              real results. We believe training is about the human, not the dog. Your dog is already
              doing what makes sense to them. We help you understand why and give you the tools to
              guide them without breaking trust. We train in the real world, not just at our
              facility — progressing into everyday environments like parks, cafés, hardware stores
              and markets.
            </p>
            <p className="reveal opacity-0 animation-delay-200">
              We don&apos;t just hand you techniques. We give you a plan, ongoing support between
              sessions, and stay in your corner until you see results — because training isn&apos;t
              a one-off, it&apos;s a partnership.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Methods Statement */}
      <section className="py-16 lg:py-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal opacity-0 font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-6">
            Our Methods
          </h2>
          <p className="reveal opacity-0 animation-delay-200 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-8">
            Positive reinforcement training, motivation and reward based training
          </p>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="reveal opacity-0 animation-delay-200">
              <strong className="text-foreground">Our approach:</strong> We build and shape
              behaviours using positive reinforcement, clear communication, and motivation, creating
              confident, engaged dogs. We don&apos;t use fear or pain. We adapt our approach to their
              needs, perception and understanding. Our expertise in a variety of proven training
              methods allows us to support a wider range of dogs, resulting in high success rates,
              from early puppy development to severe behavioral problems.
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
                <FreeCallLink>
                  <Button
                    size="lg"
                    className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 py-6 text-base group"
                  >
                    Book Your Free Call
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </FreeCallLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
