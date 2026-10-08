import { useId } from "react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { useI18n } from "@/i18n";
import type { AnalyticsDTO } from "@/shared/types";

export function ClicksChart({ series, height = 260 }: { series: AnalyticsDTO["series"]; height?: number }) {
  const { t, dateLocale, numberFormat } = useI18n();
  const gradientId = useId();
  const dense = series.length > 31;
  const total = series.reduce((sum, point) => sum + point.clicks, 0);

  return (
    <div role="img" aria-label={t("dashboard.chartDesc", { count: numberFormat.format(total), days: series.length })} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height }}>
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--brand)", stopOpacity: 0.28 }} />
              <stop offset="100%" style={{ stopColor: "var(--brand)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 4" style={{ stroke: "var(--border)" }} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            interval={dense ? 6 : series.length > 10 ? 3 : 0}
            tickFormatter={(value: string) => format(parseISO(value), "d MMM", { locale: dateLocale })}
            tick={{ fontSize: 12, style: { fill: "var(--muted-foreground)" } }}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fontSize: 12, style: { fill: "var(--muted-foreground)" } }}
            tickFormatter={(value: number) => numberFormat.format(value)}
          />
          <Tooltip
            cursor={{ style: { stroke: "var(--border)" } }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                  <p className="mb-1 font-medium">{format(parseISO(String(label)), "EEEE, d MMM yyyy", { locale: dateLocale })}</p>
                  <p className="tabular text-muted-foreground">
                    <span className="mr-2 inline-block size-2 rounded-full bg-brand" />
                    {t("dashboard.series")}: <span className="font-semibold text-foreground">{numberFormat.format(Number(payload[0]?.value ?? 0))}</span>
                  </p>
                  <p className="tabular text-muted-foreground">
                    <span className="mr-2 inline-block size-2 rounded-full" style={{ background: "var(--chart-2)" }} />
                    {t("dashboard.seriesVisitors")}: <span className="font-semibold text-foreground">{numberFormat.format(Number(payload[1]?.value ?? 0))}</span>
                  </p>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="clicks" strokeWidth={2.25} fill={`url(#${gradientId})`} style={{ stroke: "var(--brand)" }} activeDot={{ r: 4, style: { fill: "var(--brand)", stroke: "var(--card)", strokeWidth: 2 } }} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="visitors" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={false} style={{ stroke: "var(--chart-2)" }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
