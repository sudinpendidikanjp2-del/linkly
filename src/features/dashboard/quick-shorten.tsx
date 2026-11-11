import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowUpRightIcon, CheckIcon, DicesIcon, Link2Icon, LoaderCircleIcon, PencilIcon, QrCodeIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlugChip } from "@/components/slug-chip";
import { ApiError } from "@/lib/api";
import { hostOf } from "@/lib/links";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SLUG_PATTERN } from "@/shared/constants";
import { normalizeUrl } from "@/shared/schemas";
import type { LinkDTO } from "@/shared/types";
import { useI18n } from "@/i18n";
import { checkSlug, fetchPageTitle, useCreateLink } from "@/features/links/api";
import { useLinkActions } from "@/features/links/link-actions";

function randomSlug(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

/**
 * Two steps: paste the destination, then choose the short address.
 * The second step can be skipped, in which case a random slug is generated.
 */
export function QuickShorten() {
  const { t, te } = useI18n();
  const create = useCreateLink();
  const actions = useLinkActions();
  const slugInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<"url" | "slug">("url");
  const [normalized, setNormalized] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<LinkDTO | null>(null);

  const cleanSlug = slug.trim().toLowerCase();
  const debouncedSlug = useDebouncedValue(cleanSlug, 350);
  const slugValid = cleanSlug === "" || SLUG_PATTERN.test(cleanSlug);
  const check = useQuery({
    queryKey: ["slug-check", debouncedSlug],
    queryFn: () => checkSlug(debouncedSlug),
    enabled: step === "slug" && SLUG_PATTERN.test(debouncedSlug),
    staleTime: 10_000,
  });
  const checking = cleanSlug !== "" && slugValid && (cleanSlug !== debouncedSlug || check.isFetching);
  const taken = !checking && cleanSlug === debouncedSlug && check.data?.available === false;
  const available = !checking && cleanSlug === debouncedSlug && check.data?.available === true;

  // Look up the page title while the person thinks about the slug, so the link gets a readable name.
  const title = useQuery({
    queryKey: ["page-title", normalized],
    queryFn: () => fetchPageTitle(normalized!),
    enabled: step === "slug" && Boolean(normalized),
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    if (step === "slug") slugInput.current?.focus();
  }, [step]);

  function next(event: React.FormEvent) {
    event.preventDefault();
    if (!url.trim()) return;
    const parsed = normalizeUrl(url);
    if (!parsed) {
      setError(te("invalid_url"));
      return;
    }
    setError(null);
    setNormalized(parsed);
    setCreated(null);
    setStep("slug");
  }

  function backToUrl() {
    setStep("url");
    setSlug("");
    setError(null);
  }

  async function submit(mode: "custom" | "auto") {
    if (!normalized) return;
    if (mode === "custom" && (!slugValid || taken || checking)) return;
    setError(null);
    try {
      const link = await create.mutateAsync({
        originalUrl: normalized,
        slug: mode === "custom" && cleanSlug ? cleanSlug : undefined,
        title: title.data?.title,
      });
      setCreated(link);
      setUrl("");
      setSlug("");
      setNormalized(null);
      setStep("url");
      toast.success(t("links.createdToast"));
    } catch (failure) {
      if (failure instanceof ApiError && failure.fields?.slug) setError(te(failure.fields.slug));
      else setError(te(failure instanceof ApiError ? failure.code : undefined));
    }
  }

  if (step === "slug" && normalized) {
    const blocked = !slugValid || taken || checking;
    return (
      <div className="grid min-w-0 grid-cols-1 gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(cleanSlug ? "custom" : "auto");
          }}
          onKeyDown={(event) => event.key === "Escape" && backToUrl()}
          className="grid min-w-0 grid-cols-1 gap-4 rounded-xl border bg-card p-4 animate-in fade-in-0 slide-in-from-top-1 duration-300"
          noValidate
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Link2Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title.data?.title ?? hostOf(normalized)}</p>
              <p className="truncate font-mono text-[13px] text-muted-foreground" title={normalized}>
                {normalized}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={backToUrl}>
              <PencilIcon /> {t("dashboard.changeUrl")}
            </Button>
          </div>

          <div className="grid gap-2">
            <label htmlFor="quick-slug" className="text-sm font-medium">
              {t("dashboard.slugQuestion")} <span className="font-normal text-muted-foreground">({t("common.optional")})</span>
            </label>
            <div className="flex gap-2">
              <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25">
                <span className="hidden items-center border-r bg-muted px-3 font-mono text-[13px] text-muted-foreground sm:flex">{window.location.host}/</span>
                <input
                  id="quick-slug"
                  ref={slugInput}
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    if (error) setError(null);
                  }}
                  className="h-11 min-w-0 flex-1 bg-transparent px-3 font-mono text-base outline-none placeholder:font-sans placeholder:text-muted-foreground sm:h-10 sm:text-sm"
                  placeholder={t("dashboard.slugPlaceholder")}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={64}
                  onKeyDown={(event) => {
                    // Enter must work with an empty slug too (generate automatically), even though the submit button is disabled then.
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void submit(cleanSlug ? "custom" : "auto");
                    }
                  }}
                  aria-invalid={!slugValid || taken}
                  aria-describedby="quick-slug-status"
                />
              </div>
              <Button type="button" variant="outline" size="icon" className="size-11 sm:size-10" aria-label={t("linkForm.slugRandom")} title={t("linkForm.slugRandom")} onClick={() => setSlug(randomSlug())}>
                <DicesIcon />
              </Button>
            </div>
            <p id="quick-slug-status" className="min-h-5 text-[13px]" aria-live="polite">
              {!slugValid ? (
                <span className="font-medium text-destructive-text">{te("invalid_slug")}</span>
              ) : checking ? (
                <span className="text-muted-foreground">{t("linkForm.slugChecking")}</span>
              ) : taken ? (
                <span className="flex items-center gap-1 font-medium text-destructive-text">
                  <XIcon className="size-3.5" /> {t("linkForm.slugTaken")}
                </span>
              ) : available ? (
                <span className="flex items-center gap-1 font-medium text-success-text">
                  <CheckIcon className="size-3.5" /> {t("linkForm.slugAvailable")}
                </span>
              ) : (
                <span className="text-muted-foreground">{t("dashboard.slugAutoHint")}</span>
              )}
            </p>
          </div>

          {error ? (
            <p role="alert" className="text-[13px] font-medium text-destructive-text">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={create.isPending} onClick={() => void submit("auto")}>
              {create.isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
              {t("dashboard.skipSlug")}
            </Button>
            <Button type="submit" disabled={create.isPending || blocked || cleanSlug === ""}>
              {create.isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
              {t("dashboard.createWithSlug")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      <form onSubmit={next} className="flex flex-col gap-2 sm:flex-row" noValidate>
        <div className="relative flex-1">
          <label htmlFor="quick-url" className="sr-only">
            {t("dashboard.quickLabel")}
          </label>
          <Link2Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="quick-url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
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
        <Button type="submit" size="lg" className="h-12" disabled={!url.trim()}>
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
