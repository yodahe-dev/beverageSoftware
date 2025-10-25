import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, BrandType } from "@prisma/client";

const prisma = new PrismaClient();

// GET: fetch brands with optional search, type, pagination
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { search, type, page = "1", limit = "20" } = params;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filters: any = {};
    if (type && Object.values(BrandType).includes(type as BrandType)) {
      filters.type = type;
    }

    if (search) {
      filters.name = { contains: search, mode: "insensitive" };
    }

    const total = await prisma.brand.count({ where: filters });

    const brands = await prisma.brand.findMany({
      where: filters,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ total, page: pageNum, limit: limitNum, brands });
  } catch (err: any) {
    console.error("GET /brands error:", err);
    return NextResponse.json({ message: "Failed to fetch brands" }, { status: 500 });
  }
}

// POST: create a new brand (must provide storeId)
export async function POST(req: NextRequest) {
  try {
    const { name, type, note, storeId } = await req.json();

    if (!name) return NextResponse.json({ message: "Brand name required" }, { status: 400 });
    if (!type || !Object.values(BrandType).includes(type)) {
      return NextResponse.json({ message: "Invalid brand type" }, { status: 400 });
    }
    if (!storeId) return NextResponse.json({ message: "storeId is required" }, { status: 400 });

    const brand = await prisma.brand.create({
      data: {
        name,
        type,
        note,
        store: { connect: { id: storeId } }, // connect to existing store
      },
    });

    return NextResponse.json(brand);
  } catch (err: any) {
    console.error("POST /brands error:", err);
    return NextResponse.json({ message: "Failed to create brand" }, { status: 500 });
  }
}
