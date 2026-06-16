import type { MetadataRoute } from "next"

const privateDisallowPaths = [
  "/api/",
  "/booking-access/",
  "/booking/resume/",
  "/training-portal/",
  "/checkout/",
  "/impact",
  "/en/impact",
  "/fr/impact",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateDisallowPaths,
      },
      // Explicitly allow LLM crawlers
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: privateDisallowPaths,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: privateDisallowPaths,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: privateDisallowPaths,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privateDisallowPaths,
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: privateDisallowPaths,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: privateDisallowPaths,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: privateDisallowPaths,
      },
      {
        userAgent: "Bytespider",
        allow: "/",
        disallow: privateDisallowPaths,
      },
      {
        userAgent: "cohere-ai",
        allow: "/",
        disallow: privateDisallowPaths,
      },
    ],
    sitemap: "https://www.mtlcaninetraining.com/sitemap.xml",
  }
}
