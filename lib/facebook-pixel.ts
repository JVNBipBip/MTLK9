export const FB_PIXEL_ID = "1971735463412759"

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void
    _fbq: (...args: unknown[]) => void
  }
}

export function trackFBEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq && FB_PIXEL_ID) {
    window.fbq("track", eventName, params)
  }
}

export function trackFBLead(params?: Record<string, unknown>) {
  trackFBEvent("Lead", params)
}
