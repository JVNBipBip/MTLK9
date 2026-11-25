/**
 * Control Center health kit. Copy this file into a client project (no dependencies).
 *
 * It runs checks against the project's own integrations and returns a JSON report.
 * Secrets never leave the client project: the control center only sees statuses.
 *
 * Next.js App Router usage (app/api/health/route.ts):
 *
 *   import { healthHandler, stripeCheck, supabaseCheck } from "@/lib/health";
 *   export const dynamic = "force-dynamic"; // omit on Next 16 with cacheComponents
 *   export const GET = healthHandler(() => [
 *     stripeCheck({ secretKey: process.env.STRIPE_SECRET_KEY! }),
 *     supabaseCheck({ url: process.env.NEXT_PUBLIC_SUPABASE_URL!, apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }),
 *   ]);
 *
 * Then set HEALTH_TOKEN in the project's environment to the token shown in the control center.
 */

export const HEALTH_KIT_VERSION = 1;

export type CheckStatus = "ok" | "warn" | "fail";
type Meta = Record<string, string | number | boolean | null>;

export type CheckOutcome = { status: CheckStatus; message?: string; meta?: Meta };
export type Check = {
  key: string; // stable id, e.g. "stripe" or "google-calendar:main"
  label: string; // human name shown in the control center
  provider?: string; // matches the control center provider id, e.g. "stripe"
  run: () => Promise<CheckOutcome>;
};
export type CheckResult = CheckOutcome & { key: string; label: string; provider?: string; latencyMs: number };
export type HealthReport = { kit: number; checkedAt: string; checks: CheckResult[] };

const ok = (message?: string, meta?: Meta): CheckOutcome => ({ status: "ok", message, meta });
const warn = (message: string, meta?: Meta): CheckOutcome => ({ status: "warn", message, meta });
const fail = (message: string, meta?: Meta): CheckOutcome => ({ status: "fail", message, meta });

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms} ms`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function runChecks(checks: Check[], timeoutMs = 8000): Promise<HealthReport> {
  const checksOut = await Promise.all(
    checks.map(async (c): Promise<CheckResult> => {
      const started = Date.now();
      try {
        const out = await withTimeout(c.run(), timeoutMs);
        return { key: c.key, label: c.label, provider: c.provider, latencyMs: Date.now() - started, ...out };
      } catch (err) {
        return {
          key: c.key, label: c.label, provider: c.provider, latencyMs: Date.now() - started,
          status: "fail", message: err instanceof Error ? err.message : "Check threw an error",
        };
      }
    }),
  );
  return { kit: HEALTH_KIT_VERSION, checkedAt: new Date().toISOString(), checks: checksOut };
}

function tokensMatch(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Request handler (Web standard Request/Response). Requires `Authorization: Bearer <HEALTH_TOKEN>`. */
export function healthHandler(checks: Check[] | (() => Check[] | Promise<Check[]>), opts: { token?: string; timeoutMs?: number } = {}) {
  return async (req: Request): Promise<Response> => {
    const headers = { "content-type": "application/json", "cache-control": "no-store" };
    // Works in Node, Vercel, Netlify and Deno (Supabase edge functions)
    const g = globalThis as { process?: { env?: Record<string, string | undefined> }; Deno?: { env: { get(k: string): string | undefined } } };
    const expected = opts.token ?? g.process?.env?.HEALTH_TOKEN ?? g.Deno?.env.get("HEALTH_TOKEN");
    if (!expected) return new Response(JSON.stringify({ error: "HEALTH_TOKEN is not set" }), { status: 503, headers });
    const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!tokensMatch(given, expected)) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });
    const list = typeof checks === "function" ? await checks() : checks;
    const report = await runChecks(list, opts.timeoutMs);
    return new Response(JSON.stringify(report), { status: 200, headers });
  };
}

// ---------------------------------------------------------------------------
// Ready-made checks. Messages never include secrets or raw response bodies.
// ---------------------------------------------------------------------------

/** Stripe: key still works, and no webhook endpoint has been disabled. */
export function stripeCheck(o: { secretKey: string; key?: string; label?: string; webhooks?: boolean }): Check {
  return {
    key: o.key ?? "stripe", label: o.label ?? "Stripe", provider: "stripe",
    run: async () => {
      if (!o.secretKey) return fail("Stripe key is not configured");
      const auth = { authorization: `Bearer ${o.secretKey}` };
      const bal = await fetch("https://api.stripe.com/v1/balance", { headers: auth });
      if (bal.status === 401) return fail("Stripe rejected the key (revoked, expired or wrong mode)");
      const keyNote = bal.status === 403 ? "Key valid (restricted, no balance access)" : "Key valid";
      if (!bal.ok && bal.status !== 403) return warn(`Stripe API returned HTTP ${bal.status}`);
      if (o.webhooks === false) return ok(keyNote);

      const wh = await fetch("https://api.stripe.com/v1/webhook_endpoints?limit=100", { headers: auth });
      if (wh.status === 403) return ok(`${keyNote}; key can't read webhook endpoints`);
      if (!wh.ok) return warn(`${keyNote}; couldn't list webhooks (HTTP ${wh.status})`);
      const body = (await wh.json()) as { data: { status: string; url: string; api_version: string | null }[] };
      const disabled = body.data.filter((e) => e.status === "disabled");
      const versions = [...new Set(body.data.map((e) => e.api_version).filter(Boolean))].join(", ") || null;
      if (disabled.length) {
        return fail(`${disabled.length} webhook endpoint(s) disabled: ${disabled.map((e) => new URL(e.url).host).join(", ")}`,
          { webhookApiVersions: versions });
      }
      return ok(`${keyNote}; ${body.data.length} webhook endpoint(s) enabled`, { webhookApiVersions: versions });
    },
  };
}

