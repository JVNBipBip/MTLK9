import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getGroupClassOffering, groupClassOfferingIds } from "@/lib/group-class-offerings"
import { buildLocalizedMetadata } from "@/lib/seo"

const META_BY_SLUG: Record<
  string,
  { title: { en: string; fr: string }; description: { en: string; fr: string } }
> = {
  "puppy-socialization-class": {
    title: {
      en: "Puppy Socialization Class — Montreal",
      fr: "Cours de socialisation pour chiots — Montréal",
    },
    description: {
      en: "Group puppy socialization in Montreal — $30 + tax per class for pups 10–20 weeks. Play, handling, greetings, and confidence-building.",
      fr:
        "Socialisation en groupe pour chiots à Montréal — 30 $ + taxes par cours (10 à 20 semaines). Jeu, manipulation, salutations et confiance.",
    },
  },
  "teen-puppy-class": {
    title: {
      en: "Teen Puppy Class — Montreal",
      fr: "Cours pour chiots adolescents — Montréal",
    },
    description: {
      en: "Small-group teen puppy class in Montreal — focus, leash skills, and impulse control for adolescent dogs.",
      fr:
        "Cours en petit groupe pour chiots adolescents à Montréal — attention, marche en laisse et contrôle des impulsions.",
    },
  },
  "reactivity-group-class": {
    title: {
      en: "Reactivity Group Class — Montreal",
      fr: "Cours de groupe pour la réactivité — Montréal",
    },
    description: {
      en: "Structured reactivity group training in Montreal — distance management, Engage–Disengage, and handler coaching.",
      fr:
        "Entraînement en groupe pour la réactivité à Montréal — gestion de la distance, Engage–Disengage et coaching.",
    },
  },
  "level-1-obedience-class": {
    title: {
      en: "Level 1 Obedience Class — Montreal",
      fr: "Cours d'obéissance niveau 1 — Montréal",
    },
    description: {
      en: "Foundation group obedience in Montreal — loose-leash walking, basics, recall, and impulse control in a small class.",
      fr:
        "Obéissance de base en groupe à Montréal — marche en laisse, commandes, rappel et contrôle des impulsions.",
    },
  },
  "level-2-obedience-class": {
    title: {
      en: "Level 2 Obedience Class — Montreal",
      fr: "Cours d'obéissance niveau 2 — Montréal",
    },
    description: {
      en: "Intermediate group obedience in Montreal — duration, distance, and distraction proofing after solid basics.",
      fr:
        "Obéissance intermédiaire en groupe à Montréal — durée, distance et épreuves de distraction.",
    },
  },
  "level-3-obedience-class": {
    title: {
      en: "Level 3 Obedience Class — Montreal",
      fr: "Cours d'obéissance niveau 3 — Montréal",
    },
    description: {
      en: "Advanced group obedience coming soon in Montreal — challenging proofing and high-distraction reps for experienced teams.",
      fr:
        "Obéissance avancée en groupe bientôt à Montréal — épreuves exigeantes pour équipes expérimentées.",
    },
  },
}

export function generateStaticParams() {
  return groupClassOfferingIds().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const offering = getGroupClassOffering(slug)
  if (!offering) return {}
  const meta = META_BY_SLUG[slug]
  if (!meta) return {}

  return buildLocalizedMetadata({
    path: `/group-classes/${slug}`,
    title: meta.title,
    description: meta.description,
    image: offering.image,
  })
}

export default async function GroupClassDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!getGroupClassOffering(slug)) notFound()
  return children
}
