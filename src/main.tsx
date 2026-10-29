import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AuthProvider } from "@/providers/auth";
import { ThemeProvider } from "@/providers/theme";
import { I18nProvider } from "@/i18n";
import { id } from "@/i18n/id";
import { en } from "@/i18n/en";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api";
import { registerServiceWorker } from "./pwa/register";
import { toast } from "sonner";
import "./index.css";

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // A 401 on any request means the session ended: drop the cached user so the router redirects to /login.
      if (error instanceof ApiError && error.status === 401) queryClient.setQueryData(["me"], { user: null });
    },
  }),
  defaultOptions: {
    mutations: { networkMode: "always" },
    queries: {
      // Fail fast when offline so pages show an error state with a retry button instead of loading forever.
      networkMode: "always",
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        if (error instanceof ApiError) {
          if (error.status >= 400 && error.status < 500) return false;
          if (error.code === "network") return count < 1;
        }
        return count < 2;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <TooltipProvider>
            <AuthProvider>
              <App />
              <Toaster />
            </AuthProvider>
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

registerServiceWorker((activate) => {
  let lang: "id" | "en" = navigator.language.toLowerCase().startsWith("en") ? "en" : "id";
  try {
    const saved = localStorage.getItem("linkly-lang");
    if (saved === "id" || saved === "en") lang = saved;
  } catch {
    /* storage unavailable */
  }
  const text = (lang === "en" ? en : id).pwa;
  toast(text.updateTitle, { description: text.updateBody, duration: Infinity, action: { label: text.updateAction, onClick: activate } });
});
