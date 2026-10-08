import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileUpIcon, LoaderCircleIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { MAX_BULK_IMPORT } from "@/shared/constants";
import type { BulkImportResultDTO } from "@/shared/types";
import { useI18n } from "@/i18n";
import { useCollections } from "@/features/collections/api";
import { useImportLinks } from "./api";

interface Row {
  originalUrl: string;
  slug?: string;
  title?: string;
}

export function parseImportText(text: string): Row[] {
  const rows: Row[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const [url, slug, ...rest] = line.split(/[,;\t]/).map((part) => part.trim());
    if (!url || /^(url|originalurl|destination|tujuan)$/i.test(url)) continue;
    rows.push({ originalUrl: url, slug: slug || undefined, title: rest.join(", ") || undefined });
  }
  return rows;
}

const REASONS: Record<string, "import.reasonInvalidUrl" | "import.reasonSlugTaken" | "import.reasonInvalidSlug" | "import.reasonReserved" | "import.reasonFailed"> = {
  invalid_url: "import.reasonInvalidUrl",
  slug_taken: "import.reasonSlugTaken",
  invalid_slug: "import.reasonInvalidSlug",
  reserved_slug: "import.reasonReserved",
};

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t, te } = useI18n();
  const collections = useCollections();
  const importLinks = useImportLinks();
  const [text, setText] = useState("");
  const [collectionId, setCollectionId] = useState("none");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResultDTO | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => parseImportText(text), [text]);
  const tooMany = rows.length > MAX_BULK_IMPORT;

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      window.setTimeout(() => {
        setText("");
        setResult(null);
        setFileName(null);
        setCollectionId("none");
      }, 200);
    }
  }

  async function submit() {
    try {
      const response = await importLinks.mutateAsync({ items: rows, collectionId: collectionId === "none" ? null : collectionId });
      setResult(response);
      if (response.imported > 0) toast.success(t("import.done", { count: response.imported }));
    } catch (error) {
      toast.error(te(error instanceof ApiError ? error.code : undefined));
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
          <DialogDescription>{t("import.desc")}</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="grid gap-4">
            <p className="text-sm font-medium">{t("import.done", { count: result.imported })}</p>
            {result.skipped.length > 0 ? (
              <div className="grid gap-2">
                <p className="text-sm font-medium text-warning-text">{t("import.skippedTitle", { count: result.skipped.length })}</p>
                <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border text-sm">
                  {result.skipped.map((item, index) => (
                    <li key={`${item.originalUrl}-${index}`} className="flex flex-col gap-0.5 px-3 py-2">
                      <span className="truncate font-mono text-[13px]">{item.originalUrl}</span>
                      <span className="text-[13px] text-muted-foreground">{t(REASONS[item.reason] ?? "import.reasonFailed")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setResult(null)}>
                {t("import.again")}
              </Button>
              <Button onClick={() => close(false)}>{t("common.close")}</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="import-text" className="sr-only">
                {t("import.title")}
              </Label>
              <Textarea id="import-text" rows={8} value={text} onChange={(event) => setText(event.target.value)} placeholder={t("import.placeholder")} className="font-mono text-[13px]" spellCheck={false} />
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setText(await file.text());
                    setFileName(file.name);
                    event.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                  <FileUpIcon /> {t("import.file")}
                </Button>
                {fileName ? <span className="text-[13px] text-muted-foreground">{t("import.fileLoaded", { name: fileName })}</span> : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t("import.collection")}</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger className="w-full" aria-label={t("import.collection")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("linkForm.collectionNone")}</SelectItem>
                  {collections.data?.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className={tooMany ? "text-[13px] font-medium text-destructive-text" : "text-[13px] text-muted-foreground"} role={tooMany ? "alert" : undefined}>
              {tooMany ? t("import.limit", { max: MAX_BULK_IMPORT }) : rows.length > 0 ? t("import.ready", { count: rows.length }) : t("import.limit", { max: MAX_BULK_IMPORT })}
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)} disabled={importLinks.isPending}>
                {t("common.cancel")}
              </Button>
              <Button onClick={submit} disabled={rows.length === 0 || tooMany || importLinks.isPending}>
                {importLinks.isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
                {t("import.submit", { count: rows.length })}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
