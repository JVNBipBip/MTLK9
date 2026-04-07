import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/booking-access/", "/training-portal/", "/checkout/"],
    },
    sitemap: "https://mtlcaninetraining.com/sitemap.xml",
  }
}
