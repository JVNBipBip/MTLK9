import { lastBundleDay, parseDaycarePlan } from "./daycare-plan";
it.each([
  [5, "2026-12-06"],
  [10, "2026-12-27"],
  [20, "2027-01-31"],
] as const)(
  "anchors a %i-visit plan to the first visit, not purchase day",
  (visits, end) => {
    expect(lastBundleDay({ visits }, "2026-11-09")).toBe(end);
  },
);
it("never extends an existing bundle and validates an optional unpaid plan without reserving", () => {
  expect(
    lastBundleDay(
      { visits: 5, firstVisitDate: "2026-11-09", expiresOn: "2026-12-06" },
      "2026-11-17",
    ),
  ).toBe("2026-12-06");
  expect(parseDaycarePlan(undefined, 10)).toEqual([]);
  expect(
    parseDaycarePlan(["2026-11-10", "2026-11-09"], 5, "2026-11-01"),
  ).toEqual(["2026-11-09", "2026-11-10"]);
  for (const input of [
    ["2026-11-08"],
    ["2026-11-09", "2026-11-09"],
    ["2026-11-09", "2026-12-07"],
    ["2027-11-09"],
    ["2026-02-30"],
    "2026-11-09",
  ]) {
    expect(() => parseDaycarePlan(input, 5, "2026-11-01")).toThrow();
  }
});
