import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { useI18n } from "@/i18n";
import type { ClickDTO } from "@/shared/types";

export function placeOf(click: ClickDTO, unknown: string): string {
  return [click.city, click.country].filter(Boolean).join(", ") || unknown;
}

export function RecentClicks({ clicks, showLink = true }: { clicks: ClickDTO[]; showLink?: boolean }) {
  const { t, dateLocale } = useI18n();
  return (
    <ul className="divide-y">
      {clicks.map((click) => (
        <li key={click.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1 basis-48">
            {showLink ? (
              <Link to={`/links/${click.linkId}`} className="block truncate rounded-sm font-medium hover:underline hover:underline-offset-4">
                {click.linkTitle}
              </Link>
            ) : (
              <span className="block truncate font-medium">{placeOf(click, t("common.unknown"))}</span>
            )}
            <p className="truncate text-[13px] text-muted-foreground">
              {showLink ? `${placeOf(click, t("common.unknown"))} · ` : ""}
              {[click.device, click.browser, click.os].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {click.isQrScan ? <Badge variant="brand">{t("dashboard.viaQr")}</Badge> : null}
            <time className="tabular text-[13px] text-muted-foreground" dateTime={click.timestamp}>
              {formatRelative(click.timestamp, dateLocale)}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}
