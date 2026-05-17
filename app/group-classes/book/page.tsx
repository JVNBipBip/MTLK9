import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { buildLocalizedMetadata } from "@/lib/seo"
import { GroupClassesBookingPanel } from "../group-classes-booking-panel"
import { GroupClassesBookHero } from "./group-classes-book-hero"
import { GroupClassesBookLoading } from "./group-classes-book-loading"

export async function generateMetadata() {
  return buildLocalizedMetadata({
    path: "/group-classes/book",
    title: {
      en: "Finish your group class request",
      fr: "Finaliser votre demande de cours de groupe",
    },
    description: {
      en: "Use the secure link from your email to confirm access and request your group class spot.",
      fr: "Utilisez le lien sécurisé reçu par courriel pour confirmer votre accès et demander votre place en cours de groupe.",
    },
    image: "/images/Classes images/puppy_social.jpg",
    robots: { index: false, follow: true },
  })
}

export default function GroupClassesBookPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <GroupClassesBookHero />
      <section className="px-6 lg:px-8 pb-20 lg:pb-28 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={<GroupClassesBookLoading />}>
            <GroupClassesBookingPanel variant="invite" />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  )
}
