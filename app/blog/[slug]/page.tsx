import { notFound } from "next/navigation"
import { ArticleLayout } from "@/components/blog/article-layout"
import { blogPosts, getBlogPost } from "@/lib/blog"
import { getRequestLocale } from "@/lib/seo"

type BlogPostPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    notFound()
  }

  const locale = await getRequestLocale()

  return <ArticleLayout post={post} locale={locale} />
}
