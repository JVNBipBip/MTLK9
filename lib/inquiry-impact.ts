import "server-only"

import { CONSULTATIONS_COLLECTION } from "@/lib/domain"
import { getAdminDb } from "@/lib/firebase-admin"
import { CLIENT_CONSULTATIONS_SUBCOLLECTION, listClientSubcollectionDocs } from "@/lib/client-records"

const TORONTO_TIME_ZONE = "America/Toronto"
const ONE_DAY_MS = 24 * 60 * 60 * 1000

export type ImpactChangeEvent = {
  id: string
  shortSha: string
  commitSha: string
  commitTitle: string
  committedAtIso: string
  deployedAtIso: string
  deploymentId: number
  category: "Inquiry flow" | "Booking backend" | "Copy" | "SEO" | "Homepage" | "Latest release"
  highlights: string[]
}

export const IMPACT_CHANGE_EVENTS: ImpactChangeEvent[] = [
  {
    id: "inquiry-direct-submit",
    shortSha: "70b181a",
    commitSha: "70b181a3052ea0c7d0e55925b2e4dcb74de2250e",
    commitTitle: "submit inquiry directly from option card with distinct amber styling",
    committedAtIso: "2026-05-17T00:50:56.000Z",
    deployedAtIso: "2026-05-17T00:51:41.000Z",
    deploymentId: 4714989608,
    category: "Inquiry flow",
    highlights: [
      "Inquiry option submits immediately from the option card.",
      "Added loading/disabled states and stronger amber styling for the inquiry choice.",
    ],
  },
  {
    id: "questions-removed",
    shortSha: "55f0b6c",
    commitSha: "55f0b6c4c070d60df48b9a104bc889e5c0bbe7f5",
    commitTitle: "big changes for list of fixes and additions needed for nick",
    committedAtIso: "2026-05-17T18:15:13.000Z",
    deployedAtIso: "2026-05-17T18:16:03.000Z",
    deploymentId: 4720246708,
    category: "Inquiry flow",
    highlights: [
      "Cut the booking/inquiry form from 5 steps to 2 steps.",
      "Removed extended follow-up questions and goal questions from the active intake.",
      "Combined contact and dog details into the new 'Tell us about you and your dog' step.",
      "Removed the separate extra inquiry-message form; inquiry sends from the main flow.",
    ],
  },
  {
    id: "deposit-backend-fix",
    shortSha: "e052dec",
    commitSha: "e052dec92420a0acbd8400c1f73941f9a164b48d",
    commitTitle: "lots of fixes, including backend, styling, formatting but mainly took out bookings and deposits for consultation",
    committedAtIso: "2026-05-19T02:36:14.000Z",
    deployedAtIso: "2026-05-19T02:37:05.000Z",
    deploymentId: 4736642162,
    category: "Booking backend",
    highlights: [
      "Disabled the $30 deposit checkout path and moved selected consultation slots to direct booking handling.",
      "Synced inquiry details to Square customer notes without blocking form submission.",
      "Added resume links for inquiry submitters to return to scheduling.",
    ],
  },
  {
    id: "puppy-label-change",
    shortSha: "3ef65f0",
    commitSha: "3ef65f0ac50c6b695a0b39f241f9b9f99e2050db",
    commitTitle: "some small mods for nick",
    committedAtIso: "2026-05-23T01:30:25.000Z",
    deployedAtIso: "2026-05-23T01:31:13.000Z",
    deploymentId: 4790186034,
    category: "Copy",
    highlights: [
      "Changed 'Puppy training' to 'Puppy training / Young dog training'.",
      "Matched the French option label to include young-dog training.",
    ],
  },
  {
    id: "email-fix",
    shortSha: "bd5e3d4",
    commitSha: "bd5e3d4b758c3c0032ebe42a83a02049ee9d1f35",
    commitTitle: "email fix",
    committedAtIso: "2026-05-24T15:48:44.000Z",
    deployedAtIso: "2026-05-24T15:49:32.000Z",
    deploymentId: 4801265421,
    category: "Booking backend",
    highlights: [
      "Adjusted booking API email handling around consultation submissions.",
    ],
  },
  {
    id: "technical-seo",
    shortSha: "63d8efb",
    commitSha: "63d8efb8f17b7d5551dd58278fbd44fb6dc7261a",
    commitTitle: "Technical SEO: fix migration debt (sitemap host, head metadata, redirects, schema)",
    committedAtIso: "2026-06-11T00:11:11.000Z",
    deployedAtIso: "2026-06-11T00:12:41.000Z",
    deploymentId: 5012958198,
    category: "SEO",
    highlights: [
      "Fixed canonical host, sitemap, robots, metadata streaming, redirects, schema, and OG fallback coverage.",
      "Server-rendered the booking H1 so `/booking` has crawlable content before client redirect.",
    ],
  },
  {
    id: "legacy-redirects",
    shortSha: "2fee288",
    commitSha: "2fee288cd6d1e2cf0b7afd50f87530924c17700a",
    commitTitle: "SEO: deterministic 308s for legacy no-locale paths; remove self-serving aggregateRating",
    committedAtIso: "2026-06-11T01:13:42.000Z",
    deployedAtIso: "2026-06-11T01:14:29.000Z",
    deploymentId: 5013425834,
    category: "SEO",
    highlights: [
      "Added deterministic permanent redirects for legacy no-locale paths.",
      "Removed the aggregateRating markup that was too self-serving.",
    ],
  },
  {
    id: "fr-host-homepage-fixes",
    shortSha: "a070752",
    commitSha: "a0707523791fd9c1ed33742fd08f16b681f8cf68",
    commitTitle: "fr-host redirect in middleware (Vercel order) + homepage UX fixes",
    committedAtIso: "2026-06-11T15:59:12.000Z",
    deployedAtIso: "2026-06-11T16:00:11.000Z",
    deploymentId: 5022930047,
    category: "SEO",
    highlights: [
      "Moved French-host redirect handling into middleware so it runs in Vercel order.",
      "Included homepage UX polish in the same release.",
    ],
  },
  {
    id: "homepage-counter-nav",
    shortSha: "bed74d9",
    commitSha: "bed74d99c77c209a7e05693ca65a6ed470c42360",
    commitTitle: "Homepage: fix story counter (3 shown, counted whole library) + solid black desktop nav",
    committedAtIso: "2026-06-11T16:20:47.000Z",
    deployedAtIso: "2026-06-11T16:21:47.000Z",
    deploymentId: 5023219922,
    category: "Homepage",
    highlights: [
      "Fixed homepage story counter mismatch.",
      "Changed the desktop navigation to solid black.",
    ],
  },
  {
    id: "homepage-inquiry-reframe",
    shortSha: "6aeec11",
    commitSha: "6aeec11aa83d43efad3de999356bd951b7c3d0d0",
    commitTitle: "Results + homepage: vertical videos everywhere, all 5 stories on homepage, highlighted Before/After, step-1 inquiry reframe",
    committedAtIso: "2026-06-11T16:26:15.000Z",
    deployedAtIso: "2026-06-11T17:03:10.000Z",
    deploymentId: 5023741671,
    category: "Homepage",
    highlights: [
      "Changed How It Works step 1 from 'Contact Us for a Free Call' to 'See If Your Dog Qualifies'.",
      "Rewrote step 1 to push a quick inquiry before the evaluation session.",
      "Showed all five transformation stories and improved Before/After treatment.",
    ],
  },
  {
    id: "reviews-cta",
    shortSha: "2df2c5d",
    commitSha: "2df2c5d8c3bfb67afe2bad7fea19eaf9a87ed9bb",
    commitTitle: "Update homepage reviews and CTA styling",
    committedAtIso: "2026-06-11T23:58:51.000Z",
    deployedAtIso: "2026-06-12T00:02:24.000Z",
    deploymentId: 5028332068,
    category: "Homepage",
    highlights: [
      "Updated homepage review content and call-to-action styling.",
    ],
  },
  {
    id: "latest-location-fix",
    shortSha: "10e3b6d",
    commitSha: "10e3b6d52fcba7e2dea769124ead174cdd662dcb",
    commitTitle: "Merge remote-tracking branch 'origin'",
    committedAtIso: "2026-06-15T22:40:50.000Z",
    deployedAtIso: "2026-06-15T22:41:58.000Z",
    deploymentId: 5071966583,
    category: "Latest release",
    highlights: [
      "Latest production deploy; includes the location fix from commit 2b0966e.",
    ],
  },
]

