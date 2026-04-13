"use client";

import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full px-3 py-2 text-sm text-gray-900 dark:text-white border rounded-xl transition-colors",
            "bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:border-transparent",
            "disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed",
            error
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-200 dark:border-gray-700 focus:ring-blue-500",
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option
              key={opt.value}
              value={opt.value}
              className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            >
              {opt.label}
            </option>
          ))}
        </select>
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

Select.displayName = "Select";
export default Select;