import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET → fetch products (with optional search by name, subbrand, or brand)
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { search = "", page = "1", limit = "20" } = params;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const products = await prisma.product.findMany({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        subbrand: {
          include: { brand: true },
        },
      },
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { subbrand: { name: { contains: search, mode: "insensitive" } } },
              { subbrand: { brand: { name: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {},
    });

    const total = await prisma.product.count({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { subbrand: { name: { contains: search, mode: "insensitive" } } },
              { subbrand: { brand: { name: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {},
    });

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price.toString()),
      quantity: p.quantity,
      sellPrice: p.sellPrice ? parseFloat(p.sellPrice.toString()) : null,
      costPrice: p.costPrice ? parseFloat(p.costPrice.toString()) : null,
      category: p.category,
      note: p.note || "",
      subbrand: p.subbrand
        ? {
            id: p.subbrand.id,
            name: p.subbrand.name,
            brand: p.subbrand.brand
              ? { id: p.subbrand.brand.id, name: p.subbrand.brand.name }
              : null,
          }
        : null,
    }));

    return NextResponse.json({ total, page: pageNum, limit: limitNum, products: formattedProducts });
  } catch (err) {
    console.error("GET /products error:", err);
    return NextResponse.json({ message: "Failed to fetch products" }, { status: 500 });
  }
}

// POST → create a new product
export async function POST(req: NextRequest) {
  try {
    const { name, price, quantity, subbrandId, sellPrice, costPrice, category, note } = await req.json();
    if (!name || !subbrandId) return NextResponse.json({ message: "Name and subbrandId required" }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        name,
        price,
        quantity,
        sellPrice: sellPrice || null,
        costPrice: costPrice || null,
        category: category || null,
        note: note || "",
        subbrand: { connect: { id: subbrandId } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("POST /products error:", err);
    return NextResponse.json({ message: "Failed to create product" }, { status: 500 });
  }
}
