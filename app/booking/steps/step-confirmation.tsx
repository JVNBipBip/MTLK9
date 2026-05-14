"use client"

import { CheckCircle, Phone, Mail } from "lucide-react"
import { useAppLocale } from "@/components/locale-provider"
import { getIntlLocale } from "@/lib/i18n/config"
import { TORONTO_TIME_ZONE } from "@/lib/i18n/format"
import { bookingStepCopy } from "../translations"
import type { BookingFormData } from "../types"

export function StepConfirmation({
  formData,
  submissionKind,
}: {
  formData: BookingFormData
  submissionKind?: "inquiry" | null
}) {
  const locale = useAppLocale()
  const copy = bookingStepCopy[locale]
  const intlLocale = getIntlLocale(locale)
  const isInquiry = submissionKind === "inquiry"
  const consultationLocationFallback = "7770 Boul Henri-Bourassa E, Anjou, Montreal"
  const formattedConsultationDateTime = formData.consultationDateTime
    ? new Date(formData.consultationDateTime).toLocaleString(intlLocale, {
        timeZone: TORONTO_TIME_ZONE,
        dateStyle: "full",
        timeStyle: "short",
      })
    : copy.toBeConfirmed
  const assessmentSummary = isInquiry
    ? [
        {
          label: copy.when,
          value: copy.toBeConfirmed,
        },
        {
          label: copy.where,
          value: formData.consultationLocation || consultationLocationFallback,
        },
        {
          label: copy.what,
          value: locale === "fr" ? copy.inPersonAssessment : formData.consultationWhat || copy.inPersonAssessment,
        },
      ]
    : [
        { label: copy.when, value: formattedConsultationDateTime },
        { label: copy.where, value: formData.consultationLocation || copy.toBeConfirmed },
        {
          label: copy.what,
          value: locale === "fr" ? copy.inPersonAssessment : formData.consultationWhat || copy.inPersonAssessment,
        },
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
          {isInquiry ? copy.inquiryConfirmationTitle : copy.confirmationTitle}
        </h2>

        <div className="space-y-4">
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
            {isInquiry ? copy.inquiryConfirmationSubtitle : copy.confirmationSubtitle}
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
        <p className="text-sm text-muted-foreground mb-3">{copy.questionsBeforeThen}</p>
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
