import { headers } from "next/headers"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Phone } from "lucide-react"
import { FreeCallLink } from "@/components/booking-form-provider"
import { FaqAccordion } from "@/components/faq-accordion"
import { getFaqData } from "@/lib/faq-data"
import { JsonLd, buildFaqJsonLd } from "@/components/json-ld"
import { defaultLocale, isAppLocale, localeHeaderName, type AppLocale } from "@/lib/i18n/config"
import { buildLocalizedMetadata } from "@/lib/seo"

export function generateMetadata() {
  return buildLocalizedMetadata({
    path: "/faq",
    title: {
      en: "Dog Training FAQ",
      fr: "FAQ sur l'entraînement canin",
    },
    description: {
      en: "Answers about dog training methods, costs, timelines, safety, and booking in Montreal.",
      fr: "Réponses aux questions fréquentes sur les méthodes, les coûts, les délais et les programmes.",
    },
  })
}

async function getRequestLocale(): Promise<AppLocale> {
  const headerStore = await headers()
  const locale = headerStore.get(localeHeaderName)
  return isAppLocale(locale) ? locale : defaultLocale
}

const pageCopy = {
  en: {
    heading: "The Questions Every Montreal Dog Owner Asks",
    intro: "Methods, costs, timelines, safety — everything you need to know before booking.",
    ctaLabel: "Still Have Questions?",
    ctaHeading: "Start with a free 15-minute discovery call",
    ctaBody: "We'll answer your questions personally and help you figure out the right path for your dog.",
    ctaButton: "Contact Us for a Free Call",
  },
  fr: {
    heading: "Les questions que se posent les propriétaires de chiens à Montréal",
    intro: "Méthodes, coûts, délais, sécurité : tout ce qu'il faut savoir avant de réserver.",
    ctaLabel: "Vous avez encore des questions?",
    ctaHeading: "Commencez par un appel découverte gratuit de 15 minutes",
    ctaBody:
      "Nous répondrons personnellement à vos questions et vous aiderons à trouver le bon parcours pour votre chien.",
    ctaButton: "Contactez-nous pour un appel gratuit",
  },
} satisfies Record<AppLocale, Record<string, string>>

export default async function FaqPage() {
  const locale = await getRequestLocale()
  const copy = pageCopy[locale]
  const faqCategories = getFaqData(locale)
  const allFaqItems = faqCategories.flatMap((cat) => cat.items)

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={buildFaqJsonLd(allFaqItems)} />
      <Header />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4 animate-fade-up">
            {copy.heading}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 md:mb-16 animate-fade-up animation-delay-200">
            {copy.intro}
          </p>
          <FaqAccordion categories={faqCategories} />
        </div>
      </section>
      <section className="px-6 lg:px-8 pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[48px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
            <div className="relative px-8 lg:px-16 py-16 lg:py-24 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-primary-foreground/70 font-medium mb-4">
                {copy.ctaLabel}
              </p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground text-balance mb-6 max-w-3xl mx-auto">
                {copy.ctaHeading}
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto leading-relaxed mb-10">
                {copy.ctaBody}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <FreeCallLink>
                  <Button
                    size="lg"
                    className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 py-6 text-base group"
                  >
                    {copy.ctaButton}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </FreeCallLink>
                <a href="tel:+15148269558">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 py-6 text-base border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground bg-transparent"
                  >
                    <Phone className="mr-2 w-4 h-4" />
                    514 826 9558
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
