import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useI18n } from "@/i18n";
import type { LinkDTO } from "@/shared/types";
import { useLinkList } from "@/features/links/api";
import { Field } from "./fields";

export function LinkPicker({ label, value, selected, onChange, error }: { label: string; value: string; selected: LinkDTO | undefined; onChange: (link: LinkDTO) => void; error?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 250);
  const list = useLinkList({ page: 1, pageSize: 30, search: debounced, status: "all", collectionId: "all", protected: "all", sort: "createdAt", order: "desc" });

  return (
    <Field label={label} error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="h-10 w-full justify-between font-normal">
            <span className={selected ? "truncate" : "truncate text-muted-foreground"}>{selected ? `${selected.title} · /${selected.slug}` : value ? value : t("bioEditor.linkPick")}</span>
            <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] p-2">
          <Input type="search" autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("bioEditor.linkSearch")} aria-label={t("bioEditor.linkSearch")} className="mb-2" />
          <div className="max-h-64 overflow-y-auto">
            {list.isPending ? (
              <div className="grid gap-2 p-1">
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
              </div>
            ) : list.data && list.data.items.length > 0 ? (
              <ul>
                {list.data.items.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      className="press flex min-h-11 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                      onClick={() => {
                        onChange(link);
                        setOpen(false);
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{link.title}</span>
                        <span className="block truncate font-mono text-[13px] text-muted-foreground">/{link.slug}</span>
                      </span>
                      {link.id === value ? <CheckIcon className="size-4 text-brand-text" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-sm text-muted-foreground">{t("collections.linksEmpty")}</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}
