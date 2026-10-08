import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ANALYTICS_RANGES } from "@/shared/constants";
import { useT } from "@/i18n";
import type { TKey } from "@/i18n/types";

export const rangeKey = (range: number) => `dashboard.range${range}` as TKey;

export function RangeToggle({ value, onChange }: { value: number; onChange: (range: number) => void }) {
  const t = useT();
  return (
    <ToggleGroup type="single" value={String(value)} onValueChange={(next) => next && onChange(Number(next))} aria-label={t("dashboard.range")}>
      {ANALYTICS_RANGES.map((range) => (
        <ToggleGroupItem key={range} value={String(range)} aria-label={t(`dashboard.range${range}`)}>
          {t(`dashboard.range${range}`)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
