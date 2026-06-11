import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // Force blocking (non-streamed) metadata for every user agent so that
  // title/description/canonical/hreflang/OG always render inside <head>.
  // Every route is dynamic (locale comes from headers()), so without this
  // Next streams metadata into the body, which Lighthouse, social scrapers,
  // and stricter crawlers do not pick up.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Legacy fr. subdomain → canonical www French routes (one host for Google).
      {
        source: "/en/:path*",
        has: [{ type: "host", value: "fr.mtlcaninetraining.com" }],
        destination: "https://www.mtlcaninetraining.com/fr/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "fr.mtlcaninetraining.com" }],
        destination: "https://www.mtlcaninetraining.com/fr/:path*",
        permanent: true,
      },
      // Legacy pre-migration paths still indexed in Google (currently 404 after
      // the locale redirect). Locale-prefixed rules first, then bare paths.
      { source: "/:locale(en|fr)/contact-us", destination: "/:locale/booking", permanent: true },
      { source: "/contact-us", destination: "/en/booking", permanent: true },
      { source: "/:locale(en|fr)/testimonials", destination: "/:locale/results", permanent: true },
      { source: "/testimonials", destination: "/en/results", permanent: true },
      { source: "/:locale(en|fr)/faqs", destination: "/:locale/faq", permanent: true },
      { source: "/faqs", destination: "/en/faq", permanent: true },
      { source: "/:locale(en|fr)/gallery", destination: "/:locale/results", permanent: true },
      { source: "/gallery", destination: "/en/results", permanent: true },
      {
        source: "/:locale(en|fr)/in-home-dog-training-services",
        destination: "/:locale/services/in-home",
        permanent: true,
      },
      { source: "/in-home-dog-training-services", destination: "/en/services/in-home", permanent: true },
      // Deterministic 308s for legacy no-locale paths Google still treats as
      // canonical (GSC: /services 1,382 impr, /about 464 impr). The proxy's
      // locale-detect 307 is too weak a canonical signal.
      { source: "/services/:path*", destination: "/en/services/:path*", permanent: true },
      { source: "/services", destination: "/en/services", permanent: true },
      { source: "/about", destination: "/en/about", permanent: true },
      { source: "/results", destination: "/en/results", permanent: true },
      { source: "/faq", destination: "/en/faq", permanent: true },
      { source: "/blog", destination: "/en/blog", permanent: true },
      { source: "/group-classes", destination: "/en/group-classes", permanent: true },
      { source: "/:locale(en|fr)/session-with-nick", destination: "/:locale/booking", permanent: true },
      { source: "/session-with-nick", destination: "/en/booking", permanent: true },
      // Old Squarespace shop pages.
      { source: "/s/:path*", destination: "/en", permanent: true },
      { source: "/product/:path*", destination: "/en", permanent: true },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ]
  },
}

export default withNextIntl(nextConfig)
