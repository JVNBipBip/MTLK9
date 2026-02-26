"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { GOALS_OPTIONS } from "../constants"
import type { StepProps } from "../types"

export function StepGoals({ formData, updateFormData }: StepProps) {
  const toggle = (value: string) => {
    const current = formData.goals
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    updateFormData({ goals: updated })
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          What would success look like for you?
        </h2>
        <p className="text-sm text-muted-foreground">Check all that apply.</p>
      </div>

      <div className="space-y-2">
        {GOALS_OPTIONS.map((option) => {
          const selected = formData.goals.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={cn(
                "w-full text-left rounded-xl border p-3 md:p-4 transition-all duration-200 flex items-center gap-3",
                "hover:border-primary/40 hover:bg-primary/5",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                  selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                )}
              >
                {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
              <span className="font-medium text-foreground">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
