import { useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/states";
import { BreakdownCard } from "@/features/analytics/breakdown-card";
import { ClicksChart } from "@/features/analytics/clicks-chart";
import { RangeToggle, rangeKey } from "@/features/analytics/range-toggle";
import { RecentClicks } from "@/features/analytics/recent-clicks";
import { useLinkActions } from "@/features/links/link-actions";
import { useUser } from "@/providers/auth";
import { useI18n } from "@/i18n";
import { compactNumber } from "@/lib/format";
import { useOverview } from "./api";
import { QuickShorten } from "./quick-shorten";
import { Link2Icon, MousePointerClick } from "lucide-react";

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="gap-1 py-4">
      <CardHeader className="gap-0">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="tabular text-2xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="text-[13px] text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]" aria-busy="true">
      <Skeleton className="h-[380px] rounded-xl" />
      <div className="grid gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const user = useUser();
  const { t, lang, numberFormat } = useI18n();
  const actions = useLinkActions();
  const [range, setRange] = useState(30);
  const overview = useOverview(range);
  const data = overview.data;
  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];

  return (
    <div className="grid gap-8">
      <PageHeader title={t("dashboard.greeting", { name: firstName })} description={t("dashboard.subtitle")} actions={<RangeToggle value={range} onChange={setRange} />} />

      <QuickShorten />

      {overview.isPending ? (
        <DashboardSkeleton />
      ) : overview.isError ? (
        <Card>
          <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
        </Card>
      ) : data && data.totals.links === 0 ? (
        <Card>
          <EmptyState
            icon={<Link2Icon />}
            title={t("dashboard.emptyTitle")}
            body={t("dashboard.emptyBody")}
            action={<Button onClick={() => actions.create()}>{t("links.new")}</Button>}
          />
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <Card>
              <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardDescription>{t("dashboard.clicks")} · {t(rangeKey(range))}</CardDescription>
                  <p className="tabular text-4xl font-semibold tracking-tight">{numberFormat.format(data.totals.clicks)}</p>
                </div>
                <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-brand" /> {t("dashboard.series")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 border-t-2 border-dashed" style={{ borderColor: "var(--chart-2)" }} /> {t("dashboard.seriesVisitors")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ClicksChart series={data.series} />
              </CardContent>
            </Card>

            <div className="grid content-start gap-4">
              <MiniStat label={t("dashboard.visitors")} value={compactNumber(data.totals.visitors, lang)} />
              <MiniStat label={t("dashboard.qrScans")} value={compactNumber(data.totals.qrScans, lang)} />
              <MiniStat label={t("dashboard.activeLinks")} value={compactNumber(data.totals.activeLinks, lang)} hint={t("dashboard.ofTotal", { total: data.totals.links })} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.topLinks")}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.topLinks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t("dashboard.topLinksEmpty")}</p>
                ) : (
                  <ol className="grid gap-4">
                    {data.topLinks.map((link) => {
                      const max = data.topLinks[0]?.clicks ?? 1;
                      return (
                        <li key={link.id} className="grid gap-1.5">
                          <div className="flex items-baseline justify-between gap-3">
                            <Link to={`/links/${link.id}`} className="min-w-0 rounded-sm text-sm font-medium hover:underline hover:underline-offset-4">
                              <span className="block truncate">{link.title}</span>
                              <span className="block truncate font-mono text-[13px] font-normal text-muted-foreground">/{link.slug}</span>
                            </Link>
                            <span className="tabular shrink-0 text-sm font-semibold">{numberFormat.format(link.clicks)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max((link.clicks / max) * 100, 3)}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
            <BreakdownCard data={data} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.recent")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recent.length === 0 ? (
                <EmptyState icon={<MousePointerClick />} title={t("dashboard.recentEmpty")} className="py-8" />
              ) : (
                <RecentClicks clicks={data.recent} />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
