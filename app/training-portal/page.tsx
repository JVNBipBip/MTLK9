import { Suspense } from "react"
import { Header } from "@/components/header"
import { TrainingPortalContent } from "./training-portal-content"

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
