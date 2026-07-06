import type { Metadata } from "next"
import { JsonLd, buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/components/json-ld"
import { getBlogPost } from "@/lib/blog"
import { buildLocalizedMetadata, getRequestLocale, localizedUrl, noIndexMetadata } from "@/lib/seo"

type BlogPostLayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: Pick<BlogPostLayoutProps, "params">): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    return noIndexMetadata("Article Not Found", "This article could not be found.")
  }

  return buildLocalizedMetadata({
    path: post.path,
    title: post.metadata.title,
    description: post.metadata.description,
    image: post.image,
    ogType: "article",
  })
}

export default async function BlogPostLayout({ children, params }: BlogPostLayoutProps) {
  const { slug } = await params
  const post = getBlogPost(slug)

  // Unknown slugs fall through to the page, which renders notFound().
  if (!post) return children

  const locale = await getRequestLocale()
  const copy = post.content[locale]

  return (
    <>
      <JsonLd
        data={buildArticleJsonLd({
          post,
          locale,
          url: localizedUrl(locale, post.path),
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd(
          [
            { name: locale === "fr" ? "Accueil" : "Home", path: "/" },
            { name: locale === "fr" ? "Blogue" : "Blog", path: "/blog" },
            { name: copy.title, path: post.path },
          ],
          locale,
        )}
      />
      <JsonLd data={buildFaqJsonLd(copy.faqs)} />
      {children}
    </>
  )
}
