// src/components/InstallPrompt.tsx
// Shows an install banner when the browser fires the beforeinstallprompt event.
// This event only fires on Android Chrome and desktop Chrome/Edge.
// iOS users see a separate message with manual instructions.
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner,     setShowBanner]     = useState(false);
  const [isIos,          setIsIos]          = useState(false);
  const [isInstalled,    setIsInstalled]    = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed before
    const dismissed = localStorage.getItem("walletwise_install_dismissed");
    if (dismissed) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(ios);

    if (ios) {
      // Show iOS instructions after a short delay
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    // Listen for Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShowBanner(false);
    localStorage.setItem("walletwise_install_dismissed", "true");
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  }

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-gray-200/60 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white text-lg">💼</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Install WalletWise
                  </p>
                  <p className="text-xs text-gray-400">
                    Add to your home screen
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIos ? (
              // iOS manual install instructions
              <div className="space-y-2">
                <p className="text-xs text-gray-500 leading-relaxed">
                  To install on iPhone or iPad:
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-semibold text-[10px]">1</span>
                  <span>Tap the <Share className="w-3 h-3 inline" /> Share button in Safari</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-semibold text-[10px]">2</span>
                  <span>Tap <strong>Add to Home Screen</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-semibold text-[10px]">3</span>
                  <span>Tap <strong>Add</strong> to confirm</span>
                </div>
                <button
                  onClick={dismiss}
                  className="w-full mt-2 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            ) : (
              // Android / desktop install button
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  Install for quick access, offline support, and a native app feel.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={dismiss}
                    className="flex-1 py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Not now
                  </button>
                  <button
                    onClick={handleInstall}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}