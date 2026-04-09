// src/lib/currencies.ts
// SUPPORTED_CURRENCIES is the list shown in the dropdown.
// fetchExchangeRates() calls a free, no-key-required API to get live rates.
// convertToUsd() normalizes all amounts to USD so charts stay consistent.

export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$",  name: "US Dollar" },
  { code: "EUR", symbol: "€",  name: "Euro" },
  { code: "GBP", symbol: "£",  name: "British Pound" },
  { code: "CAD", symbol: "CA$",name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥",  name: "Japanese Yen" },
  { code: "INR", symbol: "₹",  name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$",name: "Mexican Peso" },
  { code: "NGN", symbol: "₦",  name: "Nigerian Naira" },
  { code: "ZAR", symbol: "R",  name: "South African Rand" },
  { code: "KES", symbol: "KSh",name: "Kenyan Shilling" },
];

export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}

// Uses open.er-api.com — free, no API key needed, updates daily
export async function fetchExchangeRates(base = "USD"): Promise<Record<string, number>> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const data = await res.json();
    return data.rates as Record<string, number>;
  } catch {
    // Fallback to 1:1 if fetch fails
    return { USD: 1 };
  }
}

export function convertToUsd(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === "USD") return amount;
  const rate = rates[currency];
  if (!rate) return amount;
  return amount / rate; // rates are relative to USD base
}