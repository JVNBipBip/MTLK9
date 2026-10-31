import { daycareMemoryDb } from "./daycare-test-db";
import { getAdminDb } from "./firebase-admin";
import { getSquareConfigAsync, squareRequest } from "./square";
import {
  createDaycareCheckout,
  daycareTaxIds,
  reconcileDaycarePass,
} from "./daycare-payments";
jest.mock("./firebase-admin", () => ({ getAdminDb: jest.fn() }));
jest.mock("./square", () => ({
  getSquareConfigAsync: jest.fn(),
  squareRequest: jest.fn(),
}));
let memory: ReturnType<typeof daycareMemoryDb>;
const account = {
  id: "a".repeat(64),
  accessHash: "hash",
  secondDog: false,
  locale: "en" as const,
};
const taxes = [
  {
    id: "gst",
    tax_data: {
      enabled: true,
      applies_to_custom_amounts: true,
      inclusion_type: "ADDITIVE",
      tax_type_id: "ca_gst",
      percentage: "5.0",
    },
  },
  {
    id: "qst",
    tax_data: {
      enabled: true,
      applies_to_custom_amounts: true,
      inclusion_type: "ADDITIVE",
      tax_type_id: "ca_qst",
      percentage: "9.975",
    },
  },
];
const input = {
  requestId: "55555555-1111-4444-9999-111111111111",
  stay: "half" as const,
  addOns: [],
  visits: 1 as const,
};
beforeEach(() => {
  jest.resetAllMocks();
  memory = daycareMemoryDb();
  jest.mocked(getAdminDb).mockReturnValue(memory.db);
  jest.mocked(getSquareConfigAsync).mockResolvedValue({
    locationId: "location",
    accessToken: "not-real",
    apiVersion: "test",
    baseUrl: "https://connect.squareupsandbox.com",
  });
  memory.data.set(`daycare_applications/${account.id}`, {
    status: "approved",
    accessHash: "hash",
    answers: { ownerEmail: "qa@example.com" },
  });
});
function checkoutMock() {
  jest.mocked(squareRequest).mockImplementation(async (path, init) => {
    if (path.startsWith("/v2/catalog")) return { objects: taxes } as any;
    if (path === "/v2/orders/calculate")
      return {
        order: { total_money: { amount: Math.round(JSON.parse(String(init.body)).order.line_items[0].base_price_money.amount * 1.14975), currency: "CAD" } },
      } as any;
    if (path === "/v2/online-checkout/payment-links")
      return {
        payment_link: {
          id: "link",
          order_id: "order",
          url: "https://sandbox.square.link/test",
        },
      } as any;
    throw new Error(`Unexpected test request ${path}`);
  });
}
test("checkout uses server prices, merchant taxes, stable idempotency and no PII in redirect", async () => {
  checkoutMock();
  const result = await createDaycareCheckout(account, input);
  expect(result.url).toBe("https://sandbox.square.link/test");
  const body = JSON.parse(
    String(
      jest
        .mocked(squareRequest)
        .mock.calls.find(([p]) => p === "/v2/online-checkout/payment-links")![1]
        .body,
    ),
  );
  expect(body.order.line_items[0].base_price_money).toEqual({
    amount: 4000,
    currency: "CAD",
  });
  expect(body.order.taxes).toHaveLength(2);
  expect(body.idempotency_key).toBe(result.id);
  expect(body.checkout_options.redirect_url).toBe(
    "https://www.mtlcaninetraining.com/en/daycare/book",
  );
  expect(memory.data.get(`daycare_passes/${result.id}`).status).toBe("pending");
  await createDaycareCheckout(account, input);
  expect(
    jest
      .mocked(squareRequest)
      .mock.calls.filter(([p]) => p.includes("payment-links")),
  ).toHaveLength(1);
  await expect(
    createDaycareCheckout(account, { ...input, stay: "full" }),
  ).rejects.toThrow("request_conflict");
});
test("new training purchases use $40 while existing checkout quotes retain their saved prices", async () => {
  checkoutMock();
  const trainingInput = { ...input, addOns: ["training" as const] };
  const result = await createDaycareCheckout(account, trainingInput);
  const pass = memory.data.get(`daycare_passes/${result.id}`);
  expect(pass.subtotalCents).toBe(8000);
  expect(pass.totalCents).toBe(9198);
  // Model an already-issued $35-training checkout: price changes must not rewrite its order.
  pass.subtotalCents = 7500;
  pass.totalCents = 8623;
  pass.order.line_items[0].base_price_money.amount = 7500;
  await createDaycareCheckout(account, trainingInput);
  expect(pass.subtotalCents).toBe(7500);
  expect(pass.totalCents).toBe(8623);
  expect(jest.mocked(squareRequest).mock.calls.filter(([path]) => path.includes("payment-links"))).toHaveLength(1);
});
test("missing or altered tax configuration fails closed", async () => {
  jest.mocked(squareRequest).mockResolvedValue({ objects: [taxes[0]] });
  await expect(daycareTaxIds()).rejects.toThrow("tax_configuration");
});
test("a refunded purchase cannot reuse its old checkout link", async () => {
  checkoutMock();
  const result = await createDaycareCheckout(account, input);
  memory.data.get(`daycare_passes/${result.id}`).status = "payment_review";
  await expect(createDaycareCheckout(account, input)).rejects.toThrow(
    "payment_required",
  );
});
function paymentFixture(
  options: {
    amount?: number;
    status?: string;
    refunded?: number;
    currency?: string;
    location?: string;
    reference?: string;
  } = {},
) {
  const id = `dc_${"a".repeat(36)}`;
  memory.data.set(`daycare_passes/${id}`, {
    applicationId: account.id,
    orderId: "order",
    totalCents: 4599,
    status: "pending",
    allocations: {},
  });
  jest.mocked(squareRequest).mockImplementation(async (path) =>
    path.startsWith("/v2/orders/")
      ? ({
          order: {
            id: "order",
            reference_id: options.reference || id,
            location_id: options.location || "location",
            total_money: {
              amount: 4599,
              currency: options.currency || "CAD",
            },
            tenders: [{ payment_id: "payment" }],
          },
        } as any)
      : ({
          payment: {
            id: "payment",
            order_id: "order",
            location_id: "location",
            status: options.status || "COMPLETED",
            amount_money: { amount: options.amount ?? 4599, currency: "CAD" },
            refunded_money: { amount: options.refunded || 0 },
          },
        } as any),
  );
  return id;
}
test("verified completed payment credits once; repeated webhooks never reset used visits", async () => {
  const id = paymentFixture();
  await reconcileDaycarePass(id);
  expect(memory.data.get(`daycare_passes/${id}`).status).toBe("paid");
  memory.data.get(`daycare_passes/${id}`).allocations = {
    b: { status: "booked" },
  };
  await reconcileDaycarePass(id);
  expect(memory.data.get(`daycare_passes/${id}`).allocations).toEqual({
    b: { status: "booked" },
  });
});
test.each([{ status: "APPROVED" }, { status: "FAILED" }, { amount: 4000 }])(
  "uncompleted/underpaid payments do not unlock credits: %p",
  async (options) => {
    const id = paymentFixture(options);
    await reconcileDaycarePass(id);
    expect(memory.data.get(`daycare_passes/${id}`).status).toBe("pending");
  },
);
test.each([
  { currency: "USD" },
  { location: "other" },
  { reference: "another-order" },
])("mismatched order fails closed: %p", async (options) => {
  const id = paymentFixture(options);
  await expect(reconcileDaycarePass(id)).rejects.toThrow("payment_mismatch");
});
test("refund detection blocks additional usage and flags existing bookings for staff", async () => {
  const id = paymentFixture({ refunded: 100 });
  await reconcileDaycarePass(id);
  expect(memory.data.get(`daycare_passes/${id}`).status).toBe("payment_review");
});
