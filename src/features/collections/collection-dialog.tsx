import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { hostOf } from "@/lib/links";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useI18n } from "@/i18n";
import { collectionSchema, type CollectionInput } from "@/shared/schemas";
import type { CollectionDTO } from "@/shared/types";
import { useLinkList } from "@/features/links/api";
import { useSaveCollection } from "./api";

export function CollectionDialog({ collection, open, onOpenChange }: { collection: CollectionDTO | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t, te } = useI18n();
  const save = useSaveCollection();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debounced = useDebouncedValue(search, 300);

  const form = useForm<CollectionInput>({ resolver: zodResolver(collectionSchema), defaultValues: { name: "", description: "" } });

  useEffect(() => {
    if (open) {
      form.reset({ name: collection?.name ?? "", description: collection?.description ?? "" });
      setSelected(new Set(collection?.linkIds ?? []));
      setSearch("");
    }
  }, [open, collection, form]);

  const links = useLinkList({ page: 1, pageSize: 50, search: debounced, status: "all", collectionId: "all", protected: "all", sort: "createdAt", order: "desc" });

  const submit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: collection?.id, input: { ...values, linkIds: [...selected] } });
      toast.success(collection ? t("collections.updatedToast") : t("collections.createdToast"));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) form.setError(field as keyof CollectionInput, { type: "server", message });
      } else {
        toast.error(te(error instanceof ApiError ? error.code : undefined));
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{collection ? t("collections.editTitle") : t("collections.createTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("collections.subtitle")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} className="grid gap-5" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("collections.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={80} placeholder={t("collections.namePlaceholder")} autoFocus autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("collections.description")} <span className="font-normal text-muted-foreground">({t("common.optional")})</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={2} maxLength={240} placeholder={t("collections.descriptionPlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="collection-link-search">{t("collections.links")}</Label>
                <span className="tabular text-[13px] text-muted-foreground">{t("collections.linksHint", { count: selected.size })}</span>
              </div>
              <Input id="collection-link-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("collections.linksSearch")} />
              <div className="max-h-56 overflow-y-auto rounded-lg border">
                {links.isPending ? (
                  <div className="grid gap-2 p-3" aria-busy="true">
                    <Skeleton className="h-8" />
                    <Skeleton className="h-8" />
                  </div>
                ) : links.data && links.data.items.length > 0 ? (
                  <ul className="divide-y">
                    {links.data.items.map((link) => {
                      const checked = selected.has(link.id);
                      return (
                        <li key={link.id}>
                          <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/60">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) =>
                                setSelected((current) => {
                                  const copy = new Set(current);
                                  if (next === true) copy.add(link.id);
                                  else copy.delete(link.id);
                                  return copy;
                                })
                              }
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{link.title}</span>
                              <span className="block truncate font-mono text-[13px] text-muted-foreground">
                                /{link.slug} · {hostOf(link.originalUrl)}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">{t("collections.linksEmpty")}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
                {save.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
