"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FreeCallLink } from "@/components/booking-form-provider"
import { useAppLocale } from "@/components/locale-provider"
import { ScrollAnimatedText } from "@/components/scroll-animated-text"
import { WistiaClickToPlay } from "@/components/wistia-click-to-play"
import { addLocaleToPathname } from "@/lib/i18n/config"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { localizeTransformationStory, transformationStories } from "@/lib/transformation-stories"

function firstSentence(text: string) {
  return text.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() ?? text
}

export function TransformationsSection() {
  const locale = useAppLocale()
  const t = useLocalizedText()
  const stories = transformationStories.map((story) => localizeTransformationStory(story, locale))
  const sectionRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("animate-fade-up")
        })
      },
      { threshold: 0.1 },
    )
    const elements = sectionRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => {
      if (!isDesktop && (el as HTMLElement).dataset.storyCard !== undefined) return
      observer.observe(el)
    })

    if (!isDesktop) {
      const mobileStrip = sectionRef.current?.querySelector("[data-mobile-strip-reveal]")
      if (mobileStrip) observer.observe(mobileStrip)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-16">
          <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-secondary font-medium mb-4">
            {t("Real Results")}
          </p>
          <ScrollAnimatedText
            text={t("Transformation stories")}
            className="font-display text-3xl md:text-5xl lg:text-7xl text-foreground text-balance mb-6 font-semibold tracking-tight"
          />
          <p className="reveal opacity-0 animation-delay-400 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("Every dog on this page started exactly where yours is now.")}
          </p>
        </div>

        <div data-mobile-strip-reveal className="opacity-0 lg:opacity-100">
          <div className="lg:grid lg:grid-cols-6 lg:gap-6">
            {stories.map((story, index) => (
              <div
                key={story.dogName}
                data-story-card
                className={`${index === activeIndex ? "block" : "hidden"} reveal lg:block lg:opacity-0 ${index === 1 ? "animation-delay-200" : index === 2 ? "animation-delay-400" : index === 3 ? "animation-delay-600" : ""} group lg:col-span-2 ${stories.length % 3 === 2 && index === stories.length - 2 ? "lg:col-start-2" : ""}`}
              >
                <article className="bg-card rounded-[1.75rem] overflow-hidden border border-border/60 shadow-[0_16px_45px_rgba(20,48,28,0.08)] hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(20,48,28,0.13)] transition-all duration-300 h-full flex flex-col">
                  {story.wistiaId ? (
                    <WistiaClickToPlay
                      wistiaId={story.wistiaId}
                      title={story.mediaAlt}
                      className="aspect-[9/16]"
                      fitStrategy="contain"
                    />
                  ) : (
                    <div className="relative aspect-[16/10] bg-muted flex items-center justify-center overflow-hidden">
                      <div className="text-center px-6">
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition-colors">
                          <Play className="w-6 h-6 text-primary ml-0.5" />
                        </div>
                        <p className="text-xs text-muted-foreground">{story.mediaPlaceholder}</p>
                      </div>
                    </div>
                  )}

                  <div className="p-5 lg:p-6 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                      <div>
                        <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                          {story.dogName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{story.breed}</p>
                      </div>
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                        {story.path}
                      </span>
                    </div>

                    <div data-transformation-comparison className="relative flex-1 rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div aria-hidden="true" className="absolute bottom-7 left-[21px] top-7 w-px bg-gradient-to-b from-destructive/35 via-border to-primary/50" />
                      <div data-transformation-before className="relative pl-8 pb-5">
                        <span aria-hidden="true" className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-[3px] border-card bg-destructive/70 ring-1 ring-destructive/25" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-destructive mb-1.5">
                          {t("Before")}
                        </p>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {firstSentence(story.before)}
                        </p>
                      </div>
                      <div data-transformation-after className="relative pl-8">
                        <span aria-hidden="true" className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-[3px] border-card bg-primary ring-1 ring-primary/30" />
                        <div className="rounded-xl bg-primary/[0.08] px-3.5 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1.5">
                            {t("After")}
                          </p>
                          <p className="line-clamp-3 text-sm font-medium leading-relaxed text-foreground">
                            {firstSentence(story.after)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <FreeCallLink>
                      <button
                        type="button"
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
                      >
                        {t("Get Started")}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </FreeCallLink>
                  </div>
                </article>
              </div>
            ))}
          </div>
          <div data-transformation-story-nav className="mt-5 flex items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={() => setActiveIndex((activeIndex - 1 + stories.length) % stories.length)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
              aria-label={locale === "fr" ? "Histoire précédente" : "Previous story"}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {stories.map((story, index) => (
                <button
                  key={story.dogName}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? "w-7 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground/40"
                  }`}
                  aria-label={`${t("Go to story")} ${index + 1}`}
                />
              ))}
              <span className="ml-1 text-xs font-semibold tabular-nums text-muted-foreground">
                {activeIndex + 1} / {stories.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveIndex((activeIndex + 1) % stories.length)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
              aria-label={locale === "fr" ? "Histoire suivante" : "Next story"}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="text-center mt-12 flex flex-col items-center gap-3">
          <Link href={addLocaleToPathname("/results", locale)}>
            <Button variant="outline" className="rounded-full px-8 group">
              {t("See All Results")}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
