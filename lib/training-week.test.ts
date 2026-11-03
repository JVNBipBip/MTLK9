import {
  trainingDay,
  trainerCanWork,
  groupSessionCanRun,
} from "./training-week";
import { trainingSlotStillAvailable } from "./training-slot-check";
import { retrieveSquareTeamMember, searchSquareAvailability } from "./square";
import { getNickTeamMemberIdForConsultation } from "./square-service-config";
jest.mock("./square", () => ({
  retrieveSquareTeamMember: jest.fn(),
  searchSquareAvailability: jest.fn(),
}));
jest.mock("./square-service-config", () => ({
  getNickTeamMemberIdForConsultation: jest.fn(),
}));
beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-28T14:00:00Z"));
});
afterEach(() => jest.restoreAllMocks());
it.each([
  ["2026-11-02T18:00:00Z", "closed"],
  ["2026-11-04T01:00:00Z", "closed"],
  ["2026-11-04T15:00:00-05:00", "weekday"],
  ["2026-11-07T02:00:00Z", "weekday"],
  ["2026-11-09T01:00:00Z", "weekend"],
  ["2026-07-01T03:30:00Z", "closed"],
  ["oops", "closed"],
])("uses Montréal time and DST: %s", (iso, day) =>
  expect(trainingDay(iso)).toBe(day),
);
it("allows Nick Wed–Fri; only Tyson/Mia can offer individual appointments on weekends", () => {
  const sun = "2026-11-08T16:00:00Z";
  for (const n of ["Nick", "Nicholas", "Mia", "Tyson"])
    expect(trainerCanWork("2026-11-06T18:00:00Z", n)).toBe(true);
  for (const n of ["Nick", "Nicolas", null, "unknown"])
    expect(trainerCanWork(sun, n)).toBe(false);
  for (const n of ["Mia Trainer", "Tyson"])
    expect(trainerCanWork(sun, n)).toBe(true);
  expect(trainerCanWork(sun, "Tyson", "nick-id", "nick-id")).toBe(false);
  expect(groupSessionCanRun({ startsAtIso: sun })).toBe(true);
  expect(
    groupSessionCanRun({ startsAtIso: sun, coachId: "nick-id" }, "nick-id"),
  ).toBe(false);
  expect(
    groupSessionCanRun({
      startsAtIso: "2026-11-03T12:00:00Z",
      coachLabel: "Mia",
    }),
  ).toBe(false);
});
it("rejects closed dates and spoofed weekend requests, and requires an exact remaining Square slot", async () => {
  const sunday = "2026-11-08T16:00:00Z";
  jest.mocked(getNickTeamMemberIdForConsultation).mockResolvedValue("nick");
  await expect(
    trainingSlotStillAvailable("2026-11-03T16:00:00Z", "svc", "mia"),
  ).resolves.toBe(false);
  jest.mocked(retrieveSquareTeamMember).mockResolvedValue("Mia");
  await expect(trainingSlotStillAvailable(sunday, "svc", "nick")).resolves.toBe(
    false,
  );
  expect(searchSquareAvailability).not.toHaveBeenCalled();
  jest
    .mocked(searchSquareAvailability)
    .mockResolvedValue({
      availabilities: [
        {
          start_at: sunday,
          appointment_segments: [{ team_member_id: "tyson" }],
        },
      ],
    });
  await expect(trainingSlotStillAvailable(sunday, "svc", "mia")).resolves.toBe(
    false,
  );
  jest
    .mocked(searchSquareAvailability)
    .mockResolvedValue({
      availabilities: [
        {
          start_at: sunday,
          appointment_segments: [
            { team_member_id: "mia", service_variation_id: "svc" },
          ],
        },
      ],
    });
  await expect(trainingSlotStillAvailable(sunday, "svc", "mia")).resolves.toBe(
    true,
  );
});
