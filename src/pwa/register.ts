/** Registers the service worker in production builds and reports when a new version is waiting. */
export function registerServiceWorker(onUpdate: (activate: () => void) => void): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        const announce = (worker: ServiceWorker) => onUpdate(() => worker.postMessage("SKIP_WAITING"));
        if (registration.waiting && navigator.serviceWorker.controller) announce(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) announce(worker);
          });
        });
        // Check for a new version whenever the app returns to the foreground.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") void registration.update().catch(() => undefined);
        });
      })
      .catch((error) => console.warn("Service worker registration failed", error));

    // Reload only when a new version replaces an old one. On the very first install the page has no controller yet,
    // and a reload there would interrupt whatever the person is doing.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading || !hadController) return;
      reloading = true;
      window.location.reload();
    });
  });
}
