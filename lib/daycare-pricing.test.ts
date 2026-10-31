import { quoteDaycare, type DaycareAddOn, type DaycareStay, type DaycareVisits } from "./daycare-pricing"

describe("approved daycare pricing", () => {
  test.each([
    ["half", 1, 4000], ["full", 1, 5500],
    ["half", 5, 19000], ["full", 5, 26125],
    ["half", 10, 37200], ["full", 10, 51150],
    ["half", 20, 70400], ["full", 20, 96800],
  ])("%s-day, %i visits matches the client brief", (stay, visits, total) => {
    expect(quoteDaycare(stay as DaycareStay, [], visits as DaycareVisits).totalCents).toBe(total)
  })
  it("prices the full experience and applies bundle savings to add-ons too", () => {
    const addOns: DaycareAddOn[] = ["training", "treadmill", "individual"]
    expect(quoteDaycare("half", addOns, 1).totalCents).toBe(11500)
    expect(quoteDaycare("full", addOns, 1).totalCents).toBe(13000)
    expect(quoteDaycare("full", addOns, 20)).toMatchObject({ totalCents: 228800, savingsCents: 31200, perVisitCents: 11440 })
    expect(quoteDaycare("full", addOns, 20, true)).toMatchObject({ totalCents: 160160, bundleSavingsCents: 31200, secondDogSavingsCents: 68640 })
  })
  it("never double charges duplicate selections", () => {
    expect(quoteDaycare("half", ["training", "training"], 1).totalCents).toBe(8000)
  })
  it("rejects unsupported selections and inherited object keys", () => {
    expect(() => quoteDaycare("overnight" as DaycareStay, [], 1)).toThrow()
    expect(() => quoteDaycare("full", [], 30 as DaycareVisits)).toThrow()
    expect(() => quoteDaycare("full", ["constructor" as DaycareAddOn], 1)).toThrow()
    expect(() => quoteDaycare("constructor" as DaycareStay, [], 1)).toThrow()
  })
})
