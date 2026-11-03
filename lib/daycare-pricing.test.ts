import { quoteDaycare, type DaycareAddOn, type DaycareStay, type DaycareVisits } from "./daycare-pricing"

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
