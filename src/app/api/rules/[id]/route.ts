// src/app/api/rules/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetRules } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }  = await ctx.params;
  const body    = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.name        !== undefined) updates.name        = body.name;
  if (body.value       !== undefined) updates.value       = String(body.value);
  if (body.ruleType    !== undefined) updates.ruleType    = body.ruleType;
  if (body.ruleBase    !== undefined) updates.ruleBase    = body.ruleBase;
  if (body.priority    !== undefined) updates.priority    = body.priority;
  if (body.active      !== undefined) updates.active      = body.active;
  if (body.description !== undefined) updates.description = body.description;

  await db.update(budgetRules).set(updates)
    .where(and(eq(budgetRules.id, id), eq(budgetRules.userId, userId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  await db.delete(budgetRules)
    .where(and(eq(budgetRules.id, id), eq(budgetRules.userId, userId)));

  return NextResponse.json({ success: true });
}