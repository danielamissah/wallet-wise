// src/lib/categories.ts
// CATEGORIES defines all valid spending categories with their colors and icons.
// autoCategorize() scans a transaction name for keywords and picks the best category.
// This is a simple but effective approach — no AI needed.

export const CATEGORIES = [
  { name: "Housing",        color: "#378ADD", icon: "🏠" },
  { name: "Food",           color: "#1D9E75", icon: "🍔" },
  { name: "Transport",      color: "#EF9F27", icon: "🚗" },
  { name: "Health",         color: "#7F77DD", icon: "💊" },
  { name: "Entertainment",  color: "#D85A30", icon: "🎬" },
  { name: "Shopping",       color: "#D4537E", icon: "🛍️" },
  { name: "Utilities",      color: "#5DCAA5", icon: "💡" },
  { name: "Education",      color: "#534AB7", icon: "📚" },
  { name: "Travel",         color: "#BA7517", icon: "✈️" },
  { name: "Savings",        color: "#185FA5", icon: "💰" },
  { name: "Income",         color: "#059669", icon: "💵" },
    { name: "Other", color: "#888780", icon: "📦" },
  {name: "Tithe", color: "#4B5563", icon: "⛪"},
] as const;

export type CategoryName = typeof CATEGORIES[number]["name"];

// Keyword map — keys are category names, values are keywords to match against
const KEYWORD_MAP: Record<string, string[]> = {
  Housing:       ["rent", "mortgage", "apartment", "house", "hoa", "maintenance"],
  Food:          ["grocery", "groceries", "restaurant", "cafe", "coffee", "pizza", "uber eats", "doordash", "grubhub", "mcdonald", "starbucks", "chipotle", "food"],
  Transport:     ["uber", "lyft", "taxi", "gas", "fuel", "parking", "transit", "bus", "train", "metro", "toll"],
  Health:        ["doctor", "pharmacy", "hospital", "medical", "dentist", "gym", "fitness", "therapy", "insurance"],
  Entertainment: ["netflix", "spotify", "hulu", "disney", "cinema", "movie", "concert", "gaming", "steam", "apple music", "youtube"],
  Shopping:      ["amazon", "ebay", "walmart", "target", "clothes", "clothing", "shoes", "fashion", "mall"],
  Utilities:     ["electric", "electricity", "water", "gas bill", "internet", "phone", "mobile", "cable", "utility"],
  Education:     ["tuition", "course", "udemy", "coursera", "book", "school", "college", "university", "learning"],
  Travel:        ["hotel", "airbnb", "flight", "airline", "booking", "vacation", "trip", "airfare"],
  Savings:       ["savings", "investment", "401k", "ira", "stock", "crypto"],
  Income:        ["salary", "paycheck", "freelance", "invoice", "deposit", "dividend", "refund", "bonus"],
};

export function autoCategorize(name: string): CategoryName {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category as CategoryName;
    }
  }
  return "Other";
}

export function getCategoryColor(name: string): string {
  return CATEGORIES.find(c => c.name === name)?.color ?? "#888780";
}

export function getCategoryIcon(name: string): string {
  return CATEGORIES.find(c => c.name === name)?.icon ?? "📦";
}