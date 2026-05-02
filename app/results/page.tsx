"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import { FreeCallLink } from "@/components/booking-form-provider"

const caseStudies = [
  {
    name: "Sasha",
    breed: "[Breed]",
    age: "",
    photoDesc: "Sasha's video testimonial about controlling reactivity",
    wistiaId: "ww92aq0dn9",
    problem:
      "I had no control over Sasha. She was so reactive that I couldn't be around other dogs without her going crazy, which made our walks together a nightmare.",
    plan: "",
    result:
      "I can finally enjoy being around other dogs. Sasha is much more manageable, and I've learned the exact techniques to correct her behavior and keep her focused.",
    quote:
      "Nick is so experienced and patient. He teaches you exactly how to deal with your dog, and now I actually enjoy our walks again. I recommend him to everybody.",
    servicePath: "Reactivity Training",
    serviceHref: "/services/reactivity",
  },
  {
    name: "Mason",
    breed: "German Shepherd",
    age: "",
    photoDesc: "Sabrina's video testimonial about overcoming Mason's severe reactivity",
    wistiaId: "3a2efylwfy",
    problem:
      "Walking Mason was a constant challenge. His reactivity toward other dogs meant we couldn't even walk down the street or through the woods without an incident.",
    plan: "",
    result:
      "Mason has come so far that we've transitioned from private lessons to group classes. He genuinely enjoys the training, and our daily life is completely different.",
    quote:
      "We drive an hour each way just to come here because it's so worth it. Working with Nick at Montreal Canine Training has truly changed our lives.",
    servicePath: "Reactivity Training",
    serviceHref: "/services/reactivity",
  },
  {
    name: "[Dog Name]",
    breed: "[Breed]",
    age: "",
    photoDesc: "Multi-dog success story video testimonial",
    wistiaId: "2cytzfcub2",
    problem:
      "Life with my first reactive dog was a nightmare. Even a simple walk felt impossible, and the constant stress was overwhelming.",
    plan: "",
    result:
      "The training made such a difference that I didn't hesitate to return with my new puppy. Now, our walks are enjoyable, and I feel confident about my dogs' future.",
    quote:
      "My life was a nightmare before we started. Now, it's a pleasure to be out with my dogs. I knew exactly where to go when I got my second puppy to make sure everything stayed on the right track.",
    servicePath: "Puppy Training",
    serviceHref: "/services/puppy-training",
  },
  {
    name: "Theo",
    breed: "Doberman",
    age: "",
    photoDesc: "Rebecca's video testimonial about training Theo, her Doberman puppy",
    wistiaId: "i0ipeqgj8k",
    problem:
      "Searching for a trainer who truly understood the intensity of a working-line Doberman. I was meticulous and hesitant until I found Nick.",
    plan: "",
    result:
      "Every session leaves me more confident. We have a clear path forward, and the support is always flexible and open—no question is ever too small.",
    quote:
      "I feel so much more confident every time I have a session. They are incredibly flexible and always there to support you, no matter what you need help with.",
    servicePath: "Puppy Training",
    serviceHref: "/services/puppy-training",
  },
  {
    name: "[Dog Name]",
    breed: "Shiba Inu",
    age: "",
    photoDesc: "Video testimonial about raising a social Shiba Inu puppy",
    wistiaId: "ek2ojttv3i",
    problem:
      "Shiba Inus are notorious for their independent and sometimes difficult attitudes. We wanted to ensure our puppy started on the right foot and developed into a well-rounded dog.",
    plan: "",
    result:
      "He is now incredibly social and great with other dogs. The training has been so successful that people often joke he's the \"anti-Shiba\" because of how friendly and calm he is.",
    quote:
      "The classes and private training have helped shape him into the dog he is now. There's always room to grow, which is why we keep coming back to Montreal Canine Training.",
    servicePath: "Puppy Training",
    serviceHref: "/services/puppy-training",
  },
  {
    name: "[Dog Name]",
    breed: "[Breed]",
    age: "",
    photoDesc: "Video testimonial about finding comfort and control with a long-reactive dog",
    wistiaId: "qtdpt5lv7o",
    problem:
      "My dog had been reactive for years. We tried everything, but nothing seemed to stick. Our walks were stressful, and he just couldn't be around other dogs comfortably.",
    plan: "",
    result:
      "The change has been drastic. He can now be around other dogs without feeling pressured or reactive. We've found a place where he truly feels safe and comfortable.",
    quote:
      "Nick is such an understanding trainer. My dog has had such a drastic change in such a short amount of time—I'm just amazed at the progress we've had.",
    servicePath: "Reactivity Training",
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
      <Script src="https://fast.wistia.com/player.js" strategy="lazyOnload" />
      <Script src="https://fast.wistia.com/embed/ww92aq0dn9.js" strategy="lazyOnload" />
      <Script src="https://fast.wistia.com/embed/i0ipeqgj8k.js" strategy="lazyOnload" />
      <Script src="https://fast.wistia.com/embed/3a2efylwfy.js" strategy="lazyOnload" />
      <Script src="https://fast.wistia.com/embed/2cytzfcub2.js" strategy="lazyOnload" />
      <Script src="https://fast.wistia.com/embed/ek2ojttv3i.js" strategy="lazyOnload" />
      <Script src="https://fast.wistia.com/embed/qtdpt5lv7o.js" strategy="lazyOnload" />
      <Header />

      <div ref={contentRef}>
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 lg:mb-20">
              <h1 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
                Real Dogs. Real Results.
              </h1>
              <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Every dog on this page started exactly where yours is now.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <article
                  key={study.name}
                  className={`reveal opacity-0 ${index === 1
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
                    {/* Photo/Video */}
                    {study.wistiaId ? (
                      <div className="relative bg-muted overflow-hidden" style={{ aspectRatio: "16/10" }}>
                        {/* @ts-expect-error - Wistia web component */}
                        <wistia-player media-id={study.wistiaId} aspect="0.5625" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "177.78%", height: "100%" }} />
                      </div>
                    ) : (
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
                    )}

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-baseline gap-2 mb-4">
                        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                          {study.name}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          {study.breed}{study.age ? `, ${study.age}` : ""}
                        </span>
                      </div>

                      <div className="space-y-4 text-sm leading-relaxed flex-grow">
                        <div>
                          <p className="font-medium text-foreground mb-1">
                            The Problem
                          </p>
                          <p className="text-muted-foreground">{study.problem}</p>
                        </div>
                        {study.plan && (
                          <div>
                            <p className="font-medium text-foreground mb-1">
                              The Plan
                            </p>
                            <p className="text-muted-foreground">{study.plan}</p>
                          </div>
                        )}
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

                      <FreeCallLink>
                        <button type="button" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
                          Book Free Evaluation
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
                  <FreeCallLink>
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
                    >
                      Book a Free Discovery Call
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
