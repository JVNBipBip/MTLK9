import { notFound } from "next/navigation"
import { getGroupClassOffering, groupClassOfferingIds } from "@/lib/group-class-offerings"
import { GroupClassDetailContent } from "../group-class-detail-content"

export function generateStaticParams() {
  return groupClassOfferingIds().map((slug) => ({ slug }))
}

export default async function GroupClassDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const offering = getGroupClassOffering(slug)
  if (!offering) notFound()
  return <GroupClassDetailContent offering={offering} />
}
