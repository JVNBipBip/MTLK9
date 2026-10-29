import { getSquareConfigAsync, squareRequest } from "./square";
import { getAdminDb } from "./firebase-admin";
import { DaycareError, type DaycarePass } from "./daycare-booking";
import { daycareHash } from "./daycare-booking-store";
import {
  quoteDaycare,
  type DaycareAddOn,
  type DaycareStay,
  type DaycareVisits,
} from "./daycare-pricing";

type Tax = {
  id: string;
  tax_data?: {
    enabled?: boolean;
    applies_to_custom_amounts?: boolean;
    inclusion_type?: string;
    tax_type_id?: string;
    percentage?: string;
  };
};
export async function daycareTaxIds() {
  const taxes: Tax[] = [];
  let cursor: string | undefined;
  do {
    const page = await squareRequest<{ objects?: Tax[]; cursor?: string }>(
      `/v2/catalog/list?types=TAX${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      { method: "GET" },
    );
    taxes.push(...(page.objects || []));
    cursor = page.cursor;
  } while (cursor);
  const active = taxes.filter(
    (t) =>
      t.tax_data?.enabled &&
      t.tax_data.applies_to_custom_amounts &&
      t.tax_data.inclusion_type === "ADDITIVE",
  );
  // Fail closed if the merchant's verified Quebec tax configuration changes.
  if (
    active.length !== 2 ||
    !active.some(
      (t) =>
        t.tax_data?.tax_type_id === "ca_gst" &&
        Number(t.tax_data.percentage) === 5,
    ) ||
    !active.some(
      (t) =>
        t.tax_data?.tax_type_id === "ca_qst" &&
        Number(t.tax_data.percentage) === 9.975,
    )
  )
    throw new DaycareError("tax_configuration", 503);
  return active.map((t) => t.id);
}
export async function createDaycareCheckout(
  account: {
    id: string;
    accessHash: string;
    secondDog: boolean;
    locale: "en" | "fr";
  },
  input: {
    requestId: string;
    stay: DaycareStay;
    addOns: DaycareAddOn[];
    visits: DaycareVisits;
  },
) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      input.requestId,
    )
  )
    throw new DaycareError("invalid_request");
  const quote = quoteDaycare(
    input.stay,
    input.addOns,
    input.visits,
    account.secondDog,
  );
  const id = `dc_${daycareHash(`${account.id}:${input.requestId}`).slice(0, 36)}`,
    db = getAdminDb(),
    ref = db.collection("daycare_passes").doc(id);
  const existing = await ref.get();
  if (existing.exists && existing.data()?.applicationId !== account.id)
    throw new DaycareError("request_conflict", 409);
  if (
    existing.exists &&
    (existing.data()?.stay !== input.stay ||
      existing.data()?.visits !== input.visits ||
      JSON.stringify(existing.data()?.addOns) !==
        JSON.stringify([...new Set(input.addOns)].sort()))
  )
    throw new DaycareError("request_conflict", 409);
  if (existing.data()?.status === "paid") return { id, paid: true };
  if (existing.exists && existing.data()?.status !== "pending")
    throw new DaycareError("payment_required", 409);
  if (existing.data()?.checkoutUrl)
    return { id, url: existing.data()!.checkoutUrl };
  const config = await getSquareConfigAsync();
  if (!existing.exists) {
    const taxIds = await daycareTaxIds();
    const order = {
      location_id: config.locationId,
      reference_id: id,
      line_items: [
        {
          name: `Daycare · ${input.stay === "half" ? "Half day" : "Full day"} · ${input.visits} visit(s)${input.addOns.length ? ` · ${input.addOns.join(", ")}` : ""}${account.secondDog ? " · second dog 30%" : ""}`,
          quantity: "1",
          base_price_money: { amount: quote.totalCents, currency: "CAD" },
        },
      ],
      taxes: taxIds.map((catalog_object_id, i) => ({
        uid: `tax-${i}`,
        catalog_object_id,
        scope: "ORDER",
      })),
      pricing_options: { auto_apply_discounts: false, auto_apply_taxes: false },
    };
    const calculated = await squareRequest<{
      order?: { total_money?: { amount?: number; currency?: string } };
    }>("/v2/orders/calculate", {
      method: "POST",
      body: JSON.stringify({ order }),
    });
    const totalCents = Number(calculated.order?.total_money?.amount);
    if (
      !Number.isSafeInteger(totalCents) ||
      totalCents <= quote.totalCents ||
      calculated.order?.total_money?.currency !== "CAD"
    )
      throw new DaycareError("tax_configuration", 503);
    await db.runTransaction(async (tx) => {
      const [pass, app] = await Promise.all([
        tx.get(ref),
        tx.get(db.collection("daycare_applications").doc(account.id)),
      ]);
      const data = app.data();
      if (
        !data ||
        data.isTest ||
        data.status !== "approved" ||
        data.accessHash !== account.accessHash
      )
        throw new DaycareError("unauthorized", 401);
      if (
        pass.exists &&
        (pass.data()?.applicationId !== account.id ||
          pass.data()?.stay !== input.stay ||
          pass.data()?.visits !== input.visits ||
          JSON.stringify(pass.data()?.addOns) !==
            JSON.stringify([...new Set(input.addOns)].sort()))
      )
        throw new DaycareError("request_conflict", 409);
      if (!!data.secondDogOf !== account.secondDog)
        throw new DaycareError("account_changed", 409);
      if (data.secondDogOf) {
        const primary = (
          await tx.get(
            db.collection("daycare_applications").doc(data.secondDogOf),
          )
        ).data();
        if (!primary || primary.status !== "approved" || primary.isTest)
          throw new DaycareError("household_review", 409);
      }
      if (!pass.exists)
        tx.create(ref, {
          id,
          applicationId: account.id,
          stay: input.stay,
          addOns: [...new Set(input.addOns)].sort(),
          visits: input.visits,
          secondDog: account.secondDog,
          subtotalCents: quote.totalCents,
          totalCents,
          order,
          status: "pending",
          allocations: {},
          createdAtIso: new Date().toISOString(),
          locale: account.locale,
        });
    });
  }
  const pass = (await ref.get()).data()!;
  // Both the payload and idempotency key survive retries and process restarts.
  const link = await squareRequest<{
    payment_link?: { id?: string; order_id?: string; url?: string };
  }>("/v2/online-checkout/payment-links", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: id,
      order: pass.order,
      checkout_options: {
        redirect_url: `https://www.mtlcaninetraining.com/${pass.locale}/daycare/book`,
        allow_tipping: false,
        ask_for_shipping_address: false,
      },
    }),
  });
  const paymentLink = link.payment_link;
  if (!paymentLink?.id || !paymentLink.order_id || !paymentLink.url)
    throw new DaycareError("checkout_unavailable", 503);
  await ref.update({
    paymentLinkId: paymentLink.id,
    orderId: paymentLink.order_id,
    checkoutUrl: paymentLink.url,
  });
  return { id, url: paymentLink.url };
}

