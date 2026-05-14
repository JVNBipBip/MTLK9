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
  superpowerEn: string
  superpowerFr?: string
  personalEn: string
  personalFr?: string
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
    superpowerEn:
      "Prioritizes engagement, motivation, communication, confidence, and relationship-building above all.",
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
    superpowerEn: "Makes high-distraction urban walks feel manageable — and even enjoyable.",
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
    superpowerEn:
      "Helps owners feel clear, supported, and confident while they build better habits with their dogs.",
    superpowerFr:
      "Elle aide les propriétaires à se sentir clairs, soutenus et confiants pendant qu'ils développent de meilleures habitudes avec leur chien.",
    personalEn:
      "She works with the team to create practical training plans that fit real family routines.",
    personalFr:
      "Elle travaille avec l'équipe pour créer des plans d'entraînement pratiques qui s'intègrent aux vraies routines familiales.",
  },
} satisfies Record<CanonicalTrainerBookingSlug, TeamTrainerPublicNarrative>

/** About page card order matches team grid. */
export const ABOUT_TEAM_SLUG_ORDER: readonly CanonicalTrainerBookingSlug[] = ["nick", "tyson", "mia"]

export function getTrainerPublicNarrative(
  slug: string,
): TeamTrainerPublicNarrative | null {
  const k = slug.trim().toLowerCase() as CanonicalTrainerBookingSlug
  if (k in TEAM_TRAINER_PUBLIC_NARRATIVE_BY_SLUG) {
    return TEAM_TRAINER_PUBLIC_NARRATIVE_BY_SLUG[k]
  }
  return null
}

export type LocalizedTrainerBioReadMoreTexts = {
  origin: string
  aboutSpecializes?: string
  hostsPills: string[]
  whatTheyOfferLabel: string
  personal: string
  superpowerClosing: string
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
    superpowerClosing:
      isFr && narrative.superpowerFr !== undefined
        ? narrative.superpowerFr
        : t(narrative.superpowerEn),
  }
}
