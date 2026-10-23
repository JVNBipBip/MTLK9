import { onRequest } from "firebase-functions/v2/https"
import { onSchedule } from "firebase-functions/v2/scheduler"
import { logger } from "firebase-functions"
import { defineSecret, defineString } from "firebase-functions/params"
import { initializeApp, getApps } from "firebase-admin/app"
import { getFirestore, Timestamp } from "firebase-admin/firestore"

const squareAppId = defineSecret("SQUARE_APPLICATION_ID")
const squareAppSecret = defineSecret("SQUARE_APPLICATION_SECRET")
const sandboxSquareAppId = defineSecret("SANDBOX_SQUARE_APPLICATION_ID")
const sandboxSquareAppSecret = defineSecret("SANDBOX_SQUARE_APPLICATION_SECRET")
const squareOAuthCallbackUrl = defineString("SQUARE_OAUTH_CALLBACK_URL")
const squareOAuthDefaultRedirect = defineString("SQUARE_OAUTH_DEFAULT_REDIRECT", {
  default: "http://localhost:3001/sync",
})
const squareEnv = defineString("SQUARE_ENV", { default: "sandbox" })

const SQUARE_TOKEN_BY_ENV: Record<string, string> = {
  production: "https://connect.squareup.com/oauth2/token",
  sandbox: "https://connect.squareupsandbox.com/oauth2/token",
}

const SQUARE_TOKENS_COLLECTION = "square_tokens"
const SQUARE_OAUTH_STATES_COLLECTION = "square_oauth_states"
const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getDb() {
  if (!getApps().length) initializeApp()
  return getFirestore()
}

