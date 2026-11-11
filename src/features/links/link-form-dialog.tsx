import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckIcon, ChevronDownIcon, DicesIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ApiError } from "@/lib/api";
import { fromLocalInput, toLocalInput } from "@/lib/links";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useI18n, useT } from "@/i18n";
import { createLinkSchema, updateLinkSchema } from "@/shared/schemas";
import { SLUG_PATTERN } from "@/shared/constants";
import type { LinkDTO } from "@/shared/types";
import { useCollections } from "@/features/collections/api";
import { checkSlug, fetchPageTitle, useCreateLink, useUpdateLink } from "./api";

interface FormValues {
  originalUrl: string;
  title: string;
  slug: string;
  collectionId: string;
  isEnabled: boolean;
  password: string;
  removePassword: boolean;
  startsAt: string;
  expiresAt: string;
  landingEnabled: boolean;
  landingDescription: string;
  landingImageUrl: string;
}

const NO_COLLECTION = "none";

function toPayload(values: FormValues) {
  return {
    originalUrl: values.originalUrl,
    title: values.title || undefined,
    slug: values.slug || undefined,
    collectionId: values.collectionId === NO_COLLECTION ? null : values.collectionId,
    isEnabled: values.isEnabled,
    startsAt: fromLocalInput(values.startsAt),
    expiresAt: fromLocalInput(values.expiresAt),
    landingEnabled: values.landingEnabled,
    landingDescription: values.landingDescription || null,
    landingImageUrl: values.landingImageUrl || null,
    password: values.removePassword ? null : values.password || undefined,
  };
}

function defaultsFor(link: LinkDTO | null): FormValues {
  return {
    originalUrl: link?.originalUrl ?? "",
    title: link?.title ?? "",
    slug: link?.slug ?? "",
    collectionId: link?.collectionId ?? NO_COLLECTION,
    isEnabled: link?.isEnabled ?? true,
    password: "",
    removePassword: false,
    startsAt: toLocalInput(link?.startsAt),
    expiresAt: toLocalInput(link?.expiresAt),
    landingEnabled: link?.landingEnabled ?? false,
    landingDescription: link?.landingDescription ?? "",
    landingImageUrl: link?.landingImageUrl ?? "",
  };
}

