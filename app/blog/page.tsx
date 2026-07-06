import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarDays, Clock } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { blogPosts } from "@/lib/blog"
import { formatLocalizedDateTime } from "@/lib/i18n/format"
import { buildLocalizedMetadata, getRequestLocale, localizedPath } from "@/lib/seo"

export function generateMetadata() {
  return buildLocalizedMetadata({
    path: "/blog",
    title: {
      en: "Dog Training Tips & Guides Montreal | MTL Canine Training",
      fr: "Conseils et guides d'entraînement canin à Montréal | MTL Canine Training",
    },
    description: {
      en: "Practical dog training guides from Montreal trainers: reactivity, separation anxiety, puppy socialization, and choosing the right trainer.",
      fr: "Guides pratiques d'entraînement canin à Montréal : réactivité, anxiété de séparation, socialisation du chiot et choix du bon entraîneur.",
    },
  })
}

export default async function BlogPage() {
  const locale = await getRequestLocale()

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="px-6 pb-16 pt-32 lg:px-8 lg:pb-24 lg:pt-40">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-balance font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {locale === "fr"
              ? "De vrais conseils pour de vrais propriétaires de chiens"
              : "Real Advice for Real Dog Owners"}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            {locale === "fr"
              ? "Conseils, guides et explications fondées sur la science, écrits par notre équipe d'entraîneurs."
              : "Tips, guides, and science-backed advice written by our team of trainers."}
          </p>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2">
            {blogPosts.map((post) => {
              const copy = post.content[locale]

              return (
                <article key={post.slug}>
                  <Link href={localizedPath(locale, post.path)} className="group block h-full">
                    <div className="h-full overflow-hidden rounded-3xl border border-border/50 bg-card shadow-lg shadow-primary/5 transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
                      <div className="relative aspect-[16/10] bg-muted">
                        <Image
                          src={post.image}
                          alt={copy.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                            <time dateTime={post.datePublished}>
                              {formatLocalizedDateTime(post.datePublished, locale, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                timeZone: "UTC",
                              })}
                            </time>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                            {post.readingMinutes} {locale === "fr" ? "min de lecture" : "min read"}
                          </span>
                        </div>
                        <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                          {copy.title}
                        </h2>
                        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                          {copy.excerpt}
                        </p>
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-all group-hover:gap-3">
                          {locale === "fr" ? "Lire l'article" : "Read more"}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
          <p className="mt-12 text-center text-sm text-muted-foreground">
            {locale === "fr"
              ? "De nouveaux guides chaque mois — rédigés par nos entraîneurs."
              : "New guides every month — written by our trainers."}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
