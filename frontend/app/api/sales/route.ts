import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * CREATE SALE
 */
export async function POST(req: NextRequest) {
  try {
    const { customerId, paymentMethod, status, note, userId, totalAmount } = await req.json();

    const sale = await prisma.sales.create({
      data: {
        customerId: customerId || null,
        userId,
        paymentMethod,
        status,
        note,
        totalAmount: new Prisma.Decimal(totalAmount || 0),
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}

/**
 * GET SALES (read + filter + search)
 * Query params supported:
 * - search: string
 * - status: string
 * - paymentMethod: string
 * - customerType: string
 * - minTotal: number
 * - maxTotal: number
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || undefined;
    const paymentMethod = searchParams.get("paymentMethod") || undefined;
    const customerType = searchParams.get("customerType") || undefined;
    const minTotal = searchParams.get("minTotal");
    const maxTotal = searchParams.get("maxTotal");

    // Build Prisma filters dynamically
    const where: any = {};

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    // Range filter
    if (minTotal || maxTotal) {
      where.totalAmount = {};
      if (minTotal) where.totalAmount.gte = parseFloat(minTotal);
      if (maxTotal) where.totalAmount.lte = parseFloat(maxTotal);
    }

    // Include customer type filter
    if (customerType) {
      where.customer = { type: customerType };
    }

    // Search filter (customer name, address, sale note)
    if (search) {
      where.OR = [
        { note: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { address: { contains: search, mode: "insensitive" } } },
      ];
    }

    const sales = await prisma.sales.findMany({
      where,
      include: {
        customer: true,
        user: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}
