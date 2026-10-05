"use client"

import { ArrowUpRight } from "lucide-react"
import { useBookingForm } from "@/components/booking-form-provider"
import type { ServiceInterest } from "@/lib/service-inquiries"

export function ServiceInquiryButton({ interest, children }: { interest: ServiceInterest; children: React.ReactNode }) {
  const { openBookingForm } = useBookingForm()
  return (
    <button type="button" onClick={() => openBookingForm({ source: `service_${interest}`, serviceInterest: interest })}
      className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
      {children}<ArrowUpRight className="size-5 shrink-0" aria-hidden />
    </button>
  )
}
