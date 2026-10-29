import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { LoaderCircleIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/providers/auth";
import AuthPage from "@/features/auth/auth-page";
import NotFoundPage from "@/features/not-found-page";

const DashboardPage = lazy(() => import("@/features/dashboard/dashboard-page"));
const LinksPage = lazy(() => import("@/features/links/links-page"));
const LinkDetailPage = lazy(() => import("@/features/links/link-detail-page"));
const CollectionsPage = lazy(() => import("@/features/collections/collections-page"));
const BioPage = lazy(() => import("@/features/bio/bio-page"));
const SettingsPage = lazy(() => import("@/features/settings/settings-page"));

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-live="polite">
      <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) {
    // Remember where the visitor was heading (including shared links from the Android share sheet).
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route element={<RequireAuth />}>
            <Route index element={<DashboardPage />} />
            <Route path="links" element={<LinksPage />} />
            <Route path="links/:id" element={<LinkDetailPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="bio" element={<BioPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