function randomSlug(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function LinkFormDialog({ link, open, onOpenChange, initialUrl }: { link: LinkDTO | null; open: boolean; onOpenChange: (open: boolean) => void; initialUrl?: string }) {
  const { t, te } = useI18n();
  const isEdit = Boolean(link);
  const collections = useCollections();
  const create = useCreateLink();
  const update = useUpdateLink(link?.id ?? "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);

  const resolver = useMemo<Resolver<FormValues>>(
    () => async (values) => {
      const result = (isEdit ? updateLinkSchema : createLinkSchema).safeParse(toPayload(values));
      if (result.success) return { values, errors: {} };
      const errors: Record<string, { type: string; message: string }> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "originalUrl");
        errors[key] ??= { type: "validation", message: issue.message };
      }
      return { values: {}, errors } as ReturnType<Resolver<FormValues>> extends Promise<infer R> ? R : never;
    },
    [isEdit],
  );

  const form = useForm<FormValues>({ resolver, defaultValues: defaultsFor(link) });
  const { control, handleSubmit, reset, setValue, setError, getValues, watch, formState } = form;

  useEffect(() => {
    if (open) {
      reset({ ...defaultsFor(link), originalUrl: link?.originalUrl ?? initialUrl ?? "" });
      setAdvancedOpen(Boolean(link?.isProtected || link?.startsAt || link?.expiresAt || link?.landingEnabled));
    }
  }, [open, link, initialUrl, reset]);

  const slug = watch("slug");
  const debouncedSlug = useDebouncedValue(slug.trim().toLowerCase(), 400);
  const slugLooksValid = SLUG_PATTERN.test(debouncedSlug);
  const slugCheck = useQuery({
    queryKey: ["slug-check", debouncedSlug, link?.id],
    queryFn: () => checkSlug(debouncedSlug, link?.id),
    enabled: open && slugLooksValid && debouncedSlug !== link?.slug,
    staleTime: 10_000,
  });

  const portalOn = watch("landingEnabled");
  const hasPassword = Boolean(link?.isProtected);
  const removePassword = watch("removePassword");

  async function autoFillTitle() {
    const { originalUrl, title } = getValues();
    if (title.trim() || !originalUrl.trim()) return;
    setFetchingTitle(true);
    try {
      const { title: fetched } = await fetchPageTitle(originalUrl);
      if (!getValues("title").trim()) setValue("title", fetched, { shouldDirty: true });
    } catch {
      /* the title is optional, ignore lookup failures */
    } finally {
      setFetchingTitle(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = toPayload(values);
      const saved = isEdit ? await update.mutateAsync(payload) : await create.mutateAsync(payload);
      toast.success(isEdit ? t("links.updatedToast") : t("links.createdToast"), { description: `/${saved.slug}` });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) setError(field as keyof FormValues, { type: "server", message });
      } else {
        toast.error(te(error instanceof ApiError ? error.code : undefined));
      }
    }
  });

  const pending = create.isPending || update.isPending;
  const host = window.location.host;

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("linkForm.editTitle") : t("linkForm.createTitle")}</DialogTitle>
          <DialogDescription>{isEdit ? t("linkForm.editDesc") : t("linkForm.createDesc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-5" noValidate>
            <FormField
              control={control}
              name="originalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("linkForm.url")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      inputMode="url"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      autoFocus={!isEdit && !initialUrl}
                      placeholder={t("linkForm.urlPlaceholder")}
                      onBlur={() => {
                        field.onBlur();
                        void autoFillTitle();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>{t("linkForm.title")}</FormLabel>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-[13px]" disabled={fetchingTitle || !watch("originalUrl")} onClick={() => {
                      setValue("title", "");
                      void autoFillTitle();
                    }}>
                      {fetchingTitle ? t("linkForm.fetchingTitle") : t("linkForm.fetchTitle")}
                    </Button>
                  </div>
                  <FormControl>
                    <Input {...field} maxLength={120} placeholder={t("linkForm.titlePlaceholder")} autoComplete="off" />
                  </FormControl>
                  <FormDescription>{t("linkForm.titleHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("linkForm.slug")}</FormLabel>
                  <div className="flex gap-2">
                    <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25">
                      <span className="flex items-center border-r bg-muted px-3 font-mono text-[13px] text-muted-foreground">{host}/</span>
                      <FormControl>
                        <input
                          {...field}
                          className="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none placeholder:font-sans placeholder:text-muted-foreground"
                          placeholder={t("linkForm.slugPlaceholder")}
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          maxLength={64}
                        />
                      </FormControl>
                    </div>
                    <Button type="button" variant="outline" size="icon" aria-label={t("linkForm.slugRandom")} title={t("linkForm.slugRandom")} onClick={() => setValue("slug", randomSlug(), { shouldDirty: true, shouldValidate: true })}>
                      <DicesIcon />
                    </Button>
                  </div>
                  <SlugStatus checking={slugCheck.isFetching} available={slugCheck.data?.available} show={slugLooksValid && debouncedSlug !== link?.slug && debouncedSlug === slug.trim().toLowerCase()} />
                  <FormDescription>{t("linkForm.slugHint")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="collectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("linkForm.collection")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_COLLECTION}>{t("linkForm.collectionNone")}</SelectItem>
                      {collections.data?.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit ? (
              <FormField
                control={control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
                    <div className="grid gap-0.5">
                      <FormLabel>{t("linkForm.enabled")}</FormLabel>
                      <FormDescription>{t("linkForm.enabledHint")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ) : null}

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger className="press flex min-h-10 w-full items-center justify-between rounded-lg px-1 text-sm font-medium hover:text-brand-text">
                {t("linkForm.advanced")}
                <ChevronDownIcon className={`size-4 transition-transform duration-200 ease-ios ${advancedOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="grid gap-5 pt-3 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=open]:fade-in-0">
                <FormField
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("linkForm.password")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="new-password" disabled={removePassword} maxLength={72} placeholder={hasPassword ? "••••••••" : t("linkForm.passwordPlaceholder")} />
                      </FormControl>
                      {hasPassword ? <FormDescription>{t("linkForm.passwordKeep")}</FormDescription> : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {hasPassword ? (
                  <FormField
                    control={control}
                    name="removePassword"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                        </FormControl>
                        <FormLabel className="font-normal">{t("linkForm.passwordRemove")}</FormLabel>
                      </FormItem>
                    )}
                  />
                ) : null}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    control={control}
                    name="startsAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("linkForm.startsAt")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("linkForm.expiresAt")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="-mt-3 text-[13px] text-muted-foreground">{t("linkForm.scheduleHint")}</p>

                <FormField
                  control={control}
                  name="landingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
                      <div className="grid gap-0.5">
                        <FormLabel>{t("linkForm.portal")}</FormLabel>
                        <FormDescription>{t("linkForm.portalHint")}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {portalOn ? (
                  <>
                    <FormField
                      control={control}
                      name="landingDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("linkForm.portalDescription")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} maxLength={300} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="landingImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("linkForm.portalImage")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="text" inputMode="url" autoComplete="off" placeholder="https://" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : null}
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={pending || (!isEdit ? false : !formState.isDirty)}>
                {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
                {pending ? t("common.saving") : isEdit ? t("linkForm.submitEdit") : t("linkForm.submitCreate")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SlugStatus({ checking, available, show }: { checking: boolean; available: boolean | undefined; show: boolean }) {
  const t = useT();
  if (!show) return null;
  if (checking || available === undefined) return <p className="text-[13px] text-muted-foreground">{t("linkForm.slugChecking")}</p>;
  return available ? (
    <p className="flex items-center gap-1 text-[13px] font-medium text-success-text">
      <CheckIcon className="size-3.5" /> {t("linkForm.slugAvailable")}
    </p>
  ) : (
    <p className="flex items-center gap-1 text-[13px] font-medium text-destructive-text">
      <XIcon className="size-3.5" /> {t("linkForm.slugTaken")}
    </p>
  );
}
