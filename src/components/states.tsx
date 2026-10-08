import type { ReactNode } from "react";
import { CircleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export function EmptyState({ icon, title, body, action, className }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      {icon ? <div className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground [&_svg]:size-6">{icon}</div> : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {body ? <p className="mx-auto max-w-sm text-sm text-muted-foreground">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ onRetry, error, className }: { onRetry?: () => void; error?: unknown; className?: string }) {
  const { t, te } = useI18n();
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : undefined;
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      <div className="grid size-12 place-items-center rounded-xl bg-destructive-soft text-destructive-text">
        <CircleAlertIcon className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t("common.errorTitle")}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{code ? te(code) : t("common.errorBody")}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}
