export interface BookingFormData {
  issue: string
  issueOther: string
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
}

export type StepProps = {
  formData: BookingFormData
  updateFormData: (updates: Partial<BookingFormData>) => void
  onAutoAdvance?: () => void
}

export const INITIAL_FORM_DATA: BookingFormData = {
  issue: "",
  issueOther: "",
  duration: "",
  tried: [],
  impact: [],
  dogName: "",
  dogBreed: "",
  dogAge: "",
  dogDuration: "",
  dogSource: "",
  goals: [],
  connectMethod: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactBestTime: "",
  contactNotes: "",
}
