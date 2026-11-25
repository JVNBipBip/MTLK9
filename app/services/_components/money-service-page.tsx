import Link from "next/link"
import { ArrowRight, CheckCircle2, ClipboardCheck, HelpCircle, ShieldCheck } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TrustStrip } from "@/components/trust-strip"
import { Button } from "@/components/ui/button"
import { ProgramSignupButton } from "@/components/booking-form-provider"
import { addLocaleToPathname, type AppLocale } from "@/lib/i18n/config"
import type { MoneyServicePageData } from "@/lib/money-service-pages"
import { EditableCopy } from "@/components/editable-copy"
import { EditableText } from "@/components/editable-text"

export function MoneyServicePage({
  page,
  locale,
}: {
  page: MoneyServicePageData
  locale: AppLocale
}) {
  const copy = page.content[locale]
  // Owner-editable where registered (money.<slug>.<path>); plain text otherwise.
  const pick = (content: unknown, path: string) => String(path.split(".").reduce<unknown>((at, key) => (at as Record<string, unknown>)[key], content))
  const e = (path: string) => (
    <EditableCopy id={`money.${page.slug}.${path}`} copy={{ en: pick(page.content.en, path), fr: pick(page.content.fr, path) }} locale={locale} />
  )
  const privateTrainingHref = addLocaleToPathname(
    page.slug === "aggression" ? "/services/private-classes" : "/services/in-home",
    locale,
  )

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section
        className="relative bg-primary bg-cover bg-center bg-no-repeat px-6 pb-20 pt-32 text-primary-foreground lg:px-8 lg:pb-28 lg:pt-40"
        style={{ backgroundImage: `url("${page.image}")` }}
      >
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground/75">
            {e("eyebrow")}
          </p>
          <h1 className="mb-6 max-w-4xl text-balance font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {e("h1")}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-primary-foreground/90 md:text-xl">
            {e("intro")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ProgramSignupButton className="rounded-full bg-primary px-6 py-5 text-sm text-primary-foreground hover:bg-primary/90 md:text-base">
              {e("primaryCta")}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ProgramSignupButton>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/60 bg-white/10 px-6 py-5 text-sm text-white backdrop-blur hover:bg-white/20 md:text-base"
            >
              <Link href={privateTrainingHref}>{e("secondaryCta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-secondary">
              <EditableText id="money.shared.planEyebrow" locale={locale} />
            </p>
            <h2 className="text-balance font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {e("planTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              {e("planIntro")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {copy.process.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                  <EditableText id="money.shared.step" locale={locale} /> {index + 1}
                </p>
                <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  {e(`process.${index}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {e(`process.${index}.body`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border/50 bg-card p-7 shadow-sm md:p-8">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {e("signsTitle")}
            </h2>
            <ul className="mt-6 space-y-3">
              {copy.signs.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/85 md:text-base">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{e(`signs.${index}`)}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/50 bg-card p-7 shadow-sm md:p-8">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {e("helpTitle")}
            </h2>
            <ul className="mt-6 space-y-3">
              {copy.help.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/85 md:text-base">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{e(`help.${index}`)}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {e("bestForTitle")}
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {copy.bestFor.map((item, index) => (
              <article key={item} className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
                <CheckCircle2 className="mb-5 h-6 w-6 text-primary" aria-hidden="true" />
                <p className="text-base leading-relaxed text-foreground">{e(`bestFor.${index}`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {e("faqTitle")}
          </h2>
          <div className="mt-8 divide-y divide-border rounded-3xl border border-border/50 bg-card px-6 shadow-sm md:px-8">
            {copy.faqs.map((faq, index) => (
              <details key={faq.question} className="group py-6">
                <summary className="cursor-pointer list-none text-base font-semibold text-foreground md:text-lg">
                  {e(`faqs.${index}.question`)}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {e(`faqs.${index}.answer`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {e("relatedTitle")}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {copy.related.map((item, index) => (
              <Link
                key={item.path}
                href={addLocaleToPathname(item.path, locale)}
                className="group rounded-3xl border border-border/50 bg-card p-6 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  {e(`related.${index}.label`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{e(`related.${index}.description`)}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  <EditableText id="money.shared.viewProgram" locale={locale} />
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
            {e("ctaTitle")}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {e("ctaBody")}
          </p>
          <div className="mt-8">
            <ProgramSignupButton size="lg" className="rounded-full px-8 py-6 text-base">
              {e("primaryCta")}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ProgramSignupButton>
          </div>
        </div>
      </section>

      <TrustStrip />
      <Footer />
    </main>
  )
}
