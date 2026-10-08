import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/i18n";
import type { AnalyticsDTO, CountItem } from "@/shared/types";

type Tab = "devices" | "browsers" | "systems" | "countries" | "referrers";
const TABS: Tab[] = ["devices", "browsers", "systems", "countries", "referrers"];

function useLabel() {
  const { t, lang } = useI18n();
  const regions = new Intl.DisplayNames([lang === "id" ? "id" : "en"], { type: "region" });
  return (tab: Tab, name: string): string => {
    if (name === "Unknown") return t("common.unknown");
    if (name === "Direct") return t("common.direct");
    if (tab === "countries" && /^[A-Z]{2}$/.test(name)) {
      try {
        return regions.of(name) ?? name;
      } catch {
        return name;
      }
    }
    return name;
  };
}

function Rows({ tab, items, total }: { tab: Tab; items: CountItem[]; total: number }) {
  const { t, numberFormat } = useI18n();
  const label = useLabel();
  if (items.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{t("dashboard.noData")}</p>;
  return (
    <ul className="grid gap-3">
      {items.map((item) => {
        const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <li key={item.name} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium">{label(tab, item.name)}</span>
              <span className="tabular shrink-0 text-muted-foreground">
                {numberFormat.format(item.count)} <span className="text-[13px]">({percent}%)</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-ios" style={{ width: `${Math.max(percent, 2)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function BreakdownCard({ data }: { data: AnalyticsDTO }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.breakdown")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="devices">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList>
              {TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {t(`dashboard.${tab}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {TABS.map((tab) => (
            <TabsContent key={tab} value={tab}>
              <Rows tab={tab} items={data[tab]} total={data.totals.clicks} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
