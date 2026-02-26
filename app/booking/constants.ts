export const ISSUE_OPTIONS = [
  { value: "puppy-out-of-control", label: "My puppy is out of control", description: "Biting, jumping, not listening" },
  { value: "pulls-lunges-reacts", label: "My dog pulls, lunges, or reacts on walks", description: "" },
  { value: "anxiety-fear-separation", label: "My dog has anxiety, fear, or separation issues", description: "" },
  { value: "aggression-safety", label: "My dog has shown aggression or I have safety concerns", description: "" },
  { value: "better-obedience", label: "My dog is generally good but I want better obedience and off-leash reliability", description: "" },
  { value: "something-else", label: "Something else", description: "" },
]

export const DURATION_OPTIONS = [
  { value: "less-than-month", label: "Less than a month", description: "It's new" },
  { value: "1-6-months", label: "1–6 months", description: "" },
  { value: "6-12-months", label: "6–12 months", description: "" },
  { value: "over-a-year", label: "Over a year", description: "" },
  { value: "since-got-dog", label: "Since I got the dog", description: "" },
]

export const TRIED_OPTIONS = [
  { value: "youtube-articles", label: "Watched videos or read articles online" },
  { value: "different-trainer", label: "Tried a different trainer" },
  { value: "tools-equipment", label: "Bought tools or equipment" },
  { value: "talked-to-vet", label: "Talked to my vet" },
  { value: "nothing-yet", label: "Haven't tried anything yet" },
]

export const IMPACT_OPTIONS = [
  { value: "dread-walking", label: "I dread walking my dog" },
  { value: "avoid-areas", label: "I avoid certain dogs, people, or places" },
  { value: "cant-leave-alone", label: "My dog can't be left alone" },
  { value: "worried-about-safety", label: "I'm worried about someone getting hurt" },
  { value: "overwhelmed", label: "I'm feeling overwhelmed or exhausted" },
  { value: "thought-about-rehoming", label: "I've thought about rehoming my dog" },
]

export const DOG_AGE_OPTIONS = [
  { value: "under-6-months", label: "Under 6 months" },
  { value: "6-12-months", label: "6–12 months" },
  { value: "1-2-years", label: "1–2 years" },
  { value: "2-5-years", label: "2–5 years" },
  { value: "5-plus-years", label: "5+ years" },
]

export const DOG_DURATION_OPTIONS = [
  { value: "less-than-3-months", label: "Less than 3 months" },
  { value: "3-12-months", label: "3–12 months" },
  { value: "1-3-years", label: "1–3 years" },
  { value: "3-plus-years", label: "3+ years" },
]

export const DOG_SOURCE_OPTIONS = [
  { value: "breeder", label: "Breeder" },
  { value: "rescue-shelter", label: "Rescue or shelter" },
  { value: "rehomed", label: "Rehomed from another owner" },
  { value: "other", label: "Other" },
]

export const GOALS_OPTIONS = [
  { value: "calm-walks", label: "Calm, enjoyable walks" },
  { value: "around-dogs", label: "My dog can be around others without reacting" },
  { value: "left-alone", label: "My dog can be left alone safely" },
  { value: "off-leash", label: "Off-leash reliability" },
  { value: "feel-confident", label: "I want to feel confident handling my dog" },
]

export const BEST_TIME_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "no-preference", label: "No preference" },
]

// Internal routing logic for CRM tagging
export const ISSUE_SERVICE_MAP: Record<string, string> = {
  "puppy-out-of-control": "Puppy Foundations",
  "pulls-lunges-reacts": "City Manners / Reactivity",
  "anxiety-fear-separation": "Reactivity & Anxiety",
  "aggression-safety": "High-Risk Behaviors",
  "better-obedience": "City Manners",
  "something-else": "Manual Review",
}
