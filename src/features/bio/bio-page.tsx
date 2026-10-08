import { useEffect, useMemo } from "react";
import { get, useForm, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckIcon, ExternalLinkIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/states";
import { ApiError } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useI18n } from "@/i18n";
import { HANDLE_PATTERN } from "@/shared/constants";
import { SOCIAL_KEYS, bioSchema, type BioInput, type BioParsed, type DesignInput } from "@/shared/bio-schema";
import type { BioDTO, LinkDTO } from "@/shared/types";
import { checkHandle, useBio, useSaveBio } from "./api";
import { BlocksEditor } from "./blocks-editor";
import { DesignEditor } from "./design-editor";
import { FloatersEditor } from "./floaters-editor";
import { TextField, UrlField } from "./fields";
import { BioPreview } from "./preview";

const SOCIAL_LABEL: Record<(typeof SOCIAL_KEYS)[number], string> = { instagram: "Instagram", twitter: "X", linkedin: "LinkedIn", youtube: "YouTube", github: "GitHub" };

type BioForm = UseFormReturn<BioInput, unknown, BioParsed>;

function toFormValues(bio: BioDTO): BioInput {
  return {
    handle: bio.handle,
    title: bio.title,
    bio: bio.bio ?? "",
    avatarUrl: bio.avatarUrl ?? "",
    theme: bio.theme as BioInput["theme"],
    buttonStyle: bio.buttonStyle as BioInput["buttonStyle"],
    showFolders: bio.showFolders,
    showBranding: bio.showBranding,
    socials: bio.socials,
    design: bio.design as DesignInput,
    blocks: bio.blocks,
    floaters: bio.floaters,
    seoTitle: bio.seoTitle ?? "",
    seoDescription: bio.seoDescription ?? "",
    ogImageUrl: bio.ogImageUrl ?? "",
  };
}

/** Collects `{ "target.url": "invalid_url" }` style codes for one array item. */
function errorsFor(errors: FieldErrors<BioInput>, list: "blocks" | "floaters", index: number): Record<string, string> {
  const node = get(errors, `${list}.${index}`) as Record<string, unknown> | undefined;
  const out: Record<string, string> = {};
  const walk = (value: unknown, path: string) => {
    if (!value || typeof value !== "object") return;
    const entry = value as { message?: unknown; [key: string]: unknown };
    if (typeof entry.message === "string" && path) out[path] = entry.message;
    for (const [key, child] of Object.entries(entry)) {
      if (key === "message" || key === "type" || key === "ref") continue;
      walk(child, path ? `${path}.${key}` : key);
    }
  };
  walk(node, "");
  return out;
}

