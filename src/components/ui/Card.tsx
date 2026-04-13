"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
}

export default function Card({ children, className, animate = false, delay = 0 }: CardProps) {
  const base = cn(
    "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 transition-colors duration-300",
    className
  );

  if (!animate) return <div className={base}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={base}
    >
      {children}
    </motion.div>
  );
}