export const squareOAuthCallback = onRequest(
  {
    cors: false,
    secrets: [squareAppId, squareAppSecret, sandboxSquareAppId, sandboxSquareAppSecret],
    minInstances: 0,
  },
  async (req, res) => {
    logger.info("squareOAuthCallback invoked", {
      method: req.method,
      url: req.originalUrl || req.url,
      hasCode: !!req.query.code,
      hasState: !!req.query.state,
      hasError: !!req.query.error,
    })

    // Log env sources - Firebase params vs process.env (for debugging sandbox/production mismatch)
    logger.info("squareOAuthCallback: ENV SOURCES", {
      SQUARE_ENV_from_process_env: process.env.SQUARE_ENV ?? "(undefined)",
      SQUARE_ENV_from_defineString: squareEnv.value() ?? "(undefined)",
    })

    if (req.method === "HEAD") {
      logger.info("squareOAuthCallback: HEAD request, returning 200")
      res.status(200).end()
      return
    }
    if (req.method !== "GET") {
      logger.warn("squareOAuthCallback: method not allowed", { method: req.method })
      res.status(405).send("Method not allowed")
      return
    }

    const code = req.query.code as string | undefined
    const state = req.query.state as string | undefined
    const error = req.query.error as string | undefined
    const errorDesc = req.query.error_description as string | undefined

    logger.info("squareOAuthCallback: parsed params", {
      codeLength: code?.length ?? 0,
      stateLength: state?.length ?? 0,
      error,
      errorDesc,
    })

    const db = getDb()
    let redirectTo = squareOAuthDefaultRedirect.value()

    const appendError = (err: string, desc?: string, raw?: string) => {
      const u = new URL(redirectTo)
      u.searchParams.set("square_error", err)
      if (desc) u.searchParams.set("square_error_desc", desc)
      if (raw) u.searchParams.set("square_error_raw", raw.slice(0, 200))
      return u.toString()
    }

    if (error) {
      logger.warn("squareOAuthCallback: Square returned error", { error, errorDesc, state: state?.slice(0, 8) })
      const stateDoc = state ? await db.collection(SQUARE_OAUTH_STATES_COLLECTION).doc(state).get() : null
      if (stateDoc?.exists) {
        const data = stateDoc.data() as { redirectTo?: string }
        redirectTo = data?.redirectTo || redirectTo
        await stateDoc.ref.delete()
      }
      res.redirect(appendError(error, errorDesc))
      return
    }

    if (!code || !state) {
      logger.warn("squareOAuthCallback: missing code or state", { hasCode: !!code, hasState: !!state })
      res.redirect(appendError("missing_params"))
      return
    }

    const stateDoc = await db.collection(SQUARE_OAUTH_STATES_COLLECTION).doc(state).get()
    if (!stateDoc.exists) {
      logger.warn("squareOAuthCallback: state not found or already used", { statePrefix: state.slice(0, 8) })
      res.redirect(appendError("invalid_state"))
      return
    }

    const stateData = stateDoc.data() as { redirectTo?: string; env?: string; createdAt?: Timestamp }
    redirectTo = stateData?.redirectTo || redirectTo
    const envFromState = stateData?.env?.toLowerCase().trim()
    logger.info("squareOAuthCallback: state validated", { redirectTo, envFromState })

    const createdAt = stateData?.createdAt
    const createdMs = createdAt instanceof Timestamp ? createdAt.toMillis() : 0
    if (Date.now() - createdMs > STATE_TTL_MS) {
      logger.warn("squareOAuthCallback: state expired", {
        ageMs: Date.now() - createdMs,
        ttlMs: STATE_TTL_MS,
      })
      await stateDoc.ref.delete()
      res.redirect(appendError("invalid_state"))
      return
    }

    await stateDoc.ref.delete()

    // Primary: env from state (set by admin when initiating OAuth - no redeploy needed to switch)
    // Fallback: process.env, defineString, or code prefix
    const envFromProcess = process.env.SQUARE_ENV?.toLowerCase().trim()
    const envFromParams = squareEnv.value()?.toLowerCase().trim()
    let env = (envFromState || envFromProcess || envFromParams || "sandbox") as string
    let isSandbox = env === "sandbox"

    // Fallback: Square sandbox auth codes often start with "sandbox-" - if so, MUST use sandbox creds
    if (code?.startsWith("sandbox-") && !isSandbox) {
      logger.warn("squareOAuthCallback: code starts with sandbox- but env was not sandbox, forcing sandbox credentials", {
        envWas: env,
        envFromProcess,
        envFromParams,
      })
      env = "sandbox"
      isSandbox = true
    }

    const clientId = isSandbox ? sandboxSquareAppId.value() : squareAppId.value()
    const clientSecret = isSandbox ? sandboxSquareAppSecret.value() : squareAppSecret.value()

    const clientIdIsSandbox = clientId?.startsWith("sandbox-") ?? false
    const clientSecretIsSandbox = clientSecret?.startsWith("sandbox-sq0csb") ?? false
    const clientSecretIsProd = clientSecret?.startsWith("sq0csp-") ?? false
    const possibleMismatch = clientIdIsSandbox && clientSecretIsProd

    logger.info("squareOAuthCallback: CREDENTIAL SELECTION", {
      env,
      envFromState: envFromState ?? "(none)",
      envFromProcess: envFromProcess ?? "(none)",
      envFromParams: envFromParams ?? "(none)",
      isSandbox,
      credentialsSource: isSandbox ? "SANDBOX_*" : "SQUARE_* (production)",
      clientIdPrefix: clientId?.slice(0, 25) ?? "(empty)",
      clientIdIsSandbox,
      clientSecretPrefix: clientSecret?.slice(0, 18) ?? "(empty)",
      clientSecretIsSandbox,
      clientSecretIsProd,
      possibleMismatch: possibleMismatch ? "YES - sandbox clientId with production secret!" : "no",
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    })
    if (possibleMismatch) {
      logger.error("CREDENTIAL MISMATCH: client_id looks sandbox but client_secret looks production. Use SANDBOX_SQUARE_APPLICATION_SECRET from sandbox app.")
    }

    if (!clientSecret) {
      logger.error("squareOAuthCallback: SQUARE_APPLICATION_SECRET is empty or not set")
      res.redirect(appendError("config", `${isSandbox ? "SANDBOX_" : ""}SQUARE_APPLICATION_SECRET not configured. Run: firebase functions:secrets:set ${isSandbox ? "SANDBOX_" : ""}SQUARE_APPLICATION_SECRET`))
      return
    }

    if (clientSecret.startsWith("sq0atp-") || clientSecret.startsWith("EAAA")) {
      logger.error("squareOAuthCallback: SQUARE_APPLICATION_SECRET looks like an access token, not the OAuth Application secret")
      res.redirect(appendError("config", "Wrong credential: You may have set your access token. Use the OAuth Application secret from Square Developer Console → OAuth → Application secret (click Show)"))
      return
    }

    const tokenUrl = SQUARE_TOKEN_BY_ENV[env] || SQUARE_TOKEN_BY_ENV.sandbox
    const tokenUrlHost = new URL(tokenUrl).host

    // redirect_uri must match EXACTLY what was sent in the authorize request.
    // Use the configured URL (same as admin uses) to avoid proxy/protocol mismatches.
    const redirectUri = (squareOAuthCallbackUrl.value() || "").replace(/\/?$/, "/")

    logger.info("squareOAuthCallback: TOKEN EXCHANGE CONFIG", {
      env,
      isSandbox,
      tokenUrl,
      tokenUrlHost,
      tokenUrlIsSandbox: tokenUrlHost.includes("sandbox"),
      redirectUri,
      redirectUriFromConfig: squareOAuthCallbackUrl.value(),
      clientIdPrefix: clientId?.slice(0, 25),
      clientSecretLength: clientSecret?.length ?? 0,
      codePrefix: code?.slice(0, 12),
    })

    if (!redirectUri) {
      logger.error("squareOAuthCallback: SQUARE_OAUTH_CALLBACK_URL not configured")
      res.redirect(appendError("config", "SQUARE_OAUTH_CALLBACK_URL not configured in functions .env"))
      return
    }

    const tokenRequestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }
    logger.info("squareOAuthCallback: calling Square token API", {
      tokenUrl,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      codeLength: code?.length,
      requestBody_client_id: clientId?.slice(0, 25),
      requestBody_redirect_uri: redirectUri,
    })
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenRequestBody),
    })

    const rawText = await tokenRes.text()
    const tokenData = (() => {
      try {
        return JSON.parse(rawText) as {
          access_token?: string
          refresh_token?: string
          merchant_id?: string
          expires_at?: string
          errors?: Array<{ code?: string; detail?: string; category?: string; field?: string }>
        }
      } catch {
        return null
      }
    })()

    logger.info("squareOAuthCallback: Square token API response", {
      status: tokenRes.status,
      ok: tokenRes.ok,
      hasAccessToken: !!tokenData?.access_token,
      hasErrors: !!tokenData?.errors?.length,
      errorCount: tokenData?.errors?.length ?? 0,
      firstError: tokenData?.errors?.[0],
      rawBodyLength: JSON.stringify(tokenData)?.length ?? 0,
    })

    if (!tokenRes.ok || !tokenData?.access_token) {
      const firstErr = tokenData?.errors?.[0] as { code?: string; detail?: string; category?: string; field?: string } | undefined
      const errDetail = firstErr?.detail
      const errCode = firstErr?.code
      const errField = firstErr?.field
      const errCategory = firstErr?.category
      const errMsg = [errDetail, errCode, errField ? `field: ${errField}` : null, errCategory ? `category: ${errCategory}` : null]
        .filter(Boolean)
        .join(" | ") || "Token exchange failed"
      const rawSummary = rawText?.slice(0, 500) || "no response body"

      const tokenUrlHost = new URL(tokenUrl).host
      logger.warn("Square token exchange failed - FULL CONTEXT", {
        status: tokenRes.status,
        errCode,
        errDetail,
        errField,
        errCategory,
        rawBody: rawSummary,
        env,
        isSandbox,
        tokenUrl,
        tokenUrlHost,
        redirectUri,
        clientIdPrefix: clientId?.slice(0, 25),
        clientIdStartsWithSandbox: clientId?.startsWith("sandbox-"),
        clientSecretPrefix: clientSecret?.slice(0, 8),
        clientSecretStartsWithSandbox: clientSecret?.startsWith("sandbox-"),
        hasCode: !!code,
        codeLength: code?.length,
      })
      const secretLooksProd = clientSecret?.startsWith("sq0csp-")
      const secretLooksSandbox = clientSecret?.startsWith("sandbox-sq0csb")
      logger.error("DIAGNOSTIC: token exchange failed", {
        env,
        isSandbox,
        tokenUrlHost,
        clientIdPrefix: clientId?.slice(0, 30),
        clientSecretPrefix: clientSecret?.slice(0, 18),
        secretLooksProd,
        secretLooksSandbox,
        redirectUri,
        squareError: rawSummary,
        hint: secretLooksProd && clientId?.startsWith("sandbox-")
          ? "MISMATCH: Using production secret with sandbox client_id. Set SANDBOX_SQUARE_APPLICATION_SECRET via firebase functions:secrets:set"
          : undefined,
      })
      res.redirect(appendError("token_exchange", errMsg, rawText))
      return
    }

    const docId = tokenData.merchant_id || "default"
    logger.info("squareOAuthCallback: saving tokens to Firestore", {
      docId,
      merchantId: tokenData.merchant_id,
      expiresAt: tokenData.expires_at,
    })

    const now = new Date().toISOString()
    await db.collection(SQUARE_TOKENS_COLLECTION).doc(docId).set(
      {
        merchantId: tokenData.merchant_id || null,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt: tokenData.expires_at || null,
        connectedAt: now,
        updatedAt: now,
        env, // sandbox or production - used by refresh to pick correct credentials
      },
      { merge: true }
    )

    logger.info("squareOAuthCallback: success, redirecting to admin", { redirectTo })

    const successUrl = new URL(redirectTo)
    successUrl.searchParams.set("square_connected", "1")
    res.redirect(successUrl.toString())
  }
)