function ProfileCard({ form, bio }: { form: BioForm; bio: BioDTO }) {
  const { t } = useI18n();
  const { control, watch } = form;
  const handle = (watch("handle") ?? "").trim().toLowerCase();
  const debouncedHandle = useDebouncedValue(handle, 400);
  const check = useQuery({
    queryKey: ["handle-check", debouncedHandle],
    queryFn: () => checkHandle(debouncedHandle),
    enabled: HANDLE_PATTERN.test(debouncedHandle) && debouncedHandle !== bio.handle,
    staleTime: 10_000,
  });
  const socials = watch("socials") ?? {};

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("bio.profile")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <FormField
            control={control}
            name="handle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("bio.handle")}</FormLabel>
                <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25">
                  <span className="flex items-center border-r bg-muted px-3 font-mono text-[13px] text-muted-foreground">{window.location.host}/b/</span>
                  <FormControl>
                    <input {...field} className="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={30} />
                  </FormControl>
                </div>
                {check.isFetching ? (
                  <p className="text-[13px] text-muted-foreground">{t("bio.handleChecking")}</p>
                ) : check.data && handle === debouncedHandle && handle !== bio.handle ? (
                  check.data.available ? (
                    <p className="flex items-center gap-1 text-[13px] font-medium text-success-text">
                      <CheckIcon className="size-3.5" /> {t("bio.handleAvailable")}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-[13px] font-medium text-destructive-text">
                      <XIcon className="size-3.5" /> {t("bio.handleTaken")}
                    </p>
                  )
                ) : null}
                <FormDescription>{t("bio.handleHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("bio.name")}</FormLabel>
                <FormControl>
                  <Input {...field} maxLength={80} autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("bio.bio")}</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} rows={3} maxLength={240} placeholder={t("bio.bioPlaceholder")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("bio.avatar")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="text" inputMode="url" placeholder="https://" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bio.socials")}</CardTitle>
          <CardDescription>{t("bio.socialHint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_KEYS.map((key) => (
            <TextField key={key} label={SOCIAL_LABEL[key]} value={socials[key] ?? ""} placeholder="@username" maxLength={200} onChange={(value) => form.setValue("socials", { ...socials, [key]: value }, { shouldDirty: true })} />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function PageSettingsCard({ form }: { form: BioForm }) {
  const { t } = useI18n();
  const values = form.watch();
  const set = (patch: Partial<BioInput>) => {
    for (const [key, value] of Object.entries(patch)) form.setValue(key as keyof BioInput, value as never, { shouldDirty: true });
  };
  const errors = form.formState.errors;
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("bioEditor.seoTitle")}</CardTitle>
          <CardDescription>{t("bioEditor.seoHint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <TextField label={t("bioEditor.seoPageTitle")} value={values.seoTitle ?? ""} onChange={(seoTitle) => set({ seoTitle })} maxLength={70} placeholder={values.title} />
          <div className="grid gap-2">
            <Label htmlFor="seo-description">{t("bioEditor.seoDescription")}</Label>
            <Textarea id="seo-description" rows={3} maxLength={160} value={values.seoDescription ?? ""} onChange={(event) => set({ seoDescription: event.target.value })} placeholder={values.bio ?? ""} />
          </div>
          <UrlField label={t("bioEditor.ogImage")} value={values.ogImageUrl ?? ""} onChange={(ogImageUrl) => set({ ogImageUrl })} error={errors.ogImageUrl?.message} hint={t("bioEditor.ogImageHint")} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="grid gap-0.5">
            <Label htmlFor="branding">{t("bioEditor.branding")}</Label>
            <p className="text-[13px] text-muted-foreground">{t("bioEditor.brandingHint")}</p>
          </div>
          <Switch id="branding" checked={values.showBranding ?? true} onCheckedChange={(showBranding) => set({ showBranding })} />
        </CardContent>
      </Card>
    </div>
  );
}

function BioEditor({ bio }: { bio: BioDTO }) {
  const { t, te } = useI18n();
  const save = useSaveBio();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const form = useForm<BioInput, unknown, BioParsed>({ resolver: zodResolver(bioSchema), defaultValues: toFormValues(bio) });
  const { handleSubmit, setError, reset, setValue, watch, formState } = form;

  useEffect(() => {
    reset(toFormValues(bio));
  }, [bio, reset]);

  const values = watch() as BioInput;

  // Titles for every link the page refers to: those the server sent plus the ones picked in this session.
  const links = useMemo(() => new Map<string, LinkDTO>(bio.links.map((link) => [link.id, link])), [bio.links]);
  const pickedLinks = useMemo(() => new Map(links), [links]);
  const known = useKnownLinks(values, pickedLinks);

  const onSubmit = handleSubmit(
    async (input) => {
      try {
        await save.mutateAsync(input as unknown as BioInput);
        toast.success(t("bio.saved"));
      } catch (error) {
        if (error instanceof ApiError && error.fields) {
          for (const [field, message] of Object.entries(error.fields)) setError(field as never, { type: "server", message });
        }
        toast.error(te(error instanceof ApiError ? error.code : undefined));
      }
    },
    () => toast.error(te("validation_error")),
  );

  const publicUrl = `${window.location.origin}/b/${bio.handle}`;
  const design = (values.design ?? {}) as DesignInput;

  const tabs = (
    <Tabs defaultValue="content" className="min-w-0">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <TabsList>
          <TabsTrigger value="content">{t("bioEditor.tabContent")}</TabsTrigger>
          <TabsTrigger value="design">{t("bioEditor.tabDesign")}</TabsTrigger>
          <TabsTrigger value="floating">{t("bioEditor.tabFloating")}</TabsTrigger>
          <TabsTrigger value="page">{t("bioEditor.tabPage")}</TabsTrigger>
          {!desktop ? <TabsTrigger value="preview">{t("bio.tabPreview")}</TabsTrigger> : null}
        </TabsList>
      </div>

      <TabsContent value="content" className="grid gap-6">
        <ProfileCard form={form} bio={bio} />
        <Card>
          <CardHeader>
            <CardTitle>{t("bioEditor.blocksTitle")}</CardTitle>
            <CardDescription>{t("bioEditor.blocksDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <BlocksEditor blocks={values.blocks ?? []} onChange={(blocks) => setValue("blocks", blocks, { shouldDirty: true, shouldValidate: formState.isSubmitted })} links={known} errorsAt={(index) => errorsFor(formState.errors, "blocks", index)} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="design">
        <DesignEditor
          values={values}
          design={design}
          onDesign={(patch) => setValue("design", { ...design, ...patch }, { shouldDirty: true })}
          onField={(patch) => Object.entries(patch).forEach(([key, value]) => setValue(key as keyof BioInput, value as never, { shouldDirty: true }))}
        />
      </TabsContent>

      <TabsContent value="floating">
        <Card>
          <CardHeader>
            <CardTitle>{t("bioEditor.floatTitle")}</CardTitle>
            <CardDescription>{t("bioEditor.floatDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FloatersEditor floaters={values.floaters ?? []} onChange={(floaters) => setValue("floaters", floaters, { shouldDirty: true, shouldValidate: formState.isSubmitted })} links={known} errorsAt={(index) => errorsFor(formState.errors, "floaters", index)} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="page">
        <PageSettingsCard form={form} />
      </TabsContent>

      {!desktop ? (
        <TabsContent value="preview">
          <BioPreview values={values} links={known} />
        </TabsContent>
      ) : null}
    </Tabs>
  );

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-6">
        <PageHeader
          title={t("bio.title")}
          description={t("bio.subtitle")}
          actions={
            <Button type="submit" disabled={save.isPending || (!formState.isDirty && bio.published)}>
              {save.isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
              {save.isPending ? t("common.saving") : t("bio.save")}
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">{t("bio.publicUrl")}</span>
          {bio.published ? (
            <>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate font-mono text-[13px] font-semibold hover:underline hover:underline-offset-4">
                {publicUrl.replace(/^https?:\/\//, "")}
              </a>
              <CopyButton value={publicUrl} className="-my-1" />
              <Button variant="ghost" size="sm" asChild className="ml-auto">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon /> {t("bio.openPage")}
                </a>
              </Button>
            </>
          ) : (
            <span className="text-muted-foreground">{t("bio.notPublished")}</span>
          )}
        </div>

        {desktop ? (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            {tabs}
            <div className="sticky top-8">
              <BioPreview values={values} links={known} />
            </div>
          </div>
        ) : (
          tabs
        )}
      </form>
    </Form>
  );
}

import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Link titles are needed for rows the user just picked, which the server has not sent yet.
 * Missing ids are fetched once and merged into the map.
 */
function useKnownLinks(values: BioInput, base: Map<string, LinkDTO>): Map<string, LinkDTO> {
  const wanted = new Set<string>();
  for (const block of values.blocks ?? []) {
    if (block.type === "link" && block.linkId) wanted.add(block.linkId);
    if ((block.type === "button" || block.type === "image") && block.target?.kind === "link" && block.target.linkId) wanted.add(block.target.linkId);
  }
  for (const floater of values.floaters ?? []) if (floater.target?.kind === "link" && floater.target.linkId) wanted.add(floater.target.linkId);
  const missing = [...wanted].filter((id) => !base.has(id));
  const results = useQueries({
    queries: missing.map((id) => ({ queryKey: ["links", "detail", id], queryFn: () => api<LinkDTO>(`/links/${id}`), staleTime: 60_000, retry: false })),
  });
  return useMemo(() => {
    const map = new Map(base);
    for (const result of results) if (result.data) map.set(result.data.id, result.data);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, results.map((result) => result.data?.id).join(",")]);
}

export default function BioPage() {
  const bio = useBio();
  if (bio.isPending) {
    return (
      <div className="grid gap-6" aria-busy="true">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  if (bio.isError) return <ErrorState error={bio.error} onRetry={() => void bio.refetch()} />;
  return <BioEditor bio={bio.data} />;
}
