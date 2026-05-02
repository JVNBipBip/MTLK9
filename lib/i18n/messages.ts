import type { AppLocale } from "./config"

export const messages = {
  en: {
    common: {
      languageName: "English",
      switchToEnglish: "English",
      switchToFrench: "Français",
      callNow: "Call Now",
      bookFreeCall: "Book a Free Call",
      bookFreeDiscoveryCall: "Book a Free Discovery Call",
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
      title: "Montreal Canine Training — Real-World Dog Training in Montreal",
      template: "%s — Montreal Canine Training",
      description:
        "Calm walks. Confident dogs. Clear plans. Montreal Canine Training delivers real-world behavioral coaching for leash reactivity, anxiety, puppy training, and more — using humane, evidence-guided methods.",
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
      bookFreeCall: "Réserver un appel gratuit",
      bookFreeDiscoveryCall: "Réserver un appel découverte gratuit",
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
      title: "Entraînement Canin Montréal — Entraînement concret à Montréal",
      template: "%s — Entraînement Canin Montréal",
      description:
        "Promenades calmes. Chiens confiants. Plans clairs. Entraînement Canin Montréal offre du coaching comportemental concret pour la réactivité en laisse, l'anxiété, l'entraînement des chiots et plus encore, avec des méthodes humaines et fondées sur les données.",
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
