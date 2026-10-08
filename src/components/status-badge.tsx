import { Badge } from "@/components/ui/badge";
import type { LinkStatus } from "@/shared/types";
import { useT } from "@/i18n";

const VARIANT = { active: "success", scheduled: "brand", expired: "warning", disabled: "neutral" } as const;

export function StatusBadge({ status }: { status: LinkStatus }) {
  const t = useT();
  return <Badge variant={VARIANT[status]}>{t(`status.${status}`)}</Badge>;
}
