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
      en: "Group puppy socialization in Montreal — $50 + tax per class for pups 10–20 weeks. Play, confidence building, and safe interactions.",
      fr:
        "Socialisation en groupe pour chiots à Montréal — 50 $ + taxes par cours (10 à 20 semaines). Jeu, confiance et interactions sécuritaires.",
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
      en: "Reactivity group class in Montreal — gradual group exposure, threshold distance work, and handler coaching for all ages.",
      fr:
        "Cours de groupe réactivité à Montréal — exposition graduelle, travail de distance seuil et coaching pour tous les âges.",
    },
  },
  "level-1-obedience-class": {
    title: {
      en: "Level 1 Obedience Class — Montreal",
      fr: "Cours d'obéissance niveau 1 — Montréal",
    },
    description: {
      en: "Level 1 basic obedience in Montreal — six core commands, engagement, and neutral behavior around distractions.",
      fr:
        "Obéissance de base niveau 1 à Montréal — six commandes, engagement et comportement neutre autour des distractions.",
    },
  },
  "level-2-obedience-class": {
    title: {
      en: "Level 2 Obedience Class — Montreal",
      fr: "Cours d'obéissance niveau 2 — Montréal",
    },
    description: {
      en: "Level 2 pack walks in Montreal — group walks for confidence, obedience, and real-world proofing after Level 1.",
      fr:
        "Obéissance niveau 2 à Montréal — marches en meute pour la confiance, l'obéissance et la généralisation en conditions réelles.",
    },
  },
  "level-3-obedience-class": {
    title: {
      en: "Level 3 Obedience Class — Montreal",
      fr: "Cours d'obéissance niveau 3 — Montréal",
    },
    description: {
      en: "Level 3 advanced obedience coming soon in Montreal — off-leash reliability for teams ready after Level 2.",
      fr:
        "Obéissance avancée niveau 3 bientôt à Montréal — fiabilité sans laisse pour les équipes prêtes après le niveau 2.",
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