export const LATEST_GITHUB_PUSH_ISO = "2026-06-15T22:41:11.000Z"
export const LATEST_PRODUCTION_DEPLOY_ISO = "2026-06-15T22:41:58.000Z"

type InquiryItem = {
  id: string
  submittedAtIso: string
  issue: string
  source: string
  status: string
  docPath: string
}

export type DailyInquiryCount = {
  date: string
  count: number
  cumulative: number
}

export type ImpactChangeRow = ImpactChangeEvent & {
  prior7dCount: number
  next7dCount: number
  next7dWindowComplete: boolean
  sinceCount: number
  topIssue: string | null
}

export type InquiryImpactDashboardData = {
  generatedAtIso: string
  latestGithubPushIso: string
  latestProductionDeployIso: string
  scanned: {
    clientDocsWithConsultations: number
    consultationDocs: number
    inquiryDocs: number
  }
  totals: {
    allTimeInquiryCount: number
    last7DaysInquiryCount: number
    sinceQuestionsRemovedCount: number
    sinceHomepageReframeCount: number
    sinceLatestDeployCount: number
  }
  dailyCounts: DailyInquiryCount[]
  changeRows: ImpactChangeRow[]
}

const torontoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TORONTO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function asValidIso(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? date.toISOString() : null
  }
  if (value && typeof value === "object" && "toDate" in value) {
    const maybeTimestamp = value as { toDate?: () => Date }
    if (typeof maybeTimestamp.toDate !== "function") return null
    const date = maybeTimestamp.toDate()
    return date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : null
  }
  return null
}

