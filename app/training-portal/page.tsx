import { Header } from "@/components/header"
import { TrainingPortalContent } from "./training-portal-content"

export default function TrainingPortalPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TrainingPortalContent />
    </div>
  )
}
