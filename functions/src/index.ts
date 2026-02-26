import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const IN_PERSON_EVALUATION_CENTS = 10000;
const IN_PERSON_CURRENCY = "cad";
const BOOKING_COLLECTIONS = ["bookings_discovery_calls", "bookings_in_person_evaluations"] as const;

type CreatePaymentIntentPayload = {
  bookingId?: string;
  connectMethod?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  dogName?: string;
};

function getStripeClient() {
  return new Stripe(stripeSecretKey.value());
}

function getDb() {
  if (!getApps().length) initializeApp();
  return getFirestore();
}

async function updateBookingByPaymentIntent(paymentIntentId: string, updates: Record<string, unknown>) {
  const db = getDb();

  for (const collectionName of BOOKING_COLLECTIONS) {
    const snapshot = await db
      .collection(collectionName)
      .where("paymentIntentId", "==", paymentIntentId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {
        collection: collectionName,
        id: doc.id,
      };
    }
  }

  return null;
}

export const healthCheck = onRequest((req, res) => {
  logger.info("Health check invoked", { path: req.path, method: req.method });
  res.status(200).json({
    ok: true,
    service: "functions",
    timestamp: new Date().toISOString(),
  });
});

export const createStripePaymentIntent = onRequest(
  {
    cors: true,
    secrets: [stripeSecretKey],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    try {
      const payload = req.body as CreatePaymentIntentPayload;
      if (!payload || payload.connectMethod !== "in-person-evaluation") {
        res.status(400).json({ error: "Payment intent is only required for in-person evaluation bookings." });
        return;
      }

      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: IN_PERSON_EVALUATION_CENTS,
        currency: IN_PERSON_CURRENCY,
        automatic_payment_methods: { enabled: true },
        receipt_email: payload.contactEmail || undefined,
        description: "Montreal Canine Training - In-person evaluation",
        metadata: {
          bookingType: payload.connectMethod || "",
          bookingId: payload.bookingId || "",
          contactName: payload.contactName || "",
          contactEmail: payload.contactEmail || "",
          contactPhone: payload.contactPhone || "",
          dogName: payload.dogName || "",
        },
      });

      res.status(200).json({
        ok: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });
    } catch (error) {
      logger.error("Failed to create Stripe payment intent", error);
      res.status(500).json({ error: "Failed to create payment intent." });
    }
  },
);

export const stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    const signature = req.header("stripe-signature");
    if (!signature) {
      res.status(400).json({ error: "Missing Stripe signature." });
      return;
    }

    try {
      const stripe = getStripeClient();
      const event = stripe.webhooks.constructEvent(req.rawBody, signature, stripeWebhookSecret.value());

      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const updated = await updateBookingByPaymentIntent(paymentIntent.id, {
            paymentStatus: "succeeded",
            paidAt: FieldValue.serverTimestamp(),
            stripeEventId: event.id,
          });
          logger.info("Payment succeeded", { paymentIntentId: paymentIntent.id, updatedBooking: updated });
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const updated = await updateBookingByPaymentIntent(paymentIntent.id, {
            paymentStatus: "failed",
            paymentErrorMessage: paymentIntent.last_payment_error?.message || null,
            stripeEventId: event.id,
          });
          logger.warn("Payment failed", { paymentIntentId: paymentIntent.id, updatedBooking: updated });
          break;
        }
        default:
          logger.info("Unhandled Stripe webhook event", { type: event.type, id: event.id });
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error("Stripe webhook error", error);
      res.status(400).json({ error: "Invalid webhook request." });
    }
  },
);
