import type { Metadata } from "next"
import { Activity, CalendarClock, GitCommitHorizontal, Rocket, TrendingUp } from "lucide-react"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IMPACT_CHANGE_EVENTS,
  formatTorontoDateTime,
  loadInquiryImpactDashboardData,
  type DailyInquiryCount,
  type ImpactChangeEvent,
  type ImpactChangeRow,
} from "@/lib/inquiry-impact"
import { noIndexMetadata } from "@/lib/seo"

export const dynamic = "force-dynamic"

export const metadata: Metadata = noIndexMetadata(
  "Inquiry Impact Dashboard",
  "Internal view of production changes and inquiry counts.",
)

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-CA").format(value)
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: number | string
  detail: string
  icon: typeof Activity
}) {
  return (
    <Card className="rounded-lg border-border/70 bg-card/90 py-5 shadow-sm">
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {typeof value === "number" ? formatNumber(value) : value}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
          </div>
          <span className="rounded-lg border border-border bg-muted/40 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function DailyBars({ dailyCounts }: { dailyCounts: DailyInquiryCount[] }) {
  const maxCount = Math.max(1, ...dailyCounts.map((day) => day.count))

  return (
    <div className="space-y-2">
      {dailyCounts.map((day) => (
        <div
          key={day.date}
          className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-sm"
        >
          <div className="font-medium tabular-nums text-foreground">{day.date}</div>
          <div className="h-8 rounded-lg bg-muted">
            <div
              className="flex h-8 min-w-2 items-center justify-end rounded-lg bg-primary/80 pr-2 text-xs font-semibold text-primary-foreground transition-all"
              style={{ width: `${Math.max(4, (day.count / maxCount) * 100)}%` }}
            >
              {day.count > 0 ? day.count : ""}
            </div>
          </div>
          <div className="text-right tabular-nums text-muted-foreground">{day.cumulative}</div>
        </div>
      ))}
    </div>
  )
}

function ChangeImpactTable({ rows }: { rows: ImpactChangeRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[9rem]">Deploy</TableHead>
          <TableHead className="min-w-[8rem]">Commit</TableHead>
          <TableHead className="min-w-[22rem]">Change</TableHead>
          <TableHead className="text-right">Since</TableHead>
          <TableHead className="text-right">7d Before</TableHead>
          <TableHead className="text-right">7d After</TableHead>
          <TableHead className="min-w-[10rem]">Top Issue Since</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const afterLabel = row.next7dWindowComplete
            ? formatNumber(row.next7dCount)
            : `${formatNumber(row.next7dCount)} partial`

          return (
            <TableRow key={row.id}>
              <TableCell className="align-top whitespace-normal">
                <div className="font-medium text-foreground">{formatTorontoDateTime(row.deployedAtIso)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Deployment {row.deploymentId}</div>
              </TableCell>
              <TableCell className="align-top">
                <div className="font-mono text-sm text-foreground">{row.shortSha}</div>
                <Badge variant="outline" className="mt-2 rounded-md">
                  {row.category}
                </Badge>
              </TableCell>
              <TableCell className="align-top whitespace-normal">
                <div className="font-medium text-foreground">{row.commitTitle}</div>
                <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted-foreground">
                  {row.highlights.map((highlight) => (
                    <li key={highlight}>- {highlight}</li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="align-top text-right tabular-nums font-semibold">
                {formatNumber(row.sinceCount)}
              </TableCell>
              <TableCell className="align-top text-right tabular-nums">
                {formatNumber(row.prior7dCount)}
              </TableCell>
              <TableCell className="align-top text-right tabular-nums">{afterLabel}</TableCell>
              <TableCell className="align-top whitespace-normal text-sm text-muted-foreground">
                {row.topIssue || "-"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function StaticChangeLogTable({ rows }: { rows: ImpactChangeEvent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[9rem]">Deploy</TableHead>
          <TableHead className="min-w-[8rem]">Commit</TableHead>
          <TableHead className="min-w-[22rem]">Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="align-top whitespace-normal">
              <div className="font-medium text-foreground">{formatTorontoDateTime(row.deployedAtIso)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Deployment {row.deploymentId}</div>
            </TableCell>
            <TableCell className="align-top">
              <div className="font-mono text-sm text-foreground">{row.shortSha}</div>
              <Badge variant="outline" className="mt-2 rounded-md">
                {row.category}
              </Badge>
            </TableCell>
            <TableCell className="align-top whitespace-normal">
              <div className="font-medium text-foreground">{row.commitTitle}</div>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted-foreground">
                {row.highlights.map((highlight) => (
                  <li key={highlight}>- {highlight}</li>
                ))}
              </ul>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default async function ImpactPage() {
  let data: Awaited<ReturnType<typeof loadInquiryImpactDashboardData>> | null = null
  let loadError: string | null = null

  try {
    data = await loadInquiryImpactDashboardData()
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load inquiry impact data."
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border bg-muted/25 px-6 pb-10 pt-28 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                Production Impact
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                Inquiry and change log
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Production deploys lined up against daily website inquiry volume. Counts are grouped by
                Toronto date and exclude client names, emails, and phone numbers.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                The change log comes from the tracked production commits. Inquiry trend counts are read
                from Firebase Firestore, where the website stores submitted inquiry records.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/80 p-4 text-sm shadow-sm">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Rocket className="h-4 w-4 text-primary" />
                Latest production deploy
              </div>
              <p className="mt-2 text-muted-foreground">
                {formatTorontoDateTime(data?.latestProductionDeployIso || "2026-06-15T22:41:58.000Z")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                GitHub pushed {formatTorontoDateTime(data?.latestGithubPushIso || "2026-06-15T22:41:11.000Z")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {loadError ? (
            <Card className="rounded-lg border-destructive/30 bg-destructive/5 py-5">
              <CardHeader>
                <CardTitle>Inquiry data unavailable</CardTitle>
                <CardDescription>
                  The commit change log is still shown below. Live inquiry counts need Firebase Admin credentials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{loadError}</p>
              </CardContent>
            </Card>
          ) : null}

          {data ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                  label="All Inquiries"
                  value={data.totals.allTimeInquiryCount}
                  detail={`${data.scanned.inquiryDocs} inquiry docs across ${data.scanned.consultationDocs} consultation docs.`}
                  icon={Activity}
                />
                <MetricCard
                  label="Last 7 Days"
                  value={data.totals.last7DaysInquiryCount}
                  detail="Rolling 7-day count from live Firestore."
                  icon={TrendingUp}
                />
                <MetricCard
                  label="Since Q&A Removed"
                  value={data.totals.sinceQuestionsRemovedCount}
                  detail="Since the May 17 two-step inquiry flow deploy."
                  icon={GitCommitHorizontal}
                />
                <MetricCard
                  label="Since Reframe"
                  value={data.totals.sinceHomepageReframeCount}
                  detail="Since the June 11 homepage inquiry copy deploy."
                  icon={CalendarClock}
                />
                <MetricCard
                  label="Since Latest"
                  value={data.totals.sinceLatestDeployCount}
                  detail="Since the most recent production deployment."
                  icon={Rocket}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <Card className="rounded-lg py-6">
                  <CardHeader>
                    <CardTitle>Inquiries Per Day</CardTitle>
                    <CardDescription>
                      Daily inquiry volume since the first tracked inquiry-flow deploy. Right column is cumulative.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DailyBars dailyCounts={data.dailyCounts} />
                  </CardContent>
                </Card>

                <Card className="rounded-lg py-6">
                  <CardHeader>
                    <CardTitle>Data Scan</CardTitle>
                    <CardDescription>Firestore documents included in this read-only aggregation.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Client records with consultations</span>
                      <span className="font-semibold tabular-nums">{data.scanned.clientDocsWithConsultations}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Consultation records</span>
                      <span className="font-semibold tabular-nums">{data.scanned.consultationDocs}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Inquiry records</span>
                      <span className="font-semibold tabular-nums">{data.scanned.inquiryDocs}</span>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Generated</p>
                      <p className="mt-1 font-medium">{formatTorontoDateTime(data.generatedAtIso)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-lg py-6">
                <CardHeader>
                  <CardTitle>Commit Impact Log</CardTitle>
                  <CardDescription>
                    Production deployment events with inquiry totals since each change and 7-day before/after counts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangeImpactTable rows={data.changeRows} />
                </CardContent>
              </Card>

              <Card className="rounded-lg py-6">
                <CardHeader>
                  <CardTitle>Daily Table</CardTitle>
                  <CardDescription>Same inquiry series as a table for quick copying.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Inquiries</TableHead>
                        <TableHead className="text-right">Cumulative</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.dailyCounts.map((day) => (
                        <TableRow key={day.date}>
                          <TableCell className="font-medium">{day.date}</TableCell>
                          <TableCell className="text-right tabular-nums">{day.count}</TableCell>
                          <TableCell className="text-right tabular-nums">{day.cumulative}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : null}

          {!data ? (
            <Card className="rounded-lg py-6">
              <CardHeader>
                <CardTitle>Tracked Production Changes</CardTitle>
                <CardDescription>
                  These are the commits used to line up website changes against inquiry trends once
                  Firestore counts are available.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaticChangeLogTable rows={IMPACT_CHANGE_EVENTS} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </main>
  )
}
