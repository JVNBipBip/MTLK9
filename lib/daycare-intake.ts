/** Shared contract: keep identical in MTLK9-Admin/lib/daycare-intake.ts. */
export type DaycareLocale = "en" | "fr"
export type DaycareAnswers = Record<string, string | string[] | boolean>
type Copy = { en: string; fr: string }
type Option = Copy & { value: string }
export type DaycareField = {
  id: string; step: number; label: Copy; kind: "text" | "tel" | "email" | "radio" | "select" | "multi" | "checkbox"
  required?: boolean; options?: Option[]; maxLength?: number; autoComplete?: string
  when?: { field: string; values: string[] }
}
const copy = (en: string, fr: string): Copy => ({ en, fr })
const opts = (...rows: [string, string, string][]): Option[] => rows.map(([value, en, fr]) => ({ value, en, fr }))
const yesNo = opts(["yes", "Yes", "Oui"], ["no", "No", "Non"])
const unsure = [...yesNo, { value: "unsure", ...copy("Unsure", "Je ne sais pas") }]
const social = [...yesNo, { value: "depends", ...copy("Depends", "Ça dépend") }]
export const DAYCARE_STEPS: Copy[] = [copy("About you", "À propos de vous"), copy("Your dog", "Votre chien"), copy("Behaviour & comfort", "Comportement et confort"), copy("Their day", "Sa journée"), copy("Health & emergency", "Santé et urgence"), copy("Food & routine", "Repas et routine"), copy("Review & submit", "Vérifier et envoyer")]
export const DAYCARE_FIELDS: DaycareField[] = [
  { id: "ownerName", step: 0, label: copy("Full name", "Nom complet"), kind: "text", required: true, autoComplete: "name" },
  { id: "ownerPhone", step: 0, label: copy("Phone number", "Numéro de téléphone"), kind: "tel", required: true, autoComplete: "tel" },
  { id: "ownerEmail", step: 0, label: copy("Email address", "Adresse courriel"), kind: "email", required: true, autoComplete: "email" },
  { id: "addressStreet", step: 0, label: copy("Street address", "Adresse"), kind: "text", required: true, autoComplete: "street-address" },
  { id: "addressCity", step: 0, label: copy("City", "Ville"), kind: "text", required: true, autoComplete: "address-level2" },
  { id: "addressPostal", step: 0, label: copy("Postal code", "Code postal"), kind: "text", required: true, autoComplete: "postal-code", maxLength: 20 },
  { id: "dogName", step: 1, label: copy("Dog’s name", "Nom du chien"), kind: "text", required: true },
  { id: "age", step: 1, label: copy("Age", "Âge"), kind: "select", required: true, options: opts(["under-6-months", "Under 6 months", "Moins de 6 mois"], ["6-12-months", "6–12 months", "6 à 12 mois"], ["1-2-years", "1–2 years", "1 à 2 ans"], ["3-5-years", "3–5 years", "3 à 5 ans"], ["6-plus-years", "6+ years", "6 ans et plus"]) },
  { id: "breed", step: 1, label: copy("Breed / mix", "Race / croisement"), kind: "text", required: true },
  { id: "sex", step: 1, label: copy("Sex", "Sexe"), kind: "radio", required: true, options: opts(["male", "Male", "Mâle"], ["female", "Female", "Femelle"]) },
  { id: "reproductive", step: 1, label: copy("Reproductive status", "Statut reproductif"), kind: "radio", required: true, options: opts(["intact", "Intact", "Non stérilisé"], ["neutered", "Spayed / neutered", "Stérilisé"]) },
  { id: "crate", step: 1, label: copy("Comfortable resting in a crate?", "À l’aise pour se reposer dans une cage?"), kind: "radio", required: true, options: [...yesNo, { value: "in-progress", ...copy("In progress", "En apprentissage") }] },
  { id: "aggression", step: 2, label: copy("Has your dog ever shown aggression toward a person or another dog?", "Votre chien a-t-il déjà montré de l’agressivité envers une personne ou un chien?"), kind: "radio", required: true, options: unsure },
  { id: "people", step: 2, label: copy("Generally comfortable and social with people?", "Généralement à l’aise et sociable avec les gens?"), kind: "radio", required: true, options: social },
  { id: "dogs", step: 2, label: copy("Generally comfortable and social with other dogs?", "Généralement à l’aise et sociable avec les autres chiens?"), kind: "radio", required: true, options: social },
  { id: "service", step: 3, label: copy("Which service interests you?", "Quel service vous intéresse?"), kind: "radio", required: true, options: opts(["daycare", "Daycare", "Garderie"], ["day-training", "Day Training", "Entraînement de jour"], ["both", "Both / unsure", "Les deux / je ne sais pas"]) },
  { id: "stay", step: 3, label: copy("Preferred stay", "Durée souhaitée"), kind: "radio", required: true, options: opts(["half", "Half day", "Demi-journée"], ["full", "Full day", "Journée complète"], ["unsure", "Not sure yet", "Je ne sais pas encore"]) },
  { id: "goals", step: 3, label: copy("What would you like us to work on?", "Quels objectifs aimeriez-vous travailler?"), kind: "multi", when: { field: "service", values: ["day-training", "both"] }, options: opts(["leash", "Leash walking", "Marche en laisse"], ["recall", "Recall", "Rappel"], ["obedience", "Basic obedience", "Obéissance de base"], ["calmness", "Calmness / settling", "Calme et détente"], ["focus", "Engagement / focus", "Engagement et attention"], ["confidence", "Confidence", "Confiance"], ["other", "Other", "Autre"]) },
  { id: "otherGoal", step: 3, label: copy("Other goal (optional)", "Autre objectif (facultatif)"), kind: "text", when: { field: "goals", values: ["other"] }, maxLength: 500 },
  { id: "vaccinated", step: 4, label: copy("Vaccinations up to date?", "Vaccins à jour?"), kind: "radio", required: true, options: unsure },
  { id: "emergencyName", step: 4, label: copy("Emergency contact’s full name", "Nom complet du contact d’urgence"), kind: "text", required: true },
  { id: "emergencyPhone", step: 4, label: copy("Emergency contact’s phone", "Téléphone du contact d’urgence"), kind: "tel", required: true },
  { id: "emergencyRelationship", step: 4, label: copy("Relationship", "Lien avec cette personne"), kind: "radio", required: true, options: opts(["partner", "Partner / spouse", "Conjoint ou conjointe"], ["family", "Family", "Famille"], ["friend", "Friend", "Ami ou amie"], ["other", "Other", "Autre"]) },
  { id: "medical", step: 4, label: copy("Any medical conditions, allergies or medications?", "Problèmes de santé, allergies ou médicaments?"), kind: "radio", required: true, options: yesNo },
  { id: "medicalTypes", step: 4, label: copy("Select what applies", "Cochez ce qui s’applique"), kind: "multi", when: { field: "medical", values: ["yes"] }, options: opts(["condition", "Medical condition", "Problème de santé"], ["allergy", "Allergy", "Allergie"], ["medication", "Medication", "Médicament"], ["special-care", "Special care", "Soins particuliers"]) },
  { id: "medicalDetails", step: 4, label: copy("Details (optional)", "Précisions (facultatif)"), kind: "text", when: { field: "medical", values: ["yes"] }, maxLength: 1000 },
  { id: "foodType", step: 5, label: copy("Food type", "Type de nourriture"), kind: "radio", required: true, options: opts(["kibble", "Kibble", "Croquettes"], ["raw", "Raw food", "Nourriture crue"], ["other", "Other", "Autre"]) },
  { id: "quantity", step: 5, label: copy("Food per day", "Quantité de nourriture par jour"), kind: "select", required: true, options: opts(["less-than-1", "Less than 1", "Moins de 1"], ["1", "1", "1"], ["1.5", "1.5", "1,5"], ["2", "2", "2"], ["2.5", "2.5", "2,5"], ["3", "3", "3"], ["4", "4", "4"], ["5-plus", "5+", "5 et plus"], ["other", "Other amount", "Autre quantité"]) },
  { id: "otherAmount", step: 5, label: copy("Specify the daily amount", "Précisez la quantité par jour"), kind: "text", required: true, when: { field: "quantity", values: ["other"] }, maxLength: 50 },
  { id: "unit", step: 5, label: copy("Unit", "Unité"), kind: "select", required: true, options: opts(["cups", "Cups", "Tasses"], ["lb", "Pounds (lb)", "Livres (lb)"], ["g", "Grams (g)", "Grammes (g)"], ["oz", "Ounces (oz)", "Onces (oz)"]) },
  { id: "meals", step: 5, label: copy("Meals per day", "Repas par jour"), kind: "radio", required: true, options: opts(["1", "Once", "Une fois"], ["2", "Twice", "Deux fois"], ["3", "3 times", "3 fois"], ["4-plus", "4+ times", "4 fois ou plus"]) },
  { id: "acknowledged", step: 6, label: copy("I confirm the information is accurate and understand that submitting this form does not guarantee acceptance.", "Je confirme l’exactitude des renseignements et je comprends que l’envoi du formulaire ne garantit pas l’admission."), kind: "checkbox", required: true },
]

