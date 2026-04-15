// src/components/InstallPrompt.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Singleton so the prompt ref survives across renders
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function getInstallPrompt() {
  return deferredPrompt;
}

export default function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [showIos,    setShowIos]    = useState(false);
  const [installed,  setInstalled]  = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Detect iOS — needs manual instructions
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = ("standalone" in navigator) &&
      (navigator as Navigator & { standalone?: boolean }).standalone;

    if (isIos && !isInStandaloneMode) {
      const dismissed = localStorage.getItem("ww_ios_prompt_dismissed");
      if (!dismissed) setShowIos(true);
      return;
    }

    // Chrome / Android — listen for beforeinstallprompt
    function handlePrompt(e: Event) {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      promptRef.current = deferredPrompt;

      const dismissed = localStorage.getItem("ww_install_dismissed");
      const dismissedAt = dismissed ? Number(dismissed) : 0;
      const hoursSince = (Date.now() - dismissedAt) / 1000 / 60 / 60;

      // Show if never dismissed, or dismissed more than 48hrs ago
      if (!dismissed || hoursSince > 48) {
        setShowBanner(true);
      }
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);

    // If we already captured the prompt before this component mounted
    if (deferredPrompt) {
      const dismissed = localStorage.getItem("ww_install_dismissed");
      const dismissedAt = dismissed ? Number(dismissed) : 0;
      const hoursSince = (Date.now() - dismissedAt) / 1000 / 60 / 60;
      if (!dismissed || hoursSince > 48) {
        promptRef.current = deferredPrompt;
        setShowBanner(true);
      }
    }

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowBanner(false);
      deferredPrompt = null;
      localStorage.removeItem("ww_install_dismissed");
    });

    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  async function handleInstall() {
    const prompt = promptRef.current ?? deferredPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShowBanner(false);
      deferredPrompt = null;
    } else {
      // Store dismissal time — re-show after 48hrs
      localStorage.setItem("ww_install_dismissed", String(Date.now()));
      setShowBanner(false);
    }
  }

  function dismissBanner() {
    localStorage.setItem("ww_install_dismissed", String(Date.now()));
    setShowBanner(false);
  }

  function dismissIos() {
    localStorage.setItem("ww_ios_prompt_dismissed", "1");
    setShowIos(false);
  }

  if (installed) return null;

  return (
    <>
      {/* Android / Chrome install banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50"
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Install WalletWise
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Add to your home screen for quick access — works offline too.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleInstall}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Install
                    </button>
                    <button
                      onClick={dismissBanner}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      Not now
                    </button>
                  </div>
                </div>
                <button
                  onClick={dismissBanner}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Safari instructions */}
      <AnimatePresence>
        {showIos && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 left-4 right-4 z-50"
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/20 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Install on iPhone
                  </p>
                </div>
                <button onClick={dismissIos}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { step: "1", text: "Tap the Share button in Safari" },
                  { step: "2", text: 'Scroll down and tap "Add to Home Screen"' },
                  { step: "3", text: 'Tap "Add" to install WalletWise' },
                ].map(s => (
                  <div key={s.step} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{s.step}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}