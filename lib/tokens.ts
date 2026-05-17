import crypto from "node:crypto"

export function hashAccessToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

/** URL-safe opaque token for resume / magic links (store only {@link hashAccessToken} in Firestore). */
export function generateAccessToken(byteLength = 24) {
  return crypto.randomBytes(byteLength).toString("base64url")
}
