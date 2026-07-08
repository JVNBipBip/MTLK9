import type { BlogPost, BlogPostSlug } from "@/lib/blog/types"
import { post as chooseDogTrainerMontreal } from "@/lib/blog/posts/choose-dog-trainer-montreal"
import { post as realReasonDogIsReactive } from "@/lib/blog/posts/real-reason-dog-is-reactive"
import { post as separationAnxietySignsMythsHelp } from "@/lib/blog/posts/separation-anxiety-signs-myths-help"
import { post as socializePuppyWithoutOverwhelming } from "@/lib/blog/posts/socialize-puppy-without-overwhelming"
import { post as whyYourDogPullsOnTheLeash } from "@/lib/blog/posts/why-your-dog-pulls-on-the-leash"
import { post as whatHappensInDogTrainingEvaluation } from "@/lib/blog/posts/what-happens-in-dog-training-evaluation"

/** All published posts, newest first (by datePublished). */
export const blogPosts: BlogPost[] = [
  chooseDogTrainerMontreal,
  realReasonDogIsReactive,
  separationAnxietySignsMythsHelp,
  socializePuppyWithoutOverwhelming,
  whyYourDogPullsOnTheLeash,
  whatHappensInDogTrainingEvaluation,
].sort((a, b) => b.datePublished.localeCompare(a.datePublished))

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getBlogPostSlugs(): BlogPostSlug[] {
  return blogPosts.map((post) => post.slug)
}
