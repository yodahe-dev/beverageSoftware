import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET → List all subbrands or search by name
 * Query param: search (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";

    const subbrands = await prisma.subBrand.findMany({
      where: search
        ? {
            name: { contains: search, mode: "insensitive" },
          }
        : {},
      include: {
        brand: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subbrands, { status: 200 });
  } catch (err) {
    console.error("GET /subbrands error:", err);
    return NextResponse.json(
      { message: "Failed to fetch subbrands" },
      { status: 500 }
    );
  }
}

/**
 * POST → Create new subbrand
 * Body: { name: string, brandId: string, note?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, brandId, note } = body;

    if (!name || !brandId) {
      return NextResponse.json(
        { message: "Name and brandId are required" },
        { status: 400 }
      );
    }

    const newSubbrand = await prisma.subBrand.create({
      data: {
        name,
        brandId,
        note: note || null,
      },
    });

    return NextResponse.json(newSubbrand, { status: 201 });
  } catch (err) {
    console.error("POST /subbrands error:", err);
    return NextResponse.json(
      { message: "Failed to create subbrand" },
      { status: 500 }
    );
  }
}
