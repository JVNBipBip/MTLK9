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
  phoneLabel: string
  phonePlaceholder: string
  phoneError: string
  stepLabel: string
  ofLabel: string
  continueCta: string
  backCta: string
  microcopy: string
  submitting: string
  successHeadline: string
  success: string
  bookCta: string
  callCta: string
  laterCta: string
  error: string
}

export const welcomePopupContent: Record<AppLocale, WelcomePopupCopy> = {
  en: {
    variants: {
      a: {
        headline: "What's your dog struggling with?",
        body: "Tell us in one line — Nick or one of our trainers will point you in the right direction. No charge, no pressure.",
        cta: "Get a trainer's take",
        messageLabel: "What's your dog struggling with? (optional)",
        messagePlaceholder: "Pulling, barking, anxiety…",
      },
      b: {
        headline: "Trainer advice that actually works",
        body: "Get our best tips for life with a dog in Montreal — from the team behind 130+ five-star reviews.",
        cta: "Send me the tips",
      },
    },
    emailLabel: "Email address",
    emailPlaceholder: "you@email.com",
    emailError: "Please enter a valid email address.",
    phoneLabel: "Phone number (optional)",
    phonePlaceholder: "Phone number (optional)",
    phoneError: "Please enter a valid phone number, including the area code.",
    stepLabel: "Step",
    ofLabel: "of",
    continueCta: "Continue",
    backCta: "Back",
    microcopy: "By signing up, you agree to receive helpful emails from Montreal Canine Training. Unsubscribe anytime.",
    submitting: "Sending…",
    successHeadline: "You're in. What would help most right now?",
    success: "Your first email is on its way. You can also speak with Nick or start your consultation request now.",
    bookCta: "Start a consultation request",
    callCta: "Call Nick",
    laterCta: "I'll check my inbox",
    error: "Something went wrong on our end — please try again.",
  },
  fr: {
    variants: {
      a: {
        headline: "Avec quoi votre chien a-t-il de la difficulté ?",
        body: "Dites-le-nous en une ligne — Nick ou un de nos entraîneurs vous orientera dans la bonne direction. Sans frais, sans pression.",
        cta: "Obtenir l'avis d'un entraîneur",
        messageLabel: "Avec quoi votre chien a-t-il de la difficulté ? (facultatif)",
        messagePlaceholder: "Tire en laisse, jappements, anxiété…",
      },
      b: {
        headline: "Des conseils d'entraîneurs qui fonctionnent vraiment",
        body: "Recevez nos meilleurs conseils pour la vie avec un chien à Montréal — de l'équipe derrière plus de 130 avis cinq étoiles.",
        cta: "Envoyez-moi les conseils",
      },
    },
    emailLabel: "Adresse courriel",
    emailPlaceholder: "vous@courriel.com",
    emailError: "Veuillez entrer une adresse courriel valide.",
    phoneLabel: "Numéro de téléphone (facultatif)",
    phonePlaceholder: "Numéro de téléphone (facultatif)",
    phoneError: "Veuillez entrer un numéro valide, y compris l'indicatif régional.",
    stepLabel: "Étape",
    ofLabel: "sur",
    continueCta: "Continuer",
    backCta: "Retour",
    microcopy: "En vous inscrivant, vous acceptez de recevoir des courriels utiles d'Entraînement Canin Montréal. Désabonnez-vous en tout temps.",
    submitting: "Envoi en cours…",
    successHeadline: "C'est fait. De quoi avez-vous le plus besoin maintenant ?",
    success: "Votre premier courriel est en route. Vous pouvez aussi parler à Nick ou commencer votre demande de consultation maintenant.",
    bookCta: "Commencer une demande de consultation",
    callCta: "Appeler Nick",
    laterCta: "Je vais vérifier mes courriels",
    error: "Une erreur est survenue de notre côté — veuillez réessayer.",
  },
}
