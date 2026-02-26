import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Play } from "lucide-react"
import { BookingLink } from "@/components/booking-form-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { getTransformationStory, transformationStories } from "@/lib/transformation-stories"

type StoryPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return transformationStories.map((story) => ({ slug: story.slug }))
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params
  const story = getTransformationStory(slug)

  if (!story) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-14 lg:pt-40 lg:pb-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-secondary font-medium mb-4">
            Transformation Story
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
            {story.dogName}: From stress to calm
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {story.breed} - {story.path}
          </p>
        </div>
      </section>

      <section className="pb-14 lg:pb-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-border/50 bg-card shadow-lg overflow-hidden">
            <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/20 via-secondary/10 to-muted flex items-center justify-center">
              {story.mediaSrc ? (
                // Render image or video media when real assets are added.
                <img src={story.mediaSrc} alt={story.mediaAlt} className="h-full w-full object-cover" />
              ) : (
                <div className="text-center px-6 max-w-2xl">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-7 h-7 text-primary ml-0.5" />
                  </div>
                  <p className="text-muted-foreground">{story.mediaPlaceholder}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24 lg:pb-28 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-border/50 bg-card p-7 md:p-10 lg:p-12 shadow-lg space-y-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-destructive mb-2">
                Before Training
              </p>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{story.before}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-2">
                After Training
              </p>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{story.after}</p>
            </div>

            <blockquote className="border-l-4 border-primary/40 pl-5 italic text-foreground/90 text-base md:text-lg">
              &ldquo;{story.testimonial}&rdquo;
            </blockquote>

            <div className="pt-2">
              <BookingLink>
                <Button size="lg" className="rounded-full px-8 py-6 text-base group">
                  Book a Free Discovery Call
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </BookingLink>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
