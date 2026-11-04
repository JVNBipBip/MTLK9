import { daycareMemoryDb } from "./daycare-test-db";
import { sendDaycareReminders } from "./daycare-reminder-notification";
import { sendClientFacingEmail } from "./email";
jest.mock("./email", () => ({
  sendEmail: jest.fn(),
  sendClientFacingEmail: jest.fn(),
}));
// 06:00 in Montréal on Tuesday 2026-11-03, so reminders cover Thursday 2026-11-05.
const now = Date.parse("2026-11-03T11:00:00Z");
function fixture() {
  const { db, data } = daycareMemoryDb();
  const app = (locale: string, ownerEmail: string, isTest = false) => ({
    locale,
    isTest,
    answers: { ownerEmail },
  });
  data.set("daycare_applications/milo", app("fr", "qa@example.invalid"));
  data.set("daycare_applications/luna", app("fr", "QA@example.invalid"));
  data.set("daycare_applications/rex", app("en", "rex@example.invalid"));
  data.set("daycare_applications/demo", app("en", "demo@example.invalid", true));
  const booking = (id: string, values: Record<string, unknown>) =>
    data.set("daycare_bookings/" + id, {
      status: "booked",
      date: "2026-11-05",
      arrival: "08:00",
      departure: "13:30",
      updatedAtIso: "v1",
      ...values,
    });
  booking("milo-thu", {
    applicationId: "milo",
    dogName: "Milo & co",
    ownerEmail: "qa@example.invalid",
    arrival: "09:00",
    departure: "18:30",
  });
  booking("luna-thu", {
    applicationId: "luna",
    dogName: "Luna",
    ownerEmail: "qa@example.invalid",
  });
  booking("milo-fri", {
    applicationId: "milo",
    dogName: "Milo & co",
    ownerEmail: "qa@example.invalid",
    date: "2026-11-06",
  });
  booking("rex-thu", {
    applicationId: "rex",
    dogName: "Rex",
    ownerEmail: "rex@example.invalid",
    status: "cancelled",
  });
  booking("demo-thu", {
    applicationId: "demo",
    dogName: "Demo",
    ownerEmail: "demo@example.invalid",
  });
  return { db, data };
}
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(sendClientFacingEmail).mockResolvedValue({ sent: true } as any);
});
it("sends one reminder per household two days ahead, once, with the free-change deadline", async () => {
  const f = fixture();
  expect(await sendDaycareReminders(f.db, now)).toEqual({
    date: "2026-11-05",
    sent: 1,
    failed: 0,
  });
  await sendDaycareReminders(f.db, now);
  expect(sendClientFacingEmail).toHaveBeenCalledTimes(1);
  const email = jest.mocked(sendClientFacingEmail).mock.calls[0][0];
  expect(email).toMatchObject({
    to: "qa@example.invalid",
    subject: "Rappel : garderie le jeudi 5 novembre",
  });
  expect(email.html).toContain("Milo &amp; co · 09:00–18:30");
  expect(email.html).toContain("Luna · 08:00–13:30");
  expect(email.html).toContain("avant le mercredi 4 novembre à 08:00");
  for (const id of ["milo-thu", "luna-thu"])
    expect(f.data.get("daycare_bookings/" + id)).toMatchObject({
      reminderStatus: "sent",
      reminderSentFor: "2026-11-05",
    });
  expect(f.data.get("daycare_bookings/milo-fri").reminderStatus).toBeUndefined();
});
it("keeps a failed reminder retryable and never marks a booking changed mid-send", async () => {
  const f = fixture();
  jest.mocked(sendClientFacingEmail).mockImplementationOnce(async () => {
    // A reschedule rewrites the booking while the email is in flight.
    f.data.set("daycare_bookings/luna-thu", {
      ...f.data.get("daycare_bookings/luna-thu"),
      reminderAttemptAt: undefined,
      reminderStatus: undefined,
      date: "2026-11-07",
    });
    return { sent: false } as any;
  });
  expect(await sendDaycareReminders(f.db, now)).toMatchObject({ failed: 1 });
  expect(f.data.get("daycare_bookings/milo-thu")).toMatchObject({
    reminderStatus: "failed",
  });
  expect(f.data.get("daycare_bookings/milo-thu").reminderSentFor).toBeUndefined();
  expect(f.data.get("daycare_bookings/luna-thu").reminderStatus).toBeUndefined();
  expect(await sendDaycareReminders(f.db, now)).toMatchObject({ sent: 1 });
  expect(jest.mocked(sendClientFacingEmail).mock.calls[1][0].html).not.toContain(
    "Luna",
  );
});
