import type { Metadata } from "next"
import { JsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd, buildServiceJsonLd } from "@/components/json-ld"
import { moneyServicePages } from "@/lib/money-service-pages"
import { buildLocalizedMetadata, getRequestLocale } from "@/lib/seo"

const page = moneyServicePages.aggression

export function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    path: page.path,
    title: page.metadata.title,
    description: page.metadata.description,
    image: page.image,
  })
}

export default async function AggressionLayout({
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
          price: page.price,
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd(
          [
            { name: locale === "fr" ? "Accueil" : "Home", path: "/" },
            { name: locale === "fr" ? "Services" : "Services", path: "/services" },
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