function clientIdFromConsultationPath(path: string) {
  return path.match(/^clients\/([^/]+)\/consultations\//)?.[1] || null
}

function dateKeyInToronto(iso: string) {
  return torontoDateFormatter.format(new Date(iso))
}

function addDaysIso(iso: string, days: number) {
  return new Date(new Date(iso).getTime() + days * ONE_DAY_MS).toISOString()
}

function minIso(a: string, b: string) {
  return a < b ? a : b
}

function normalizeIssue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "unknown"
}

function issueDisplayName(issue: string) {
  const labels: Record<string, string> = {
    "puppy-out-of-control": "Puppy / young dog",
    "pulls-lunges-reacts": "Leash pulling / reactivity",
    "aggression-safety": "Aggression / safety",
    "better-obedience": "Obedience / off-leash",
    "sport-training": "Sport training",
    "anxiety-fear-separation": "Anxiety / fear / separation",
    unknown: "Unknown",
  }
  return labels[issue] || issue
}

function normalizeConsultationDoc(doc: { id: string; ref: { path: string }; data: () => Record<string, unknown> }) {
  const data = doc.data()
  const submittedAtIso = asValidIso(data.submittedAtIso) || asValidIso(data.createdAt)
  if (!submittedAtIso) return null
  if (data.consultationSubmissionKind !== "inquiry") return null

  return {
    id: typeof data.id === "string" && data.id.trim() ? data.id : doc.id,
    submittedAtIso,
    issue: normalizeIssue(data.issue),
    source: typeof data.source === "string" ? data.source : "",
    status: typeof data.status === "string" ? data.status : "",
    docPath: doc.ref.path,
  } satisfies InquiryItem
}

function countInRange(items: InquiryItem[], startIso: string, endIso: string) {
  return items.filter((item) => item.submittedAtIso >= startIso && item.submittedAtIso < endIso).length
}

