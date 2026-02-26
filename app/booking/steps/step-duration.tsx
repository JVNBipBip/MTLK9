"use client"

import { cn } from "@/lib/utils"
import { DURATION_OPTIONS } from "../constants"
import type { StepProps } from "../types"

export function StepDuration({ formData, updateFormData, onAutoAdvance }: StepProps) {
  const handleSelect = (value: string) => {
    updateFormData({ duration: value })
    onAutoAdvance?.()
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          How long has this been going on?
        </h2>
      </div>

      <div className="space-y-2">
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "w-full text-left rounded-xl border p-3 md:p-4 transition-all duration-200",
              "hover:border-primary/40 hover:bg-primary/5",
              formData.duration === option.value
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card"
            )}
          >
            <span className="font-medium text-foreground">{option.label}</span>
            {option.description && (
              <span className="text-sm text-muted-foreground ml-2">({option.description})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
