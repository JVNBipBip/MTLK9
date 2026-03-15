import { onRequest } from "firebase-functions/v2/https"
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

    const data = doc.data() as { refreshToken?: string; merchantId?: string; env?: string }
    const refreshToken = data?.refreshToken?.trim()
    if (!refreshToken) {
      res.status(400).json({ ok: false, error: "Missing refresh_token" })
      return
    }

    // Use env from token doc if present (set at OAuth connect), else from config
    const env = data?.env || squareEnv.value()
    const isSandbox = env === "sandbox"
    const clientId = isSandbox ? sandboxSquareAppId.value() : squareAppId.value()
    const clientSecret = isSandbox ? sandboxSquareAppSecret.value() : squareAppSecret.value()
    if (!clientId || !clientSecret) {
      logger.error("squareOAuthRefresh: missing OAuth credentials", { env, isSandbox })
      res.status(500).json({ ok: false, error: `${isSandbox ? "SANDBOX_" : ""}SQUARE_APPLICATION_ID/SECRET not configured` })
      return
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
      logger.warn("squareOAuthRefresh: Square refresh failed", {
        status: refreshRes.status,
        err: firstErr,
      })
      res.status(502).json({
        ok: false,
        error: firstErr?.detail || firstErr?.code || "Token refresh failed",
      })
      return
    }

    // Square should return expires_at; fallback to 30 days from now if missing
    let newExpiresAt = tokenData.expires_at?.trim() || null
    if (!newExpiresAt) {
      const fallback = new Date()
      fallback.setDate(fallback.getDate() + 30)
      newExpiresAt = fallback.toISOString()
      logger.warn("squareOAuthRefresh: Square did not return expires_at, using fallback", { fallback: newExpiresAt })
    } else {
      logger.info("squareOAuthRefresh: Square response", { expiresAt: newExpiresAt })
    }

    const docId = doc.id
    const updatedAt = new Date().toISOString()
    await doc.ref.update({
      accessToken: tokenData.access_token,
      expiresAt: newExpiresAt,
      updatedAt,
      ...(tokenData.refresh_token ? { refreshToken: tokenData.refresh_token } : {}),
    })

    logger.info("squareOAuthRefresh: success", { docId, merchantId: tokenData.merchant_id, expiresAt: newExpiresAt })
    res.status(200).json({ ok: true, expiresAt: newExpiresAt, updatedAt })
  }
)
