// src/components/ServiceWorkerRegistration.tsx
// Registers the service worker on mount.
// Must be a client component — service workers are browser-only.
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("WalletWise SW registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("SW registration failed:", err);
        });
    }
  }, []);

  return null; // renders nothing — just a side effect
}