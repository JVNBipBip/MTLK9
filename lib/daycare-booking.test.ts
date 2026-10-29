import {
  addDays,
  operatingDay,
  passBalance,
  torontoDate,
  torontoTime,
  validateSlot,
  validDate,
  type DaycarePass,
} from "./daycare-booking";
import { quoteDaycare } from "./daycare-pricing";
const now = Date.parse("2026-10-29T14:00:00Z");
const pass = { visits: 5, allocations: {} } as DaycarePass;
test("Toronto dates, DST offsets and invalid dates are handled explicitly", () => {
  expect(validDate("2026-02-30")).toBe(false);
  expect(validDate("2026-11-02")).toBe(true);
  expect(torontoDate(Date.parse("2026-11-02T01:00:00Z"))).toBe("2026-11-01");
  expect(new Date(torontoTime("2026-11-02", "07:30")).toISOString()).toBe(
    "2026-11-02T12:30:00.000Z",
  );
  expect(new Date(torontoTime("2027-03-15", "07:30")).toISOString()).toBe(
    "2027-03-15T11:30:00.000Z",
  );
  expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
});
test("only Mondays and Tuesdays after launch operate", () => {
  expect(operatingDay("2026-10-27")).toBe(false);
  expect(operatingDay("2026-11-01")).toBe(false);
  expect(operatingDay("2026-11-02")).toBe(true);
  expect(operatingDay("2026-11-03")).toBe(true);
  expect(operatingDay("2026-11-04")).toBe(false);
});
test("exactly six hours is half day, with strict opening hours and 24h cutoff", () => {
  const six = { date: "2026-11-02", arrival: "07:30", departure: "13:30" };
  expect(() => validateSlot(six, "half", now)).not.toThrow();
  expect(() => validateSlot(six, "full", now)).toThrow("stay_duration");
  expect(() =>
    validateSlot({ ...six, departure: "13:31" }, "half", now),
  ).toThrow("stay_duration");
  expect(() =>
    validateSlot({ ...six, departure: "18:30" }, "full", now),
  ).not.toThrow();
  expect(() =>
    validateSlot({ ...six, departure: "18:31" }, "full", now),
  ).toThrow("outside_hours");
  expect(() =>
    validateSlot(six, "half", torontoTime(six.date, six.arrival) - 86400000),
  ).not.toThrow();
  expect(() =>
    validateSlot(
      six,
      "half",
      torontoTime(six.date, six.arrival) - 86400000 + 1,
    ),
  ).toThrow("notice_24h");
});
test("bundles start at first visit, not purchase; early cancellation can move an unstarted anchor", () => {
  const allocations = {
    a: {
      date: "2026-11-02",
      arrival: "07:30",
      departure: "13:30",
      status: "booked" as const,
    },
    b: {
      date: "2026-11-09",
      arrival: "07:30",
      departure: "13:30",
      status: "booked" as const,
    },
  };
  expect(passBalance(pass, {}, now)).toMatchObject({
    remaining: 5,
    expiresOn: null,
  });
  expect(passBalance(pass, allocations, now)).toMatchObject({
    remaining: 3,
    firstVisitDate: "2026-11-02",
    expiresOn: "2026-11-29",
    lockedFirstVisitDate: null,
  });
  expect(
    passBalance(
      pass,
      { ...allocations, a: { ...allocations.a, status: "cancelled" } },
      now,
    ),
  ).toMatchObject({
    remaining: 4,
    firstVisitDate: "2026-11-09",
    expiresOn: "2026-12-06",
  });
  expect(
    passBalance(pass, allocations, Date.parse("2026-11-03T15:00:00Z"))
      .lockedFirstVisitDate,
  ).toBe("2026-11-02");
  expect(() =>
    passBalance(
      pass,
      { ...allocations, c: { ...allocations.a, date: "2026-11-30" } },
      now,
    ),
  ).toThrow("bundle_window");
});
test.each([
  [5, 27],
  [10, 48],
  [20, 83],
])("%i visits have the confirmed validity window", (visits, days) => {
  expect(
    passBalance(
      { ...pass, visits } as DaycarePass,
      {
        a: {
          date: "2026-11-02",
          arrival: "07:30",
          departure: "13:30",
          status: "booked",
        },
      },
      now,
    ).expiresOn,
  ).toBe(addDays("2026-11-02", days));
});
test("second dog receives additional30% after bundle savings on all selected services", () => {
  expect(quoteDaycare("full", [], 20, true).totalCents).toBe(67760);
  expect(
    quoteDaycare("full", [], 20).totalCents +
      quoteDaycare("full", [], 20, true).totalCents,
  ).toBe(164560);
  expect(
    quoteDaycare("full", ["training", "treadmill", "individual"], 20, true)
      .totalCents,
  ).toBe(154000);
  expect(quoteDaycare("half", [], 1, true).totalCents).toBe(2800);
});
