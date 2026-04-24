import { intakeRequiresNickOnlyConsultation, NICK_ROUTING_IMPACT_VALUES } from "./consultation-routing"

describe("intakeRequiresNickOnlyConsultation", () => {
  it("returns true for aggression-safety issue", () => {
    expect(intakeRequiresNickOnlyConsultation("aggression-safety", [])).toBe(true)
    expect(intakeRequiresNickOnlyConsultation("aggression-safety", ["dread-walking"])).toBe(true)
  })

  it("returns true when impact includes worried-about-safety", () => {
    expect(intakeRequiresNickOnlyConsultation("pulls-lunges-reacts", ["worried-about-safety"])).toBe(true)
  })

  it("does not route to specialist for thought-about-rehoming alone", () => {
    expect(intakeRequiresNickOnlyConsultation("puppy-out-of-control", ["thought-about-rehoming"])).toBe(false)
    expect(intakeRequiresNickOnlyConsultation("pulls-lunges-reacts", ["thought-about-rehoming"])).toBe(false)
  })

  it("returns false for typical intake", () => {
    expect(intakeRequiresNickOnlyConsultation("pulls-lunges-reacts", ["dread-walking"])).toBe(false)
    expect(intakeRequiresNickOnlyConsultation("", [])).toBe(false)
  })

  it("documents impact constants used for routing", () => {
    expect(NICK_ROUTING_IMPACT_VALUES).toContain("worried-about-safety")
    expect(NICK_ROUTING_IMPACT_VALUES).not.toContain("thought-about-rehoming")
  })
})
