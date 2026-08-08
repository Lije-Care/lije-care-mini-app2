const STALE_SW_RELOAD_KEY = "lije-care-sw-reset";

const runAfterLoad = (callback: () => void) => {
  if (document.readyState === "complete") {
    callback();
    return;
  }

  window.addEventListener("load", callback, { once: true });
};

export function unregisterStaleServiceWorkers() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  runAfterLoad(() => {
    navigator.serviceWorker
      .getRegistrations()
      .then(async (registrations) => {
        if (registrations.length === 0) {
          sessionStorage.removeItem(STALE_SW_RELOAD_KEY);
          return;
        }

        const unregisterResults = await Promise.all(
          registrations.map(async (registration) => {
            const hadWorker = Boolean(
              registration.active || registration.waiting || registration.installing
            );
            const unregistered = await registration.unregister();

            if (hadWorker && unregistered) {
              console.log("Unregistered stale Service Worker:", registration.scope);
            }

            return hadWorker && unregistered;
          })
        );

        const removedAnyWorker = unregisterResults.some(Boolean);
        const needsReload =
          removedAnyWorker &&
          Boolean(navigator.serviceWorker.controller) &&
          !sessionStorage.getItem(STALE_SW_RELOAD_KEY);

        if (needsReload) {
          sessionStorage.setItem(STALE_SW_RELOAD_KEY, "1");
          window.location.reload();
          return;
        }

        sessionStorage.removeItem(STALE_SW_RELOAD_KEY);
      })
      .catch((error) => {
        console.log("Service Worker cleanup failed:", error);
      });
  });
}
