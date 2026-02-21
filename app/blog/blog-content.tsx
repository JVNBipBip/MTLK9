"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const categories = [
  "All",
  "Puppy Tips",
  "Reactivity & Anxiety",
  "City Living with Dogs",
  "Training Myths",
  "Client Stories",
] as const

type Category = (typeof categories)[number]

const blogPosts = [
  {
    slug: "why-your-dog-pulls-on-the-leash",
    title: "Why Your Dog Pulls on the Leash (And What Actually Fixes It)",
    category: "City Living with Dogs" as const,
    description: "The science behind leash pulling and the methods that work in real-world Montreal.",
  },
  {
    slug: "real-reason-dog-is-reactive",
    title: "The Real Reason Your Dog Is Reactive — It's Not What You Think",
    category: "Reactivity & Anxiety" as const,
    description: "Understanding the root causes of reactivity can change how you approach training.",
  },
  {
    slug: "99-percent-dogs-behavioral-issues",
    title: "99% of Dogs Have Behavioral Issues. Here's Why That's Good News.",
    category: "Training Myths" as const,
    description: "Most dogs struggle with something. That doesn't mean yours is broken — it means help exists.",
  },
  {
    slug: "what-happens-in-dog-training-evaluation",
    title: "What Happens in a Dog Training Evaluation (And Why It Matters)",
    category: "Training Myths" as const,
    description: "A behind-the-scenes look at how we assess your dog and build a custom plan.",
  },
  {
    slug: "apartment-living-with-dog-montreal",
    title: "Apartment Living with a Dog in Montreal: A Survival Guide",
    category: "City Living with Dogs" as const,
    description: "Tips for keeping your dog happy and well-behaved in tight urban spaces.",
  },
  {
    slug: "socialize-puppy-without-overwhelming",
    title: "How to Socialize Your Puppy Without Overwhelming Them",
    category: "Puppy Tips" as const,
    description: "The right balance of exposure and protection for your puppy's critical development period.",
  },
  {
    slug: "why-we-train-in-parks-not-classrooms",
    title: "Why We Train in Parks, Not Classrooms",
    category: "Training Myths" as const,
    description: "Real-world training means real-world results. Here's why location matters.",
  },
  {
    slug: "separation-anxiety-signs-myths-help",
    title: "Separation Anxiety: The Signs, The Myths, and What Actually Helps",
    category: "Reactivity & Anxiety" as const,
    description: "Cutting through the noise to give you a clear path forward.",
  },
  {
    slug: "choose-dog-trainer-montreal",
    title: "How to Choose a Dog Trainer in Montreal (Red Flags and Green Flags)",
    category: "Training Myths" as const,
    description: "What to look for — and what to run from — when hiring a trainer.",
  },
  {
    slug: "dog-doesnt-need-to-be-fixed",
    title: "Your Dog Doesn't Need to Be 'Fixed' — They Need a Plan",
    category: "Client Stories" as const,
    description: "One owner's journey from frustration to a calmer, happier dog.",
  },
]

export function BlogContent() {
  const contentRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState<Category>("All")

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
  }, [activeCategory])

  const filteredPosts =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((post) => post.category === activeCategory)

  return (
    <div ref={contentRef}>
      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="reveal opacity-0 font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
            Real Advice for Real Dog Owners
          </h1>
          <p className="reveal opacity-0 animation-delay-200 text-lg md:text-xl text-muted-foreground">
            Tips, stories, and science-backed guidance from our team.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="pb-12 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="reveal opacity-0 flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="pb-24 lg:pb-32 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <article
                key={post.slug}
                className={`reveal opacity-0 ${
                  index % 3 === 1
                    ? "animation-delay-200"
                    : index % 3 === 2
                      ? "animation-delay-400"
                      : ""
                }`}
              >
                <Link href="#" className="group block">
                  <div className="bg-card rounded-3xl border border-border/50 shadow-lg shadow-primary/5 overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300">
                    {/* Placeholder image area */}
                    <div className="aspect-[16/10] bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground/50 text-xs">
                        Image
                      </span>
                    </div>
                    <div className="p-6">
                      <span className="inline-block text-xs font-medium text-primary mb-3">
                        {post.category}
                      </span>
                      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                        {post.description}
                      </p>
                      <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-3 gap-2 transition-all">
                        Read more
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
