// src/app/api/recurring/[id]/route.ts
// PATCH  — update or pause/resume a recurring item
// DELETE — remove it

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }  = await ctx.params;
  const body    = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.name        !== undefined) updates.name        = body.name;
  if (body.amount      !== undefined) updates.amount      = String(body.amount);
  if (body.category    !== undefined) updates.category    = body.category;
  if (body.frequency   !== undefined) updates.frequency   = body.frequency;
  if (body.dayOfPeriod !== undefined) updates.dayOfPeriod = body.dayOfPeriod;
  if (body.active      !== undefined) updates.active      = body.active;
  if (body.notes       !== undefined) updates.notes       = body.notes;

  await db.update(recurringTransactions).set(updates)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  await db.delete(recurringTransactions)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

  return NextResponse.json({ success: true });
}