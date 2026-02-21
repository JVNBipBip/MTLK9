"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { ScrollAnimatedText } from "@/components/scroll-animated-text"

const painPoints = [
  {
    question: "Pull on every walk?",
    description: "You dread taking them out. Every walk is a battle.",
    href: "/services/city-manners",
    image: "/images/pain-points/pulling.png",
  },
  {
    question: "Lunge or bark at other dogs?",
    description: "You cross the street, avoid the park, walk at odd hours.",
    href: "/services/reactivity",
    image: "/images/pain-points/barking.png",
  },
  {
    question: "Destroy things when left alone?",
    description: "You can't leave the house without worrying.",
    href: "/services/reactivity",
    image: "/images/pain-points/destroying.png",
  },
  {
    question: "Bite, nip, or jump on people?",
    description: "Guests are afraid. You're embarrassed and on edge.",
    href: "/services/puppy-foundations",
    image: "/images/pain-points/jumping.png",
  },
]

export function PainPointsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("animate-fade-up")
        })
      },
      { threshold: 0.1 },
    )
    const elements = sectionRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const updateActiveIndex = () => {
      const items = Array.from(scroller.querySelectorAll("article"))
      if (!items.length) return
      const scrollLeft = scroller.scrollLeft

      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      items.forEach((item, index) => {
        const distance = Math.abs(item.offsetLeft - scrollLeft)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      setActiveIndex(closestIndex)
    }

    updateActiveIndex()
    scroller.addEventListener("scroll", updateActiveIndex, { passive: true })
    return () => scroller.removeEventListener("scroll", updateActiveIndex)
  }, [])

  const goToSlide = (index: number) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const items = Array.from(scroller.querySelectorAll("article"))
    const target = items[index]
    if (!target) return
    scroller.scrollTo({ left: target.offsetLeft, behavior: "smooth" })
  }

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
            Sound Familiar?
          </p>
          <ScrollAnimatedText
            text="Does your dog..."
            className="font-display text-3xl md:text-5xl lg:text-7xl text-foreground text-balance mb-6 font-semibold tracking-tight"
          />
          <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            You&apos;re not a bad owner. These are the most common reasons Montreal dog owners reach
            out to us.
          </p>
        </div>

        <div className="reveal opacity-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-xs md:text-sm uppercase tracking-[0.14em] text-muted-foreground/80">
              Swipe/Scroll to see each challenge
            </p>
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToSlide(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-45 disabled:cursor-not-allowed"
                aria-label="Previous challenge"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => goToSlide(Math.min(painPoints.length - 1, activeIndex + 1))}
                disabled={activeIndex === painPoints.length - 1}
                className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-border/60 bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-45 disabled:cursor-not-allowed"
                aria-label="Next challenge"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div ref={scrollerRef} className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2">
            {painPoints.map((point, index) => (
              <article
                key={point.question}
                className={`${index === 1 || index === 3 ? "animation-delay-200" : index === 2 ? "animation-delay-400" : ""} snap-start shrink-0 w-[88%] sm:w-[82%] md:w-[76%] lg:w-full group bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 overflow-hidden`}
              >
                <div className="grid lg:grid-cols-2 min-h-[560px] lg:min-h-[460px]">
                  <div className="relative h-64 sm:h-80 lg:h-full overflow-hidden">
                    <Image
                      src={point.image}
                      alt={point.question}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:bg-gradient-to-r lg:from-black/25 lg:to-transparent" />
                  </div>
                  <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
                    <p className="text-xs uppercase tracking-[0.16em] text-secondary font-semibold mb-3">
                      Common Challenge
                    </p>
                    <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-4">
                      {point.question}
                    </h3>
                    <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 max-w-xl">
                      {point.description}
                    </p>
                    <Link href={point.href} className="mt-auto inline-flex">
                      <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold transition-colors group-hover:bg-primary/90">
                        Find your training path
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2.5">
            {painPoints.map((point, index) => (
              <button
                key={point.question}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeIndex ? "w-7 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground/40"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
            <span className="ml-2 text-xs font-medium tracking-wide text-muted-foreground">
              {activeIndex + 1} / {painPoints.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
