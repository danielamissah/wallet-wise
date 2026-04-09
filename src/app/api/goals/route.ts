// src/app/api/goals/route.ts
//
// GET  /api/goals  → list all savings goals for the user
// POST /api/goals  → create a new savings goal

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savingsGoals } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.userId, userId));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, targetAmount, savedAmount, currency, color } = await req.json();

  if (!name || !targetAmount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const newGoal = {
    id:           generateId(),
    userId,
    name,
    targetAmount: String(targetAmount),
    savedAmount:  String(savedAmount ?? 0),
    currency:     currency ?? "USD",
    color:        color ?? "#378ADD",
    completed:    false,
  };

  await db.insert(savingsGoals).values(newGoal);
  return NextResponse.json(newGoal, { status: 201 });
}