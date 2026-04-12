// src/components/ui/Modal.tsx
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        // Full-screen overlay — flex column so modal stays in view
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            // On mobile: slides up from bottom, rounded top corners only
            // On sm+: centered card with all rounded corners
            className={cn(
              "bg-white w-full sm:max-w-md",
              "rounded-t-3xl sm:rounded-2xl",
              "max-h-[92vh] sm:max-h-[90vh]",
              "flex flex-col",
              "shadow-xl",
              className
            )}
            onClick={e => e.stopPropagation()}
          >
            {/* Header — sticky so title always visible while scrolling */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              {/* Drag handle — mobile only */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full sm:hidden" />
              <h2 className="text-base font-semibold text-gray-900 mt-2 sm:mt-0">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors mt-2 sm:mt-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-5">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}