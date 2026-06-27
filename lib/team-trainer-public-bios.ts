/**
 * Trainer narrative copy for About and /booking/[slug].
 * keyed by CanonicalTrainerBookingSlug (see team-trainer-photos.ts).
 */

import type { CanonicalTrainerBookingSlug } from "@/lib/team-trainer-photos"

export type TeamTrainerPublicNarrative = {
  bookingSlug: CanonicalTrainerBookingSlug
  /** English source string; French via dom-translations (useLocalizedText). */
  originEn: string
  aboutSpecializesEn: string
  aboutSpecializesFr: string
  hostsPillsEn: string[]
  hostsPillsFr: string[]
  personalEn: string
  personalFr?: string
}

export type TrainerSeoServiceLink = {
  path: string
  labelEn: string
  labelFr: string
}

export type TrainerSeoFaq = {
  questionEn: string
  answerEn: string
  questionFr: string
  answerFr: string
}

export type TrainerSeoProfile = {
  bookingSlug: CanonicalTrainerBookingSlug
  fullName: string
  shortName: string
  jobTitleEn: string
  jobTitleFr: string
  titleEn: string
  titleFr: string
  descriptionEn: string
  descriptionFr: string
  introEn: string
  introFr: string
  specialtiesEn: string[]
  specialtiesFr: string[]
  bestForEn: string[]
  bestForFr: string[]
  serviceLinks: TrainerSeoServiceLink[]
  faqs: TrainerSeoFaq[]
}

export const TEAM_TRAINER_PUBLIC_NARRATIVE_BY_SLUG = {
  nick: {
    bookingSlug: "nick",
    originEn: [
      "Nick has been handling dogs from a young age and has always had a natural ability working with them.",
      "With over 10 years of experience, a growing list of successful cases, and a strong reputation for rehabilitating dogs, he built Montreal Canine Training into what has become one of the leading dog training companies in Montreal. Today, his focus is on building a strong team of professionals, continuing to teach and educate people about their dogs, and offering dog trainer courses for individuals looking to pursue a career in the industry.",
    ].join("\n\n"),
    aboutSpecializesEn:
      "Specializes in Major Behaviour Modification, Reactivity, Advanced Obedience and Sport training.",
    aboutSpecializesFr:
      "Se spécialise en modification majeure du comportement, réactivité, obéissance avancée et sport canin.",
    hostsPillsEn: [
      "Consultations & private lessons",
      "Obedience groups (levels 2 & 3)",
      "Reactivity groups",
      "Apprenticeship programs",
    ],
    hostsPillsFr: [
      "Consultations & cours privés",
      "Groupes obéissance (niv. 2 et 3)",
      "Groupes réactivité",
      "Programmes d'apprentissage",
    ],
    personalEn:
      "At home, he shares his life with two Australian Shepherds, cats, a wife, and a baby.",
  },
  tyson: {
    bookingSlug: "tyson",
    originEn: [
      "Tyson's journey began with his first dog, Winston, an Australian Shepherd. Through his experience, hard work, and proven results, he has demonstrated the qualities and skills needed to help people better understand, manage, and build stronger relationships with their dogs.",
      "He works closely with clients to problem-solve and create clear, customized training programs tailored to fit each client's lifestyle and goals. So far, he has achieved excellent results and built an impressive track record of customer satisfaction.",
      "With Tyson, clients can feel confident, supported, and in good hands during every single session.",
    ].join("\n\n"),
    aboutSpecializesEn:
      "Specializes in Puppy Training & Development, Behaviour Modification, Obedience and Reactivity Training.",
    aboutSpecializesFr:
      "Se spécialise en formation et développement des chiots, modification du comportement, obéissance et entraînement à la réactivité.",
    hostsPillsEn: [
      "Consultations & private lessons",
      "Puppy socialization",
      "Teen puppy group",
      "Reactivity group",
      "Obedience group (level 1)",
    ],
    hostsPillsFr: [
      "Consultations & cours privés",
      "Socialisation chiots",
      "Groupe chiot ado",
      "Groupe réactivité",
      "Obéissance collectif (niv. 1)",
    ],
    personalEn:
      "He has two dogs of his own and lives by the philosophy that structure creates freedom.",
  },
  mia: {
    bookingSlug: "mia",
    originEn: [
      "Mia successfully completed Montreal Canine Training's apprenticeship program two years ago and has completed over 100 hours of stage work, along with many additional hours working in our day training program.",
      "She began her dog training journey with her personal dog, Appa, and quickly discovered a true passion for helping dogs and their owners.",
      "Mia is an exceptional trainer who genuinely enjoys helping others and building strong relationships between dogs and their families.",
    ].join("\n\n"),
    aboutSpecializesEn:
      "Specializes in Puppy Training & Development, Minor Behaviour Modification, Reactivity Training and Obedience.",
    aboutSpecializesFr:
      "Se spécialise en formation et développement des chiots, modification mineure du comportement, réactivité et obéissance.",
    hostsPillsEn: ["Consultations & private lessons", "Reactivity group"],
    hostsPillsFr: ["Consultations & cours privés", "Groupe réactivité"],
    personalEn:
      "She works with the team to create practical training plans that fit real family routines.",
    personalFr:
      "Elle travaille avec l'équipe pour créer des plans d'entraînement pratiques qui s'intègrent aux vraies routines familiales.",
  },
} satisfies Record<CanonicalTrainerBookingSlug, TeamTrainerPublicNarrative>