/** Fetches Square, never trusts the return URL or a browser-supplied paid flag. */
export async function reconcileDaycarePass(id: string) {
  if (!/^dc_[a-f0-9-]{36}$/.test(id)) return;
  const db = getAdminDb(),
    ref = db.collection("daycare_passes").doc(id);
  const data = (await ref.get()).data() as DaycarePass | undefined;
  if (!data?.orderId) return;
  const config = await getSquareConfigAsync();
  const response = await squareRequest<{
    order?: {
      id?: string;
      reference_id?: string;
      location_id?: string;
      state?: string;
      total_money?: { amount?: number; currency?: string };
      tenders?: { payment_id?: string }[];
    };
  }>(`/v2/orders/${encodeURIComponent(data.orderId)}`, { method: "GET" });
  const order = response.order;
  if (
    !order ||
    order.reference_id !== id ||
    order.location_id !== config.locationId ||
    order.total_money?.currency !== "CAD" ||
    Number(order.total_money.amount) !== data.totalCents
  )
    throw new DaycareError("payment_mismatch", 503);
  const paymentIds = [
    ...new Set((order.tenders || []).map((t) => t.payment_id).filter(Boolean)),
  ] as string[];
  if (!paymentIds.length) return;
  const payments = await Promise.all(
    paymentIds.map(async (paymentId) => {
      const result = await squareRequest<{
        payment?: {
          id?: string;
          order_id?: string;
          location_id?: string;
          status?: string;
          amount_money?: { amount?: number; currency?: string };
          refunded_money?: { amount?: number };
        };
      }>(`/v2/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });
      return result.payment;
    }),
  );
  const refunded = payments.some(
    (p) => Number(p?.refunded_money?.amount || 0) > 0,
  );
  const paid =
    payments.every(
      (p) =>
        p?.status === "COMPLETED" &&
        p.order_id === data.orderId &&
        p.location_id === config.locationId &&
        p.amount_money?.currency === "CAD",
    ) &&
    payments.reduce(
      (sum, p) => sum + Number(p?.amount_money?.amount || 0),
      0,
    ) === data.totalCents;
  if (!paid && !refunded) return;
  await db.runTransaction(async (tx) => {
    const current = (await tx.get(ref)).data();
    if (!current || current.orderId !== data.orderId)
      throw new DaycareError("payment_mismatch", 503);
    if (refunded)
      tx.update(ref, {
        status: "payment_review",
        paymentIssue: "Square refund detected; review existing reservations.",
        updatedAtIso: new Date().toISOString(),
      });
    else if (current.status === "pending")
      tx.update(ref, {
        status: "paid",
        paidAtIso: new Date().toISOString(),
        paymentIds,
      });
  });
}

export async function reconcileDaycareWebhook(payload: any) {
  const object = payload?.data?.object;
  const orderId =
    object?.payment?.order_id ||
    object?.order?.id ||
    object?.order_updated?.order_id ||
    object?.refund?.order_id;
  if (!orderId || typeof orderId !== "string") return;
  const matches = await getAdminDb()
    .collection("daycare_passes")
    .where("orderId", "==", orderId)
    .limit(1)
    .get();
  if (!matches.empty) await reconcileDaycarePass(matches.docs[0].id);
}
