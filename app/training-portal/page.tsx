import type { Metadata } from "next"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { noIndexMetadata } from "@/lib/seo"
import { TrainingPortalContent } from "./training-portal-content"

export const metadata: Metadata = noIndexMetadata(
  "Training Portal — Montreal Canine Training",
  "Private training portal for Montreal Canine Training clients.",
)

export default function TrainingPortalPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-8 animate-pulse text-muted-foreground">Loading...</div>}>
        <TrainingPortalContent />
      </Suspense>
    </div>
  )
}
