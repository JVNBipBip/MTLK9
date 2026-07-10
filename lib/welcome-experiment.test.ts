import {
  assignWelcomeExperiment,
  parseWelcomeExperimentCookieHeader,
  parseWelcomeExperimentValue,
  serializeWelcomeExperiment,
} from "@/lib/welcome-experiment"

describe("welcome flow experiment", () => {
  it("reserves twenty percent of visitors as a holdout", () => {
    expect(assignWelcomeExperiment(0, 0.2)).toEqual({ cohort: "holdout", variant: null })
    expect(assignWelcomeExperiment(0.1999, 0.8)).toEqual({ cohort: "holdout", variant: null })
    expect(assignWelcomeExperiment(0.2, 0.2)).toEqual({ cohort: "treatment", variant: "a" })
    expect(assignWelcomeExperiment(0.9, 0.8)).toEqual({ cohort: "treatment", variant: "b" })
  })

  it("round-trips valid assignments and rejects malformed values", () => {
    expect(parseWelcomeExperimentValue(serializeWelcomeExperiment({ cohort: "holdout", variant: null }))).toEqual({
      cohort: "holdout",
      variant: null,
    })
    expect(parseWelcomeExperimentValue("treatment:b")).toEqual({ cohort: "treatment", variant: "b" })
    expect(parseWelcomeExperimentValue("treatment:c")).toBeNull()
  })

  it("reads the assignment from a cookie header", () => {
    expect(parseWelcomeExperimentCookieHeader("foo=bar; mtlk9_welcome_experiment=treatment%3Aa; theme=dark")).toEqual({
      cohort: "treatment",
      variant: "a",
    })
    expect(parseWelcomeExperimentCookieHeader("foo=bar")).toBeNull()
  })
})
