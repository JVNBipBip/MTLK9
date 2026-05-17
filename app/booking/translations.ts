import type { AppLocale } from "@/lib/i18n/config"

export const bookingStepCopy = {
  en: {
    issueKicker: "START HERE TO FILL OUT YOUR INQUIRY",
    issueTitle: "What's going on with your dog?",
    issueSubtitle:
      "Please select one of the five options that best describes your dog.",
    followUpsTitle: "A few quick questions",
    followUpsSubtitle: "These answers help us match you with the best assessment slot.",
    goalsTitle: "What would success look like for you?",
    checkAllThatApply: "Check all that apply.",
    goalsComplete: "Thanks, we have the details we need for this category.",
    youAndDogTitle: "Tell us about you and your dog",
    dogInfoTitle: "Tell us about your dog",
    dogName: "Dog's name",
    dogNamePlaceholder: "e.g. Max",
    dogBreed: "Breed or mix",
    dogBreedPlaceholder: "e.g. German Shepherd mix",
    dogAge: "Age",
    dogAgePlaceholder: "Select age range",
    contactTitle: "Last step - how do we reach you?",
    contactName: "Your name",
    contactNamePlaceholder: "Full name",
    contactEmail: "Email",
    contactPhone: "Phone number",
    contactBestTime: "Best time to reach you",
    contactBestTimePlaceholder: "Select a time",
    additionalDogContext:
      "Please share with us any additional information about your dog",
    contactNotes: "Anything else you want us to know?",
    optional: "(optional)",
    contactNotesPlaceholder: "Feel free to share anything that might help us prepare...",
    toBeConfirmed: "To be confirmed by email",
    when: "When",
    where: "Where",
    what: "What",
    inPersonAssessment: "In-person assessment",
    confirmationTitle: "You're in. Your assessment is booked.",
    confirmationSubtitle:
      "You'll receive a confirmation email shortly with your booking details and a short prep checklist.",
    inquiryConfirmationTitle: "Your inquiry was sent.",
    inquiryConfirmationSubtitle: "We'll get back to you shortly.",
    questionsBeforeThen: "Questions before then?",
  },
  fr: {
    issueKicker: "COMMENCEZ ICI POUR COMPLÉTER VOTRE DEMANDE",
    issueTitle: "Que se passe-t-il avec votre chien?",
    issueSubtitle:
      "Veuillez choisir l'une des cinq options qui décrit le mieux votre situation.",
    followUpsTitle: "Quelques questions rapides",
    followUpsSubtitle: "Ces réponses nous aident à vous proposer le meilleur créneau d'évaluation.",
    goalsTitle: "À quoi ressemblerait une réussite pour vous?",
    checkAllThatApply: "Cochez toutes les options qui s'appliquent.",
    goalsComplete: "Merci, nous avons les détails nécessaires pour cette catégorie.",
    youAndDogTitle: "Parlez-nous de vous et de votre chien",
    dogInfoTitle: "Parlez-nous de votre chien",
    dogName: "Nom du chien",
    dogNamePlaceholder: "ex. Max",
    dogBreed: "Race ou croisement",
    dogBreedPlaceholder: "ex. Berger allemand croisé",
    dogAge: "Âge",
    dogAgePlaceholder: "Sélectionnez une tranche d'âge",
    contactTitle: "Dernière étape - comment pouvons-nous vous joindre?",
    contactName: "Votre nom",
    contactNamePlaceholder: "Nom complet",
    contactEmail: "Courriel",
    contactPhone: "Numéro de téléphone",
    contactBestTime: "Meilleur moment pour vous joindre",
    contactBestTimePlaceholder: "Sélectionnez un moment",
    additionalDogContext:
      "Veuillez partager toute information supplémentaire sur votre chien",
    contactNotes: "Autre chose que vous voulez nous faire savoir?",
    optional: "(optionnel)",
    contactNotesPlaceholder: "Partagez tout détail qui pourrait nous aider à nous préparer...",
    toBeConfirmed: "À confirmer par courriel",
    when: "Quand",
    where: "Où",
    what: "Quoi",
    inPersonAssessment: "Évaluation en personne",
    confirmationTitle: "C'est confirmé. Votre évaluation est réservée.",
    confirmationSubtitle:
      "Vous recevrez bientôt un courriel de confirmation avec les détails de votre réservation et une courte liste de préparation.",
    inquiryConfirmationTitle: "Votre demande a été envoyée.",
    inquiryConfirmationSubtitle: "Nous vous répondrons sous peu.",
    questionsBeforeThen: "Des questions d'ici là?",
  },
} as const

