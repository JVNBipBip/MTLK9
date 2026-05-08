"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBookingForm } from "@/components/booking-form-provider"
import { useAppLocale } from "@/components/locale-provider"
import { addLocaleToPathname } from "@/lib/i18n/config"

export function BookingPageRedirect() {
  const router = useRouter()
  const { openBookingForm } = useBookingForm()
  const locale = useAppLocale()

  useEffect(() => {
    openBookingForm()
    router.replace(addLocaleToPathname("/", locale))
  }, [locale, openBookingForm, router])

  return null
}
