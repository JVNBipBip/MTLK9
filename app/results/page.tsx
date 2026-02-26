"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import { BookingLink } from "@/components/booking-form-provider"

const caseStudies = [
  {
    name: "Luna",
    breed: "German Shepherd Mix",
    age: "3 years",
    photoDesc: "Luna walking calmly on leash in a Montreal park",
    problem:
      "Every walk was a nightmare. Luna would lunge at every dog we passed — barking, pulling, completely over threshold. I was embarrassed and exhausted. I thought we'd never be able to enjoy a walk again.",
    plan: "Reactivity program with structured desensitization, threshold management, and counter-conditioning in real-world environments.",
    result: "Luna now walks calmly through parks. We can pass other dogs at a distance without her losing it. Walks are finally enjoyable.",
    quote: "I never thought we'd get here. The team gave us a clear plan and stuck with us until it clicked.",
    servicePath: "Reactivity & Anxiety",
    serviceHref: "/services/reactivity",
  },
  {
    name: "Milo",
    breed: "French Bulldog",
    age: "2 years",
    photoDesc: "Milo heeling on loose leash in the city",
    problem:
      "Milo pulled so hard on every walk I thought my arm would fall off. At home, he destroyed furniture when left alone. City life felt impossible with him.",
    plan: "City Manners program focusing on loose-leash walking, impulse control, and structured management for home alone time.",
    result: "Milo now heels on a loose leash. He's calmer at home and we can actually enjoy Montreal together.",
    quote: "From chaos to calm. The difference is night and day.",
    servicePath: "City Manners",
    serviceHref: "/services/city-manners",
  },
  {
    name: "Charlie",
    breed: "Golden Retriever",
    age: "5 months",
    photoDesc: "Charlie playing calmly with other puppies",
    problem:
      "Charlie was a land shark — biting everything, jumping on everyone, zero recall. I was overwhelmed and worried we were creating bad habits.",
    plan: "Puppy Foundations program: bite inhibition, socialization, recall foundations, and building calm routines.",
    result: "Charlie is now a calm, socialized puppy. He comes when called, greets people politely, and the biting is under control.",
    quote: "They gave us a roadmap when we had no idea where to start. Best investment we made.",
    servicePath: "Puppy Foundations",
    serviceHref: "/services/puppy-foundations",
  },
  {
    name: "Bella",
    breed: "Rescue Pit Bull",
    age: "4 years",
    photoDesc: "Bella resting gently near a baby",
    problem:
      "Bella had resource guarding and a bite history. We were terrified — we had a baby on the way and didn't know if we could keep her. Other trainers turned us away.",
    plan: "High-Risk Behaviors program: safety evaluation, resource-guarding protocol, and gradual exposure with our newborn.",
    result: "Bella is now gentle around our baby. We have clear management in place and she's part of the family again.",
    quote: "They didn't give up on us when everyone else did. We're forever grateful.",
    servicePath: "High-Risk Behaviors",
    serviceHref: "/services/high-risk",
  },
  {
    name: "Oscar",
    breed: "Labrador",
    age: "3 years",
    photoDesc: "Oscar resting calmly in his crate",
    problem:
      "Oscar couldn't be left alone. He destroyed our apartment, barked for hours, and we couldn't leave the house without him. Our lives revolved around his anxiety.",
    plan: "Separation anxiety protocol with gradual desensitization, settle training, and structured alone-time building.",
    result: "Oscar now settles calmly when we leave. We can go to work, run errands, and have a life again.",
    quote: "I cried when we left him alone for the first time without destruction. It felt like a miracle.",
    servicePath: "Reactivity & Anxiety",
    serviceHref: "/services/reactivity",
  },
  {
    name: "Rosie",
    breed: "Border Collie Mix",
    age: "2 years",
    photoDesc: "Rosie exploring confidently on a trail",
    problem:
      "Rosie was shut down and fearful. She wouldn't walk, hid from everything, and we didn't know how to help her. She'd been through so much in rescue.",
    plan: "Rescue rehabilitation with confidence-building, fear-free exposure, and patience-first approach.",
    result: "Rosie is now confident and explores. She walks willingly, engages with the world, and finally acts like the dog we knew she could be.",
    quote: "They met her where she was. No pressure, just patience. She blossomed.",
    servicePath: "Reactivity & Anxiety",
    serviceHref: "/services/reactivity",
  },
]

export default function ResultsPage() {
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
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 lg:mb-20">
              <h1 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
                Real Dogs. Real Montreal. Real Results.
              </h1>
              <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Every dog on this page started exactly where yours is now.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <article
                  key={study.name}
                  className={`reveal opacity-0 ${
                    index === 1
                      ? "animation-delay-200"
                      : index === 2
                        ? "animation-delay-400"
                        : index === 3
                          ? "animation-delay-200"
                          : index === 4
                            ? "animation-delay-400"
                            : index === 5
                              ? "animation-delay-600"
                              : ""
                  }`}
                >
                  <div className="h-full bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 flex flex-col overflow-hidden">
                    {/* Photo/Video placeholder */}
                    <div
                      className="aspect-[16/10] bg-gradient-to-br from-primary/20 via-secondary/10 to-muted flex items-center justify-center relative group cursor-pointer"
                      aria-label={study.photoDesc}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 ml-1" fill="currentColor" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 left-2 right-2 text-xs text-muted-foreground italic text-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 py-1 px-2 rounded">
                        {study.photoDesc}
                      </span>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-baseline gap-2 mb-4">
                        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
                          {study.name}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {study.breed}, {study.age}
                        </span>
                      </div>

                      <div className="space-y-4 text-sm leading-relaxed flex-grow">
                        <div>
                          <p className="font-medium text-foreground mb-1">
                            The Problem
                          </p>
                          <p className="text-muted-foreground">{study.problem}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">
                            The Plan
                          </p>
                          <p className="text-muted-foreground">{study.plan}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">
                            The Result
                          </p>
                          <p className="text-muted-foreground">{study.result}</p>
                        </div>
                      </div>

                      <blockquote className="mt-4 pt-4 border-t border-border/50 text-sm italic text-muted-foreground">
                        &ldquo;{study.quote}&rdquo;
                      </blockquote>

                      <Link href={study.serviceHref} className="mt-4 inline-flex">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/30 transition-colors">
                          {study.servicePath}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-lg bg-gradient-to-br from-primary/10 via-muted/30 to-secondary/10">
              <div className="relative px-8 lg:px-16 py-16 lg:py-24 text-center">
                <h2 className="reveal opacity-0 font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground text-balance mb-6 max-w-3xl mx-auto">
                  Your dog&apos;s story could be next.
                </h2>
                <p className="reveal opacity-0 animation-delay-200 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
                  Book a free discovery call and start your dog&apos;s transformation.
                </p>
                <div className="reveal opacity-0 animation-delay-400">
                  <BookingLink>
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
                    >
                      Book a Free Discovery Call
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </BookingLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TrustStrip />
      </div>

      <Footer />
    </main>
  )
}
