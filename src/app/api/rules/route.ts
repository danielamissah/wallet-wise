// src/app/api/rules/route.ts
// GET  /api/rules  — list all budget rules
// POST /api/rules  — create a rule

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetRules } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(budgetRules)
    .where(eq(budgetRules.userId, userId));

  // Sort by priority so tithe (priority 1) comes before savings (priority 2) etc.
  rows.sort((a, b) => a.priority - b.priority);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, category, ruleType, ruleBase, value, currency, priority, description } = body;

  if (!name || !ruleType || !ruleBase || value === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rule = {
    id:          generateId(),
    userId,
    name,
    category:    category ?? name,
    ruleType,
    ruleBase,
    value:       String(value),
    currency:    currency ?? "USD",
    priority:    priority ?? 0,
    active:      true,
    description: description ?? null,
  };

  await db.insert(budgetRules).values(rule);
  return NextResponse.json(rule, { status: 201 });
}