/** About page card order matches team grid. */
export const ABOUT_TEAM_SLUG_ORDER: readonly CanonicalTrainerBookingSlug[] = ["nick", "tyson", "mia"]

export const TRAINER_SEO_PROFILE_BY_SLUG = {
  nick: {
    bookingSlug: "nick",
    fullName: "Nick Azzuolo",
    shortName: "Nick",
    jobTitleEn: "Owner, Founder and Head Dog Trainer",
    jobTitleFr: "Propriétaire, fondateur et entraîneur canin en chef",
    titleEn: "Dog Trainer Montreal | Nick Azzuolo",
    titleFr: "Dresseur de chien Montréal | Nick Azzuolo",
    descriptionEn:
      "Work with Nick Azzuolo at Montreal Canine Training for reactivity, behaviour modification, advanced obedience, and serious rehabilitation cases.",
    descriptionFr:
      "Travaillez avec Nick Azzuolo pour la réactivité, la modification du comportement, l'obéissance avancée et les cas de réhabilitation.",
    introEn:
      "Nick leads complex behaviour cases and advanced obedience work for Montreal owners who need a clear, structured plan for a dog that has become hard to manage.",
    introFr:
      "Nick dirige les dossiers comportementaux complexes et l'obéissance avancée pour les propriétaires de Montréal qui ont besoin d'un plan clair et structuré.",
    specialtiesEn: [
      "Major behaviour modification",
      "Reactivity and leash conflict",
      "Advanced obedience",
      "Sport and high-drive dogs",
    ],
    specialtiesFr: [
      "Modification majeure du comportement",
      "Réactivité et conflits en laisse",
      "Obéissance avancée",
      "Chiens sportifs et chiens très motivés",
    ],
    bestForEn: [
      "Dogs with repeated reactivity, aggression, or safety concerns",
      "Owners who need structure after trying generic advice",
      "Advanced obedience goals beyond basic manners",
    ],
    bestForFr: [
      "Chiens avec réactivité répétée, agressivité ou enjeux de sécurité",
      "Propriétaires qui ont besoin de structure après des conseils génériques",
      "Objectifs d'obéissance avancée au-delà des bases",
    ],
    serviceLinks: [
      { path: "/services/aggression", labelEn: "Aggressive dog training", labelFr: "Chien agressif" },
      { path: "/services/reactivity", labelEn: "Reactive dog training", labelFr: "Entraînement pour chiens réactifs" },
      { path: "/services/private-classes", labelEn: "Private training", labelFr: "Cours privés" },
      { path: "/services/obedience", labelEn: "Obedience training", labelFr: "Obéissance" },
    ],
    faqs: [
      {
        questionEn: "When should I book with Nick?",
        answerEn:
          "Book with Nick when your dog needs advanced behaviour work, serious reactivity support, or a structured rehabilitation plan.",
        questionFr: "Quand devrais-je réserver avec Nick?",
        answerFr:
          "Réservez avec Nick si votre chien a besoin d'un travail comportemental avancé, d'un soutien sérieux pour la réactivité ou d'un plan de réhabilitation structuré.",
      },
      {
        questionEn: "Does Nick work with reactive dogs?",
        answerEn:
          "Yes. Reactivity, threshold work, leash conflict, and advanced behaviour modification are core parts of Nick's work.",
        questionFr: "Nick travaille-t-il avec les chiens réactifs?",
        answerFr:
          "Oui. La réactivité, le travail de seuil, les conflits en laisse et la modification avancée du comportement font partie de son travail principal.",
      },
    ],
  },
  tyson: {
    bookingSlug: "tyson",
    fullName: "Tyson Jerome White",
    shortName: "Tyson",
    jobTitleEn: "Dog Trainer",
    jobTitleFr: "Entraîneur canin",
    titleEn: "Dog Trainer Montreal | Tyson White",
    titleFr: "Dresseur de chien Montréal | Tyson White",
    descriptionEn:
      "Book dog training with Tyson White for puppy development, obedience, behaviour modification, reactivity, and private training in Montreal.",
    descriptionFr:
      "Réservez avec Tyson White pour les chiots, l'obéissance, la modification du comportement, la réactivité et les cours privés à Montréal.",
    introEn:
      "Tyson builds practical plans for families who need puppy foundations, obedience, better leash skills, and calm behaviour around distractions.",
    introFr:
      "Tyson bâtit des plans pratiques pour les familles qui veulent de bonnes bases, de l'obéissance, une meilleure marche en laisse et un comportement calme.",
    specialtiesEn: [
      "Puppy training and development",
      "Obedience foundations",
      "Reactivity training",
      "Private lesson coaching",
    ],
    specialtiesFr: [
      "Formation et développement des chiots",
      "Bases d'obéissance",
      "Entraînement à la réactivité",
      "Coaching en cours privés",
    ],
    bestForEn: [
      "Puppies and adolescent dogs building foundations",
      "Owners who want clear homework between sessions",
      "Dogs that need better focus and manners around distractions",
    ],
    bestForFr: [
      "Chiots et jeunes chiens qui bâtissent leurs bases",
      "Propriétaires qui veulent des devoirs clairs entre les séances",
      "Chiens qui doivent améliorer leur focus et leurs manières avec distractions",
    ],
    serviceLinks: [
      { path: "/services/puppy-training", labelEn: "Puppy training", labelFr: "Entraînement pour chiots" },
      { path: "/services/reactivity", labelEn: "Reactive dog training", labelFr: "Entraînement pour chiens réactifs" },
      { path: "/services/private-classes", labelEn: "Private training", labelFr: "Cours privés" },
      { path: "/group-classes", labelEn: "Group classes", labelFr: "Cours collectifs" },
    ],
    faqs: [
      {
        questionEn: "Is Tyson a good fit for puppy training?",
        answerEn:
          "Yes. Tyson works with puppies and adolescent dogs on confidence, engagement, leash skills, manners, and obedience foundations.",
        questionFr: "Tyson est-il un bon choix pour l'entraînement des chiots?",
        answerFr:
          "Oui. Tyson travaille avec les chiots et les jeunes chiens sur la confiance, l'engagement, la marche en laisse, les manières et les bases d'obéissance.",
      },
      {
        questionEn: "Can Tyson help with reactivity?",
        answerEn:
          "Yes. Tyson supports reactivity cases and can help decide whether private training or a group class is the right next step.",
        questionFr: "Tyson peut-il aider avec la réactivité?",
        answerFr:
          "Oui. Tyson accompagne des cas de réactivité et peut aider à déterminer si les cours privés ou collectifs sont la bonne prochaine étape.",
      },
    ],
  },
  mia: {
    bookingSlug: "mia",
    fullName: "Mia M",
    shortName: "Mia",
    jobTitleEn: "Dog Trainer",
    jobTitleFr: "Entraîneuse canine",
    titleEn: "Dog Trainer Montreal | Mia M",
    titleFr: "Dresseuse de chien Montréal | Mia M",
    descriptionEn:
      "Book dog training with Mia M for puppy training, obedience, minor behaviour modification, reactivity, and practical family routines in Montreal.",
    descriptionFr:
      "Réservez un entraînement canin avec Mia M pour les chiots, l'obéissance, la modification mineure du comportement, la réactivité et les routines familiales.",
    introEn:
      "Mia focuses on practical training for families who want better routines, calmer behaviour, and a dog that can handle real everyday situations.",
    introFr:
      "Mia se concentre sur un entraînement pratique pour les familles qui veulent de meilleures routines, un comportement plus calme et un chien prêt pour le quotidien.",
    specialtiesEn: [
      "Puppy training",
      "Pet obedience",
      "Minor behaviour modification",
      "Reactivity training",
    ],
    specialtiesFr: [
      "Entraînement des chiots",
      "Obéissance familiale",
      "Modification mineure du comportement",
      "Entraînement à la réactivité",
    ],
    bestForEn: [
      "Families building everyday routines with their dog",
      "Puppy and obedience foundations",
      "Owners who want practical coaching they can repeat at home",
    ],
    bestForFr: [
      "Familles qui bâtissent des routines quotidiennes avec leur chien",
      "Bases pour chiots et obéissance",
      "Propriétaires qui veulent un coaching pratique à répéter à la maison",
    ],
    serviceLinks: [
      { path: "/services/puppy-training", labelEn: "Puppy training", labelFr: "Entraînement pour chiots" },
      { path: "/services/reactivity", labelEn: "Reactive dog training", labelFr: "Entraînement pour chiens réactifs" },
      { path: "/services/obedience", labelEn: "Obedience training", labelFr: "Obéissance" },
      { path: "/group-classes", labelEn: "Group classes", labelFr: "Cours collectifs" },
    ],
    faqs: [
      {
        questionEn: "What does Mia specialize in?",
        answerEn:
          "Mia specializes in puppy training, obedience, minor behaviour modification, reactivity work, and practical family routines.",
        questionFr: "Quelles sont les spécialités de Mia?",
        answerFr:
          "Mia se spécialise en entraînement des chiots, obéissance, modification mineure du comportement, réactivité et routines familiales pratiques.",
      },
      {
        questionEn: "Is Mia a good fit for family dog training?",
        answerEn:
          "Yes. Mia is a strong fit for families who want clear routines, better manners, and training that fits daily life.",
        questionFr: "Mia est-elle un bon choix pour l'entraînement d'un chien de famille?",
        answerFr:
          "Oui. Mia convient bien aux familles qui veulent des routines claires, de meilleures manières et un entraînement adapté au quotidien.",
      },
    ],
  },
} satisfies Record<CanonicalTrainerBookingSlug, TrainerSeoProfile>

