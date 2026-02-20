"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollAnimatedText } from "@/components/scroll-animated-text"
import { transformationStories } from "@/lib/transformation-stories"

export function TransformationsSection() {
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
      const items = Array.from(scroller.querySelectorAll("[data-story-card]"))
      if (!items.length) return
      const scrollLeft = scroller.scrollLeft

      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      items.forEach((item, index) => {
        const distance = Math.abs((item as HTMLElement).offsetLeft - scrollLeft)
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
    const items = Array.from(scroller.querySelectorAll("[data-story-card]"))
    const target = items[index] as HTMLElement | undefined
    if (!target) return
    scroller.scrollTo({ left: target.offsetLeft, behavior: "smooth" })
  }

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
            Real Results
          </p>
          <ScrollAnimatedText
            text="Transformation stories"
            className="font-display text-3xl md:text-5xl lg:text-7xl text-foreground text-balance mb-6 font-semibold tracking-tight"
          />
          <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every dog on this page started exactly where yours is now.
          </p>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 lg:pb-0 lg:grid lg:grid-cols-3 lg:overflow-visible"
        >
          {transformationStories.map((story, index) => (
            <div
              key={story.dogName}
              data-story-card
              className={`reveal opacity-0 ${index === 1 ? "animation-delay-200" : index === 2 ? "animation-delay-400" : ""} group snap-center shrink-0 w-[86%] sm:w-[70%] lg:w-auto lg:shrink`}
            >
              <div className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 h-full flex flex-col">
                {/* Video/Image Placeholder */}
                <div className="relative aspect-[16/10] bg-muted flex items-center justify-center overflow-hidden">
                  <div className="text-center px-6">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition-colors">
                      <Play className="w-6 h-6 text-primary ml-0.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">{story.mediaPlaceholder}</p>
                  </div>
                </div>

                <div className="p-6 lg:p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {story.dogName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{story.breed}</p>
                    </div>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {story.path}
                    </span>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-destructive mb-1">
                        Before
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {story.before}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
                        After
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {story.after}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={story.href}
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Read full story
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2.5 lg:hidden">
          {transformationStories.map((story, index) => (
            <button
              key={story.dogName}
              type="button"
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex ? "w-7 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground/40"
              }`}
              aria-label={`Go to story ${index + 1}`}
            />
          ))}
          <span className="ml-2 text-xs font-medium tracking-wide text-muted-foreground">
            {activeIndex + 1} / {transformationStories.length}
          </span>
        </div>

        <div className="text-center mt-12">
          <Link href="/results">
            <Button variant="outline" className="rounded-full px-8 group">
              See All Results
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
