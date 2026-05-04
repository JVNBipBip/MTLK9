import type { ContractKind } from "@/lib/domain"
import { addLocaleToPathname, defaultLocale, type AppLocale } from "@/lib/i18n/config"

/** Bump when the owner replaces legal text; stored on each acceptance. */
export const CONTRACT_VERSION = "v1-agreements-2026-05-04"

const PLACEHOLDER_BODY =
  "Placeholder agreement text. The owner will supply final terms for daycare, group classes, private training, and assessments. By accepting, you confirm you have read the agreement version shown below."

const PRIVATE_CLASSES_BODY = `Client Agreement

Thank you for being part of the Montreal Canine Training program!

Client information:
- Full name
- Email
- Phone number
- Dog's name
- Breed
- Evaluation session completed: Yes / No

To be filled out by trainer:
- Selected training option
- Start date
- End date
- Cost

I acknowledge that there is a 24-hour cancellation policy. Cancelled or rescheduled appointments within 24 hours will result in a $50 cancellation fee.

I acknowledge that a "No-Show" to a scheduled appointment will result in a $50 fee and no longer being able to make up for that session.

I acknowledge that the training sessions must be completed within the start and end date.

Liability Waiver
I fully release, discharge and indemnify Montreal Canine Training Inc. including owner, directors, officers, employees, agents, insurers, assigns and successors of and from any and all causes of action, lawsuits, losses, damages, injuries howsoever occurring, whether by negligence or otherwise, claims, demands, sums, costs, expenses, and any other liability of any kind, of or to me or any other participant(s) or person, directly or indirectly arising out of or in connection with the services and advise provided. I hereby waive my insurers' right to make a claim against the released parties. The Client confirms having read the above Waiver & Release and signed it voluntarily.`

const PRIVATE_CLASSES_BODY_FR = `Entente client

Merci de faire partie du programme d'Entraînement Canin Montréal!

Informations du client:
- Nom complet
- Courriel
- Numéro de téléphone
- Nom du chien
- Race
- Séance d'évaluation complétée: Oui / Non

À remplir par l'entraîneur:
- Option d'entraînement choisie
- Date de début
- Date de fin
- Coût

Je reconnais qu'une politique d'annulation de 24 heures s'applique. Toute annulation ou tout report de rendez-vous effectué à moins de 24 heures d'avis entraînera des frais d'annulation de 50 $.

Je reconnais qu'une absence à un rendez-vous prévu entraînera des frais de 50 $ et que cette séance ne pourra plus être reprise.

Je reconnais que les séances d'entraînement doivent être complétées entre la date de début et la date de fin.

Décharge de responsabilité
Je libère entièrement, décharge et indemnise Montreal Canine Training Inc., y compris son propriétaire, ses administrateurs, dirigeants, employés, agents, assureurs, ayants droit et successeurs, de toute cause d'action, poursuite, perte, dommage, blessure, quelle qu'en soit la cause, que ce soit par négligence ou autrement, réclamation, demande, somme, coût, dépense et toute autre responsabilité de quelque nature que ce soit, envers moi ou tout autre participant ou personne, découlant directement ou indirectement des services et conseils fournis ou y étant liés. Je renonce par les présentes au droit de mes assureurs de présenter une réclamation contre les parties libérées. Le client confirme avoir lu la décharge et renonciation ci-dessus et l'avoir acceptée volontairement.`

const GROUP_CLASSES_BODY = `Group Class Client Agreement

I acknowledge that a missed group class cannot be rescheduled, refunded or credited in any circumstances.

I acknowledge that I am responsible for my dog's behavior, damage or injury caused by my dog during training.

Liability Waiver
I fully release, discharge and indemnify Montreal Canine Training Inc. including owner, directors, officers, employees, agents, insurers, assigns and successors of and from all causes of action, lawsuits, losses, damages, injuries howsoever occurring, whether by negligence or otherwise, claims, demands, sums, costs, expenses, and any other liability of any kind, of or to me or any other participant(s) or person, directly or indirectly arising out of or in connection with the services and advise provided. I hereby waive my insurers' right to make a claim against the released parties. The Client confirms having read the above Waiver & Release and signed it voluntarily.`

const GROUP_CLASSES_BODY_FR = `Entente client - cours de groupe

Je reconnais qu'un cours de groupe manqué ne peut être repris, remboursé ou crédité en aucune circonstance.

Je reconnais être responsable du comportement de mon chien, ainsi que de tout dommage ou blessure causé par mon chien pendant l'entraînement.

Décharge de responsabilité
Je libère entièrement, décharge et indemnise Montreal Canine Training Inc., y compris son propriétaire, ses administrateurs, dirigeants, employés, agents, assureurs, ayants droit et successeurs, de toute cause d'action, poursuite, perte, dommage, blessure, quelle qu'en soit la cause, que ce soit par négligence ou autrement, réclamation, demande, somme, coût, dépense et toute autre responsabilité de quelque nature que ce soit, envers moi ou tout autre participant ou personne, découlant directement ou indirectement des services et conseils fournis ou y étant liés. Je renonce par les présentes au droit de mes assureurs de présenter une réclamation contre les parties libérées. Le client confirme avoir lu la décharge et renonciation ci-dessus et l'avoir acceptée volontairement.`

