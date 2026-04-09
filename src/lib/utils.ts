// src/lib/utils.ts
// Small reusable helpers used across the app.

import { clsx, type ClassValue } from "clsx";

// cn() lets you combine Tailwind classes conditionally:
// cn("text-red-500", isActive && "font-bold") → "text-red-500 font-bold"
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Formats a number as currency: formatCurrency(1234.5, "USD") → "$1,234.50"
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Returns "January 2025" from a Date object
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Generates a short unique ID — good enough for our use case
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];