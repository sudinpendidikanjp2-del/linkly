import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ExternalLinkIcon, LoaderCircleIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CopyButton } from "@/components/copy-button";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/states";
import { ApiError } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useI18n } from "@/i18n";
import { HANDLE_PATTERN } from "@/shared/constants";
import { BIO_BUTTON_STYLES, BIO_THEME_IDS, SOCIAL_KEYS, bioSchema, type BioInput } from "@/shared/schemas";
import { BIO_THEMES } from "@/shared/bio-themes";
import type { BioDTO, LinkDTO } from "@/shared/types";
import { useLinkList } from "@/features/links/api";
import { checkHandle, useBio, useSaveBio } from "./api";
import { BioPreview } from "./bio-preview";

const SOCIAL_LABEL: Record<(typeof SOCIAL_KEYS)[number], string> = { instagram: "Instagram", twitter: "X", linkedin: "LinkedIn", youtube: "YouTube", github: "GitHub" };

function toFormValues(bio: BioDTO): BioInput {
  return {
    handle: bio.handle,
    title: bio.title,
    bio: bio.bio ?? "",
    avatarUrl: bio.avatarUrl ?? "",
    bgImageUrl: bio.bgImageUrl ?? "",
    theme: bio.theme as BioInput["theme"],
    buttonStyle: bio.buttonStyle as BioInput["buttonStyle"],
    videoUrl: bio.videoUrl ?? "",
    showFolders: bio.showFolders,
    socials: bio.socials,
    linkIds: bio.linkIds,
  };
}

