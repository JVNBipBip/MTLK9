import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
      // Explicitly allow LLM crawlers
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
      {
        userAgent: "Bytespider",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
      {
        userAgent: "cohere-ai",
        allow: "/",
        disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
      },
    ],
    sitemap: "https://mtlcaninetraining.com/sitemap.xml",
  }
}
