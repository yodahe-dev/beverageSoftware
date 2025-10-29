// app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExpenseCategory, Prisma } from "@prisma/client";

/**
 * Robust Expenses API
 *
 * Supports:
 *  - POST /api/expenses         -> create single or multiple expenses
 *  - GET  /api/expenses         -> list expenses with search, filter, date-range, pagination, sorting
 *
 * Query params (GET):
 *  - search         string (searches title and note)
 *  - category       ExpenseCategory (home|work|both|other)
 *  - date_from      ISO date (inclusive)
 *  - date_to        ISO date (inclusive)
 *  - page           number (default 1)
 *  - limit          number (default 20)
 *  - sort_by        "createdAt" | "amount" (default createdAt)
 *  - sort_order     "asc" | "desc" (default desc)
 *
 * POST body:
 *  - single expense object:
 *      { title, amount, quantity?, category?, note? }
 *  - OR array of expense objects
 */

const json = (data: any, status = 200) =>
  NextResponse.json(data, { status });

const errorResponse = (message: string, status = 400) =>
  json({ error: message }, status);

type ExpenseInput = {
  title: string;
  amount: number | string;
  quantity?: number;
  category?: ExpenseCategory | string;
  note?: string | null;
};

const isValidCategory = (c: any): c is ExpenseCategory => {
  return ["home", "work", "both", "other"].includes(String(c));
};

const parseNumber = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** POST handler - create single or many expenses */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Normalize to array for uniform processing
    const items: ExpenseInput[] = Array.isArray(body) ? body : [body];

    if (!items.length) return errorResponse("No expense data provided", 400);

    // Validate each item
    const toCreate: Prisma.ExpenseCreateInput[] = [];
    for (const [i, raw] of items.map((r, idx) => [r, idx] as any)) {
      const idxLabel = Array.isArray(body) ? ` (index ${i})` : "";
      if (!raw || typeof raw !== "object")
        return errorResponse(`Invalid expense payload${idxLabel}`, 400);

      const title = String(raw.title ?? "").trim();
      if (!title) return errorResponse(`title is required${idxLabel}`, 400);

      const amountNum = parseNumber(raw.amount);
      if (amountNum === null || amountNum < 0)
        return errorResponse(`amount is required and must be a non-negative number${idxLabel}`, 400);

      const quantity = raw.quantity === undefined ? 1 : parseInt(String(raw.quantity), 10);
      if (!Number.isInteger(quantity) || quantity <= 0)
        return errorResponse(`quantity must be a positive integer${idxLabel}`, 400);

      const category = raw.category ?? "other";
      if (!isValidCategory(category))
        return errorResponse(`invalid category (home|work|both|other)${idxLabel}`, 400);

      toCreate.push({
        title,
        amount: new Prisma.Decimal(String(amountNum)),
        quantity,
        category: category as ExpenseCategory,
        note: raw.note ? String(raw.note) : null,
      } as any); // Prisma.Decimal typed as any here for compile convenience
    }

    // Create in a transaction (safe, returns created rows)
    const created: any[] = [];
    await prisma.$transaction(async (tx) => {
      for (const item of toCreate) {
        const row = await tx.expense.create({ data: item as any });
        created.push(row);
      }
    });

    return json({ message: "Expenses created", count: created.length, data: created }, 201);
  } catch (err: any) {
    console.error("POST /api/expenses error:", err);
    return errorResponse(err?.message || "Failed to create expenses", 500);
  }
}

/** GET handler - list / search / filter / paginate / sort */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const categoryParam = url.searchParams.get("category") || undefined;
    const dateFrom = url.searchParams.get("date_from") || undefined;
    const dateTo = url.searchParams.get("date_to") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;
    const sortBy = (url.searchParams.get("sort_by") || "createdAt") as "createdAt" | "amount";
    const sortOrder = (url.searchParams.get("sort_order") || "desc") as "asc" | "desc";

    // Build where clause
    const where: Prisma.ExpenseWhereInput = {
      deletedAt: null,
    };

    if (categoryParam) {
      if (!isValidCategory(categoryParam)) {
        return errorResponse("Invalid category filter. Use: home|work|both|other", 400);
      }
      where.category = categoryParam as ExpenseCategory;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
      ];
    }

    // date filters
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const d = new Date(dateFrom);
        if (isNaN(d.getTime())) return errorResponse("Invalid date_from", 400);
        (where.createdAt as any).gte = d;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        if (isNaN(d.getTime())) return errorResponse("Invalid date_to", 400);
        // include the full day by moving to end of day
        d.setHours(23, 59, 59, 999);
        (where.createdAt as any).lte = d;
      }
    }

    const orderBy =
      sortBy === "amount"
        ? { amount: sortOrder }
        : { createdAt: sortOrder }; // default createdAt

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      filters: {
        search: search ?? null,
        category: categoryParam ?? null,
        dateFrom: dateFrom ?? null,
        dateTo: dateTo ?? null,
        sortBy,
        sortOrder,
      },
    });
  } catch (err: any) {
    console.error("GET /api/expenses error:", err);
    return errorResponse(err?.message || "Failed to fetch expenses", 500);
  }
}
