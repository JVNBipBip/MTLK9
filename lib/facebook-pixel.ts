export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "1971735463412759"

type PixelParams = Record<string, unknown>

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void
    _fbq: (...args: unknown[]) => void
  }
}

export function trackFBEvent(eventName: string, params?: PixelParams) {
  if (typeof window !== "undefined" && window.fbq && FB_PIXEL_ID) {
    window.fbq("track", eventName, params)
  }
}

export function trackFBLead(params?: PixelParams) {
  trackFBEvent("Lead", params)
}

export function trackFBInitiateCheckout(params?: PixelParams) {
  trackFBEvent("InitiateCheckout", params)
}

export function trackFBSchedule(params?: PixelParams) {
  trackFBEvent("Schedule", params)
}

export function trackFBCompleteRegistration(params?: PixelParams) {
  trackFBEvent("CompleteRegistration", params)
}

export function trackFBPurchase(params?: PixelParams) {
  trackFBEvent("Purchase", params)
}
