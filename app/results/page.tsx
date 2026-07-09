"use client"

import { useEffect, useRef } from "react"
import { ArrowDown, ArrowRight } from "lucide-react"
import { Footer } from "@/components/footer"
import { FreeCallLink } from "@/components/booking-form-provider"
import { Header } from "@/components/header"
import { useAppLocale } from "@/components/locale-provider"
import { TrustStrip } from "@/components/trust-strip"
import { Button } from "@/components/ui/button"
import { WistiaClickToPlay } from "@/components/wistia-click-to-play"
import { useLocalizedText } from "@/lib/i18n/use-localized-text"
import { localizeTransformationStory, transformationStories } from "@/lib/transformation-stories"

export default function ResultsPage() {
  const locale = useAppLocale()
  const t = useLocalizedText()
  const contentRef = useRef<HTMLDivElement>(null)
  const caseStudies = transformationStories.map((story) => localizeTransformationStory(story, locale))

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("animate-fade-up")
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
                {t("Real Dogs. Real Results.")}
              </h1>
              <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("Every dog on this page started exactly where yours is now.")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <article
                  key={study.slug}
                  className={`reveal opacity-0 ${
                    index === 1
                      ? "animation-delay-200"
                      : index === 2
                        ? "animation-delay-400"
                        : index === 3
                          ? "animation-delay-200"
                          : index === 4
                            ? "animation-delay-400"
                            : ""
                  }`}
                >
                  <div className="h-full bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 flex flex-col overflow-hidden">
                    {study.wistiaId && (
                      <WistiaClickToPlay
                        wistiaId={study.wistiaId}
                        posterSrc={study.posterSrc}
                        title={study.mediaAlt}
                        playLabel={locale === "fr" ? "Lire la vidéo" : "Play video"}
                        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 92vw"
                      />
                    )}

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-baseline gap-2 mb-4">
                        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                          {study.dogName}
                        </h2>
                        <span className="text-sm text-muted-foreground">{study.breed}</span>
                      </div>

                      <div className="space-y-3 text-sm leading-relaxed flex-grow">
                        <div className="rounded-xl bg-destructive/[0.06] border-l-[3px] border-destructive/60 p-3.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-destructive mb-1.5">
                            {t("Before")}
                          </p>
                          <p className="text-muted-foreground">{study.before}</p>
                        </div>
                        <div className="flex justify-center -my-1" aria-hidden="true">
                          <ArrowDown className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                        <div className="rounded-xl bg-primary/[0.06] border-l-[3px] border-primary/60 p-3.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-1.5">
                            {t("After")}
                          </p>
                          <p className="text-muted-foreground">{study.after}</p>
                        </div>
                      </div>

                      <blockquote className="mt-4 pt-4 border-t border-border/50 text-sm italic text-muted-foreground">
                        &ldquo;{study.testimonial}&rdquo;
                      </blockquote>

                      <FreeCallLink>
                        <button
                          type="button"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          {t("Book Free Evaluation")}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </FreeCallLink>
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
                <h2 className="reveal opacity-0 font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground text-balance mb-6 max-w-3xl mx-auto">
                  {t("Your dog's story could be next.")}
                </h2>
                <p className="reveal opacity-0 animation-delay-200 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
                  {t("Contact us for a free discovery call and start your dog's transformation.")}
                </p>
                <div className="reveal opacity-0 animation-delay-400">
                  <FreeCallLink>
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
                    >
                      {t("Contact Us for a Free Discovery Call")}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </FreeCallLink>
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
