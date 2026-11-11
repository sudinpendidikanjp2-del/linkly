import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, FileUpIcon, LinkIcon, LockIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { SlugChip } from "@/components/slug-chip";
import { EmptyState, ErrorState } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { extractSharedUrl, hostOf } from "@/lib/links";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useI18n } from "@/i18n";
import { PAGE_SIZES } from "@/shared/constants";
import type { LinkDTO } from "@/shared/types";
import { useCollections } from "@/features/collections/api";
import { useBulkLinks, useLinkList, type LinkFilters } from "./api";
import { useLinkActions } from "./link-actions";
import { LinkRowActions } from "./link-row-actions";

const STATUSES = ["all", "active", "scheduled", "expired", "disabled"] as const;
const SORTS = {
  newest: { sort: "createdAt", order: "desc" },
  oldest: { sort: "createdAt", order: "asc" },
  clicks: { sort: "clicks", order: "desc" },
  title: { sort: "title", order: "asc" },
} as const;
type SortKey = keyof typeof SORTS;

function useFilters() {
  const [params, setParams] = useSearchParams();
  const get = (key: string, fallback: string) => params.get(key) ?? fallback;
  const sortKey = (get("sort", "newest") in SORTS ? get("sort", "newest") : "newest") as SortKey;
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "" || value === "all" || (key === "sort" && value === "newest") || (key === "page" && value === "1") || (key === "size" && value === "10")) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in changes)) next.delete("page");
    setParams(next, { replace: true });
  };
  const filters: LinkFilters = {
    page: Math.max(1, Number(get("page", "1")) || 1),
    pageSize: (PAGE_SIZES as readonly number[]).includes(Number(get("size", "10"))) ? Number(get("size", "10")) : 10,
    search: get("q", ""),
    status: get("status", "all"),
    collectionId: get("collection", "all"),
    protected: get("protected", "all"),
    ...SORTS[sortKey],
  };
  return { filters, sortKey, update, reset: () => setParams({}, { replace: true }), active: ["q", "status", "collection", "protected"].some((key) => params.has(key)) };
}

function RowSkeleton() {
  return (
    <div className="grid gap-px" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 p-4">
          <Skeleton className="size-[18px]" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
          <Skeleton className="hidden h-6 w-16 sm:block" />
        </div>
      ))}
    </div>
  );
}

