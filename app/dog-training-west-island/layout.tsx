import type { Metadata } from "next"
import { JsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { locationPages } from "@/lib/location-pages"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

const page = locationPages["west-island"]

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: page.path,
    title: page.metadata.title,
    description: page.metadata.description,
    image: page.image,
  })
}

export default async function WestIslandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getRequestLocale()
  const copy = page.content[locale]

  return (
    <>
      <JsonLd
        data={buildServiceJsonLd({
          name: page.serviceSchema.name[locale],
          description: page.serviceSchema.description[locale],
          path: page.path,
          locale,
          areaServed: page.areaServed,
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd(
          [
            { name: locale === "fr" ? "Accueil" : "Home", path: "/" },
            { name: copy.h1, path: page.path },
          ],
          locale,
        )}
      />
      <JsonLd data={buildFaqJsonLd(copy.faqs)} />
      {children}
    </>
  )
}