const ASSESSMENT_BOOKING_BODY = `Evaluation Contract Agreement

1. Cancellation Policy
I agree to provide a minimum of 48 hours notice to reschedule or cancel my evaluation.

2. Liability Waiver
The client hereby agrees to release, indemnify, and hold harmless the Company, its owners, employees, and agents from any and all claims, liabilities, damages, or expenses arising out of or in connection with the Client's participation in the evaluation.`

const ASSESSMENT_BOOKING_BODY_FR = `Entente contractuelle d'évaluation

1. Politique d'annulation
J'accepte de fournir un préavis minimum de 48 heures pour reporter ou annuler mon évaluation.

2. Décharge de responsabilité
Le client accepte par les présentes de libérer, d'indemniser et de tenir indemne la compagnie, ses propriétaires, employés et agents de toute réclamation, responsabilité, dommage ou dépense découlant de la participation du client à l'évaluation ou y étant lié.`

export const CONTRACT_LABEL: Record<ContractKind, string> = {
  daycare: "Daycare agreement",
  private_classes: "Private training agreement",
  group_classes: "Group class agreement",
  assessment_booking: "Assessment / intake agreement",
}

const CONTRACT_LABEL_BY_LOCALE: Record<AppLocale, Record<ContractKind, string>> = {
  en: CONTRACT_LABEL,
  fr: {
    daycare: "Entente de garderie",
    private_classes: "Entente d'entraînement privé",
    group_classes: "Entente de cours de groupe",
    assessment_booking: "Entente d'évaluation",
  },
}

const CONTRACT_BODY_BY_LOCALE: Record<AppLocale, Partial<Record<ContractKind, string>>> = {
  en: {
    private_classes: PRIVATE_CLASSES_BODY,
    group_classes: GROUP_CLASSES_BODY,
    assessment_booking: ASSESSMENT_BOOKING_BODY,
  },
  fr: {
    private_classes: PRIVATE_CLASSES_BODY_FR,
    group_classes: GROUP_CLASSES_BODY_FR,
    assessment_booking: ASSESSMENT_BOOKING_BODY_FR,
  },
}

export const CONTRACT_URL: Partial<Record<ContractKind, string>> = {
  private_classes: "/agreements/private-training",
  group_classes: "/agreements/group-classes",
  assessment_booking: "/agreements/evaluation",
}

export const CONTRACT_LINK_LABEL: Record<AppLocale, Partial<Record<ContractKind, string>>> = {
  en: {
    private_classes: "View private training agreement",
    group_classes: "View group class agreement",
    assessment_booking: "View consultation agreement",
  },
  fr: {
    private_classes: "Voir l'entente d'entraînement privé",
    group_classes: "Voir l'entente de cours de groupe",
    assessment_booking: "Voir l'entente de consultation",
  },
}

export const CONTRACT_ACCEPTANCE_LABEL: Record<AppLocale, Partial<Record<ContractKind, string>>> = {
  en: {
    private_classes: "I have read and agree to the private training agreement.",
    group_classes: "I have read and agree to the group class agreement.",
    assessment_booking: "I have read and agree to the consultation agreement.",
  },
  fr: {
    private_classes: "J'ai lu et j'accepte l'entente d'entraînement privé.",
    group_classes: "J'ai lu et j'accepte l'entente de cours de groupe.",
    assessment_booking: "J'ai lu et j'accepte l'entente de consultation.",
  },
}

export const CONTRACT_ACCEPTED_LABEL: Record<AppLocale, Partial<Record<ContractKind, string>>> = {
  en: {
    private_classes: "Private training agreement already accepted.",
    group_classes: "Group class agreement already accepted.",
  },
  fr: {
    private_classes: "Entente d'entraînement privé déjà acceptée.",
    group_classes: "Entente de cours de groupe déjà acceptée.",
  },
}

const CONTRACT_KIND_BY_SLUG: Record<string, ContractKind> = {
  "private-training": "private_classes",
  "group-classes": "group_classes",
  evaluation: "assessment_booking",
}

export function contractKindFromSlug(slug: string): ContractKind | null {
  return CONTRACT_KIND_BY_SLUG[slug] || null
}

export function contractLabel(kind: ContractKind, locale: AppLocale = defaultLocale): string {
  return CONTRACT_LABEL_BY_LOCALE[locale][kind]
}

export function contractBody(kind: ContractKind, locale: AppLocale = defaultLocale): string {
  const body = CONTRACT_BODY_BY_LOCALE[locale][kind] || CONTRACT_BODY_BY_LOCALE.en[kind]
  if (body) return body
  if (kind === "assessment_booking") return ASSESSMENT_BOOKING_BODY
  return PLACEHOLDER_BODY
}

export function contractUrl(kind: ContractKind, locale: AppLocale = defaultLocale): string {
  const url = CONTRACT_URL[kind]
  return url ? addLocaleToPathname(url, locale) : "#"
}
