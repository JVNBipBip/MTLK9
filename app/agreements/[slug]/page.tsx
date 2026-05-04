import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { contractBody, contractKindFromSlug, contractLabel } from "@/lib/contract-terms"
import { defaultLocale, isAppLocale, localeHeaderName, type AppLocale } from "@/lib/i18n/config"
import { noIndexMetadata } from "@/lib/seo"

type AgreementPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return [{ slug: "private-training" }, { slug: "group-classes" }, { slug: "evaluation" }]
}

export const metadata: Metadata = noIndexMetadata(
  "Service Agreement — Montreal Canine Training",
  "Service agreement for Montreal Canine Training clients.",
)

async function getRequestLocale(): Promise<AppLocale> {
  const headerStore = await headers()
  const locale = headerStore.get(localeHeaderName)
  return isAppLocale(locale) ? locale : defaultLocale
}

export default async function AgreementPage({ params }: AgreementPageProps) {
  const { slug } = await params
  const kind = contractKindFromSlug(slug)
  const locale = await getRequestLocale()

  if (!kind) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="px-6 pb-16 pt-32 md:pb-24 md:pt-40 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card p-6 shadow-lg shadow-primary/5 sm:p-8 lg:p-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-secondary">
            Montreal Canine Training
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {contractLabel(kind, locale)}
          </h1>
          <div className="mt-8 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {contractBody(kind, locale)}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
