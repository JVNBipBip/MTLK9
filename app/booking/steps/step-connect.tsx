"use client"

import { cn } from "@/lib/utils"
import { Phone, MapPin } from "lucide-react"
import type { StepProps } from "../types"

const CONNECT_OPTIONS = [
  {
    value: "discovery-call",
    icon: Phone,
    label: "Free 15-minute discovery call",
    description:
      "A quick phone call to talk through what's going on and figure out the right path. No cost, no commitment.",
  },
  {
    value: "in-person-evaluation",
    icon: MapPin,
    label: "In-person evaluation ($100)",
    description:
      "We meet you and your dog in the real world — a park, your street, your building — and do a full behavioral assessment. 60–75 minutes.",
  },
]

export function StepConnect({ formData, updateFormData, onAutoAdvance }: StepProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          How would you like to start?
        </h2>
      </div>

      <div className="space-y-3">
        {CONNECT_OPTIONS.map((option) => {
          const selected = formData.connectMethod === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => { updateFormData({ connectMethod: option.value }); onAutoAdvance?.() }}
              className={cn(
                "w-full text-left rounded-xl border p-4 md:p-5 transition-all duration-200",
                "hover:border-primary/40 hover:bg-primary/5",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <option.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-foreground text-lg block">{option.label}</span>
                  <span className="text-sm text-muted-foreground mt-1 block leading-relaxed">
                    {option.description}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
