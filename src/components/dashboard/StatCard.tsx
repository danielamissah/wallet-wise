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
  blue:  "text-blue-600 bg-blue-50",
  green: "text-green-600 bg-green-50",
  red:   "text-red-500 bg-red-50",
  gray:  "text-gray-600 bg-gray-100",
};

export default function StatCard({ label, value, trend, color = "gray", icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:shadow-gray-100/80 transition-shadow cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        {icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", COLOR_MAP[color])}>
            {icon}
          </div>
        )}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
        className="text-2xl font-semibold text-gray-900 mb-2"
      >
        {value}
      </motion.p>
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trend > 0  && <TrendingUp   className="w-3.5 h-3.5 text-green-500" />}
          {trend < 0  && <TrendingDown className="w-3.5 h-3.5 text-red-400"   />}
          {trend === 0 && <Minus       className="w-3.5 h-3.5 text-gray-400"  />}
          <span className={cn("text-xs font-medium",
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-500" : "text-gray-400")}>
            {trend > 0 ? "+" : ""}{trend.toFixed(1)}% vs last month
          </span>
        </div>
      )}
    </motion.div>
  );
}