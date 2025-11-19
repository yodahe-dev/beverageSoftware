import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, BrandType, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const json = (data: any, status = 200) => NextResponse.json(data, { status });

/**
 * GET /api/brands
 *  - supports search, type, pagination
 */

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { search, type, page = "1", limit = "20" } = params;

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);

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
      include: { store: true },
    });

    return json({ total, page: pageNum, limit: limitNum, brands });
  } catch (err: any) {
    console.error("GET /brands error:", err);
    return json({ message: "Failed to fetch brands" }, 500);
  }
}

/**
 * POST /api/brands
 *  - requires: name, type, storeId
 *  - optional: note
 *
 * Using BrandUncheckedCreateInput so we can pass storeId directly (type-safe).
*/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const type = body?.type;
    const note = body?.note ?? null;
    const storeId = body?.storeId;

    if (!name) {
      return json({ message: "Brand name required" }, 400);
    }

    if (!type || !Object.values(BrandType).includes(type as BrandType)) {
      return json({ message: "Invalid brand type" }, 400);
    }

    if (!storeId) {
      return json({ message: "storeId is required" }, 400);
    }

    // Ensure store exists
    const storeExists = await prisma.store.findUnique({ where: { id: storeId } });
    if (!storeExists) {
      return json({ message: "storeId does not exist" }, 400);
    }

    // Use unchecked create input to set storeId directly (keeps TS happy)
    const brand = await prisma.brand.create({
      data: {
        name,
        type,
        note,
        storeId,
      } as Prisma.BrandUncheckedCreateInput,
    });

    return json(brand, 201);
  } catch (err: any) {
    console.error("POST /brands error:", err);
    return json({ message: "Failed to create brand" }, 500);
  }
}
