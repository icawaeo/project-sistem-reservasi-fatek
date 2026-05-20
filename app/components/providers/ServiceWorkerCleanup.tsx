"use client";

import { useEffect } from "react";

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(
        registrations
          .filter((registration) => {
            const scriptUrls = [
              registration.active?.scriptURL,
              registration.installing?.scriptURL,
              registration.waiting?.scriptURL,
            ].filter(Boolean);

            return scriptUrls.some((scriptUrl) => {
              try {
                return new URL(scriptUrl as string).origin === window.location.origin;
              } catch {
                return false;
              }
            });
          })
          .map((registration) => registration.unregister())
      ))
      .catch(() => {
        // Best-effort cleanup for browsers that previously loaded a worker.
      });

    if ("caches" in window) {
      caches.keys()
        .then((keys) => Promise.all(
          keys
            .filter((key) => (
              key.startsWith("static-cache-") ||
              key.startsWith("pages-cache-") ||
              key.startsWith("image-cache-") ||
              key.startsWith("font-cache-") ||
              key.startsWith("api-cache-")
            ))
            .map((key) => caches.delete(key))
        ))
        .catch(() => {
          // Ignore cache cleanup failures.
        });
    }
  }, []);

  return null;
}