export function daycareFieldVisible(field: DaycareField, answers: DaycareAnswers): boolean {
  if (!field.when) return true
  const parent = DAYCARE_FIELDS.find(item => item.id === field.when!.field)
  if (parent && !daycareFieldVisible(parent, answers)) return false
  const value = answers[field.when.field]
  return field.when.values.some(item => Array.isArray(value) ? value.includes(item) : value === item)
}

export function validateDaycareAnswers(raw: unknown, step?: number): { answers: DaycareAnswers; errors: string[] } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { answers: {}, errors: ["ownerName"] }
  const input = raw as DaycareAnswers
  const answers: DaycareAnswers = {}
  const errors: string[] = []
  for (const field of DAYCARE_FIELDS) {
    if (!daycareFieldVisible(field, input) || (step !== undefined && field.step !== step)) continue
    const value = input[field.id]
    let valid = true
    if (field.kind === "checkbox") {
      valid = field.required ? value === true : typeof value === "boolean"
      answers[field.id] = value === true
    } else if (field.kind === "multi") {
      valid = value === undefined || (Array.isArray(value) && value.length <= (field.options?.length || 0) && value.every(v => typeof v === "string" && field.options?.some(o => o.value === v)))
      answers[field.id] = valid && Array.isArray(value) ? [...new Set(value)] : []
    } else {
      let text = typeof value === "string" ? value.trim() : ""
      valid = (value === undefined || typeof value === "string") && (!field.required || text.length > 0) && text.length <= (field.maxLength || 254) && !/[\u0000-\u001f\u007f]/.test(text)
      if (text && field.options) valid = valid && field.options.some(option => option.value === text)
      if (text && field.kind === "email") { text = text.toLowerCase(); valid = valid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) }
      if (text && field.kind === "tel") valid = valid && /^\+?[\d\s().-]+$/.test(text) && text.replace(/\D/g, "").length >= 8 && text.replace(/\D/g, "").length <= 15
      answers[field.id] = text
    }
    if (!valid) errors.push(field.id)
  }
  return { answers, errors }
}

export function daycareAnswerLabel(field: DaycareField, value: DaycareAnswers[string], locale: DaycareLocale): string {
  if (typeof value === "boolean") return value ? (locale === "fr" ? "Oui" : "Yes") : (locale === "fr" ? "Non" : "No")
  // Preserve readable historical answers without offering removed goals on new applications.
  const label = (v: string) => field.id === "goals" && v === "jumping" ? (locale === "fr" ? "Sauts" : "Jumping") : field.options?.find(option => option.value === v)?.[locale] || v
  return Array.isArray(value) ? value.map(label).join(", ") : label(value || "")
}
