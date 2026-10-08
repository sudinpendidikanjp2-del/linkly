import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeftIcon, ExternalLinkIcon, LockIcon, MousePointerClickIcon, PencilIcon, QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { EmptyState, ErrorState } from "@/components/states";
import { SlugChip } from "@/components/slug-chip";
import { StatusBadge } from "@/components/status-badge";
import { BreakdownCard } from "@/features/analytics/breakdown-card";
import { ClicksChart } from "@/features/analytics/clicks-chart";
import { RangeToggle, rangeKey } from "@/features/analytics/range-toggle";
import { RecentClicks } from "@/features/analytics/recent-clicks";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/i18n";
import { useLink, useLinkAnalytics } from "./api";
import { useLinkActions } from "./link-actions";
import { LinkRowActions } from "./link-row-actions";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-words">{children}</dd>
    </div>
  );
}

export default function LinkDetailPage() {
  const { id = "" } = useParams();
  const { t, dateLocale, numberFormat } = useI18n();
  const actions = useLinkActions();
  const [range, setRange] = useState(30);
  const link = useLink(id);
  const analytics = useLinkAnalytics(id, range);

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit text-muted-foreground">
      <Link to="/links">
        <ArrowLeftIcon /> {t("detail.back")}
      </Link>
    </Button>
  );

  if (link.isPending) {
    return (
      <div className="grid gap-6" aria-busy="true">
        {back}
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (link.isError) {
    const missing = link.error instanceof ApiError && link.error.status === 404;
    return (
      <div className="grid gap-4">
        {back}
        <Card>{missing ? <EmptyState title={t("detail.notFoundTitle")} body={t("detail.notFoundBody")} /> : <ErrorState error={link.error} onRetry={() => void link.refetch()} />}</Card>
      </div>
    );
  }

  const data = link.data;
  const stats = analytics.data;
  const qrShare = stats && stats.totals.clicks > 0 ? Math.round((stats.totals.qrScans / stats.totals.clicks) * 100) : 0;

  return (
    <div className="grid gap-6">
      {back}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-2xl font-semibold break-words sm:text-3xl">{data.title}</h1>
            <StatusBadge status={data.status} />
          </div>
          <SlugChip slug={data.slug} className="text-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => actions.showQr(data)}>
            <QrCodeIcon /> {t("links.qr")}
          </Button>
          <Button onClick={() => actions.edit(data)}>
            <PencilIcon /> {t("common.edit")}
          </Button>
          <LinkRowActions link={data} redirectAfterDelete="/links" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-6">
          <Card className="gap-0 py-0">
            <dl className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
              {[
                { label: t("detail.totalClicks"), value: numberFormat.format(data.clickCount), hint: undefined },
                { label: t("dashboard.clicks"), value: stats ? numberFormat.format(stats.totals.clicks) : "-", hint: t(rangeKey(range)) },
                { label: t("dashboard.visitors"), value: stats ? numberFormat.format(stats.totals.visitors) : "-", hint: t(rangeKey(range)) },
                { label: t("detail.qr"), value: stats ? numberFormat.format(stats.totals.qrScans) : "-", hint: stats ? t("detail.qrShare", { percent: qrShare }) : undefined },
              ].map((stat) => (
                <div key={stat.label} className="grid gap-0.5 p-4">
                  <dt className="text-[13px] text-muted-foreground">{stat.label}</dt>
                  <dd className="tabular text-2xl font-semibold tracking-tight">{stat.value}</dd>
                  {stat.hint ? <dd className="text-[13px] text-muted-foreground">{stat.hint}</dd> : null}
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("detail.chart")}</CardTitle>
              <RangeToggle value={range} onChange={setRange} />
            </CardHeader>
            <CardContent>
              {analytics.isPending ? <Skeleton className="h-[260px]" /> : analytics.isError ? <ErrorState error={analytics.error} onRetry={() => void analytics.refetch()} /> : stats ? <ClicksChart series={stats.series} /> : null}
            </CardContent>
          </Card>

          {stats ? <BreakdownCard data={stats} /> : null}

          <Card>
            <CardHeader>
              <CardTitle>{t("detail.recent")}</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && stats.recent.length > 0 ? <RecentClicks clicks={stats.recent} showLink={false} /> : <EmptyState icon={<MousePointerClickIcon />} title={t("detail.recentEmpty")} className="py-8" />}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("detail.details")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <Detail label={t("detail.destination")}>
                <span className="flex items-start gap-1">
                  <a href={data.originalUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all hover:underline hover:underline-offset-4">
                    {data.originalUrl}
                  </a>
                  <CopyButton value={data.originalUrl} className="-mt-1.5 shrink-0" />
                </span>
              </Detail>
              <Detail label={t("detail.created")}>{formatDateTime(data.createdAt, dateLocale)}</Detail>
              <Detail label={t("detail.schedule")}>
                {data.startsAt || data.expiresAt ? (
                  <span className="grid gap-0.5">
                    {data.startsAt ? <span>{t("detail.startsOn", { date: formatDateTime(data.startsAt, dateLocale) })}</span> : null}
                    {data.expiresAt ? <span>{t("detail.endsOn", { date: formatDateTime(data.expiresAt, dateLocale) })}</span> : null}
                  </span>
                ) : (
                  t("detail.noSchedule")
                )}
              </Detail>
              <Detail label={t("detail.collection")}>{data.collectionName ?? t("common.none")}</Detail>
              <Detail label={t("detail.security")}>
                <span className="grid gap-1">
                  <span className="flex items-center gap-1.5">
                    <LockIcon className="size-3.5 text-muted-foreground" /> {data.isProtected ? t("links.protected") : t("links.protectionNo")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ExternalLinkIcon className="size-3.5 text-muted-foreground" /> {data.landingEnabled ? t("links.portal") : `${t("links.portal")}: ${t("common.none").toLowerCase()}`}
                  </span>
                </span>
              </Detail>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
