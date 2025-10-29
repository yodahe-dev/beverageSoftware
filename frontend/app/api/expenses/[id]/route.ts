// app/api/expenses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExpenseCategory, Prisma } from "@prisma/client";

const json = (data: any, status = 200) => NextResponse.json(data, { status });
const errorResponse = (message: string, status = 400) => json({ error: message }, status);

const isValidCategory = (c: any): c is ExpenseCategory =>
  ["home", "work", "both", "other"].includes(String(c));

const parseNumber = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** GET - single expense */
export async function GET(req: NextRequest) {
  try {
    const id = req.url.split("/").pop();
    if (!id) return errorResponse("Expense id is required", 400);

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense || expense.deletedAt) return errorResponse("Expense not found", 404);

    return json({ data: expense });
  } catch (err: any) {
    console.error("GET /api/expenses/[id] error:", err);
    return errorResponse(err?.message || "Failed to fetch expense", 500);
  }
}

/** PUT - update single expense */
export async function PUT(req: NextRequest) {
  try {
    const id = req.url.split("/").pop();
    if (!id) return errorResponse("Expense id is required", 400);

    const body = await req.json();
    const updateData: Prisma.ExpenseUpdateInput = {};

    if (body.title) updateData.title = String(body.title).trim();
    if (body.amount !== undefined) {
      const amount = parseNumber(body.amount);
      if (amount === null || amount < 0) return errorResponse("Invalid amount", 400);
      updateData.amount = new Prisma.Decimal(String(amount));
    }
    if (body.quantity !== undefined) {
      const quantity = parseInt(String(body.quantity), 10);
      if (!Number.isInteger(quantity) || quantity <= 0) return errorResponse("Invalid quantity", 400);
      updateData.quantity = quantity;
    }
    if (body.category && isValidCategory(body.category)) updateData.category = body.category;
    if (body.note !== undefined) updateData.note = String(body.note);

    const updated = await prisma.expense.update({ where: { id }, data: updateData });
    return json({ message: "Expense updated", data: updated });
  } catch (err: any) {
    console.error("PUT /api/expenses/[id] error:", err);
    return errorResponse(err?.message || "Failed to update expense", 500);
  }
}

/** DELETE - soft or permanent delete */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.url.split("/").pop();
    if (!id) return errorResponse("Expense id is required", 400);

    const url = new URL(req.url);
    const permanent = url.searchParams.get("permanent") === "true";

    let deleted;
    if (permanent) {
      deleted = await prisma.expense.delete({ where: { id } });
    } else {
      deleted = await prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    }

    return json({ message: permanent ? "Expense permanently deleted" : "Expense deleted", data: deleted });
  } catch (err: any) {
    console.error("DELETE /api/expenses/[id] error:", err);
    return errorResponse(err?.message || "Failed to delete expense", 500);
  }
}