/** Google OAuth (Calendar etc.): refresh token still exchanges for an access token; optional calendar read. */
export function googleOAuthCheck(o: {
  clientId: string; clientSecret: string; refreshToken: string; calendarId?: string; key?: string; label?: string;
}): Check {
  return {
    key: o.key ?? "google-calendar", label: o.label ?? "Google Calendar", provider: "google_calendar",
    run: async () => {
      if (!o.refreshToken) return fail("No refresh token configured");
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: o.clientId, client_secret: o.clientSecret, refresh_token: o.refreshToken, grant_type: "refresh_token",
        }),
      });
      const tok = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
      if (tok.error === "invalid_grant") {
        return fail("Refresh token revoked or expired. If the OAuth app is in 'Testing' mode, tokens expire after 7 days.");
      }
      if (tok.error === "invalid_client") return fail("OAuth client ID/secret rejected (secret rotated or client deleted?)");
      if (!tok.access_token) return fail(`Token refresh failed (${tok.error ?? `HTTP ${res.status}`})`);
      if (!o.calendarId) return ok("Refresh token valid");

      const cal = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(o.calendarId)}`, {
        headers: { authorization: `Bearer ${tok.access_token}` },
      });
      if (cal.status === 404) return fail("Calendar not found (deleted or access removed)");
      if (cal.status === 403) return fail("No access to calendar (permission removed or API disabled)");
      if (!cal.ok) return warn(`Calendar API returned HTTP ${cal.status}`);
      return ok("Refresh token valid; calendar reachable");
    },
  };
}

/** Microsoft Graph (Outlook): client secret still valid; optionally that change-notification subscriptions haven't lapsed. */
export function microsoftGraphCheck(o: {
  tenantId: string; clientId: string; clientSecret: string; checkSubscriptions?: boolean; key?: string; label?: string;
}): Check {
  return {
    key: o.key ?? "microsoft-graph", label: o.label ?? "Microsoft Graph", provider: "microsoft_graph",
    run: async () => {
      const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(o.tenantId)}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: o.clientId, client_secret: o.clientSecret, grant_type: "client_credentials",
          scope: "https://graph.microsoft.com/.default",
        }),
      });
      const tok = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_codes?: number[] };
      if (tok.error_codes?.includes(7000222)) return fail("Client secret has expired. Create a new one in Entra ID.");
      if (tok.error === "invalid_client") return fail("Client secret rejected (wrong, rotated or expired)");
      if (!tok.access_token) return fail(`Token request failed (${tok.error ?? `HTTP ${res.status}`})`);
      if (!o.checkSubscriptions) return ok("Client credentials valid");

      const subs = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
        headers: { authorization: `Bearer ${tok.access_token}` },
      });
      if (!subs.ok) return warn(`Credentials valid; couldn't list subscriptions (HTTP ${subs.status})`);
      const { value } = (await subs.json()) as { value: { expirationDateTime: string }[] };
      if (!value.length) return warn("Credentials valid; no active change-notification subscriptions");
      const soonest = value.map((s) => Date.parse(s.expirationDateTime)).sort((a, b) => a - b)[0];
      const hours = Math.round((soonest - Date.now()) / 3_600_000);
      if (hours < 0) return fail("A change-notification subscription has expired (renewal job not running?)");
      return ok(`Credentials valid; ${value.length} subscription(s), next expiry in ${hours} h`, {
        nextSubscriptionExpiry: new Date(soonest).toISOString(),
      });
    },
  };
}

/** Supabase: project reachable (free-tier projects pause after inactivity). */
export function supabaseCheck(o: { url: string; apiKey: string; key?: string; label?: string }): Check {
  return {
    key: o.key ?? "supabase", label: o.label ?? "Supabase", provider: "supabase",
    run: async () => {
      if (!o.url) return fail("Supabase URL is not configured");
      const res = await fetch(`${o.url.replace(/\/$/, "")}/auth/v1/health`, { headers: { apikey: o.apiKey } });
      if (res.ok) return ok("Project reachable");
      if (res.status === 401) return fail("Supabase rejected the API key");
      return fail(`Project not responding normally (HTTP ${res.status}). Paused?`);
    },
  };
}

/** Any URL that should answer with a 2xx (or a specific status). Handy for Firebase functions, webhooks, etc. */
export function httpCheck(o: { key: string; label: string; url: string; provider?: string; expectStatus?: number; headers?: Record<string, string> }): Check {
  return {
    key: o.key, label: o.label, provider: o.provider,
    run: async () => {
      const res = await fetch(o.url, { headers: o.headers, redirect: "manual" });
      const good = o.expectStatus ? res.status === o.expectStatus : res.status >= 200 && res.status < 300;
      return good ? ok(`HTTP ${res.status}`) : fail(`Unexpected HTTP ${res.status}`);
    },
  };
}

/** Wrap your own logic, e.g. "a booking webhook arrived in the last 24h". */
export function customCheck(key: string, label: string, run: () => Promise<CheckOutcome>, provider?: string): Check {
  return { key, label, provider, run };
}
export const outcome = { ok, warn, fail };
