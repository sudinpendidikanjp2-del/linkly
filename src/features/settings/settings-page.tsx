import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckIcon, DownloadIcon, LoaderCircleIcon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { ApiError, api } from "@/lib/api";
import { useAuth, useUser } from "@/providers/auth";
import { useInstall } from "@/pwa/use-install";
import { ACCENTS, useTheme, type Accent, type ThemeMode } from "@/providers/theme";
import { useI18n, type Lang } from "@/i18n";
import { passwordChangeSchema, profileSchema, type PasswordChangeInput, type ProfileInput } from "@/shared/schemas";
import type { AppConfigDTO, UserDTO } from "@/shared/types";

const ACCENT_SWATCH: Record<Accent, string> = { teal: "#0f766e", blue: "#1d4ed8", orange: "#c2410c", rose: "#be123c", violet: "#6d28d9" };

function useErrorToast() {
  const { te } = useI18n();
  return (error: unknown) => toast.error(te(error instanceof ApiError ? error.code : undefined));
}

function ProfileCard() {
  const { t } = useI18n();
  const user = useUser();
  const { setUser } = useAuth();
  const onError = useErrorToast();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name ?? "", avatarUrl: user.avatarUrl ?? "" } });

  return (
    <Card>
      <Form {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const { user: updated } = await api<{ user: UserDTO }>("/account/profile", { method: "PATCH", body: values });
              setUser(updated);
              form.reset({ name: updated.name ?? "", avatarUrl: updated.avatarUrl ?? "" });
              toast.success(t("settings.saved"));
            } catch (error) {
              onError(error);
            }
          })}
        >
          <CardHeader>
            <CardTitle>{t("settings.profile")}</CardTitle>
            <CardDescription>{t("settings.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="mt-5 grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="settings-email">{t("settings.email")}</Label>
              <Input id="settings-email" value={user.email} readOnly disabled />
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="name" maxLength={80} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.avatar")}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} type="text" inputMode="url" placeholder="https://" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="mt-5 justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
              {form.formState.isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function AppearanceCard() {
  const { t, lang, setLang } = useI18n();
  const { mode, setMode, accent, setAccent } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.appearance")}</CardTitle>
        <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label id="theme-label">{t("settings.theme")}</Label>
          <ToggleGroup type="single" value={mode} onValueChange={(next) => next && setMode(next as ThemeMode)} aria-labelledby="theme-label">
            <ToggleGroupItem value="light">
              <SunIcon className="size-4" /> {t("settings.themeLight")}
            </ToggleGroupItem>
            <ToggleGroupItem value="dark">
              <MoonIcon className="size-4" /> {t("settings.themeDark")}
            </ToggleGroupItem>
            <ToggleGroupItem value="system">
              <MonitorIcon className="size-4" /> {t("settings.themeSystem")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid gap-2">
          <Label id="accent-label">{t("settings.accent")}</Label>
          <RadioGroup value={accent} onValueChange={(next) => setAccent(next as Accent)} aria-labelledby="accent-label" className="flex flex-wrap gap-2">
            {ACCENTS.map((name) => (
              <label key={name} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft">
                <RadioGroupItem value={name} className="sr-only" />
                <span className="size-4 rounded-full" style={{ background: ACCENT_SWATCH[name] }} aria-hidden="true" />
                {t(`settings.accent${name.charAt(0).toUpperCase()}${name.slice(1)}` as "settings.accentTeal")}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="grid gap-2">
          <Label id="lang-label">{t("settings.language")}</Label>
          <ToggleGroup type="single" value={lang} onValueChange={(next) => next && setLang(next as Lang)} aria-labelledby="lang-label">
            <ToggleGroupItem value="id">Bahasa Indonesia</ToggleGroupItem>
            <ToggleGroupItem value="en">English</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function AppCard() {
  const { t } = useI18n();
  const { canInstall, installed, needsManualInstall, install } = useInstall();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pwa.appTitle")}</CardTitle>
        <CardDescription>{t("pwa.appDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {installed ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success-text">
            <CheckIcon className="size-4" /> {t("pwa.installed")}
          </p>
        ) : canInstall ? (
          <Button
            onClick={async () => {
              if (await install()) toast.success(t("pwa.installOk"));
            }}
          >
            <DownloadIcon /> {t("pwa.install")}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">{needsManualInstall ? t("pwa.iosHint") : t("pwa.browserHint")}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SecurityCard() {
  const { t } = useI18n();
  const user = useUser();
  const { setUser } = useAuth();
  const onError = useErrorToast();
  const form = useForm<PasswordChangeInput>({ resolver: zodResolver(passwordChangeSchema), defaultValues: { currentPassword: "", newPassword: "" } });

  return (
    <Card>
      <Form {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await api<{ ok: true }>("/account/password", { method: "POST", body: values });
              setUser({ ...user, hasPassword: true });
              form.reset({ currentPassword: "", newPassword: "" });
              toast.success(t("settings.passwordChanged"));
            } catch (error) {
              if (error instanceof ApiError && error.fields) {
                for (const [field, message] of Object.entries(error.fields)) form.setError(field as keyof PasswordChangeInput, { type: "server", message });
              } else onError(error);
            }
          })}
        >
          <CardHeader>
            <CardTitle>{t("settings.security")}</CardTitle>
            <CardDescription>{user.hasPassword ? t("settings.securityDesc") : t("settings.securityNoPassword")}</CardDescription>
          </CardHeader>
          <CardContent className="mt-5 grid gap-5">
            {user.hasPassword ? (
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.currentPassword")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="password" autoComplete="current-password" maxLength={72} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.newPassword")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="new-password" maxLength={72} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="mt-5 justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : null}
              {user.hasPassword ? t("settings.changePassword") : t("settings.setPassword")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function AdminCard() {
  const { t } = useI18n();
  const { config } = useAuth();
  const queryClient = useQueryClient();
  const onError = useErrorToast();
  const mutation = useMutation({
    mutationFn: (registrationEnabled: boolean) => api<{ registrationEnabled: boolean }>("/admin/settings", { method: "PATCH", body: { registrationEnabled } }),
    onSuccess: ({ registrationEnabled }) => {
      queryClient.setQueryData<AppConfigDTO>(["config"], (current) => (current ? { ...current, registrationEnabled } : current));
      toast.success(t("settings.saved"));
    },
    onError,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.admin")}</CardTitle>
        <CardDescription>{t("settings.adminDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="grid gap-0.5">
            <Label htmlFor="registration-toggle">{t("settings.registration")}</Label>
            <p className="text-[13px] text-muted-foreground">{t("settings.registrationHint")}</p>
          </div>
          <Switch id="registration-toggle" checked={config?.registrationEnabled ?? true} disabled={mutation.isPending || !config} onCheckedChange={(next) => mutation.mutate(next)} />
        </div>
      </CardContent>
    </Card>
  );
}

function DangerCard() {
  const { t } = useI18n();
  const user = useUser();
  const { setUser, logout } = useAuth();
  const onError = useErrorToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { te } = useI18n();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.signOutTitle")}</CardTitle>
          <CardDescription>{t("settings.signOutDesc")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => void logout()}>
            <LogOutIcon /> {t("nav.signOut")}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive-text">{t("settings.danger")}</CardTitle>
          <CardDescription>{t("settings.dangerDesc")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            {t("settings.deleteAccount")}
          </Button>
        </CardFooter>
      </Card>

      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setPassword("");
            setError(null);
          }
        }}
        title={t("settings.deleteAccountTitle")}
        description={t("settings.deleteAccountBody")}
        confirmLabel={t("settings.deleteConfirm")}
        pending={pending}
        onConfirm={async () => {
          setPending(true);
          setError(null);
          try {
            await api<{ ok: true }>("/account", { method: "DELETE", body: { password } });
            setUser(null);
          } catch (failure) {
            if (failure instanceof ApiError && failure.code === "wrong_password") setError(te("wrong_password"));
            else onError(failure);
          } finally {
            setPending(false);
          }
        }}
      >
        {user.hasPassword ? (
          <div className="grid gap-2">
            <Label htmlFor="delete-password">{t("settings.confirmPassword")}</Label>
            <Input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(error)} />
            {error ? (
              <p role="alert" className="text-[13px] font-medium text-destructive-text">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();
  const user = useUser();

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageHeader title={t("settings.title")} description={t("settings.subtitle")} />
      <ProfileCard />
      <AppearanceCard />
      <AppCard />
      <SecurityCard />
      {user.role === "ADMIN" ? <AdminCard /> : null}
      <DangerCard />
    </div>
  );
}
