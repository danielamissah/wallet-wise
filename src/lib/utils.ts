// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Formats a number as currency in the given currency code
// formatCurrency(1234.5, "EUR") → "€1,234.50"
export function formatCurrency(amount: number, currency = "USD"): string {
  // Guard against invalid/undefined currency codes
  const safeCurrency = currency && currency.length === 3 ? currency : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style:                 "currency",
      currency:              safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if Intl doesn't know the currency code
    return `${safeCurrency} ${amount.toFixed(2)}`;
  }
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Gets the user's preferred display currency from localStorage (client only)
export function getPreferredCurrency(): string {
  if (typeof window === "undefined") return "USD";
  return localStorage.getItem("walletwise_currency") ?? "USD";
}