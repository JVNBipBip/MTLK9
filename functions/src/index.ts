import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
export { createStripePaymentIntent, stripeWebhook } from "./stripe";
export { squareOAuthCallback, squareOAuthRefresh } from "./squareOAuth";

export const healthCheck = onRequest((req, res) => {
  logger.info("Health check invoked", { path: req.path, method: req.method });
  res.status(200).json({
    ok: true,
    service: "functions",
    timestamp: new Date().toISOString(),
  });
});
