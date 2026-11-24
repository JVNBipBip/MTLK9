import { DAYCARE_PROMO, daycarePromoActive, quoteDaycare, type DaycareAddOn, type DaycareStay, type DaycareVisits } from "./daycare-pricing"

// Regular-price tests must not depend on whether today falls inside a sale.
beforeAll(() => { jest.useFakeTimers({ now: Date.parse("2026-11-03T12:00:00-05:00") }) })
afterAll(() => { jest.useRealTimers() })

describe("Black Friday 2026 daycare sale", () => {
  const at = (iso: string) => Date.parse(iso)
  it("runs Thursday 00:00 through Sunday 23:59 Montreal time", () => {
    expect(daycarePromoActive(at("2026-11-25T23:59:59-05:00"))).toBe(false)
    expect(daycarePromoActive(at("2026-11-26T00:00:00-05:00"))).toBe(true)
    expect(daycarePromoActive(at("2026-11-29T23:59:59-05:00"))).toBe(true)
    expect(daycarePromoActive(at("2026-11-30T00:00:00-05:00"))).toBe(false)
  })
  it("replaces the bundle discounts with 12/18/25% and keeps the regular price as compare-at", () => {
    const now = at("2026-11-27T10:00:00-05:00")
    expect(quoteDaycare("full", [], 1, false, now)).toMatchObject({ totalCents: 5500, promo: null })
    expect(quoteDaycare("full", [], 5, false, now)).toMatchObject({ discountPercent: 12, totalCents: 24200, standardTotalCents: 26125, promo: DAYCARE_PROMO.id })
    expect(quoteDaycare("full", [], 10, false, now)).toMatchObject({ discountPercent: 18, totalCents: 45100, standardTotalCents: 51150 })
    expect(quoteDaycare("full", [], 20, false, now)).toMatchObject({ discountPercent: 25, totalCents: 82500, standardTotalCents: 96800 })
    // Second-dog 30% still stacks after the bundle discount.
    expect(quoteDaycare("full", [], 20, true, now).totalCents).toBe(82500 - Math.round(82500 * 0.3))
  })
  it("goes back to regular pricing after the sale", () => {
    expect(quoteDaycare("full", [], 20, false, at("2026-11-30T00:00:00-05:00"))).toMatchObject({ discountPercent: 12, totalCents: 96800, standardTotalCents: 96800, promo: null })
  })
})

describe("approved daycare pricing", () => {
  it("matches all 128 combinations against Nick’s rates, bundle percentages and additional second-dog discount",()=>{
    for(const stay of ["half","full"] as const) for(let mask=0;mask<8;mask++) for(const visits of [1,5,10,20] as const) for(const second of [false,true]){
      const extras=(["training","treadmill","individual"] as const).filter((_,i)=>mask&(1<<i));
      const gross=((stay==="half"?4000:5500)+extras.reduce((sum,k)=>sum+({training:4000,treadmill:1500,individual:2000})[k],0))*visits;
      const bundle=gross-Math.round(gross*({1:0,5:5,10:7,20:12})[visits]/100);
      expect(quoteDaycare(stay,extras,visits,second).totalCents).toBe(bundle-(second?Math.round(bundle*0.30):0));
    }
  });
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
