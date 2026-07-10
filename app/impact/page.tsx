import type { Metadata } from "next"
import { Activity, CalendarClock, Gauge, Languages, Rocket, TrendingUp, Users } from "lucide-react"
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
  loadInquiryImpactSnapshots,
  type DailyInquiryCount,
  type ImpactChangeEvent,
  type ImpactChangeRow,
  type InquiryImpactSnapshot,
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

function formatLabel(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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
  let snapshots: InquiryImpactSnapshot[] = []
  let loadError: string | null = null
  let snapshotLoadError: string | null = null

  try {
    data = await loadInquiryImpactDashboardData()
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load inquiry impact data."
  }

  if (data) {
    try {
      snapshots = await loadInquiryImpactSnapshots()
    } catch (error) {
      snapshotLoadError = error instanceof Error ? error.message : "Could not load daily snapshots."
    }
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
                Live website submissions, language mix, and production changes in one place. Counts are
                grouped by Toronto date and exclude client names, emails, phone numbers, and dog names.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                The change log comes from the tracked production commits. Inquiry trend counts are read
                from Firebase Firestore, where the website stores submitted inquiry records.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/80 p-4 text-sm shadow-sm">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Activity className="h-4 w-4 text-primary" />
                Current report
              </div>
              <p className="mt-2 text-muted-foreground">
                Generated {data ? formatTorontoDateTime(data.generatedAtIso) : "when inquiry data is available"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest daily snapshot: {snapshots[0] ? formatTorontoDateTime(snapshots[0].generatedAtIso) : "pending"}
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
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <MetricCard
                  label="All Inquiries"
                  value={data.totals.allTimeInquiryCount}
                  detail={`${data.scanned.inquiryDocs} inquiry docs across ${data.scanned.consultationDocs} consultation docs.`}
                  icon={Activity}
                />
                <MetricCard
                  label="Last 30 Days"
                  value={data.totals.last30DaysInquiryCount}
                  detail="Canonical baseline from completed website inquiry records."
                  icon={TrendingUp}
                />
                <MetricCard
                  label="Daily Average"
                  value={data.totals.last30DayDailyAverage.toFixed(2)}
                  detail="Average completed inquiries per day over the rolling 30-day window."
                  icon={Gauge}
                />
                <MetricCard
                  label="Scheduled / Completed"
                  value={data.totals.last30DaysScheduledOrCompletedCount}
                  detail="Last-30-day inquiries currently marked scheduled or completed."
                  icon={CalendarClock}
                />
                <MetricCard
                  label="Last 7 Days"
                  value={data.totals.last7DaysInquiryCount}
                  detail="Rolling 7-day count from live Firestore."
                  icon={Rocket}
                />
                <MetricCard
                  label="Experiment Tagged"
                  value={data.welcomeExperiment.taggedInquiryCount}
                  detail={`${data.welcomeExperiment.holdoutInquiryCount} holdout; ${data.welcomeExperiment.treatmentInquiryCount} treatment.`}
                  icon={Users}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-lg py-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-primary" />
                      Last-30-day language split
                    </CardTitle>
                    <CardDescription>
                      Taken from the English or French site locale that submitted each inquiry.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div className="border-b border-border pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                      <p className="text-sm text-muted-foreground">English</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">{data.last30Language.englishCount}</p>
                    </div>
                    <div className="border-b border-border pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                      <p className="text-sm text-muted-foreground">French</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">{data.last30Language.frenchCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unknown / legacy</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">{data.last30Language.unknownCount}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-lg py-6">
                  <CardHeader>
                    <CardTitle>Scheduled reporting</CardTitle>
                    <CardDescription>
                      Vercel records one aggregate snapshot every day. The live totals above update on every page load.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                      <span className="text-muted-foreground">Schedule</span>
                      <span className="font-medium">Daily at 12:15 UTC</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Latest snapshot</span>
                      <span className="text-right font-medium">
                        {snapshots[0] ? formatTorontoDateTime(snapshots[0].generatedAtIso) : "Pending first run"}
                      </span>
                    </div>
                    {snapshotLoadError ? (
                      <p className="text-xs text-destructive">Snapshot history unavailable: {snapshotLoadError}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <Card className="rounded-lg py-6">
                  <CardHeader>
                    <CardTitle>30-Day Inquiry Baseline</CardTitle>
                    <CardDescription>
                      Daily completed inquiry volume for the measurement window. Right column is cumulative.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DailyBars dailyCounts={data.last30DailyCounts} />
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
                  <CardTitle>Recent website submissions</CardTitle>
                  <CardDescription>
                    The 25 newest inquiries, without personal contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[11rem]">Submitted</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead className="min-w-[12rem]">Primary issue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Experiment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentInquiries.map((inquiry, index) => (
                        <TableRow key={`${inquiry.submittedAtIso}-${index}`}>
                          <TableCell className="whitespace-normal font-medium">
                            {formatTorontoDateTime(inquiry.submittedAtIso)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-md uppercase">
                              {inquiry.locale || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-normal">{inquiry.issue}</TableCell>
                          <TableCell>{formatLabel(inquiry.status)}</TableCell>
                          <TableCell className="whitespace-normal text-muted-foreground">
                            {formatLabel(inquiry.source)}
                          </TableCell>
                          <TableCell>
                            {inquiry.welcomeFlowCohort === "holdout"
                              ? "Holdout"
                              : inquiry.welcomeFlowVariant
                                ? `Treatment ${inquiry.welcomeFlowVariant.toUpperCase()}`
                                : "Pre-test"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="rounded-lg py-6">
                <CardHeader>
                  <CardTitle>Daily Vercel snapshots</CardTitle>
                  <CardDescription>
                    Stable daily aggregates for comparing form volume before and after the welcome flow launches.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {snapshots.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">All time</TableHead>
                          <TableHead className="text-right">Last 30d</TableHead>
                          <TableHead className="text-right">Last 7d</TableHead>
                          <TableHead className="text-right">Scheduled / completed</TableHead>
                          <TableHead className="text-right">EN</TableHead>
                          <TableHead className="text-right">FR</TableHead>
                          <TableHead className="text-right">Experiment tagged</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snapshots.map((snapshot) => (
                          <TableRow key={snapshot.date}>
                            <TableCell className="font-medium">{snapshot.date}</TableCell>
                            <TableCell className="text-right tabular-nums">{snapshot.totals.allTimeInquiryCount}</TableCell>
                            <TableCell className="text-right tabular-nums">{snapshot.totals.last30DaysInquiryCount}</TableCell>
                            <TableCell className="text-right tabular-nums">{snapshot.totals.last7DaysInquiryCount}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {snapshot.totals.last30DaysScheduledOrCompletedCount}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{snapshot.last30Language.englishCount}</TableCell>
                            <TableCell className="text-right tabular-nums">{snapshot.last30Language.frenchCount}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {snapshot.welcomeExperiment.taggedInquiryCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      The first row appears after the cron endpoint completes its first production run.
                    </p>
                  )}
                </CardContent>
              </Card>

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
