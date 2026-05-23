export const ISSUE_OPTIONS = [
  {
    value: "puppy-out-of-control",
    label: "Puppy training / Young dog training",
    description:
      "Need help with crate training, potty training, nipping, socialization, basic training, or other puppy-related behaviours.",
  },
  {
    value: "pulls-lunges-reacts",
    label: "Leash pulling, reactivity and overall obedience",
    description:
      "Walks are stressful; controlling my dog inside or outside the house is a struggle. Need help with overall obedience and behaviour.",
  },
  {
    value: "aggression-safety",
    label: "Aggression and severe behaviour problems",
    description:
      "Severe reactivity, biting, resource guarding, separation anxiety, or safety concerns inside or outside the house.",
  },
  {
    value: "better-obedience",
    label: "Improving obedience or off-leash reliability",
    description:
      "Your dog is generally good but you'd like to improve, do more advanced training, and take training to the next level.",
  },
  {
    value: "sport-training",
    label: "Sport training",
    description:
      "You'd like to start bite sports, agility, active obedience, or something fun with your dog.",
  },
]

export type FollowUpQuestion = {
  value: string
  label: string
  kind: "yes-no" | "single-choice"
  choices?: Array<{ value: string; label: string }>
}

/** Intake uses a single scenario step plus a combined contact step; extended Q&A removed. */
export const FOLLOW_UP_QUESTIONS_BY_ISSUE: Record<string, FollowUpQuestion[]> = {}

export const GOALS_OPTIONS_BY_ISSUE: Record<string, Array<{ value: string; label: string }>> = {}

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

export type IntakeQuestionAnswer = {
  questionKey: string
  questionLabel: string
  answer: string
  answerLabel: string
}

export function optionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => option.value === value)?.label || value
}

export function issueLabel(value: string) {
  return optionLabel(ISSUE_OPTIONS, value)
}

export function goalLabelsForIssue(issue: string, values: string[]) {
  const options = GOALS_OPTIONS_BY_ISSUE[issue] || []
  return values.map((value) => optionLabel(options, value)).filter(Boolean)
}

export function intakeResponsesForIssue(issue: string, followUps: Record<string, string>): IntakeQuestionAnswer[] {
  const questions = FOLLOW_UP_QUESTIONS_BY_ISSUE[issue] || []
  return questions
    .map((question) => {
      const answer = followUps[question.value]
      if (!answer) return null
      const choices =
        question.kind === "yes-no"
          ? [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]
          : question.choices || []
      return {
        questionKey: question.value,
        questionLabel: question.label,
        answer,
        answerLabel: optionLabel(choices, answer),
      }
    })
    .filter((response): response is IntakeQuestionAnswer => Boolean(response))
}

// Internal routing logic for CRM tagging
export const ISSUE_SERVICE_MAP: Record<string, string> = {
  "puppy-out-of-control": "Puppy Training",
  "pulls-lunges-reacts": "Reactivity Training",
  "aggression-safety": "Private Classes",
  "better-obedience": "Obedience Training",
  "sport-training": "Sport Training",
  /** @deprecated Removed from intake; kept for legacy records */
  "anxiety-fear-separation": "Private Classes",
  "something-else": "Manual Review",
}