const optionTextFr: Record<string, { label?: string; description?: string }> = {
  "puppy-out-of-control": {
    label: "Formation chiot",
    description:
      "Aide pour la cage, la propreté, le mordillage, la socialisation, les bases ou d'autres comportements de chiot.",
  },
  "pulls-lunges-reacts": {
    label: "Tirer en laisse, réactivité et obéissance générale",
    description:
      "Les promenades sont stressantes; contrôler votre chien à la maison ou à l'extérieur est difficile. Besoin d'aide avec l'obéissance et le comportement.",
  },
  "anxiety-fear-separation": {
    label: "Anxiété, peur ou anxiété de séparation",
    description: "Votre chien a de la difficulté seul, près de déclencheurs ou dans les lieux publics.",
  },
  "aggression-safety": {
    label: "Agressivité et problèmes de comportement graves",
    description:
      "Réactivité sévère, morsures, protection des ressources, anxiété de séparation ou enjeux de sécurité à la maison ou à l'extérieur.",
  },
  "better-obedience": {
    label: "Améliorer l'obéissance ou la fiabilité hors laisse",
    description:
      "Votre chien va plutôt bien, mais vous voulez progresser, approfondir l'entraînement et passer au niveau supérieur.",
  },
  "sport-training": {
    label: "Entraînement sportif",
    description:
      "Vous souhaitez commencer sports de mordant, agility, obéissance active ou une activité amusante avec votre chien.",
  },
  "crate-trouble": { label: "Votre chiot a-t-il de la difficulté avec sa cage?" },
  "potty-mistakes": { label: "Votre chiot fait-il ses besoins dans la maison?" },
  "trouble-in-and-out": { label: "Votre chiot cause-t-il des problèmes dans la maison et à l'extérieur?" },
  "reactive-to-humans": { label: "Mon chien tire, se lance et réagit aux humains" },
  "reactive-to-dogs": { label: "Mon chien tire, se lance et réagit aux chiens" },
  "social-with-humans": { label: "Votre chien est-il sociable avec les humains?" },
  "social-with-dogs": { label: "Votre chien est-il sociable avec les chiens?" },
  "bitten-or-nipped-human": { label: "Votre chien a-t-il déjà mordu ou pincé un humain?" },
  "struggles-left-alone": { label: "Avez-vous de la difficulté à laisser votre chien seul à la maison?" },
  "stressed-by-dogs-people": { label: "Votre chien est-il stressé ou inquiet avec les chiens ou les gens?" },
  "trouble-public-places": { label: "Avez-vous de la difficulté à amener votre chien dans les lieux publics?" },
  "bitten-human": { label: "Votre chien a-t-il mordu un humain?" },
  "bitten-dog": { label: "Votre chien a-t-il mordu un autre chien?" },
  "resource-guarding-family-bite": {
    label: "Votre chien vous a-t-il mordu, vous ou un membre de votre famille, à cause de la protection des ressources?",
  },
  "seen-another-trainer": { label: "Avez-vous consulté un autre entraîneur dans le passé?" },
  "obedience-public-distractions": {
    label: "Voulez-vous améliorer l'obéissance de votre chien en public ou avec de fortes distractions?",
  },
  "off-leash-training": { label: "Voulez-vous commencer l'entraînement sans laisse?" },
  "group-obedience-class": { label: "Voulez-vous vous inscrire à un cours d'obéissance de groupe de base ou avancé?" },
  "sport-interest": { label: "Quel sport vous intéresse?" },
  yes: { label: "Oui" },
  no: { label: "Non" },
  agility: { label: "Agilité" },
  "bite-sport": { label: "Sport de mordant" },
  "active-obedience": { label: "Obéissance active" },
  "puppy-calm-around-people-dogs": {
    label: "Mon chiot peut apprendre à rester calme avec les gens et les chiens",
  },
  "puppy-left-alone": { label: "Mon chien peut rester seul sans problème" },
  "puppy-listens-anywhere": { label: "Mon chiot écoute peu importe l'environnement où je l'amène" },
  "neutral-around-humans-dogs": { label: "J'aimerais que mon chien soit neutre avec les humains et les chiens" },
  "join-group-class": { label: "J'aimerais voir mon chien dans un cours de groupe" },
  "neutral-and-listens": {
    label: "J'aimerais que mon chien soit neutre avec les gens et les chiens, et qu'il écoute mes commandes",
  },
  "calm-confident-around-people-dogs": {
    label: "Mon chien peut apprendre à être calme et confiant avec les gens et les chiens",
  },
  "left-alone-without-issues": { label: "Mon chien peut rester seul sans problème" },
  "neutral-around-triggers": { label: "Mon chien peut rester neutre face à ses déclencheurs" },
  "under-6-months": { label: "Moins de 6 mois" },
  "6-12-months": { label: "6 à 12 mois" },
  "1-2-years": { label: "1 à 2 ans" },
  "2-5-years": { label: "2 à 5 ans" },
  "5-plus-years": { label: "5 ans et plus" },
  morning: { label: "Matin" },
  afternoon: { label: "Après-midi" },
  evening: { label: "Soir" },
  "no-preference": { label: "Aucune préférence" },
}

export function bookingOptionLabel(locale: AppLocale, value: string, fallback: string) {
  return locale === "fr" ? optionTextFr[value]?.label ?? fallback : fallback
}

export function bookingOptionDescription(locale: AppLocale, value: string, fallback: string) {
  return locale === "fr" ? optionTextFr[value]?.description ?? fallback : fallback
}
