"use client"

import { cn } from "@/lib/utils"
import { ISSUE_OPTIONS } from "../constants"
import type { StepProps } from "../types"

export function StepIssue({ formData, updateFormData, onAutoAdvance }: StepProps) {
  const handleSelect = (value: string) => {
    updateFormData({
      issue: value,
      issueOther: "",
      followUps: {},
      goals: [],
      consultationDateTime: "",
      consultationSlotKey: "",
    })
    onAutoAdvance?.()
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Start here
        </p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          What&apos;s going on with your dog?
        </h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          Pick the closest match. We&apos;ll use this to ask the right follow-up questions and show the best trainer options.
        </p>
      </div>

      <div className="grid gap-3">
        {ISSUE_OPTIONS.map((option, index) => {
          const selected = formData.issue === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                "group w-full text-left rounded-2xl border p-4 md:p-5 transition-all duration-200",
                "bg-card/90 shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md"
                  : "border-border",
              )}
            >
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/50 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary",
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base md:text-lg font-semibold leading-snug text-foreground">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1 h-3 w-3 shrink-0 rounded-full border transition-colors",
                    selected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30 group-hover:border-primary/50",
                  )}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
