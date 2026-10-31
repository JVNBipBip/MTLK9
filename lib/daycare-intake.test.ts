import { DAYCARE_FIELDS, daycareAnswerLabel, daycareFieldVisible, validateDaycareAnswers, type DaycareAnswers } from "./daycare-intake"

export function validDaycareAnswers(): DaycareAnswers {
  const answers: DaycareAnswers = {}
  for (const field of DAYCARE_FIELDS.filter(item => item.required)) answers[field.id] = field.kind === "checkbox" ? true : field.options?.[0].value || (field.kind === "email" ? "tester@example.com" : field.kind === "tel" ? "+15145550123" : "Test answer")
  return answers
}

describe("daycare questionnaire contract", () => {
  it("removes vet fields from new intake and strips stale submitted values", () => {
    expect(DAYCARE_FIELDS.map(field => field.id)).not.toEqual(expect.arrayContaining(["veterinarian", "vetPhone"]))
    const parsed = validateDaycareAnswers({ ...validDaycareAnswers(), veterinarian: "Old test clinic", vetPhone: "+15145550123" })
    expect(parsed.errors).toEqual([])
    expect(parsed.answers).not.toHaveProperty("veterinarian")
    expect(parsed.answers).not.toHaveProperty("vetPhone")
    expect(parsed.answers).toHaveProperty("emergencyPhone")
  })
  it("removes Jumping from new choices while still displaying historical answers", () => {
    const goals = DAYCARE_FIELDS.find(field => field.id === "goals")!
    expect(goals.options?.map(option => option.value)).not.toContain("jumping")
    expect(validateDaycareAnswers({ ...validDaycareAnswers(), service: "day-training", goals: ["jumping"] }).errors).toContain("goals")
    expect(daycareAnswerLabel(goals, ["jumping", "recall"], "en")).toBe("Jumping, Recall")
    expect(daycareAnswerLabel(goals, ["jumping", "recall"], "fr")).toBe("Sauts, Rappel")
  })
  it("covers all seven steps and accepts a complete application", () => {
    expect(new Set(DAYCARE_FIELDS.map(field => field.step)).size).toBe(7)
    expect(validateDaycareAnswers(validDaycareAnswers()).errors).toEqual([])
  })
  it.each(DAYCARE_FIELDS.filter(field => field.required && !field.when).map(field => field.id))("requires %s", id => {
    const answers = validDaycareAnswers(); delete answers[id]
    expect(validateDaycareAnswers(answers).errors).toContain(id)
  })
  it("strips hidden answers and unrecognized access/approval fields", () => {
    const parsed = validateDaycareAnswers({ ...validDaycareAnswers(), service: "daycare", medical: "no", goals: ["other"], otherGoal: "hidden", medicalDetails: "hidden", status: "approved", accessCode: "not-allowed" })
    for (const field of ["goals", "otherGoal", "medicalDetails", "status", "accessCode"]) expect(parsed.answers).not.toHaveProperty(field)
  })
  it("validates conditionally required quantities and optional multi-select values", () => {
    const answers = { ...validDaycareAnswers(), quantity: "other", otherAmount: "", service: "day-training", goals: ["invalid"] }
    expect(validateDaycareAnswers(answers).errors).toEqual(expect.arrayContaining(["otherAmount", "goals"]))
    expect(daycareFieldVisible(DAYCARE_FIELDS.find(f => f.id === "otherGoal")!, { ...answers, goals: ["other"] })).toBe(true)
  })
  it("rejects invalid email, phone, oversized values and false acknowledgements", () => {
    const checked = validateDaycareAnswers({ ...validDaycareAnswers(), ownerEmail: "not-an-email", ownerPhone: "123", breed: "x".repeat(255), acknowledged: "true" })
    expect(checked.errors).toEqual(expect.arrayContaining(["ownerEmail", "ownerPhone", "breed", "acknowledged"]))
  })
  it("validates a single step without requiring later answers", () => {
    expect(validateDaycareAnswers({ ownerName: "Test", ownerPhone: "+15145550123", ownerEmail: "TESTER@EXAMPLE.COM", addressStreet: "123 Test", addressCity: "Montreal", addressPostal: "H1E 1P2" }, 0)).toMatchObject({ errors: [], answers: { ownerEmail: "tester@example.com" } })
  })
})
