export interface BookingFormData {
  issue: string
  issueOther: string
  followUps: Record<string, string>
  duration: string
  tried: string[]
  impact: string[]
  dogName: string
  dogBreed: string
  dogAge: string
  dogDuration: string
  dogSource: string
  goals: string[]
  connectMethod: string
  contactName: string
  contactEmail: string
  contactPhone: string
  contactBestTime: string
  contactNotes: string
  consultationDateTime: string
  consultationSlotKey: string
  consultationTeamMemberId: string
  consultationTeamMemberName: string
  consultationServiceVariationId: string
  consultationLocation: string
  consultationWhat: string
  fbclid: string
}

export type StepProps = {
  formData: BookingFormData
  updateFormData: (updates: Partial<BookingFormData>) => void
  onAutoAdvance?: () => void
}

export const INITIAL_FORM_DATA: BookingFormData = {
  issue: "",
  issueOther: "",
  followUps: {},
  duration: "",
  tried: [],
  impact: [],
  dogName: "",
  dogBreed: "",
  dogAge: "",
  dogDuration: "",
  dogSource: "",
  goals: [],
  connectMethod: "in-person-evaluation",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactBestTime: "",
  contactNotes: "",
  consultationDateTime: "",
  consultationSlotKey: "",
  consultationTeamMemberId: "",
  consultationTeamMemberName: "",
  consultationServiceVariationId: "",
  consultationLocation: "",
  consultationWhat: "In-person evaluation (60-75 minutes)",
  fbclid: "",
}
