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
        daycare: "Daycare",
        grooming: "Grooming",
        trainingOffer: "Save 30%",
        apprenticeships: "Trainer Apprenticeships",
        more: "More",
        groupClasses: "Group Classes",
        results: "Results",
        aboutUs: "About Us",
        faq: "FAQ",
        blog: "Blog",
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
      title: "Dog Training Montreal | MTL Canine Training",
      template: "%s | Montreal Canine Training",
      description:
        "Montreal’s dog training school and canine facility. Explore private and group training, Day Training, Daycare, grooming, and dog trainer apprenticeships.",
      ogTitle: "Dog Training Montreal | MTL Canine Training",
      ogDescription:
        "Private and group dog training, Day Training, Daycare, grooming, and trainer apprenticeships in Montreal.",
      imageAlt: "Dog owners with their German Shepherd at Montreal Canine Training",
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
        daycare: "Garderie",
        grooming: "Toilettage",
        trainingOffer: "Rabais de 30 %",
        apprenticeships: "Apprentissage pour entraîneurs",
        more: "Plus",
        groupClasses: "Cours de groupe",
        results: "Résultats",
        aboutUs: "À propos",
        faq: "FAQ",
        blog: "Blogue",
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
      title: "Dressage chien Montréal | MTL Canine Training",
      template: "%s | Entraînement Canin Montréal",
      description:
        "École d’entraînement et centre canin à Montréal. Cours privés et de groupe, entraînement de jour, garderie, toilettage et apprentissage pour entraîneurs.",
      ogTitle: "Dressage chien Montréal | MTL Canine Training",
      ogDescription:
        "Cours privés et de groupe, entraînement de jour, garderie, toilettage et programmes d’apprentissage à Montréal.",
      imageAlt: "Des propriétaires avec leur berger allemand chez MTL Canine Training",
    },
  },
} as const

export type AppMessages = (typeof messages)[AppLocale]

export function getMessages(locale: AppLocale): AppMessages {
  return messages[locale]
}
