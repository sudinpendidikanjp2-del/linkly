import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { FolderClosedIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState } from "@/components/states";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/i18n";
import type { CollectionDTO } from "@/shared/types";
import { useCollections, useDeleteCollection } from "./api";
import { CollectionDialog } from "./collection-dialog";

export default function CollectionsPage() {
  const { t, te, numberFormat } = useI18n();
  const collections = useCollections();
  const remove = useDeleteCollection();
  const [dialog, setDialog] = useState<{ open: boolean; collection: CollectionDTO | null }>({ open: false, collection: null });
  const [pendingDelete, setPendingDelete] = useState<CollectionDTO | null>(null);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("collections.title")}
        description={t("collections.subtitle")}
        actions={
          <Button onClick={() => setDialog({ open: true, collection: null })}>
            <PlusIcon /> {t("collections.new")}
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        {collections.isPending ? (
          <div className="divide-y" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="grid gap-2 p-5">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : collections.isError ? (
          <ErrorState error={collections.error} onRetry={() => void collections.refetch()} />
        ) : collections.data.length === 0 ? (
          <EmptyState
            icon={<FolderClosedIcon />}
            title={t("collections.emptyTitle")}
            body={t("collections.emptyBody")}
            action={
              <Button onClick={() => setDialog({ open: true, collection: null })}>
                <PlusIcon /> {t("collections.new")}
              </Button>
            }
          />
        ) : (
          <ul className="divide-y">
            {collections.data.map((collection) => (
              <li key={collection.id} className="flex items-center gap-4 p-4 sm:px-5">
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-text">
                  <FolderClosedIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h2 className="truncate text-[15px] font-semibold">{collection.name}</h2>
                  {collection.description ? <p className="truncate text-sm text-muted-foreground">{collection.description}</p> : null}
                  <p className="tabular text-[13px] text-muted-foreground">
                    {t("collections.linkCount", { count: numberFormat.format(collection.linkCount) })} · {t("collections.clicks", { count: numberFormat.format(collection.clickCount) })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                    <Link to={`/links?collection=${collection.id}`}>{t("collections.viewLinks")}</Link>
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`${t("common.edit")}: ${collection.name}`} onClick={() => setDialog({ open: true, collection })}>
                    <PencilIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`${t("common.delete")}: ${collection.name}`} className="text-destructive-text hover:bg-destructive-soft hover:text-destructive-text" onClick={() => setPendingDelete(collection)}>
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CollectionDialog collection={dialog.collection} open={dialog.open} onOpenChange={(open) => setDialog((current) => ({ ...current, open }))} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t("collections.deleteTitle", { name: pendingDelete?.name ?? "" })}
        description={t("collections.deleteBody")}
        confirmLabel={t("common.delete")}
        pending={remove.isPending}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await remove.mutateAsync(pendingDelete.id);
            toast.success(t("collections.deletedToast"));
            setPendingDelete(null);
          } catch (error) {
            toast.error(te(error instanceof ApiError ? error.code : undefined));
          }
        }}
      />
    </div>
  );
}
