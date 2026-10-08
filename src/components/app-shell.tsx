import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { ChartNoAxesColumnIcon, CheckIcon, FolderClosedIcon, LanguagesIcon, Link2Icon, LogOutIcon, MenuIcon, MonitorIcon, MoonIcon, PlusIcon, SettingsIcon, SquareUserIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { LinkActionsProvider, useLinkActions } from "@/features/links/link-actions";
import { useAuth, useUser } from "@/providers/auth";
import { useTheme, type ThemeMode } from "@/providers/theme";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "nav.dashboard", icon: ChartNoAxesColumnIcon, end: true },
  { to: "/links", key: "nav.links", icon: Link2Icon },
  { to: "/collections", key: "nav.collections", icon: FolderClosedIcon },
  { to: "/bio", key: "nav.bio", icon: SquareUserIcon },
  { to: "/settings", key: "nav.settings", icon: SettingsIcon },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t("nav.main")} className="grid gap-1">
      {NAV.map(({ to, key, icon: Icon, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={"end" in rest}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "press flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
              isActive ? "bg-brand-soft text-brand-text" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )
          }
        >
          <Icon className="size-[18px]" />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  );
}

function UserMenu() {
  const user = useUser();
  const { logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { mode, setMode } = useTheme();
  const initial = (user.name ?? user.email).trim().charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="press flex w-full min-w-0 items-center gap-3 rounded-lg p-2 text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/30">
          <Avatar className="size-9">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-sm font-medium">{user.name ?? user.email}</span>
            <span className="truncate text-[13px] text-muted-foreground">{user.email}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        <DropdownMenuLabel>{t("settings.theme")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(next) => setMode(next as ThemeMode)}>
          <DropdownMenuRadioItem value="light">
            <SunIcon className="size-4" /> {t("settings.themeLight")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon className="size-4" /> {t("settings.themeDark")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorIcon className="size-4" /> {t("settings.themeSystem")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setLang("id")}>
          <LanguagesIcon /> Bahasa Indonesia {lang === "id" ? <CheckIcon className="ml-auto" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLang("en")}>
          <LanguagesIcon /> English {lang === "en" ? <CheckIcon className="ml-auto" /> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <LogOutIcon /> {t("nav.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ShellFrame() {
  const { t } = useI18n();
  const actions = useLinkActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <a href="#main" className="sr-only z-[60] rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        {t("common.skipToContent")}
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-card p-4 lg:flex">
        <Link to="/" className="rounded-lg px-2 pt-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30" aria-label="Linkly">
          <Logo />
        </Link>
        <Button onClick={() => actions.create()} className="h-11 justify-start px-4">
          <PlusIcon /> {t("nav.newLink")}
        </Button>
        <NavLinks />
        <div className="mt-auto border-t pt-3">
          <UserMenu />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-md lg:hidden">
          <Button variant="ghost" size="icon" aria-label={t("nav.openMenu")} onClick={() => setMenuOpen(true)}>
            <MenuIcon />
          </Button>
          <Link to="/" className="rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30" aria-label="Linkly">
            <Logo className="text-base" />
          </Link>
          <Button size="sm" className="ml-auto" onClick={() => actions.create()}>
            <PlusIcon /> {t("nav.newLink")}
          </Button>
        </header>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="p-4">
            <SheetHeader className="p-0 pr-10">
              <SheetTitle>
                <Logo />
              </SheetTitle>
              <SheetDescription className="sr-only">{t("nav.main")}</SheetDescription>
            </SheetHeader>
            <NavLinks onNavigate={() => setMenuOpen(false)} />
            <div className="mt-auto border-t pt-3">
              <UserMenu />
            </div>
          </SheetContent>
        </Sheet>

        <main id="main" tabIndex={-1} key={location.pathname} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none animate-in fade-in-0 slide-in-from-bottom-1 duration-300 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <LinkActionsProvider>
      <ShellFrame />
    </LinkActionsProvider>
  );
}
