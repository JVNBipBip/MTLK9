import type { AppLocale } from "@/lib/i18n/config"

export type WelcomePopupVariant = "a" | "b"

/** localStorage key. Value shape:
 * `{"state":"dismissed","at":"<iso>","variant":"a"|"b"}` → suppress 30 days
 * `{"state":"subscribed","variant":"a"|"b"}` → suppress forever
 * `{"variant":"a"|"b"}` → variant assigned, popup not yet acted on */
export const WELCOME_POPUP_STORAGE_KEY = "mtl-welcome-popup"

export const WELCOME_POPUP_DISMISS_SUPPRESS_DAYS = 30

/** Fraction of document height that counts as "deep enough" to trigger. */
export const WELCOME_POPUP_SCROLL_DEPTH = 0.4

export const WELCOME_POPUP_TIME_TRIGGER_MS = 10_000

/** Locale-stripped path prefixes where the popup must never show
 * (compare against `stripLocaleFromPathname(usePathname())`). */
export const WELCOME_POPUP_BLOCKED_PATH_PREFIXES = [
  "/booking",
  "/training-portal",
  "/checkout",
  "/privacy",
  "/terms",
] as const

export type WelcomePopupVariantCopy = {
  headline: string
  body: string
  cta: string
  /** Variant A only — sr-only label for the optional one-line message field. */
  messageLabel?: string
  messagePlaceholder?: string
}

export type WelcomePopupCopy = {
  variants: Record<WelcomePopupVariant, WelcomePopupVariantCopy>
  emailLabel: string
  emailPlaceholder: string
  emailError: string
  microcopy: string
  submitting: string
  success: string
  error: string
}

export const welcomePopupContent: Record<AppLocale, WelcomePopupCopy> = {
  en: {
    variants: {
      a: {
        headline: "What's your dog struggling with?",
        body: "Tell us in one line — one of our trainers will point you in the right direction. No charge, no pressure.",
        cta: "Get a trainer's take",
        messageLabel: "What's your dog struggling with? (optional)",
        messagePlaceholder: "Pulling, barking, anxiety…",
      },
      b: {
        headline: "Trainer advice that actually works",
        body: "Get our best tips for life with a dog in Montreal — from the team behind 124+ five-star trainings.",
        cta: "Send me the tips",
      },
    },
    emailLabel: "Email address",
    emailPlaceholder: "you@email.com",
    emailError: "Please enter a valid email address.",
    microcopy: "One or two helpful emails per week at most. Unsubscribe anytime.",
    submitting: "Sending…",
    success: "Check your inbox — first email is on its way. Talk soon!",
    error: "Something went wrong on our end — please try again.",
  },
  fr: {
    variants: {
      a: {
        headline: "Avec quoi votre chien a-t-il de la difficulté ?",
        body: "Dites-le-nous en une ligne — un de nos entraîneurs vous pointera dans la bonne direction. Sans frais, sans pression.",
        cta: "Obtenir l'avis d'un entraîneur",
        messageLabel: "Avec quoi votre chien a-t-il de la difficulté ? (facultatif)",
        messagePlaceholder: "Tire en laisse, jappements, anxiété…",
      },
      b: {
        headline: "Des conseils d'entraîneurs qui fonctionnent vraiment",
        body: "Recevez nos meilleurs conseils pour la vie avec un chien à Montréal — de l'équipe derrière plus de 124 entraînements cinq étoiles.",
        cta: "Envoyez-moi les conseils",
      },
    },
    emailLabel: "Adresse courriel",
    emailPlaceholder: "vous@courriel.com",
    emailError: "Veuillez entrer une adresse courriel valide.",
    microcopy: "Au plus un ou deux courriels utiles par semaine. Désabonnez-vous en tout temps.",
    submitting: "Envoi en cours…",
    success: "Vérifiez votre boîte de réception — le premier courriel est en route. À bientôt !",
    error: "Une erreur est survenue de notre côté — veuillez réessayer.",
  },
}
