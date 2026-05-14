import type { Metadata } from "next"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { noIndexMetadata } from "@/lib/seo"
import { TrainingPortalContent } from "../training-portal-content"

export const metadata: Metadata = noIndexMetadata(
  "Private Training Portal — Montreal Canine Training",
  "Choose a package and book private training sessions.",
)

export default function TrainingPortalPrivatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-8 animate-pulse text-muted-foreground">Loading...</div>}>
        <TrainingPortalContent mode="private_only" />
      </Suspense>
    </div>
  )
}
