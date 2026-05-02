export const ISSUE_OPTIONS = [
  {
    value: "puppy-out-of-control",
    label: "Puppy or young dog help",
    description: "Nipping, crying in the crate, jumping, socialization, or not listening.",
  },
  {
    value: "pulls-lunges-reacts",
    label: "Pulling, lunging, or reactivity",
    description: "Walks feel stressful, your dog reacts, or basic commands are hard outside.",
  },
  {
    value: "anxiety-fear-separation",
    label: "Anxiety, fear, or separation anxiety",
    description: "Your dog struggles being alone, around triggers, or in public places.",
  },
  {
    value: "aggression-safety",
    label: "Aggression or safety concerns",
    description: "Biting, resource guarding, or concerns around people, dogs, family, or the public.",
  },
  {
    value: "better-obedience",
    label: "Better obedience and off-leash reliability",
    description: "Your dog is generally good, but you want sharper listening in real life.",
  },
  {
    value: "sport-training",
    label: "Sport training",
    description: "Agility, bite sports, active obedience, or other structured sport work.",
  },
]

export type FollowUpQuestion = {
  value: string
  label: string
  kind: "yes-no" | "single-choice"
  choices?: Array<{ value: string; label: string }>
}

export const FOLLOW_UP_QUESTIONS_BY_ISSUE: Record<string, FollowUpQuestion[]> = {
  "puppy-out-of-control": [
    { value: "crate-trouble", label: "Is your puppy having trouble with their crate?", kind: "yes-no" },
    { value: "potty-mistakes", label: "Is your puppy making potty mistakes in the house?", kind: "yes-no" },
    {
      value: "trouble-in-and-out",
      label: "Is your puppy causing trouble in the house and outside the house?",
      kind: "yes-no",
    },
  ],
  "pulls-lunges-reacts": [
    { value: "reactive-to-humans", label: "My dog pulls, lunges, and is reactive to humans", kind: "yes-no" },
    { value: "reactive-to-dogs", label: "My dog pulls, lunges, and is reactive to dogs", kind: "yes-no" },
    { value: "social-with-humans", label: "Is your dog social with humans?", kind: "yes-no" },
    { value: "social-with-dogs", label: "Is your dog social with dogs?", kind: "yes-no" },
    { value: "bitten-or-nipped-human", label: "Has your dog ever bitten or nipped at a human?", kind: "yes-no" },
  ],
  "anxiety-fear-separation": [
    {
      value: "struggles-left-alone",
      label: "Are you struggling with your dog being left alone at the house?",
      kind: "yes-no",
    },
    { value: "stressed-by-dogs-people", label: "Is your dog stressed or worried about dogs or people?", kind: "yes-no" },
    { value: "trouble-public-places", label: "Are you having trouble bringing your dog to public places?", kind: "yes-no" },
  ],
  "aggression-safety": [
    { value: "bitten-human", label: "Has your dog bitten a human?", kind: "yes-no" },
    { value: "bitten-dog", label: "Has your dog bitten another dog?", kind: "yes-no" },
    {
      value: "resource-guarding-family-bite",
      label: "Has your dog bitten you or any family members due to resource guarding?",
      kind: "yes-no",
    },
    { value: "seen-another-trainer", label: "Have you gone to see another trainer in the past?", kind: "yes-no" },
  ],
  "better-obedience": [
    {
      value: "obedience-public-distractions",
      label: "Would you like to improve your dog's obedience in public or high distractions?",
      kind: "yes-no",
    },
    { value: "off-leash-training", label: "Would you like to begin off-leash training?", kind: "yes-no" },
    {
      value: "group-obedience-class",
      label: "Would you like to join a basic or advanced obedience group class?",
      kind: "yes-no",
    },
  ],
  "sport-training": [
    {
      value: "sport-interest",
      label: "Which sport are you interested in?",
      kind: "single-choice",
      choices: [
        { value: "agility", label: "Agility" },
        { value: "bite-sport", label: "Bite Sport" },
        { value: "active-obedience", label: "Active Obedience" },
      ],
    },
  ],
}

export const GOALS_OPTIONS_BY_ISSUE: Record<string, Array<{ value: string; label: string }>> = {
  "puppy-out-of-control": [
    { value: "puppy-calm-around-people-dogs", label: "My puppy can learn to be calm around people and dogs" },
    { value: "puppy-left-alone", label: "My dog can be left alone without any issues" },
    { value: "puppy-listens-anywhere", label: "My puppy listens regardless of which environment I bring them to" },
  ],
  "pulls-lunges-reacts": [
    { value: "neutral-around-humans-dogs", label: "I would like my dog to be neutral around humans and dogs" },
    { value: "join-group-class", label: "I would like to see my dog in a group class" },
    {
      value: "neutral-and-listens",
      label: "I would like my dog to be neutral around people and dogs, and listen to my commands",
    },
  ],
  "anxiety-fear-separation": [
    { value: "calm-confident-around-people-dogs", label: "My dog can learn to be calm and confident around people and dogs" },
    { value: "left-alone-without-issues", label: "My dog can be left alone without any issues" },
    { value: "neutral-around-triggers", label: "My dog can be neutral around their triggers" },
  ],
}

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
  "puppy-out-of-control": "Puppy Training",
  "pulls-lunges-reacts": "Reactivity Training",
  "anxiety-fear-separation": "Private Classes",
  "aggression-safety": "Private Classes",
  "better-obedience": "Obedience Training",
  "sport-training": "Sport Training",
  "something-else": "Manual Review",
}