/**
 * Refresh when the access token is already expired or expires within this window.
 * Square access tokens last 30 days; with a daily schedule this gives ~7 retries
 * before a token can lapse.
 */
const REFRESH_WHEN_EXPIRING_WITHIN_MS = 7 * 24 * 60 * 60 * 1000

type TokenDoc = FirebaseFirestore.QueryDocumentSnapshot

type RefreshResult =
  | { ok: true; docId: string; expiresAt: string; updatedAt: string }
  | { ok: false; docId: string; error: string; httpStatus: number }

/** True when the stored token is expired, near expiry, or carries no expiry we can trust. */
function isRefreshDue(expiresAt?: string | null): boolean {
  if (!expiresAt) return true // unknown expiry - refresh so Square hands us a real one
  const ms = Date.parse(expiresAt)
  if (Number.isNaN(ms)) return true
  return ms - Date.now() <= REFRESH_WHEN_EXPIRING_WITHIN_MS
}

/** Exchange one doc's stored refresh_token for a new access token and persist it. */
async function refreshSquareTokenDoc(doc: TokenDoc): Promise<RefreshResult> {
  const data = doc.data() as {
    refreshToken?: string
    merchantId?: string
    env?: string
    expiresAt?: string
  }
  const refreshToken = data?.refreshToken?.trim()
  if (!refreshToken) {
    return { ok: false, docId: doc.id, error: "Missing refresh_token", httpStatus: 400 }
  }

  // Use env from token doc if present (set at OAuth connect), else from config
  const env = data?.env || squareEnv.value()
  const isSandbox = env === "sandbox"
  const clientId = isSandbox ? sandboxSquareAppId.value() : squareAppId.value()
  const clientSecret = isSandbox ? sandboxSquareAppSecret.value() : squareAppSecret.value()
  if (!clientId || !clientSecret) {
    logger.error("squareRefresh: missing OAuth credentials", { env, isSandbox, docId: doc.id })
    return {
      ok: false,
      docId: doc.id,
      error: `${isSandbox ? "SANDBOX_" : ""}SQUARE_APPLICATION_ID/SECRET not configured`,
      httpStatus: 500,
    }
  }

  const tokenUrl = SQUARE_TOKEN_BY_ENV[env] || SQUARE_TOKEN_BY_ENV.sandbox

  const refreshRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  const rawText = await refreshRes.text()
  const tokenData = (() => {
    try {
      return JSON.parse(rawText) as {
        access_token?: string
        refresh_token?: string
        expires_at?: string
        merchant_id?: string
        errors?: Array<{ code?: string; detail?: string }>
      }
    } catch {
      return null
    }
  })()

  if (!refreshRes.ok || !tokenData?.access_token) {
    const firstErr = tokenData?.errors?.[0]
    logger.warn("squareRefresh: Square refresh failed", {
      docId: doc.id,
      status: refreshRes.status,
      err: firstErr,
    })
    return {
      ok: false,
      docId: doc.id,
      error: firstErr?.detail || firstErr?.code || "Token refresh failed",
      httpStatus: 502,
    }
  }

  // Square should return expires_at; fallback to 30 days from now if missing
  let newExpiresAt = tokenData.expires_at?.trim() || null
  if (!newExpiresAt) {
    const fallback = new Date()
    fallback.setDate(fallback.getDate() + 30)
    newExpiresAt = fallback.toISOString()
    logger.warn("squareRefresh: Square did not return expires_at, using fallback", {
      docId: doc.id,
      fallback: newExpiresAt,
    })
  }

  const updatedAt = new Date().toISOString()
  await doc.ref.update({
    accessToken: tokenData.access_token,
    expiresAt: newExpiresAt,
    updatedAt,
    lastRefreshedAt: updatedAt,
    lastRefreshError: null,
    ...(tokenData.refresh_token ? { refreshToken: tokenData.refresh_token } : {}),
  })

  logger.info("squareRefresh: success", {
    docId: doc.id,
    merchantId: tokenData.merchant_id || data.merchantId,
    expiresAt: newExpiresAt,
  })
  return { ok: true, docId: doc.id, expiresAt: newExpiresAt, updatedAt }
}