export function getTrainerPublicNarrative(
  slug: string,
): TeamTrainerPublicNarrative | null {
  const k = slug.trim().toLowerCase() as CanonicalTrainerBookingSlug
  if (k in TEAM_TRAINER_PUBLIC_NARRATIVE_BY_SLUG) {
    return TEAM_TRAINER_PUBLIC_NARRATIVE_BY_SLUG[k]
  }
  return null
}

export function getTrainerSeoProfile(slug: string): TrainerSeoProfile | null {
  const k = slug.trim().toLowerCase() as CanonicalTrainerBookingSlug
  if (k in TRAINER_SEO_PROFILE_BY_SLUG) {
    return TRAINER_SEO_PROFILE_BY_SLUG[k]
  }
  return null
}

export function localizeTrainerSeoProfile(profile: TrainerSeoProfile, locale: "en" | "fr") {
  const isFr = locale === "fr"
  return {
    fullName: profile.fullName,
    shortName: profile.shortName,
    jobTitle: isFr ? profile.jobTitleFr : profile.jobTitleEn,
    title: isFr ? profile.titleFr : profile.titleEn,
    description: isFr ? profile.descriptionFr : profile.descriptionEn,
    intro: isFr ? profile.introFr : profile.introEn,
    specialties: isFr ? profile.specialtiesFr : profile.specialtiesEn,
    bestFor: isFr ? profile.bestForFr : profile.bestForEn,
    serviceLinks: profile.serviceLinks.map((link) => ({
      path: link.path,
      label: isFr ? link.labelFr : link.labelEn,
    })),
    faqs: profile.faqs.map((faq) => ({
      question: isFr ? faq.questionFr : faq.questionEn,
      answer: isFr ? faq.answerFr : faq.answerEn,
    })),
  }
}

export type LocalizedTrainerBioReadMoreTexts = {
  origin: string
  aboutSpecializes?: string
  hostsPills: string[]
  whatTheyOfferLabel: string
  personal: string
}

export function localizeTrainerBioReadMoreTexts(
  narrative: TeamTrainerPublicNarrative,
  locale: "en" | "fr",
  t: (english: string) => string,
): LocalizedTrainerBioReadMoreTexts {
  const isFr = locale === "fr"
  return {
    origin: t(narrative.originEn),
    aboutSpecializes: isFr ? narrative.aboutSpecializesFr : narrative.aboutSpecializesEn,
    hostsPills: isFr ? narrative.hostsPillsFr : narrative.hostsPillsEn,
    whatTheyOfferLabel: t("What they offer"),
    personal:
      isFr && narrative.personalFr !== undefined ? narrative.personalFr : t(narrative.personalEn),
  }
}
