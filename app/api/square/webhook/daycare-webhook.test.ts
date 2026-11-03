import { createHmac } from "node:crypto";
import { POST } from "./route";
import { getAdminDb } from "@/lib/firebase-admin";
import { reconcileDaycareWebhook } from "@/lib/daycare-payments";
import { DaycareError } from "@/lib/daycare-booking";
import { reconcileSquareBookingWebhook } from "@/lib/square-webhook-bookings";
jest.mock("@/lib/firebase-admin", () => ({ getAdminDb: jest.fn() }));
jest.mock("@/lib/daycare-payments", () => ({
  reconcileDaycareWebhook: jest.fn(),
}));
jest.mock("@/lib/class-sync-trigger", () => ({
  shouldTriggerClassSync: () => false,
}));
jest.mock("@/lib/square-webhook-bookings", () => ({
  reconcileSquareBookingWebhook: jest.fn(),
}));
const docs: any[] = [];
const url = "https://example.invalid/api/square/webhook?token=private-query";
const before = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
const payload = JSON.stringify({
  event_id: "test-event-id",
  type: "payment.updated",
  data: {
    object: {
      unused: "private@example.invalid",
      card_hint: "sensitive-body-only",
    },
  },
});
function request(body = payload, valid = true) {
  const sig = createHmac("sha256", "local-test-only")
    .update(url + body)
    .digest("base64");
  return new Request(url, {
    method: "POST",
    body,
    headers: {
      "x-square-hmacsha256-signature": valid ? sig : "invalid",
      "square-retry-number": "2",
    },
  });
}
beforeEach(() => {
  docs.length = 0;
  jest.resetAllMocks();
  process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = "local-test-only";
  jest.mocked(getAdminDb).mockReturnValue({
    collection: () => ({
      add: async (d: any) => {
        docs.push(d);
      },
    }),
  } as any);
  jest
    .mocked(reconcileSquareBookingWebhook)
    .mockResolvedValue({
      action: "skipped_non_lifecycle",
      clientEmail: "private@example.invalid",
      clientPhone: "5140000000",
    } as any);
  for (const k of ["info", "warn", "error"] as const)
    jest.spyOn(console, k).mockImplementation(() => {});
});
afterEach(() => {
  if (before === undefined) delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  else process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = before;
  try {
    expect(
      JSON.stringify([
        docs,
        ...(["info", "warn", "error"] as const).map(
          (k) => (console[k] as jest.Mock).mock.calls,
        ),
      ]),
    ).not.toMatch(
      /sensitive-body-only|private@example|private-query|5140000000|rawBodyPreview/,
    );
  } finally {
    jest.restoreAllMocks();
  }
});
it.each([
  "credited",
  "already_paid",
  "pending",
  "refund_review",
  "already_in_review",
  "not_daycare",
  "no_order",
] as const)(
  "records receipt before %s and safely acknowledges it",
  async (outcome) => {
    jest.mocked(reconcileDaycareWebhook).mockImplementation(async () => {
      expect(docs[0].stage).toBe("received");
      return outcome;
    });
    expect((await POST(request())).status).toBe(200);
    expect(docs[1]).toMatchObject({
      eventId: "test-event-id",
      stage: ["not_daycare", "no_order"].includes(outcome)
        ? "daycare_payment_skipped"
        : "daycare_payment_ok",
      details: { outcome, retryNumber: 2 },
    });
  },
);
it("persists the retryable reason before returning 503 without unlocking visits", async () => {
  jest
    .mocked(reconcileDaycareWebhook)
    .mockRejectedValue(new DaycareError("payment_mismatch", 503));
  expect((await POST(request())).status).toBe(503);
  expect(docs.map((d) => d.stage)).toEqual([
    "received",
    "daycare_payment_error",
  ]);
  expect(docs[1].details).toMatchObject({
    reason: "payment_mismatch",
    httpStatus: 503,
    retryable: true,
    retryNumber: 2,
  });
  expect(reconcileSquareBookingWebhook).not.toHaveBeenCalled();
});
it("does not process or store unsigned payloads or unparseable signed data", async () => {
  expect((await POST(request(payload, false))).status).toBe(401);
  await POST(request("private@example.invalid"));
  expect(docs.map((d) => d.stage)).toEqual([
    "signature_failed",
    "payload_parse_failed",
  ]);
  expect(reconcileDaycareWebhook).not.toHaveBeenCalled();
});
it("a logging outage cannot turn a successful event into a payment failure", async () => {
  jest.mocked(getAdminDb).mockReturnValue({
    collection: () => ({
      add: async () => {
        throw Error("store down");
      },
    }),
  } as any);
  jest.mocked(reconcileDaycareWebhook).mockResolvedValue("already_paid");
  expect((await POST(request())).status).toBe(200);
});
