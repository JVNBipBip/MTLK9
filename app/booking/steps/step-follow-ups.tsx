"use client"

import { cn } from "@/lib/utils"
import { FOLLOW_UP_QUESTIONS_BY_ISSUE } from "../constants"
import type { StepProps } from "../types"

export function StepFollowUps({ formData, updateFormData }: StepProps) {
  const questions = FOLLOW_UP_QUESTIONS_BY_ISSUE[formData.issue] || []

  const setAnswer = (questionValue: string, answer: string) => {
    updateFormData({
      followUps: {
        ...formData.followUps,
        [questionValue]: answer,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-1">
          A few quick questions
        </h2>
        <p className="text-sm text-muted-foreground">
          These help us match you with the right trainer for your assessment.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question) => {
          const selected = formData.followUps[question.value] || ""
          const choices =
            question.kind === "yes-no"
              ? [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]
              : question.choices || []

          return (
            <div key={question.value} className="rounded-xl border border-border bg-card p-3 md:p-4 space-y-3">
              <p className="font-medium text-foreground">{question.label}</p>
              <div className="flex flex-wrap gap-2">
                {choices.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => setAnswer(question.value, choice.value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                      selected === choice.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40",
                    )}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
