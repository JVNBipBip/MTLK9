"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBookingForm } from "@/components/booking-form-provider"

export function BookingPageRedirect() {
  const router = useRouter()
  const { openBookingForm } = useBookingForm()

  useEffect(() => {
    openBookingForm()
    router.replace("/")
  }, [openBookingForm, router])

  return null
}
