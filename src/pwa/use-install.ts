import { useEffect, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

const standaloneQuery = typeof window !== "undefined" ? window.matchMedia("(display-mode: standalone)") : null;
const isStandalone = () => Boolean(standaloneQuery?.matches) || (navigator as unknown as { standalone?: boolean }).standalone === true;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    emit();
  });
}

function snapshot(): string {
  return `${deferred ? 1 : 0}${installed || isStandalone() ? 1 : 0}`;
}

export function useInstall() {
  const state = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot,
    () => "00",
  );
  useEffect(() => {
    const onChange = () => emit();
    standaloneQuery?.addEventListener("change", onChange);
    return () => standaloneQuery?.removeEventListener("change", onChange);
  }, []);

  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);

  return {
    canInstall: state[0] === "1",
    installed: state[1] === "1",
    /** iOS Safari has no install prompt; people add the app from the Share sheet. */
    needsManualInstall: ios && state[1] === "0",
    async install(): Promise<boolean> {
      if (!deferred) return false;
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      emit();
      return outcome === "accepted";
    },
  };
}
