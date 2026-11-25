import { EditableCopy } from "@/components/editable-copy"
import { EditableText } from "@/components/editable-text"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { FreeCallButton } from "@/components/booking-form-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WistiaClickToPlay } from "@/components/wistia-click-to-play"
import { getLocalizedText } from "@/lib/i18n/localized-text"
import { buildLocalizedMetadata, getRequestLocale, noIndexMetadata } from "@/lib/seo"
import {
  getTransformationStory,
  isPublishableTransformationStory,
  localizeTransformationStory,
  transformationStories,
} from "@/lib/transformation-stories"

type StoryPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return transformationStories.map((story) => ({ slug: story.slug }))
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const story = getTransformationStory(slug)

  if (!story) {
    return noIndexMetadata("Story Not Found", "This transformation story could not be found.")
  }

  if (!isPublishableTransformationStory(story)) {
    return noIndexMetadata(
      `${story.dogName}: Transformation Story`,
      "This transformation story is not ready for search indexing.",
    )
  }

  return buildLocalizedMetadata({
    path: `/results/${story.slug}`,
    title: {
      en: `${story.dogName}'s Dog Training Result`,
      fr: `Résultat d'entraînement de ${story.dogName}`,
    },
    description: {
      en: `${story.dogName}, a ${story.breed}, made real progress through ${story.path.toLowerCase()} at Montreal Canine Training.`,
      fr: `${story.dogName}, ${story.breed}, a fait de vrais progrès grâce à l'entraînement chez Entraînement Canin Montréal.`,
    },
  })
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params
  const storyData = getTransformationStory(slug)

  if (!storyData) {
    notFound()
  }

  const locale = await getRequestLocale()
  const story = localizeTransformationStory(storyData, locale)
  const t = (text: string) => getLocalizedText(locale, text)
  type StoryKey = "breed" | "path" | "before" | "after" | "testimonial"
  const e = (key: StoryKey) => <EditableCopy id={`story.${storyData.slug}.${key}`} copy={{ en: storyData[key], fr: storyData.fr[key] }} locale={locale} />

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-14 lg:pt-40 lg:pb-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-secondary font-medium mb-4">
            <EditableText id="results.story.eyebrow" locale={locale} />
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
            <EditableCopy id={`story.${storyData.slug}.dogName`} copy={{ en: storyData.dogName, fr: storyData.dogName }} locale={locale} />: <EditableText id="results.story.headingEnd" locale={locale} />
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            {e("breed")} - {e("path")}
          </p>
        </div>
      </section>

      <section className="pb-14 lg:pb-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-border/50 bg-card shadow-lg">
            {story.wistiaId ? (
              <WistiaClickToPlay
                wistiaId={story.wistiaId}
                title={story.mediaAlt}
              />
            ) : story.mediaSrc ? (
              <img src={story.mediaSrc} alt={story.mediaAlt} className="h-full w-full object-cover" />
            ) : null}
          </div>
        </div>
      </section>

      <section className="pb-24 lg:pb-28 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-border/50 bg-card p-7 md:p-10 lg:p-12 shadow-lg space-y-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-destructive mb-2">
                <EditableText id="results.story.before" locale={locale} />
              </p>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{e("before")}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary mb-2">
                <EditableText id="results.story.after" locale={locale} />
              </p>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{e("after")}</p>
            </div>

            <blockquote className="border-l-4 border-primary/40 pl-5 italic text-foreground/90 text-base md:text-lg">
              &ldquo;{e("testimonial")}&rdquo;
            </blockquote>

            <div className="pt-2">
              <FreeCallButton size="lg" className="rounded-full px-8 py-6 text-base group">
                <EditableText id="results.story.button" locale={locale} />
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </FreeCallButton>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
