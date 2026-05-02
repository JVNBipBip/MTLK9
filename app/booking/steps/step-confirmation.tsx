"use client"

import { CheckCircle, Phone, Mail } from "lucide-react"
import { useAppLocale } from "@/components/locale-provider"
import { getIntlLocale } from "@/lib/i18n/config"
import type { BookingFormData } from "../types"

export function StepConfirmation({ formData }: { formData: BookingFormData }) {
  const locale = useAppLocale()
  const intlLocale = getIntlLocale(locale)
  const formattedConsultationDateTime = formData.consultationDateTime
    ? new Date(formData.consultationDateTime).toLocaleString(intlLocale, {
        timeZone: "America/Toronto",
        dateStyle: "full",
        timeStyle: "short",
      })
    : "To be confirmed by email"
  const assessmentSummary = [
    { label: "When", value: formattedConsultationDateTime },
    { label: "Where", value: formData.consultationLocation || "To be confirmed by email" },
    { label: "What", value: formData.consultationWhat || "In-person assessment" },
  ]

  return (
    <div className="space-y-6 text-center py-8">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
          You&apos;re in. Your assessment is booked.
        </h2>

        <div className="space-y-4">
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
            You&apos;ll receive a confirmation email shortly with your booking details and a short prep checklist.
          </p>
          <div className="rounded-2xl border border-border bg-muted/30 p-6 max-w-md mx-auto text-left space-y-2">
            {assessmentSummary.map((item) => (
              <p key={item.label} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{item.label}:</span> {item.value}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border max-w-md mx-auto">
        <p className="text-sm text-muted-foreground mb-3">Questions before then?</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="tel:+15148269558"
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Phone className="w-4 h-4" />
            514 826 9558
          </a>
          <a
            href="mailto:mtlcaninetraining@gmail.com"
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Mail className="w-4 h-4" />
            mtlcaninetraining@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
