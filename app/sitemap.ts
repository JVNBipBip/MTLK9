import type { MetadataRoute } from "next"

const BASE_URL = "https://mtlcaninetraining.com"

const paths = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/services", changeFrequency: "weekly", priority: 0.9 },
  { path: "/services/reactivity", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/private-classes", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/obedience", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/puppy-training", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/in-home", changeFrequency: "monthly", priority: 0.8 },
  { path: "/results", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.5 },
  { path: "/booking", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return paths.flatMap((entry) =>
    (["en", "fr"] as const).map((locale) => ({
      url: `${BASE_URL}/${locale}${entry.path}`,
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: {
        languages: {
          en: `${BASE_URL}/en${entry.path}`,
          fr: `${BASE_URL}/fr${entry.path}`,
        },
      },
    })),
  )
}
