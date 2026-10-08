import { useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, LanguagesIcon, LoaderCircleIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/logo";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/providers/auth";
import { useTheme } from "@/providers/theme";
import { useI18n } from "@/i18n";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/shared/schemas";

function PasswordInput({ id, visible, onToggle, ...props }: React.ComponentProps<typeof Input> & { visible: boolean; onToggle: () => void }) {
  const { t } = useI18n();
  return (
    <div className="relative">
      <Input id={id} type={visible ? "text" : "password"} className="pr-11" {...props} />
      <Button type="button" variant="ghost" size="icon-sm" className="absolute top-0.5 right-0.5 text-muted-foreground" onClick={onToggle} aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={visible}>
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
    </div>
  );
}

function useSubmit<T extends { setError: (name: never, error: { type: string; message: string }) => void }>() {
  const { te } = useI18n();
  return (error: unknown, form: T) => {
    if (error instanceof ApiError && error.fields) {
      for (const [field, message] of Object.entries(error.fields)) form.setError(field as never, { type: "server", message });
    }
    toast.error(te(error instanceof ApiError ? error.code : undefined));
  };
}

function LoginForm() {
  const { t } = useI18n();
  const { login } = useAuth();
  const [visible, setVisible] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const onError = useSubmit<typeof form>();

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await login(values);
          } catch (error) {
            onError(error, form);
          }
        })}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email")}</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="email" inputMode="email" placeholder={t("auth.emailPlaceholder")} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.password")}</FormLabel>
              <FormControl>
                <PasswordInput {...field} autoComplete="current-password" visible={visible} onToggle={() => setVisible((v) => !v)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : null}
          {t("auth.signIn")}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm({ disabled }: { disabled: boolean }) {
  const { t } = useI18n();
  const { register } = useAuth();
  const [visible, setVisible] = useState(false);
  const form = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "" } });
  const onError = useSubmit<typeof form>();

  if (disabled) {
    return (
      <p role="status" className="rounded-lg bg-warning-soft px-4 py-3 text-sm font-medium text-warning-text">
        {t("auth.registrationOff")}
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await register(values);
          } catch (error) {
            onError(error, form);
          }
        })}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.name")}</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="name" placeholder={t("auth.namePlaceholder")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email")}</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="email" inputMode="email" placeholder={t("auth.emailPlaceholder")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.password")}</FormLabel>
              <FormControl>
                <PasswordInput {...field} autoComplete="new-password" visible={visible} onToggle={() => setVisible((v) => !v)} />
              </FormControl>
              <FormDescription>{t("auth.passwordHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <LoaderCircleIcon className="animate-spin" /> : null}
          {t("auth.signUp")}
        </Button>
      </form>
    </Form>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.600-.2-2.300H12v4.400h6.200a5.300 5.300 0 0 1-2.300 3.500v2.900h3.700c2.200-2 3.400-5 3.400-8.500Z" />
      <path fill="#34A853" d="M12 24c3.100 0 5.700-1 7.600-2.800l-3.700-2.900c-1 .7-2.300 1.100-3.900 1.100-3 0-5.500-2-6.400-4.700H1.800v3a12 12 0 0 0 10.200 6.300Z" />
      <path fill="#FBBC05" d="M5.600 14.700a7.200 7.200 0 0 1 0-4.600v-3H1.800a12 12 0 0 0 0 10.600l3.800-3Z" />
      <path fill="#EA4335" d="M12 4.800c1.700 0 3.200.6 4.400 1.700l3.300-3.300A11.900 11.900 0 0 0 12 0 12 12 0 0 0 1.800 6.600l3.800 3C6.500 6.800 9 4.800 12 4.800Z" />
    </svg>
  );
}

export default function AuthPage() {
  const { t, lang, setLang } = useI18n();
  const { user, loading, config } = useAuth();
  const { resolved, setMode } = useTheme();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [googlePending, setGooglePending] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const oauthError = params.get("error");

  async function google() {
    setGooglePending(true);
    try {
      const { url } = await api<{ url: string }>("/auth/google/url");
      window.location.assign(url);
    } catch (error) {
      setGooglePending(false);
      toast.error(t("auth.oauthFailed"), { description: error instanceof ApiError ? undefined : undefined });
    }
  }

  const facts = [
    { title: t("auth.p1Title"), body: t("auth.p1Body") },
    { title: t("auth.p2Title"), body: t("auth.p2Body") },
    { title: t("auth.p3Title"), body: t("auth.p3Body") },
  ];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="relative flex min-h-dvh flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label={t("settings.language")} onClick={() => setLang(lang === "id" ? "en" : "id")}>
              <LanguagesIcon />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t("settings.theme")} onClick={() => setMode(resolved === "dark" ? "light" : "dark")}>
              {resolved === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{tab === "login" ? t("auth.welcome") : t("auth.signUpTitle")}</h1>
            <p className="text-[15px] text-muted-foreground">{tab === "login" ? t("auth.welcomeBody") : t("auth.signUpBody")}</p>
          </div>

          {oauthError ? (
            <p role="alert" className="rounded-lg bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive-text">
              {oauthError === "registration_disabled" ? t("auth.registrationOff") : t("auth.oauthFailed")}
            </p>
          ) : null}

          <Tabs value={tab} onValueChange={(next) => setTab(next as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t("auth.tabSignIn")}</TabsTrigger>
              <TabsTrigger value="register">{t("auth.tabSignUp")}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm disabled={config?.registrationEnabled === false} />
            </TabsContent>
          </Tabs>

          {config?.googleEnabled ? (
            <>
              <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {t("auth.or")}
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" size="lg" onClick={google} disabled={googlePending}>
                {googlePending ? <LoaderCircleIcon className="animate-spin" /> : <GoogleIcon />}
                {t("auth.google")}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <aside className="hidden flex-col justify-between bg-brand-soft p-12 lg:flex" aria-label="Linkly">
        <p className="font-mono text-sm text-brand-text">
          linkly<span aria-hidden="true">/</span>
          <span className="font-semibold">promo-juli</span>
        </p>
        <div className="max-w-md space-y-10">
          <div className="space-y-3">
            <h2 className="text-4xl leading-[1.1] font-semibold text-foreground">{t("auth.panelTitle")}</h2>
            <p className="text-base text-muted-foreground">{t("auth.panelBody")}</p>
          </div>
          <dl className="space-y-5">
            {facts.map((fact) => (
              <div key={fact.title} className="space-y-1">
                <dt className="font-semibold">{fact.title}</dt>
                <dd className="text-sm text-muted-foreground">{fact.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <span />
      </aside>
    </div>
  );
}
