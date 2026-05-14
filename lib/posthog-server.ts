import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

export function getPostHogClient(): PostHog | null {
  const key = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null

  if (!posthogClient) {
    posthogClient = new PostHog(key, {
      host: process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return posthogClient
}

type CaptureArgs = {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
}

export async function captureServerEvent({ distinctId, event, properties }: CaptureArgs) {
  const client = getPostHogClient()
  if (!client) return
  client.capture({ distinctId, event, properties })
  try {
    await client.flush()
  } catch {
    // swallow — analytics must never break the request
  }
}
