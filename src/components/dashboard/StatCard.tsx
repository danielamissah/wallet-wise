// src/components/dashboard/StatCard.tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: number;
  color?: "blue" | "green" | "red" | "gray";
  icon?: React.ReactNode;
  delay?: number;
}

const COLOR_MAP = {
  blue:  "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40",
  green: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/40",
  red:   "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/40",
  gray:  "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800",
};

export default function StatCard({ label, value, trend, color = "gray", icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 hover:shadow-md hover:shadow-gray-100/80 dark:hover:shadow-gray-900/80 transition-all cursor-default"
    >
      <div className="flex items-center justify-between sm:items-start sm:flex-col sm:gap-0 gap-3">
        <div className="flex-1 sm:w-full">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
            className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
          >
            {value}
          </motion.p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend > 0  && <TrendingUp   className="w-3 h-3 text-green-500" />}
              {trend < 0  && <TrendingDown className="w-3 h-3 text-red-400"   />}
              {trend === 0 && <Minus       className="w-3 h-3 text-gray-400"  />}
              <span className={cn("text-xs font-medium",
                trend > 0 ? "text-green-600 dark:text-green-400" :
                trend < 0 ? "text-red-500 dark:text-red-400" :
                "text-gray-400")}>
                {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg flex items-center justify-center shrink-0",
            COLOR_MAP[color]
          )}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}