function BioEditor({ bio }: { bio: BioDTO }) {
  const { t, te } = useI18n();
  const save = useSaveBio();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const form = useForm<BioInput>({ resolver: zodResolver(bioSchema), defaultValues: toFormValues(bio) });
  const { control, watch, setValue, handleSubmit, setError, reset, formState } = form;

  const [linkSearch, setLinkSearch] = useState("");
  const debouncedSearch = useDebouncedValue(linkSearch, 300);
  const available = useLinkList({ page: 1, pageSize: 50, search: debouncedSearch, status: "all", collectionId: "all", protected: "all", sort: "createdAt", order: "desc" });

  const values = watch();
  const linkIds = values.linkIds ?? [];

  const known = useMemo(() => {
    const map = new Map<string, LinkDTO>();
    for (const link of bio.links) map.set(link.id, link);
    for (const link of available.data?.items ?? []) map.set(link.id, link);
    return map;
  }, [bio.links, available.data]);

  const selectedLinks = linkIds.map((id) => known.get(id)).filter((link): link is LinkDTO => Boolean(link));
  const addable = (available.data?.items ?? []).filter((link) => !linkIds.includes(link.id));

  const handle = (values.handle ?? "").trim().toLowerCase();
  const debouncedHandle = useDebouncedValue(handle, 400);
  const handleCheck = useQuery({
    queryKey: ["handle-check", debouncedHandle],
    queryFn: () => checkHandle(debouncedHandle),
    enabled: HANDLE_PATTERN.test(debouncedHandle) && debouncedHandle !== bio.handle,
    staleTime: 10_000,
  });

  useEffect(() => {
    reset(toFormValues(bio));
  }, [bio, reset]);

  function move(index: number, direction: -1 | 1) {
    const next = [...linkIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setValue("linkIds", next, { shouldDirty: true });
  }

  const onSubmit = handleSubmit(async (input) => {
    try {
      await save.mutateAsync(input);
      toast.success(t("bio.saved"));
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) setError(field as keyof BioInput, { type: "server", message });
      }
      toast.error(te(error instanceof ApiError ? error.code : undefined));
    }
  });

  const publicUrl = `${window.location.origin}/b/${bio.handle}`;

  const editor = (
    <div className="grid gap-6">
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
                {handleCheck.isFetching ? (
                  <p className="text-[13px] text-muted-foreground">{t("bio.handleChecking")}</p>
                ) : handleCheck.data && handle === debouncedHandle && handle !== bio.handle ? (
                  handleCheck.data.available ? (
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
          <CardTitle>{t("bio.appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <FormField
            control={control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel id="bio-theme-label">{t("bio.theme")}</FormLabel>
                <RadioGroup value={field.value} onValueChange={field.onChange} aria-labelledby="bio-theme-label" className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
                  {BIO_THEME_IDS.map((id) => {
                    const theme = BIO_THEMES[id];
                    return (
                      <label key={id} className="relative flex cursor-pointer flex-col gap-2 rounded-lg border p-2 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft">
                        <RadioGroupItem value={id} className="sr-only" aria-label={t("bio.themeLabel", { name: theme.label })} />
                        <span className="flex h-10 items-end gap-1 rounded-md p-1.5" style={{ background: theme.bg, border: `1px solid ${theme.border}` }} aria-hidden="true">
                          <span className="h-2 w-6 rounded-sm" style={{ background: theme.fg }} />
                          <span className="size-2.5 rounded-full" style={{ background: theme.accent }} />
                        </span>
                        <span className="text-[13px] font-medium">{theme.label}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="buttonStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("bio.buttonStyle")}</FormLabel>
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                  <ToggleGroup type="single" value={field.value} onValueChange={(next) => next && field.onChange(next)} aria-label={t("bio.buttonStyle")}>
                    {BIO_BUTTON_STYLES.map((style) => (
                      <ToggleGroupItem key={style} value={style}>
                        {t(`bio.style${style.charAt(0).toUpperCase()}${style.slice(1)}` as "bio.styleClassic")}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="bgImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("bio.bgImage")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="text" inputMode="url" placeholder="https://" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("bio.video")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="text" inputMode="url" placeholder="https://youtube.com/watch?v=" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="showFolders"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
                <FormLabel className="leading-snug">{t("bio.showFolders")}</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
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
            <div key={key} className="grid gap-2">
              <Label htmlFor={`social-${key}`}>{SOCIAL_LABEL[key]}</Label>
              <Input
                id={`social-${key}`}
                value={values.socials?.[key] ?? ""}
                onChange={(event) => setValue("socials", { ...values.socials, [key]: event.target.value }, { shouldDirty: true })}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={200}
                placeholder="@username"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bio.links")}</CardTitle>
          <CardDescription>{t("bio.linksHint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {selectedLinks.length > 0 ? (
            <div className="grid gap-2">
              <p className="text-[13px] font-medium text-muted-foreground">{t("bio.shown", { count: selectedLinks.length })}</p>
              <ol className="divide-y rounded-lg border">
                {selectedLinks.map((link, index) => (
                  <li key={link.id} className="flex items-center gap-2 p-2 pl-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{link.title}</span>
                      <span className="block truncate font-mono text-[13px] text-muted-foreground">/{link.slug}</span>
                    </span>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} aria-label={t("bio.moveUp", { title: link.title })} onClick={() => move(index, -1)}>
                      <ArrowUpIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === selectedLinks.length - 1} aria-label={t("bio.moveDown", { title: link.title })} onClick={() => move(index, 1)}>
                      <ArrowDownIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`${t("common.remove")}: ${link.title}`} onClick={() => setValue("linkIds", linkIds.filter((id) => id !== link.id), { shouldDirty: true })}>
                      <XIcon />
                    </Button>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="bio-link-search">{t("bio.linksSearch")}</Label>
            <Input id="bio-link-search" type="search" value={linkSearch} onChange={(event) => setLinkSearch(event.target.value)} />
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              {available.isPending ? (
                <div className="grid gap-2 p-3" aria-busy="true">
                  <Skeleton className="h-9" />
                  <Skeleton className="h-9" />
                </div>
              ) : addable.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">{available.data?.total === 0 && !debouncedSearch ? t("bio.linksEmpty") : t("collections.linksEmpty")}</p>
              ) : (
                <ul className="divide-y">
                  {addable.map((link) => (
                    <li key={link.id}>
                      <button
                        type="button"
                        className="press flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/60 focus-visible:bg-muted/60"
                        onClick={() => setValue("linkIds", [...linkIds, link.id], { shouldDirty: true })}
                      >
                        <PlusIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{link.title}</span>
                          <span className="block truncate font-mono text-[13px] text-muted-foreground">/{link.slug}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const preview = (
    <div className="grid gap-4">
      <BioPreview values={values} links={selectedLinks} />
    </div>
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
            {editor}
            <div className="sticky top-8">{preview}</div>
          </div>
        ) : (
          <Tabs defaultValue="edit">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">{t("bio.tabEdit")}</TabsTrigger>
              <TabsTrigger value="preview">{t("bio.tabPreview")}</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" forceMount className="data-[state=inactive]:hidden">
              {editor}
            </TabsContent>
            <TabsContent value="preview">{preview}</TabsContent>
          </Tabs>
        )}
      </form>
    </Form>
  );
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
