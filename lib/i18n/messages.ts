import type { AppLocale } from "./config"

export const messages = {
  en: {
    common: {
      languageName: "English",
      switchToEnglish: "English",
      switchToFrench: "Français",
      callNow: "Call Now",
      bookFreeCall: "Contact Us",
      bookFreeDiscoveryCall: "Contact Us for a Free Discovery Call",
      nav: {
        trainingPrograms: "Training Programs",
        groupClasses: "Group Classes",
        results: "Results",
        aboutUs: "About Us",
        faq: "FAQ",
      },
      footer: {
        description:
          "Real-world training for real Montreal life. Calm walks, confident dogs, and clear plans — through humane methods and a team of specialists who have seen it all before.",
        trainingPrograms: "Training Programs",
        company: "Company",
        getStarted: "Get Started",
        contact: "Contact",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service",
        allRightsReserved: "All rights reserved.",
      },
    },
    metadata: {
      title: "Dog Training Montreal — Montreal Canine Training",
      template: "%s — Montreal Canine Training",
      description:
        "Real-world dog training in Montreal for reactivity, anxiety, puppy skills, and calmer walks.",
      ogTitle: "Montreal Canine Training — Real-World Dog Training",
      ogDescription:
        "Real-world behavioral coaching for Montreal dog owners. Calm walks, confident dogs, and clear plans.",
      imageAlt: "Montreal Canine Training — Real-World Dog Training",
    },
  },
  fr: {
    common: {
      languageName: "Français",
      switchToEnglish: "English",
      switchToFrench: "Français",
      callNow: "Appelez maintenant",
      bookFreeCall: "Contactez-nous",
      bookFreeDiscoveryCall: "Contactez-nous pour un appel découverte gratuit",
      nav: {
        trainingPrograms: "Entraînement",
        groupClasses: "Cours de groupe",
        results: "Résultats",
        aboutUs: "À propos",
        faq: "FAQ",
      },
      footer: {
        description:
          "Un entraînement concret pour la vraie vie à Montréal. Des promenades calmes, des chiens confiants et des plans clairs, avec des méthodes humaines et une équipe de spécialistes expérimentés.",
        trainingPrograms: "Entraînement",
        company: "Entreprise",
        getStarted: "Commencer",
        contact: "Contact",
        privacyPolicy: "Politique de confidentialité",
        termsOfService: "Conditions d'utilisation",
        allRightsReserved: "Tous droits réservés.",
      },
    },
    metadata: {
      title: "Entraînement canin Montréal — Entraînement Canin Montréal",
      template: "%s — Entraînement Canin Montréal",
      description:
        "Entraînement canin à Montréal pour la réactivité, l'anxiété, les chiots et les promenades calmes.",
      ogTitle: "Entraînement Canin Montréal — Entraînement concret",
      ogDescription:
        "Coaching comportemental concret pour les propriétaires de chiens à Montréal. Promenades calmes, chiens confiants et plans clairs.",
      imageAlt: "Entraînement Canin Montréal — Entraînement concret",
    },
  },
} as const

export type AppMessages = (typeof messages)[AppLocale]

export function getMessages(locale: AppLocale): AppMessages {
  return messages[locale]
}
