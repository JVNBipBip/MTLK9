import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase-admin";
import { daycareAccount } from "./daycare-booking-store";
import { DaycareError } from "./daycare-booking";

export const DAYCARE_COOKIE = "mtlk9_daycare";
export const daycareJson = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
export function daycareFailure(error: unknown) {
  return daycareJson(
    { error: error instanceof DaycareError ? error.code : "unavailable" },
    error instanceof DaycareError ? error.status : 503,
  );
}
export async function daycareBody(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new DaycareError("forbidden", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new DaycareError("invalid_request", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new DaycareError("invalid_request");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4096) {
      await reader.cancel();
      throw new DaycareError("too_large", 413);
    }
    chunks.push(value);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString());
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body;
  } catch {
    throw new DaycareError("invalid_request");
  }
}
export const currentDaycareAccount = (request: NextRequest) =>
  daycareAccount(
    getAdminDb(),
    request.cookies.get(DAYCARE_COOKIE)?.value || "",
  );
export async function daycareLoginLimit(request: NextRequest) {
  const secret = process.env.DAYCARE_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) throw new DaycareError("unavailable", 503);
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const bucket = Math.floor(Date.now() / 900000);
  const id = createHmac("sha256", secret)
    .update(`${ip}:${bucket}`)
    .digest("hex");
  const db = getAdminDb(),
    ref = db.collection("daycare_login_limits").doc(id);
  await db.runTransaction(async (tx) => {
    const count = Number((await tx.get(ref)).data()?.count || 0);
    if (count >= 20) throw new DaycareError("rate_limited", 429);
    tx.set(ref, {
      count: count + 1,
      expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
    });
  });
}
