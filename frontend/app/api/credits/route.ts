import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, CreditStatus } from "@prisma/client";

const json = (data: any, status = 200) => NextResponse.json(data, { status });

// ========================
// GET /api/credits
// ========================
// ?search=...&status=...&userId=...
export async function GET(req: NextRequest) {
  try {
    const { search, status, userId } = Object.fromEntries(req.nextUrl.searchParams);

    const where: Prisma.CreditWhereInput = {
      deletedAt: null,
      ...(status ? { status: status as CreditStatus } : {}),
      ...(userId ? { userId } : {}),
      ...(search
        ? {
            OR: [
              { note: { contains: search, mode: "insensitive" } },
              {
                customer: {
                  name: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const credits = await prisma.credit.findMany({
      where,
      include: {
        customer: true,
        user: true,
        saleItem: true,
        sales: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return json(credits);
  } catch (error: any) {
    console.error("GET /credits error:", error);
    return json({ error: error.message }, 500);
  }
}

// ========================
// POST /api/credits
// ========================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId,
      userId,
      saleId,
      saleItemId,
      quantity,
      creditPrice,
      returnPrice,
      totalAmount,
      paidAmount,
      balance,
      status,
      dueDate,
      note,
    } = body;

    if (!customerId || !userId || !saleId || !saleItemId) {
      return json({ error: "Missing required fields" }, 400);
    }

    const credit = await prisma.credit.create({
      data: {
        customerId,
        userId,
        saleId,
        saleItemId,
        quantity,
        creditPrice: new Prisma.Decimal(creditPrice || 0),
        returnPrice: new Prisma.Decimal(returnPrice || 0),
        totalAmount: new Prisma.Decimal(totalAmount || 0),
        paidAmount: new Prisma.Decimal(paidAmount || 0),
        balance: new Prisma.Decimal(balance || 0),
        status: status || "active",
        dueDate: dueDate ? new Date(dueDate) : null,
        note,
      },
    });

    return json(credit, 201);
  } catch (error: any) {
    console.error("POST /credits error:", error);
    return json({ error: error.message }, 500);
  }
}