/** Record a failed refresh on the doc so the admin can see why sync is down. */
async function recordRefreshFailure(doc: TokenDoc, error: string) {
  try {
    await doc.ref.update({ lastRefreshError: error, lastRefreshAttemptAt: new Date().toISOString() })
  } catch (err) {
    logger.warn("squareRefresh: could not record failure on token doc", { docId: doc.id, err })
  }
}

/** Refresh Square OAuth access token using stored refresh_token. Call when access token is expired. */
export const squareOAuthRefresh = onRequest(
  {
    cors: false,
    secrets: [squareAppId, squareAppSecret, sandboxSquareAppId, sandboxSquareAppSecret],
    minInstances: 0,
  },
  async (req, res) => {
    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).json({ ok: false, error: "Method not allowed" })
      return
    }

    const db = getDb()
    const snap = await db.collection(SQUARE_TOKENS_COLLECTION).limit(5).get()
    const doc = snap.docs.find((d) => {
      const data = d.data()
      return data?.refreshToken?.trim()
    })
    if (!doc) {
      logger.warn("squareOAuthRefresh: no token doc with refreshToken found")
      res.status(404).json({ ok: false, error: "No OAuth token with refresh_token found" })
      return
    }

    // On-demand: always refresh. The caller asked because a Square call just failed.
    const result = await refreshSquareTokenDoc(doc)
    if (!result.ok) {
      await recordRefreshFailure(doc, result.error)
      res.status(result.httpStatus).json({ ok: false, error: result.error })
      return
    }
    res.status(200).json({ ok: true, expiresAt: result.expiresAt, updatedAt: result.updatedAt })
  }
)

