import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExpenseCategory, Prisma } from "@prisma/client";

const json = (data: any, status = 200) => NextResponse.json(data, { status });
const errorResponse = (message: string, status = 400) => json({ error: message }, status);

type ExpenseInput = {
  title: string;
  amount: number | string;
  quantity?: number;
  category?: ExpenseCategory | string;
  note?: string | null;
};

const isValidCategory = (c: any): c is ExpenseCategory =>
  ["home", "work", "both", "other"].includes(String(c));

const parseNumber = (v: any): number => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** POST - create single or multiple expenses */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: ExpenseInput[] = Array.isArray(body) ? body : [body];
    if (!items.length) return errorResponse("No expense data provided");

    const toCreate: Prisma.ExpenseCreateInput[] = [];

    for (const raw of items) {
      const title = String(raw.title ?? "").trim() || "Untitled";
      const amountNum = parseNumber(raw.amount);
      const quantity = raw.quantity && Number.isInteger(Number(raw.quantity)) && Number(raw.quantity) > 0 ? Number(raw.quantity) : 1;
      const category = isValidCategory(raw.category) ? raw.category : "other";

      toCreate.push({
        title,
        amount: new Prisma.Decimal(String(amountNum)),
        quantity,
        category,
        note: raw.note ? String(raw.note).trim() : null,
      } as any);
    }

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

/** GET - list / search / filter / pagination / sort */
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

    const where: Prisma.ExpenseWhereInput = { deletedAt: null };

    if (categoryParam && isValidCategory(categoryParam)) {
      where.category = categoryParam as ExpenseCategory;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const d = new Date(dateFrom);
        if (!isNaN(d.getTime())) (where.createdAt as any).gte = d;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          (where.createdAt as any).lte = d;
        }
      }
    }

    const orderBy = sortBy === "amount" ? { amount: sortOrder } : { createdAt: sortOrder };
    const [data, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy, skip, take: limit }),
      prisma.expense.count({ where }),
    ]);

    return json({
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
      filters: { search: search ?? null, category: categoryParam ?? null, dateFrom: dateFrom ?? null, dateTo: dateTo ?? null, sortBy, sortOrder },
    });
  } catch (err: any) {
    console.error("GET /api/expenses error:", err);
    return errorResponse(err?.message || "Failed to fetch expenses", 500);
  }
}
