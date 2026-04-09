// src/app/api/goals/[id]/route.ts
//
// PATCH  /api/goals/:id  → update saved amount or mark complete
// DELETE /api/goals/:id  → delete a goal

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savingsGoals } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.name         !== undefined) updates.name         = body.name;
  if (body.targetAmount !== undefined) updates.targetAmount = String(body.targetAmount);
  if (body.savedAmount  !== undefined) updates.savedAmount  = String(body.savedAmount);
  if (body.color        !== undefined) updates.color        = body.color;
  if (body.completed    !== undefined) updates.completed    = body.completed;

  await db
    .update(savingsGoals)
    .set(updates)
    .where(and(eq(savingsGoals.id, params.id), eq(savingsGoals.userId, userId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .delete(savingsGoals)
    .where(and(eq(savingsGoals.id, params.id), eq(savingsGoals.userId, userId)));

  return NextResponse.json({ success: true });
}