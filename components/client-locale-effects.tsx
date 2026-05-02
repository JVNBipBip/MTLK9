"use client"

import { useEffect } from "react"
import { stripLocaleFromPathname, type AppLocale } from "@/lib/i18n/config"
import { frenchTextTranslations } from "@/lib/i18n/dom-translations"

const ATTRIBUTE_NAMES = ["aria-label", "alt", "placeholder", "title"]
const sortedTranslationEntries = Object.entries(frenchTextTranslations).sort((a, b) => b[0].length - a[0].length)
const translatedTextNodes = new WeakSet<Text>()

const frenchPageMetadata: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Entraînement Canin Montréal — Entraînement concret à Montréal",
    description:
      "Promenades calmes. Chiens confiants. Plans clairs. Coaching comportemental concret pour les chiens de Montréal.",
  },
  "/services": {
    title: "Entraînement canin — Entraînement Canin Montréal",
    description:
      "Choisissez le bon parcours pour votre chien : réactivité, cours privés, obéissance, chiots ou entraînement à domicile.",
  },
  "/services/reactivity": {
    title: "Entraînement pour la réactivité — Montréal",
    description: "Programmes privés et de groupe pour les chiens qui jappent, se lancent ou figent face aux déclencheurs.",
  },
  "/services/private-classes": {
    title: "Cours privés pour chiens — Montréal",
    description: "Coaching individuel pour le comportement, la réactivité, l'anxiété, l'agressivité et les objectifs personnalisés.",
  },
  "/services/obedience": {
    title: "Obéissance canine — Montréal",
    description: "Compétences fiables dans la vraie vie : rappel, marche en laisse, impulsions et distractions.",
  },
  "/services/puppy-training": {
    title: "Entraînement des chiots — Montréal",
    description: "Socialisation, confiance, inhibition de la morsure et bonnes bases pour chiots et jeunes chiens.",
  },
  "/services/in-home": {
    title: "Entraînement canin à domicile — Montréal",
    description: "Entraînement dans votre maison et votre quartier pour les problèmes qui apparaissent dans la vraie vie.",
  },
  "/group-classes": {
    title: "Cours de groupe pour chiens — Montréal",
    description: "Consultez les cours de groupe approuvés pour votre chien et demandez une place dans une série à venir.",
  },
  "/about": {
    title: "À propos — Entraînement Canin Montréal",
    description: "Découvrez notre équipe, notre philosophie et nos méthodes d'entraînement canin humaines et concrètes.",
  },
  "/blog": {
    title: "Conseils d'entraînement canin — Entraînement Canin Montréal",
    description: "Conseils, histoires et explications fondées sur la science pour les propriétaires de chiens à Montréal.",
  },
  "/results": {
    title: "Résultats et transformations — Entraînement Canin Montréal",
    description: "De vrais chiens, de vrais progrès et des histoires de transformation à Montréal.",
  },
  "/faq": {
    title: "FAQ — Entraînement Canin Montréal",
    description: "Réponses aux questions fréquentes sur les méthodes, les coûts, les délais et les programmes.",
  },
  "/booking": {
    title: "Réserver un appel gratuit — Entraînement Canin Montréal",
    description: "Parlez-nous de votre chien et trouvez le bon parcours d'entraînement.",
  },
  "/training-portal": {
    title: "Portail d'entraînement — Entraînement Canin Montréal",
    description: "Consultez vos options d'entraînement, forfaits privés et cours de groupe.",
  },
  "/privacy": {
    title: "Politique de confidentialité — Entraînement Canin Montréal",
    description: "Comment nous recueillons, utilisons et protégeons vos renseignements personnels.",
  },
  "/terms": {
    title: "Conditions d'utilisation — Entraînement Canin Montréal",
    description: "Conditions applicables à l'utilisation du site et des services d'Entraînement Canin Montréal.",
  },
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function preserveOuterWhitespace(original: string, replacement: string) {
  const leading = original.match(/^\s*/)?.[0] ?? ""
  const trailing = original.match(/\s*$/)?.[0] ?? ""
  return `${leading}${replacement}${trailing}`
}

function translateText(value: string) {
  const normalized = normalize(value)
  if (!normalized) return value

  const exact = frenchTextTranslations[normalized]
  if (exact) return preserveOuterWhitespace(value, exact)

  let translated = normalized
  for (const [english, french] of sortedTranslationEntries) {
    translated = translated.replaceAll(english, french)
  }

  if (translated !== normalized) return preserveOuterWhitespace(value, translated)
  return value
}

function shouldSkipElement(element: Element) {
  return ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT"].includes(element.tagName)
}

function translateTextNode(node: Text) {
  if (translatedTextNodes.has(node)) return
  const nextValue = translateText(node.textContent || "")
  if (nextValue !== node.textContent) node.textContent = nextValue
  translatedTextNodes.add(node)
}

function translateElementAttributes(element: Element) {
  if (!(element instanceof HTMLElement)) return
  for (const attributeName of ATTRIBUTE_NAMES) {
    const current = element.getAttribute(attributeName)
    if (!current) continue
    const nextValue = translateText(current)
    if (nextValue !== current) element.setAttribute(attributeName, nextValue)
  }
}

function translateNodeTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text)
    return
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return

  if (root.nodeType === Node.ELEMENT_NODE) {
    const element = root as Element
    if (shouldSkipElement(element)) return
    translateElementAttributes(element)
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT
      return normalize(node.textContent || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })

  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)

  for (const node of nodes) {
    translateTextNode(node)
  }

  if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    for (const element of Array.from((root as ParentNode).querySelectorAll<HTMLElement>("*"))) {
      translateElementAttributes(element)
    }
  }
}

export function ClientLocaleEffects({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    document.documentElement.lang = locale

    if (locale !== "fr") return

    const metadata = frenchPageMetadata[stripLocaleFromPathname(window.location.pathname)]
    if (metadata) {
      document.title = metadata.title
      document.querySelector('meta[name="description"]')?.setAttribute("content", metadata.description)
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", metadata.title)
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", metadata.description)
    }

    translateNodeTree(document.body)

    let frameId: number | null = null
    const pendingNodes = new Set<Node>()
    const flushPendingNodes = () => {
      frameId = null
      const nodes = Array.from(pendingNodes)
      pendingNodes.clear()
      for (const node of nodes) translateNodeTree(node)
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          pendingNodes.add(node)
        }
      }
      if (pendingNodes.size > 0 && frameId === null) {
        frameId = window.requestAnimationFrame(flushPendingNodes)
      }
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      if (frameId !== null) window.cancelAnimationFrame(frameId)
      pendingNodes.clear()
    }
  }, [locale])

  return null
}
