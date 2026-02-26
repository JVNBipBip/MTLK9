"use client"

import { CheckCircle, Phone, Mail } from "lucide-react"
import type { BookingFormData } from "../types"

export function StepConfirmation({ formData }: { formData: BookingFormData }) {
  const isDiscoveryCall = formData.connectMethod === "discovery-call"

  return (
    <div className="space-y-6 text-center py-8">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
          {isDiscoveryCall
            ? "You're in. Here's what happens next."
            : "You're in. Let's pick a time."}
        </h2>

        {isDiscoveryCall ? (
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
            We&apos;ll call you within 1 business day at the number you provided.
            In the meantime, don&apos;t stress — you just took the hardest step.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
              We&apos;ll send you a confirmation email with a short prep checklist
              so we can make the most of our time together.
            </p>
            {/* Placeholder for Calendly / scheduling widget */}
            <div className="rounded-2xl border border-border bg-muted/30 p-8 max-w-md mx-auto">
              <p className="text-sm text-muted-foreground">
                Calendar scheduling widget will be embedded here
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border max-w-md mx-auto">
        <p className="text-sm text-muted-foreground mb-3">Questions before then?</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="tel:+15145551234"
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Phone className="w-4 h-4" />
            (514) 555-1234
          </a>
          <a
            href="mailto:info@mtlcaninetraining.com"
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Mail className="w-4 h-4" />
            info@mtlcaninetraining.com
          </a>
        </div>
      </div>
    </div>
  )
}