export default function LinksPage() {
  const { t, te, dateLocale, numberFormat } = useI18n();
  const actions = useLinkActions();
  const [shareParams, setShareParams] = useSearchParams();
  const { filters, sortKey, update, reset, active } = useFilters();

  // Opened from the app shortcut (?new=1) or the Android share sheet (?url=...&text=...): start a new link right away.
  useEffect(() => {
    if (!shareParams.has("new") && !shareParams.has("url") && !shareParams.has("text")) return;
    actions.create(extractSharedUrl(shareParams.get("url"), shareParams.get("text")));
    const next = new URLSearchParams(shareParams);
    ["new", "url", "text", "title"].forEach((key) => next.delete(key));
    setShareParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const collections = useCollections();
  const bulk = useBulkLinks();

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  useEffect(() => {
    if (debouncedSearch !== filters.search) update({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  useEffect(() => setSearchInput(filters.search), [filters.search]);

  const list = useLinkList(filters);
  const items = list.data?.items ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  useEffect(() => setSelected(new Set()), [list.data?.page, filters.search, filters.status, filters.collectionId, filters.protected, filters.sort, filters.pageSize]);

  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  const someSelected = selected.size > 0 && !allSelected;
  const selectedIds = useMemo(() => [...selected], [selected]);

  function toggleRow(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function runBulk(action: "enable" | "disable" | "delete" | "move", collectionId?: string | null) {
    try {
      const { affected } = await bulk.mutateAsync({ ids: selectedIds, action, collectionId });
      toast.success(t("links.bulkDone", { count: affected }));
      setSelected(new Set());
      setConfirmBulkDelete(false);
    } catch (error) {
      toast.error(te(error instanceof ApiError ? error.code : undefined));
    }
  }

  const total = list.data?.total ?? 0;
  const from = total === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const to = Math.min(total, filters.page * filters.pageSize);
  const totalPages = list.data?.totalPages ?? 1;

  const renderTitle = (link: LinkDTO) => (
    <div className="min-w-0 space-y-0.5">
      <div className="flex items-center gap-2">
        <Link to={`/links/${link.id}`} className="truncate rounded-sm font-medium hover:underline hover:underline-offset-4">
          {link.title || t("links.noTitle")}
        </Link>
        {link.isProtected ? <LockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label={t("links.protected")} /> : null}
      </div>
      <SlugChip slug={link.slug} />
      <p className="truncate text-[13px] text-muted-foreground" title={link.originalUrl}>
        {hostOf(link.originalUrl)}
        {link.collectionName ? ` · ${link.collectionName}` : ""}
      </p>
    </div>
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("links.title")}
        description={list.data ? t("links.subtitle", { count: numberFormat.format(total) }) : undefined}
        actions={
          <>
            <Button variant="outline" onClick={actions.importLinks}>
              <FileUpIcon /> <span className="hidden sm:inline">{t("links.import")}</span>
              <span className="sm:hidden">{t("links.import")}</span>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/links/export.csv" download>
                <DownloadIcon /> {t("links.export")}
              </a>
            </Button>
            <Button onClick={() => actions.create()} className="hidden lg:inline-flex">
              <PlusIcon /> {t("links.new")}
            </Button>
          </>
        }
      />

      <div className="grid gap-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={t("links.searchPlaceholder")} aria-label={t("common.search")} className="pr-10 pl-9" type="search" />
            {searchInput ? (
              <Button variant="ghost" size="icon-sm" className="absolute top-0.5 right-0.5 text-muted-foreground" aria-label={t("common.clear")} onClick={() => setSearchInput("")}>
                <XIcon />
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filters.collectionId} onValueChange={(value) => update({ collection: value })}>
              <SelectTrigger aria-label={t("links.collection")} className="min-w-40 flex-1 md:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("links.collectionAll")}</SelectItem>
                <SelectItem value="none">{t("links.collectionNone")}</SelectItem>
                {collections.data?.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.protected} onValueChange={(value) => update({ protected: value })}>
              <SelectTrigger aria-label={t("links.protection")} className="min-w-40 flex-1 md:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("links.protectionAll")}</SelectItem>
                <SelectItem value="yes">{t("links.protectionYes")}</SelectItem>
                <SelectItem value="no">{t("links.protectionNo")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(value) => update({ sort: value })}>
              <SelectTrigger aria-label={t("links.sort")} className="min-w-40 flex-1 md:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("links.sortNewest")}</SelectItem>
                <SelectItem value="oldest">{t("links.sortOldest")}</SelectItem>
                <SelectItem value="clicks">{t("links.sortClicks")}</SelectItem>
                <SelectItem value="title">{t("links.sortTitle")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <ToggleGroup type="single" value={filters.status} onValueChange={(value) => value && update({ status: value })} aria-label={t("links.status")}>
            {STATUSES.map((status) => (
              <ToggleGroupItem key={status} value={status}>
                {status === "all" ? t("common.all") : t(`status.${status}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {selected.size > 0 ? (
        <div role="region" aria-label={t("common.selected", { count: selected.size })} className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-4 py-2.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <span className="mr-auto text-sm font-medium text-brand-text">{t("common.selected", { count: selected.size })}</span>
          <Select value="" onValueChange={(value) => void runBulk("move", value === "none" ? null : value)}>
            <SelectTrigger aria-label={t("links.bulkMove")} className="h-9 w-auto bg-card">
              <SelectValue placeholder={t("links.bulkMove")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("links.collectionNone")}</SelectItem>
              {collections.data?.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="bg-card" disabled={bulk.isPending} onClick={() => void runBulk("enable")}>
            {t("links.bulkEnable")}
          </Button>
          <Button variant="outline" size="sm" className="bg-card" disabled={bulk.isPending} onClick={() => void runBulk("disable")}>
            {t("links.bulkDisable")}
          </Button>
          <Button variant="destructive" size="sm" disabled={bulk.isPending} onClick={() => setConfirmBulkDelete(true)}>
            {t("links.bulkDelete")}
          </Button>
        </div>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        {list.isPending ? (
          <RowSkeleton />
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : items.length === 0 ? (
          active ? (
            <EmptyState
              icon={<SearchIcon />}
              title={t("links.emptyFilteredTitle")}
              body={t("links.emptyFilteredBody")}
              action={
                <Button variant="outline" onClick={reset}>
                  {t("common.clear")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<LinkIcon />}
              title={t("links.emptyTitle")}
              body={t("links.emptyBody")}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => actions.create()}>
                    <PlusIcon /> {t("links.new")}
                  </Button>
                  <Button variant="outline" onClick={actions.importLinks}>
                    <FileUpIcon /> {t("links.import")}
                  </Button>
                </div>
              }
            />
          )
        ) : (
          <>
            <div className={`hidden md:block ${list.isPlaceholderData ? "opacity-60 transition-opacity" : ""}`}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 pl-4">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={(checked) => setSelected(checked === true ? new Set(items.map((item) => item.id)) : new Set())}
                        aria-label={t("links.selectAll")}
                      />
                    </TableHead>
                    <TableHead>{t("links.colLink")}</TableHead>
                    <TableHead>{t("links.colStatus")}</TableHead>
                    <TableHead className="text-right">{t("links.colClicks")}</TableHead>
                    <TableHead>{t("links.colCreated")}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((link) => (
                    <TableRow key={link.id} data-state={selected.has(link.id) ? "selected" : undefined}>
                      <TableCell className="pl-4">
                        <Checkbox checked={selected.has(link.id)} onCheckedChange={(checked) => toggleRow(link.id, checked === true)} aria-label={t("links.selectRow", { title: link.title })} />
                      </TableCell>
                      <TableCell className="max-w-[420px] py-3">{renderTitle(link)}</TableCell>
                      <TableCell>
                        <StatusBadge status={link.status} />
                      </TableCell>
                      <TableCell className="tabular text-right font-medium">{numberFormat.format(link.clickCount)}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(link.createdAt, dateLocale)}</TableCell>
                      <TableCell className="pr-3">
                        <LinkRowActions link={link} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className={`divide-y md:hidden ${list.isPlaceholderData ? "opacity-60 transition-opacity" : ""}`}>
              {items.map((link) => (
                <li key={link.id} className="flex items-start gap-3 p-4" data-state={selected.has(link.id) ? "selected" : undefined}>
                  <Checkbox className="mt-1" checked={selected.has(link.id)} onCheckedChange={(checked) => toggleRow(link.id, checked === true)} aria-label={t("links.selectRow", { title: link.title })} />
                  <div className="min-w-0 flex-1 space-y-2">
                    {renderTitle(link)}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                      <StatusBadge status={link.status} />
                      <span className="tabular">{t("links.colClicks")}: <span className="font-medium text-foreground">{numberFormat.format(link.clickCount)}</span></span>
                      <span>{formatDate(link.createdAt, dateLocale)}</span>
                    </div>
                  </div>
                  <LinkRowActions link={link} />
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="tabular text-muted-foreground">{t("links.showing", { from, to, total: numberFormat.format(total) })}</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <span className="hidden sm:inline">{t("links.rowsPerPage")}</span>
                  <Select value={String(filters.pageSize)} onValueChange={(value) => update({ size: value })}>
                    <SelectTrigger aria-label={t("links.rowsPerPage")} className="h-9 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon-sm" disabled={filters.page <= 1} onClick={() => update({ page: String(filters.page - 1) })} aria-label={t("common.previous")}>
                    <ChevronLeftIcon />
                  </Button>
                  <span className="tabular min-w-24 text-center text-muted-foreground">{t("links.pageOf", { page: filters.page, total: totalPages })}</span>
                  <Button variant="outline" size="icon-sm" disabled={filters.page >= totalPages} onClick={() => update({ page: String(filters.page + 1) })} aria-label={t("common.next")}>
                    <ChevronRightIcon />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={t("links.bulkDeleteTitle", { count: selected.size })}
        description={t("links.bulkDeleteBody")}
        confirmLabel={t("common.delete")}
        pending={bulk.isPending}
        onConfirm={() => void runBulk("delete")}
      />
    </div>
  );
}
