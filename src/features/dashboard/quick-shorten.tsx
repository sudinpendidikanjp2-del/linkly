import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowUpRightIcon, Link2Icon, LoaderCircleIcon, QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlugChip } from "@/components/slug-chip";
import { ApiError } from "@/lib/api";
import { normalizeUrl } from "@/shared/schemas";
import type { LinkDTO } from "@/shared/types";
import { useI18n } from "@/i18n";
import { useCreateLink } from "@/features/links/api";
import { useLinkActions } from "@/features/links/link-actions";

export function QuickShorten() {
  const { t, te } = useI18n();
  const create = useCreateLink();
  const actions = useLinkActions();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<LinkDTO | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    if (!normalizeUrl(value)) {
      setError(te("invalid_url"));
      return;
    }
    setError(null);
    try {
      const link = await create.mutateAsync({ originalUrl: value });
      setCreated(link);
      setValue("");
      toast.success(t("links.createdToast"));
    } catch (failure) {
      setError(te(failure instanceof ApiError ? failure.code : undefined));
    }
  }

  return (
    <div className="grid gap-3">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row" noValidate>
        <div className="relative flex-1">
          <label htmlFor="quick-url" className="sr-only">
            {t("dashboard.quickLabel")}
          </label>
          <Link2Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="quick-url"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={t("dashboard.quickPlaceholder")}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "quick-url-error" : undefined}
            className="h-12 pl-10 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="h-12" disabled={create.isPending || !value.trim()}>
          {create.isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {t("dashboard.quickButton")}
        </Button>
      </form>
      {error ? (
        <p id="quick-url-error" role="alert" className="text-[13px] font-medium text-destructive-text">
          {error}
        </p>
      ) : null}
      {created ? (
        <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 animate-in fade-in-0 slide-in-from-top-1 duration-300">
          <span className="text-sm font-medium text-brand-text">{t("dashboard.quickDone")}</span>
          <SlugChip slug={created.slug} />
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => actions.showQr(created)}>
              <QrCodeIcon /> {t("links.qr")}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/links/${created.id}`}>
                {t("links.analytics")} <ArrowUpRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
