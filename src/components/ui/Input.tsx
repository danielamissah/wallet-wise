"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-3 py-2 text-sm text-gray-900 dark:text-white border rounded-xl transition-colors",
            "bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed",
            error
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-200 dark:border-gray-700 focus:ring-blue-500",
            className
          )}
          {...props}
        />
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <span>⚠</span> {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;