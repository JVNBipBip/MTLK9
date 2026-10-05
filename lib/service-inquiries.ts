export const serviceInterests = {
  "day-training": "Day Training Program",
  daycare: "Regular Daycare Program",
  "training-documentation-offer": "30% Training Documentation Offer",
} as const

export type ServiceInterest = keyof typeof serviceInterests

/** Keep the requested program in staff-visible notes even if the visitor edits their notes. */
export function serviceInquiryNotes(interest: ServiceInterest | undefined, notes: string): string {
  return interest ? `Requested program: ${serviceInterests[interest]}\n${notes}`.trim() : notes
}
