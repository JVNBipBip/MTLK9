"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ISSUE_OPTIONS } from "../constants"
import type { StepProps } from "../types"

export function StepIssue({ formData, updateFormData, onAutoAdvance }: StepProps) {
  const handleSelect = (value: string) => {
    updateFormData({ issue: value, ...(value !== "something-else" && { issueOther: "" }) })
    if (value !== "something-else" && onAutoAdvance) {
      onAutoAdvance()
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          What&apos;s going on with your dog?
        </h2>
        <p className="text-sm text-muted-foreground">Select the option that best describes your situation.</p>
      </div>

      <div className="space-y-2">
        {ISSUE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "w-full text-left rounded-xl border p-3 md:p-4 transition-all duration-200",
              "hover:border-primary/40 hover:bg-primary/5",
              formData.issue === option.value
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card"
            )}
          >
            <span className="font-medium text-foreground">{option.label}</span>
            {option.description && (
              <span className="block text-sm text-muted-foreground mt-0.5">{option.description}</span>
            )}
          </button>
        ))}
      </div>

      {formData.issue === "something-else" && (
        <div className="pt-2">
          <Input
            placeholder="Tell us what's going on..."
            value={formData.issueOther}
            onChange={(e) => updateFormData({ issueOther: e.target.value })}
            className="rounded-xl h-12 text-base"
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
