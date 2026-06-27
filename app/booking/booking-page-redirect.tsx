"use client"

import { useEffect } from "react"
import { useBookingForm } from "@/components/booking-form-provider"

export function BookingPageRedirect() {
  const { openBookingForm } = useBookingForm()

  useEffect(() => {
    openBookingForm()
  }, [openBookingForm])

  return null
}
