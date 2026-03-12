import { TrainingPortalBookingContent } from "../training-portal-booking-content"

type Props = {
  searchParams: Promise<{ email?: string; dog?: string }>
}

export default async function TrainingPortalBookPage({ searchParams }: Props) {
  const params = await searchParams
  const email = (params.email || "").trim().toLowerCase()
  const dog = (params.dog || "").trim()

  if (!email || !dog) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
          <p className="text-muted-foreground text-center mb-6">
            Missing required information. Please start from the training portal.
          </p>
          <a href="/services" className="text-primary hover:underline">
            Back to Services
          </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TrainingPortalBookingContent clientEmail={email} dogName={dog} />
    </div>
  )
}
