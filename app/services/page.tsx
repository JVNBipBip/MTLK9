"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, PawPrint } from "lucide-react"
import { ProgramSignupLink, TrainingPortalLink } from "@/components/booking-form-provider"

const services = [
  {
    title: "Reactivity Training",
    href: "/services/reactivity",
    for: "Dogs who lunge, bark, or shut down around triggers",
    solves: "Structured protocols covering the Three D's, attention cues, engagement, leash work, confidence building, and real-world scenario training",
    format: "Private & group classes",
    price: "",
    cta: "Get Help with Reactivity",
  },
  {
    title: "Private Classes",
    href: "/services/private-classes",
    for: "Dogs who need focused, one-on-one attention",
    solves: "Behaviour modification, leash reactivity, aggression, confidence building, separation anxiety, resource guarding, and handler skill development",
    format: "3, 5, or 7 session packages",
    price: "",
    cta: "Book Private Training",
    popular: true,
  },
  {
    title: "Obedience Training",
    href: "/services/obedience",
    for: "Dogs 9 months+ who need reliable real-world skills",
    solves: "Basic and advanced obedience, the Three D's, engagement, pack walks, high-distraction proofing, and off-leash reliability",
    format: "Private & group classes — Level 1 & Level 2",
    price: "",
    cta: "Start Obedience Training",
  },
  {
    title: "Puppy Training",
    href: "/services/puppy-training",
    for: "Puppies 10–20 weeks & teen dogs 5–9 months",
    solves: "Socialisation, confidence building, bite inhibition, intro to obedience, marker training, and focus around distractions",
    format: "Private & group classes",
    price: "",
    cta: "Start Your Puppy's Plan",
  },
  {
    title: "In-Home Training",
    href: "/services/in-home",
    for: "Owners who want training in their own environment",
    solves: "Behaviour modification, door manners, separation anxiety, house training — all addressed where the problems actually happen",
    format: "Consultation + 3, 5, or 7 session packages",
    price: "",
    cta: "Book In-Home Training",
  },
]

export default function ServicesPage() {
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
              Choose Your Training Path
            </h1>
            <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every dog is different. Every path starts with understanding yours.
            </p>
          </div>

          <div className="space-y-8 lg:space-y-10">
            {services.map((service, index) => (
              <article
                key={service.href}
                className={`reveal opacity-0 ${
                  index === 1
                    ? "animation-delay-200"
                    : index === 2
                      ? "animation-delay-400"
                      : index === 3
                        ? "animation-delay-200"
                        : index === 4
                          ? "animation-delay-600"
                          : ""
                }`}
              >
                <div className="bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 overflow-hidden">
                  <div className="grid lg:grid-cols-2">
                    <div
                      className={`relative min-h-[240px] md:min-h-[300px] bg-gradient-to-br from-primary/20 via-secondary/10 to-muted flex items-center justify-center p-8 ${
                        index % 2 === 1 ? "lg:order-2" : ""
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                          <PawPrint className="w-7 h-7 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">[Image: {service.title}]</p>
                      </div>
                    </div>

                    <div className={`p-8 lg:p-10 flex flex-col ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                      <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-2">
                        {service.title}
                      </h2>
                      <p className="text-sm font-medium text-primary mb-4">{service.for}</p>
                      <p className="text-muted-foreground leading-relaxed mb-4 flex-grow">
                        {service.solves}
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">{service.format}</p>
                      <ProgramSignupLink>
                        <Button className="w-full rounded-full group/btn">
                          {service.cta}
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </ProgramSignupLink>
                      <Link
                        href={service.href}
                        className="mt-3 inline-flex items-center justify-center w-full text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Learn More
                        <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-lg bg-gradient-to-br from-primary/10 via-muted/30 to-secondary/10">
            <div className="relative px-8 lg:px-16 py-16 lg:py-24 text-center">
              <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
                Need Guidance?
              </p>
              <h2 className="reveal opacity-0 animation-delay-200 font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground text-balance mb-6 max-w-3xl mx-auto">
                Not Sure Where to Start?
              </h2>
              <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
                Book a free 15-minute discovery call. Tell us about your dog, and we&apos;ll help you
                find the right training path — no pressure, no commitment.
              </p>
              <div className="reveal opacity-0 animation-delay-600">
                <TrainingPortalLink>
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
                  >
                    Book Private Training
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </TrainingPortalLink>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      <Footer />
    </main>
  )
}
