import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { PainPointsSection } from "@/components/pain-points-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { TrustStrip } from "@/components/trust-strip"
import { TransformationsSection } from "@/components/transformations-section"
import { StatsSection } from "@/components/stats-section"
import { FinalCTASection } from "@/components/final-cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <TrustStrip />
      <PainPointsSection />
      <StatsSection />
      <TransformationsSection />
      <HowItWorksSection />
      <FinalCTASection />
      <Footer />
    </main>
  )
}
