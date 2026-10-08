import { shortLabel, shortUrl } from "@/lib/links";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

/** The identity motif of the product: the short address, host dimmed, slug in ink. */
export function SlugChip({ slug, copy = true, className }: { slug: string; copy?: boolean; className?: string }) {
  const t = useT();
  const label = shortLabel(slug);
  const host = label.slice(0, label.length - slug.length);
  return (
    <span className={cn("inline-flex max-w-full items-center gap-0.5 font-mono text-[13px]", className)}>
      <a
        href={shortUrl(slug)}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 truncate rounded-sm hover:underline hover:underline-offset-4"
        onClick={(event) => event.stopPropagation()}
        title={shortUrl(slug)}
      >
        <span className="text-muted-foreground">{host}</span>
        <span className="font-semibold text-foreground">{slug}</span>
      </a>
      {copy ? <CopyButton value={shortUrl(slug)} label={t("links.copyShort")} className="-my-1 size-8" /> : null}
    </span>
  );
}