/**
 * Keeps Square OAuth tokens alive without anyone touching the admin.
 *
 * Square access tokens expire 30 days after connect. Before this existed the only
 * refresh path was on-demand (app -> SQUARE_OAUTH_REFRESH_URL) which, if it ever
 * failed, left the token dead and every outbound Square call failing silently.
 * Runs daily so a token has ~7 chances to renew inside the expiry window.
 */
export const squareTokenScheduledRefresh = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "America/Toronto",
    secrets: [squareAppId, squareAppSecret, sandboxSquareAppId, sandboxSquareAppSecret],
    retryCount: 3,
  },
  async () => {
    const db = getDb()
    const snap = await db.collection(SQUARE_TOKENS_COLLECTION).get()
    const docs = snap.docs.filter((d) => (d.data() as { refreshToken?: string })?.refreshToken?.trim())

    if (docs.length === 0) {
      logger.warn("squareTokenScheduledRefresh: no token docs with a refresh_token")
      return
    }

    let refreshed = 0
    let skipped = 0
    let failed = 0

    for (const doc of docs) {
      const data = doc.data() as { expiresAt?: string; merchantId?: string }
      if (!isRefreshDue(data?.expiresAt)) {
        skipped += 1
        logger.info("squareTokenScheduledRefresh: not due yet", {
          docId: doc.id,
          expiresAt: data?.expiresAt,
        })
        continue
      }

      try {
        const result = await refreshSquareTokenDoc(doc)
        if (result.ok) {
          refreshed += 1
        } else {
          failed += 1
          await recordRefreshFailure(doc, result.error)
          logger.error("squareTokenScheduledRefresh: refresh failed - Square sync will break", {
            docId: doc.id,
            merchantId: data?.merchantId,
            expiresAt: data?.expiresAt,
            error: result.error,
          })
        }
      } catch (err) {
        failed += 1
        const message = err instanceof Error ? err.message : String(err)
        await recordRefreshFailure(doc, message)
        logger.error("squareTokenScheduledRefresh: unexpected error", { docId: doc.id, error: message })
      }
    }

    logger.info("squareTokenScheduledRefresh: done", { total: docs.length, refreshed, skipped, failed })
  }
)
