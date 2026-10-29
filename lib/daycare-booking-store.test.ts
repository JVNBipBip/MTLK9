import { daycareMemoryDb } from "./daycare-test-db";
import {
  changeDaycareBooking,
  daycareAccount,
  issueDaycareAccess,
  daycareHash,
} from "./daycare-booking-store";
import { torontoTime } from "./daycare-booking";
const now = Date.parse("2026-10-29T14:00:00Z"),
  slot = { date: "2026-11-02", arrival: "07:30", departure: "13:30" };
function fixture() {
  const { db, data } = daycareMemoryDb();
  const id = "a".repeat(64),
    passId = "pass-12345678";
  data.set(`daycare_applications/${id}`, {
    status: "approved",
    accessHash: "hash",
    answers: {
      dogName: "Test",
      ownerName: "Owner",
      ownerEmail: "owner@example.com",
    },
  });
  data.set(`daycare_passes/${passId}`, {
    applicationId: id,
    stay: "half",
    addOns: [],
    visits: 5,
    status: "paid",
    allocations: {},
  });
  const input = {
    applicationId: id,
    accessHash: "hash",
    passId,
    bookingId: "booking-12345",
    action: "book" as const,
    slot,
  };
  return { db, data, id, passId, input };
}
test("concurrent arrivals cannot oversell the15th dog, even across different passes", async () => {
  const f = fixture();
  f.data.set(`daycare_days/${slot.date}`, {
    occupants: Object.fromEntries(
      Array.from({ length: 14 }, (_, i) => [`other${i}`, `booking${i}`]),
    ),
  });
  f.data.set("daycare_applications/second", {
    ...f.data.get(`daycare_applications/${f.id}`),
  });
  f.data.set("daycare_passes/second-pass", {
    ...f.data.get(`daycare_passes/${f.passId}`),
    applicationId: "second",
  });
  const results = await Promise.allSettled([
    changeDaycareBooking(f.db, f.input, now),
    changeDaycareBooking(
      f.db,
      {
        ...f.input,
        applicationId: "second",
        passId: "second-pass",
        bookingId: "booking-22222",
      },
      now,
    ),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(
    Object.keys(f.data.get(`daycare_days/${slot.date}`).occupants),
  ).toHaveLength(15);
});
test("retrying a booking does not consume another credit; one dog cannot reserve twice", async () => {
  const f = fixture();
  await changeDaycareBooking(f.db, f.input, now);
  expect(await changeDaycareBooking(f.db, f.input, now)).toMatchObject({
    repeated: true,
  });
  expect(
    Object.keys(f.data.get(`daycare_passes/${f.passId}`).allocations),
  ).toHaveLength(1);
  await expect(
    changeDaycareBooking(f.db, { ...f.input, bookingId: "booking-22222" }, now),
  ).rejects.toThrow("already_booked");
});
test("timely cancellation restores credit, clears capacity and is idempotent", async () => {
  const f = fixture();
  await changeDaycareBooking(f.db, f.input, now);
  const cancel = { ...f.input, action: "cancel" as const };
  expect(await changeDaycareBooking(f.db, cancel, now)).toMatchObject({
    status: "cancelled",
  });
  expect(await changeDaycareBooking(f.db, cancel, now)).toMatchObject({
    repeated: true,
  });
  expect(f.data.get(`daycare_passes/${f.passId}`).firstVisitDate).toBeNull();
  expect(
    Object.keys(f.data.get(`daycare_days/${slot.date}`).occupants),
  ).toHaveLength(0);
});
test("late cancellation forfeits the credit and late rescheduling fails", async () => {
  const f = fixture();
  await changeDaycareBooking(f.db, f.input, now);
  const late = torontoTime(slot.date, slot.arrival) - 3600000;
  await expect(
    changeDaycareBooking(
      f.db,
      {
        ...f.input,
        action: "reschedule",
        slot: { ...slot, date: "2026-11-03" },
      },
      late,
    ),
  ).rejects.toThrow("late_reschedule");
  expect(
    await changeDaycareBooking(f.db, { ...f.input, action: "cancel" }, late),
  ).toMatchObject({ status: "forfeited" });
  expect(
    f.data.get(`daycare_passes/${f.passId}`).allocations[f.input.bookingId]
      .status,
  ).toBe("forfeited");
});
test("rescheduling transfers capacity atomically; a full destination keeps original reservation", async () => {
  const f = fixture();
  await changeDaycareBooking(f.db, f.input, now);
  f.data.set("daycare_days/2026-11-03", {
    occupants: Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => [`other${i}`, `b${i}`]),
    ),
  });
  await expect(
    changeDaycareBooking(
      f.db,
      {
        ...f.input,
        action: "reschedule",
        slot: { ...slot, date: "2026-11-03" },
      },
      now,
    ),
  ).rejects.toThrow("day_full");
  expect(f.data.get(`daycare_days/${slot.date}`).occupants[f.id]).toBe(
    f.input.bookingId,
  );
  f.data.set("daycare_days/2026-11-03", { occupants: {} });
  await changeDaycareBooking(
    f.db,
    { ...f.input, action: "reschedule", slot: { ...slot, date: "2026-11-03" } },
    now,
  );
  expect(
    Object.keys(f.data.get(`daycare_days/${slot.date}`).occupants),
  ).toHaveLength(0);
  expect(f.data.get("daycare_days/2026-11-03").occupants[f.id]).toBe(
    f.input.bookingId,
  );
});
test("pending payments, revoked access, foreign balances and test applications cannot book", async () => {
  for (const mutation of ["pending", "revoked", "foreign", "test"]) {
    const f = fixture();
    if (mutation === "pending")
      f.data.get(`daycare_passes/${f.passId}`).status = "pending";
    if (mutation === "revoked")
      f.data.get(`daycare_applications/${f.id}`).status = "revoked";
    if (mutation === "foreign")
      f.data.get(`daycare_passes/${f.passId}`).applicationId = "other";
    if (mutation === "test")
      f.data.get(`daycare_applications/${f.id}`).isTest = true;
    await expect(changeDaycareBooking(f.db, f.input, now)).rejects.toThrow();
    expect(f.data.has(`daycare_bookings/${f.input.bookingId}`)).toBe(false);
  }
});
test("access codes are hashed, reissuance invalidates old codes and revocation is checked", async () => {
  const f = fixture();
  const first = await issueDaycareAccess(f.db, f.id, "Nick");
  expect(JSON.stringify([...f.data])).not.toContain(first.token);
  expect(await daycareAccount(f.db, first.token)).toMatchObject({ id: f.id });
  const second = await issueDaycareAccess(f.db, f.id, "Nick");
  await expect(daycareAccount(f.db, first.token)).rejects.toThrow(
    "unauthorized",
  );
  expect(f.data.has(`daycare_access/${daycareHash(second.token)}`)).toBe(true);
  f.data.get(`daycare_applications/${f.id}`).status = "revoked";
  await expect(daycareAccount(f.db, second.token)).rejects.toThrow(
    "unauthorized",
  );
});
test("household discount requires an approved primary and cannot be given to a third dog", async () => {
  const f = fixture(),
    second = "b".repeat(64),
    third = "c".repeat(64);
  await issueDaycareAccess(f.db, f.id, "Nick");
  f.data.set(`daycare_applications/${second}`, {
    ...f.data.get(`daycare_applications/${f.id}`),
    accessHash: null,
  });
  f.data.set(`daycare_applications/${third}`, {
    ...f.data.get(`daycare_applications/${f.id}`),
    accessHash: null,
  });
  const code = await issueDaycareAccess(f.db, second, "Nick", f.id);
  expect(await daycareAccount(f.db, code.token)).toMatchObject({
    secondDog: true,
  });
  await expect(issueDaycareAccess(f.db, third, "Nick", f.id)).rejects.toThrow(
    "second_dog_already_set",
  );
});
