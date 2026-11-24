import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { PainPointsSection } from "@/components/pain-points-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FaqSection } from "@/components/faq-section"
import { TrustStrip } from "@/components/trust-strip"
import { TransformationsSection } from "@/components/transformations-section"
import { StatsSection } from "@/components/stats-section"
import { FinalCTASection } from "@/components/final-cta-section"
import { Footer } from "@/components/footer"
import { ServicesOverview } from "@/components/services-overview"
import { TrainingMoments } from "@/components/training-moments"
import { getFaqData } from "@/lib/faq-data"
import { getRequestLocale } from "@/lib/seo"
import { DaycarePromoBanner } from "@/components/daycare-promo-banner"
import { daycarePromoActive } from "@/lib/daycare-pricing"

export default async function Home() {
  const locale = await getRequestLocale()
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      {daycarePromoActive() && <div className="px-5 pt-8 md:px-8"><DaycarePromoBanner locale={locale} className="mx-auto max-w-6xl" /></div>}
      <TrustStrip />
      <ServicesOverview />
      <PainPointsSection />
      <TransformationsSection />
      <TrainingMoments />
      <HowItWorksSection />
      <StatsSection />
      <FaqSection categories={getFaqData(locale)} />
      <FinalCTASection />
      <Footer />
    </main>
  )
}
