import type { BookingFormData } from "@/app/booking/types"
import {
  BEST_TIME_OPTIONS,
  DOG_AGE_OPTIONS,
  DOG_DURATION_OPTIONS,
  DOG_SOURCE_OPTIONS,
  DURATION_OPTIONS,
  GOALS_OPTIONS,
  IMPACT_OPTIONS,
  TRIED_OPTIONS,
  optionLabel,
} from "@/app/booking/constants"
import type { AppLocale } from "@/lib/i18n/config"

/** Marks the auto-generated block appended to Square customer notes. */
export const SQUARE_CUSTOMER_NOTE_AUTO_START = "--- MTL K9 ---"

/** Square customer note field limit (matches consultation deposit notes). */
export const SQUARE_CUSTOMER_NOTE_MAX_LENGTH = 900

export function parseStaffNoteFromSquareNote(full: string): string {
  const idx = full.indexOf(SQUARE_CUSTOMER_NOTE_AUTO_START)
  if (idx === -1) return full.trim()
  return full.slice(0, idx).trim()
}

export function composeSquareCustomerNote(staffNote: string, appendixLines: string[]): string {
  const staff = staffNote.trim()
  const appendix = appendixLines.map((line) => line.trim()).filter(Boolean)
  if (appendix.length === 0) {
    return staff.slice(0, SQUARE_CUSTOMER_NOTE_MAX_LENGTH)
  }
  const autoBlock = [SQUARE_CUSTOMER_NOTE_AUTO_START, ...appendix].join("\n")
  const combined = staff ? `${staff}\n\n${autoBlock}` : autoBlock
  return combined.slice(0, SQUARE_CUSTOMER_NOTE_MAX_LENGTH)
}

function joinLabels(values: string[], options: Array<{ value: string; label: string }>) {
  return values.map((value) => optionLabel(options, value)).filter(Boolean).join("; ")
}

function formatSubmittedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toISOString().slice(0, 19).replace("T", " ")
}

export type InquirySquareNoteInput = {
  formData: BookingFormData
  issueLabel: string
  goalLabels: string[]
  intakeResponseSummary: string
  locale: AppLocale
  preferredTrainerLabel?: string | null
  submittedAtIso: string
}

/** Build auto-appendix lines from a website consultation inquiry form submission. */
export function buildInquirySquareCustomerNoteAppendixLines(input: InquirySquareNoteInput): string[] {
  const { formData } = input
  const lines: string[] = []

  lines.push(`Website inquiry (${formatSubmittedAt(input.submittedAtIso)})`)

  const contactParts = [
    formData.contactName?.trim(),
    formData.contactEmail?.trim(),
    formData.contactPhone?.trim(),
    formData.contactBestTime
      ? `Best: ${optionLabel(BEST_TIME_OPTIONS, formData.contactBestTime)}`
      : null,
  ].filter(Boolean)
  if (contactParts.length > 0) lines.push(`Contact: ${contactParts.join(" | ")}`)

  const dogParts = [
    formData.dogName?.trim(),
    formData.dogBreed?.trim() ? `Breed: ${formData.dogBreed.trim()}` : null,
    formData.dogAge ? `Age: ${optionLabel(DOG_AGE_OPTIONS, formData.dogAge)}` : null,
    formData.dogDuration
      ? `With owner: ${optionLabel(DOG_DURATION_OPTIONS, formData.dogDuration)}`
      : null,
    formData.dogSource ? `From: ${optionLabel(DOG_SOURCE_OPTIONS, formData.dogSource)}` : null,
  ].filter(Boolean)
  if (dogParts.length > 0) lines.push(`Dog: ${dogParts.join(" | ")}`)

  const issue =
    input.issueLabel.trim() ||
    formData.issueOther.trim() ||
    formData.issue.trim()
  if (issue) lines.push(`Issue: ${issue}`)

  if (formData.duration) {
    lines.push(`Problem duration: ${optionLabel(DURATION_OPTIONS, formData.duration)}`)
  }

  const tried = joinLabels(formData.tried || [], TRIED_OPTIONS)
  if (tried) lines.push(`Tried: ${tried}`)

  const impact = joinLabels(formData.impact || [], IMPACT_OPTIONS)
  if (impact) lines.push(`Impact: ${impact}`)

  const goals =
    input.goalLabels.length > 0
      ? input.goalLabels.join("; ")
      : joinLabels(formData.goals || [], GOALS_OPTIONS)
  if (goals) lines.push(`Goals: ${goals}`)

  const intake = input.intakeResponseSummary.trim()
  if (intake) lines.push(`Intake: ${intake.replace(/\n/g, " | ")}`)

  const message = formData.contactNotes?.trim()
  if (message) lines.push(`Message: ${message}`)

  if (input.preferredTrainerLabel?.trim()) {
    lines.push(`Trainer pref: ${input.preferredTrainerLabel.trim()}`)
  }

  lines.push(`Language: ${input.locale === "fr" ? "French" : "English"}`)

  return lines
}
