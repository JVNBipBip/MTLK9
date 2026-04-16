import { intakeRequiresNickOnlyConsultation, NICK_ROUTING_IMPACT_VALUES } from "./consultation-routing"

describe("intakeRequiresNickOnlyConsultation", () => {
  it("returns true for aggression-safety issue", () => {
    expect(intakeRequiresNickOnlyConsultation("aggression-safety", [])).toBe(true)
    expect(intakeRequiresNickOnlyConsultation("aggression-safety", ["dread-walking"])).toBe(true)
  })

  it("returns true when impact includes worried-about-safety", () => {
    expect(intakeRequiresNickOnlyConsultation("pulls-lunges-reacts", ["worried-about-safety"])).toBe(true)
  })

  it("returns true when impact includes thought-about-rehoming", () => {
    expect(intakeRequiresNickOnlyConsultation("puppy-out-of-control", ["thought-about-rehoming"])).toBe(true)
  })

  it("returns false for typical intake", () => {
    expect(intakeRequiresNickOnlyConsultation("pulls-lunges-reacts", ["dread-walking"])).toBe(false)
    expect(intakeRequiresNickOnlyConsultation("", [])).toBe(false)
  })

  it("documents impact constants used for routing", () => {
    expect(NICK_ROUTING_IMPACT_VALUES).toContain("worried-about-safety")
    expect(NICK_ROUTING_IMPACT_VALUES).toContain("thought-about-rehoming")
  })
})
