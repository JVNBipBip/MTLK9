import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock, Lightbulb } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { Button } from "@/components/ui/button"
import type { AppLocale } from "@/lib/i18n/config"
import { formatLocalizedDateTime } from "@/lib/i18n/format"
import { localizedPath } from "@/lib/seo"
import type { BlogPost, BlogSection } from "@/lib/blog/types"

function ArticleSectionBlock({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "heading":
      return (
        <h2 className="mt-12 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {section.text}
        </h2>
      )
    case "subheading":
      return (
        <h3 className="mt-8 font-display text-2xl font-semibold tracking-tight text-foreground">
          {section.text}
        </h3>
      )
    case "paragraph":
      return <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">{section.text}</p>
    case "list":
      return (
        <ul className="mt-5 space-y-3">
          {section.items.map((item) => (
            <li key={item} className="flex gap-3 text-base leading-relaxed text-foreground/85 md:text-lg">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case "callout":
      return (
        <aside className="mt-8 rounded-3xl border border-border/50 bg-muted/30 p-6 md:p-7">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lightbulb className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {section.title}
          </h3>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{section.text}</p>
        </aside>
      )
  }
}

export function ArticleLayout({
  post,
  locale,
}: {
  post: BlogPost
  locale: AppLocale
}) {
  const copy = post.content[locale]
  // Dates are date-only ISO strings; format in UTC so they don't shift a day.
  const publishedLabel = formatLocalizedDateTime(post.datePublished, locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="px-6 pb-10 pt-32 lg:px-8 lg:pb-14 lg:pt-40">
        <div className="mx-auto max-w-4xl">
          <nav aria-label={locale === "fr" ? "Fil d'Ariane" : "Breadcrumb"} className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href={localizedPath(locale, "/")} className="transition-colors hover:text-foreground">
                  {locale === "fr" ? "Accueil" : "Home"}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </li>
              <li>
                <Link href={localizedPath(locale, "/blog")} className="transition-colors hover:text-foreground">
                  {locale === "fr" ? "Blogue" : "Blog"}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </li>
              <li aria-current="page" className="line-clamp-1 font-medium text-foreground">
                {copy.title}
              </li>
            </ol>
          </nav>

          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-secondary">
            {locale === "fr" ? "Guide d'entraînement" : "Training guide"}
          </p>
          <h1 className="mb-6 text-balance font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {copy.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>
              {locale === "fr" ? "Par" : "By"}{" "}
              <Link
                href={localizedPath(locale, `/booking/${post.author.slug}`)}
                className="font-medium text-primary transition-colors hover:text-primary/80"
              >
                {post.author.name}
              </Link>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              <time dateTime={post.datePublished}>{publishedLabel}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              {post.readingMinutes} {locale === "fr" ? "min de lecture" : "min read"}
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12 lg:px-8 lg:pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-border/50 bg-muted shadow-lg shadow-primary/5">
            <Image
              src={post.image}
              alt={copy.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8 lg:pb-24">
        <article className="mx-auto max-w-3xl">
          {copy.sections.map((section, index) => (
            <ArticleSectionBlock key={index} section={section} />
          ))}
        </article>
      </section>

      <section className="bg-muted/30 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {copy.faqTitle}
          </h2>
          <div className="mt-8 divide-y divide-border rounded-3xl border border-border/50 bg-card px-6 shadow-sm md:px-8">
            {copy.faqs.map((faq) => (
              <details key={faq.question} className="group py-6">
                <summary className="cursor-pointer list-none text-base font-semibold text-foreground md:text-lg">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {copy.relatedTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {copy.related.map((item) => (
              <Link
                key={item.path}
                href={localizedPath(locale, item.path)}
                className="group rounded-3xl border border-border/50 bg-card p-6 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  {item.label}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  {locale === "fr" ? "En savoir plus" : "Learn more"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {copy.ctaTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {copy.ctaBody}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-base">
              <Link href={localizedPath(locale, "/booking")}>
                {copy.ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 py-6 text-base">
              <Link href={localizedPath(locale, "/services/consultation")}>
                {locale === "fr" ? "Découvrir la consultation" : "Explore the consultation"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <TrustStrip />
      <Footer />
    </main>
  )
}
