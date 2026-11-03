import { daycareMemoryDb } from "./daycare-test-db";
import { notifyDaycareItinerary } from "./daycare-itinerary-notification";
import { sendEmail, sendClientFacingEmail } from "./email";
jest.mock("./email", () => ({
  sendEmail: jest.fn(),
  sendClientFacingEmail: jest.fn(),
}));
function fixture() {
  const { db, data } = daycareMemoryDb();
  data.set("daycare_applications/dog", {
    locale: "fr",
    answers: { ownerEmail: "qa@example.invalid" },
  });
  const ids = Array.from({ length: 20 }, (_, i) => "qa-booking-" + i);
  for (const [i, id] of ids.entries())
    data.set("daycare_bookings/" + id, {
      applicationId: "dog",
      householdRequestId: "request",
      dogName: "Milo & co",
      ownerEmail: "qa@example.invalid",
      status: "booked",
      date: "2026-11-" + String(i + 1).padStart(2, "0"),
      arrival: "07:30",
      departure: "13:30",
      updatedAtIso: "v1",
      createdAtIso: "v1",
      notificationStatus: "pending",
    });
  return { db, data, ids };
}
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(sendClientFacingEmail).mockResolvedValue({ sent: true } as any);
  jest.mocked(sendEmail).mockResolvedValue({ sent: true } as any);
});
it("sends one bilingual itinerary per recipient, even on retries, tracking each visit’s version", async () => {
  const f = fixture();
  await notifyDaycareItinerary(f.db, f.ids);
  await notifyDaycareItinerary(f.db, f.ids);
  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(sendClientFacingEmail).toHaveBeenCalledTimes(1);
  expect(sendClientFacingEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "qa@example.invalid",
      subject: "Vos visites en garderie sont confirmées",
      html: expect.stringContaining("Milo &amp; co"),
    }),
  );
  for (const id of f.ids)
    expect(f.data.get("daycare_bookings/" + id)).toMatchObject({
      notificationStatus: "sent",
      customerNotifiedVersion: "v1",
      staffNotifiedVersion: "v1",
    });
});
it("retries failed staff delivery without resending to the owner or reporting an already changed date", async () => {
  const f = fixture();
  jest.mocked(sendEmail).mockRejectedValueOnce(Error("smtp down"));
  await notifyDaycareItinerary(f.db, f.ids);
  expect(f.data.get("daycare_bookings/" + f.ids[0]).notificationStatus).toBe(
    "failed",
  );
  f.data.get("daycare_bookings/" + f.ids[0]).updatedAtIso = "v2";
  await notifyDaycareItinerary(f.db, f.ids);
  expect(sendEmail).toHaveBeenCalledTimes(2);
  expect(sendClientFacingEmail).toHaveBeenCalledTimes(1);
  expect(jest.mocked(sendEmail).mock.calls[1][0].html).not.toContain(
    "2026-11-01",
  );
});
it("never combines unrelated bookings or sends to a changed household address", async () => {
  const f = fixture();
  const row = f.data.get("daycare_bookings/" + f.ids[1]);
  row.householdRequestId = "another";
  await notifyDaycareItinerary(f.db, f.ids);
  row.householdRequestId = "request";
  row.ownerEmail = "other@example.invalid";
  await notifyDaycareItinerary(f.db, f.ids);
  expect(sendEmail).not.toHaveBeenCalled();
  expect(sendClientFacingEmail).not.toHaveBeenCalled();
});