function topIssueInRange(items: InquiryItem[], startIso: string, endIso: string) {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (item.submittedAtIso < startIso || item.submittedAtIso >= endIso) continue
    counts.set(item.issue, (counts.get(item.issue) || 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  return top ? `${issueDisplayName(top[0])} (${top[1]})` : null
}

function buildDailyCounts(items: InquiryItem[], startIso: string, endIso: string): DailyInquiryCount[] {
  const byDay = new Map<string, number>()
  for (const item of items) {
    if (item.submittedAtIso < startIso || item.submittedAtIso >= endIso) continue
    const key = dateKeyInToronto(item.submittedAtIso)
    byDay.set(key, (byDay.get(key) || 0) + 1)
  }

  const keys = new Set<string>()
  let cursorMs = new Date(startIso).getTime()
  const endMs = new Date(endIso).getTime()
  while (cursorMs <= endMs) {
    keys.add(dateKeyInToronto(new Date(cursorMs).toISOString()))
    cursorMs += ONE_DAY_MS
  }
  keys.add(dateKeyInToronto(endIso))

  let cumulative = 0
  return [...keys]
    .sort()
    .map((date) => {
      const count = byDay.get(date) || 0
      cumulative += count
      return { date, count, cumulative }
    })
}

async function loadInquiryItems() {
  const db = getAdminDb()
  const nestedDocs = await listClientSubcollectionDocs(db, CLIENT_CONSULTATIONS_SUBCOLLECTION, 1000)
  const rootSnap = await db.collection(CONSULTATIONS_COLLECTION).limit(1000).get()
  const docs = [...nestedDocs, ...rootSnap.docs]

  const seenPaths = new Set<string>()
  const uniqueDocs = docs.filter((doc) => {
    if (seenPaths.has(doc.ref.path)) return false
    seenPaths.add(doc.ref.path)
    return true
  })

  const items = uniqueDocs
    .map((doc) => normalizeConsultationDoc(doc))
    .filter((item): item is InquiryItem => Boolean(item))
    .sort((a, b) => a.submittedAtIso.localeCompare(b.submittedAtIso))

  return {
    items,
    scanned: {
      clientDocsWithConsultations: new Set(
        uniqueDocs.map((doc) => clientIdFromConsultationPath(doc.ref.path)).filter(Boolean),
      ).size,
      consultationDocs: uniqueDocs.length,
      inquiryDocs: items.length,
    },
  }
}

export async function loadInquiryImpactDashboardData(): Promise<InquiryImpactDashboardData> {
  const generatedAtIso = new Date().toISOString()
  const { items, scanned } = await loadInquiryItems()
  const earliestEventIso = IMPACT_CHANGE_EVENTS[0]?.deployedAtIso || generatedAtIso
  const last7StartIso = addDaysIso(generatedAtIso, -7)
  const questionsRemovedIso =
    IMPACT_CHANGE_EVENTS.find((event) => event.id === "questions-removed")?.deployedAtIso || earliestEventIso
  const homepageReframeIso =
    IMPACT_CHANGE_EVENTS.find((event) => event.id === "homepage-inquiry-reframe")?.deployedAtIso || earliestEventIso

  const changeRows = IMPACT_CHANGE_EVENTS.map((event) => {
    const prior7dStartIso = addDaysIso(event.deployedAtIso, -7)
    const next7dEndIso = addDaysIso(event.deployedAtIso, 7)
    const cappedNext7dEndIso = minIso(next7dEndIso, generatedAtIso)
    return {
      ...event,
      prior7dCount: countInRange(items, prior7dStartIso, event.deployedAtIso),
      next7dCount: countInRange(items, event.deployedAtIso, cappedNext7dEndIso),
      next7dWindowComplete: next7dEndIso <= generatedAtIso,
      sinceCount: countInRange(items, event.deployedAtIso, generatedAtIso),
      topIssue: topIssueInRange(items, event.deployedAtIso, generatedAtIso),
    }
  })

  return {
    generatedAtIso,
    latestGithubPushIso: LATEST_GITHUB_PUSH_ISO,
    latestProductionDeployIso: LATEST_PRODUCTION_DEPLOY_ISO,
    scanned,
    totals: {
      allTimeInquiryCount: items.length,
      last7DaysInquiryCount: countInRange(items, last7StartIso, generatedAtIso),
      sinceQuestionsRemovedCount: countInRange(items, questionsRemovedIso, generatedAtIso),
      sinceHomepageReframeCount: countInRange(items, homepageReframeIso, generatedAtIso),
      sinceLatestDeployCount: countInRange(items, LATEST_PRODUCTION_DEPLOY_ISO, generatedAtIso),
    },
    dailyCounts: buildDailyCounts(items, earliestEventIso, generatedAtIso),
    changeRows,
  }
}

export function formatTorontoDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso))
}
