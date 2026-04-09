// src/app/api/transactions/route.ts
//
// GET  /api/transactions  → fetch transactions for the logged-in user
// POST /api/transactions  → create a new transaction
//
// auth() from Clerk gives the current user's ID.
// We never trust the client to send a userId — we always read it from the server session.

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { eq, and, desc, like, gte, lte, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { autoCategorize } from "@/lib/categories";
import { fetchExchangeRates, convertToUsd } from "@/lib/currencies";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Pull query params from the URL: /api/transactions?month=4&year=2025&search=spotify
  const { searchParams } = req.nextUrl;
  const month     = searchParams.get("month");
  const year      = searchParams.get("year");
  const search    = searchParams.get("search");
  const category  = searchParams.get("category");
  const type      = searchParams.get("type");

  // Build filters dynamically — only add a condition if the param was provided
  // "and()" in Drizzle combines multiple WHERE conditions
  const filters = [eq(transactions.userId, userId)];

  if (month && year) {
    // Filter by month/year by checking the date range
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end   = new Date(Number(year), Number(month), 1);
    filters.push(gte(transactions.date, start));
    filters.push(lte(transactions.date, end));
  }

  if (search) {
    // ILIKE is case-insensitive LIKE in Postgres
    filters.push(like(transactions.name, `%${search}%`));
  }

  if (category) filters.push(eq(transactions.category, category));
  if (type)     filters.push(eq(transactions.type, type as "income" | "expense"));

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...filters))
    .orderBy(desc(transactions.date));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, amount, type, category, currency, date, note } = body;

  // Basic validation — never trust client data
  if (!name || !amount || !type || !currency || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Auto-categorize if the client sent "auto" or nothing
  const resolvedCategory = (!category || category === "auto")
    ? autoCategorize(name)
    : category;

  // Fetch live rates and convert to USD for normalized analytics
  const rates    = await fetchExchangeRates();
  const amountUsd = convertToUsd(Number(amount), currency, rates);

  const newTx = {
    id:         generateId(),
    userId,
    name,
    amount:     String(amount),
    type,
    category:   resolvedCategory,
    currency,
    amountUsd:  String(amountUsd),
    date:       new Date(date),
    note:       note ?? null,
  };

  await db.insert(transactions).values(newTx);
  return NextResponse.json(newTx, { status: 201 });
}