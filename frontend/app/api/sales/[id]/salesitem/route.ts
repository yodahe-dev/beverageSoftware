import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ✅ Create or update sale items (secured & no duplicates)
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const saleId = id;
    const items = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const createdOrUpdatedItems: any[] = [];

    for (const i of items) {
      if (!i.productId || !i.quantity || !i.subtotal) {
        return NextResponse.json(
          { error: "Missing required fields (productId, quantity, subtotal)" },
          { status: 400 }
        );
      }

      // ✅ Check for duplicate sale item for this product
      const existingItem = await prisma.saleItem.findFirst({
        where: {
          salesId: saleId,
          productId: i.productId,
        },
      });

      if (existingItem) {
        // ✅ Update quantity and subtotal if item already exists
        const updated = await prisma.saleItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + Number(i.quantity),
            subtotal: new Prisma.Decimal(
              existingItem.subtotal.plus(i.subtotal)
            ),
            updatedAt: new Date(),
          },
        });
        createdOrUpdatedItems.push(updated);
      } else {
        // ✅ Create new item if not exists
        const newItem = await prisma.saleItem.create({
          data: {
            salesId: saleId,
            productId: i.productId,
            subbrandId: i.subbrandId || null,
            category: i.category || "unknown",
            quantity: Number(i.quantity),
            drinkPrice: i.drinkPrice
              ? new Prisma.Decimal(i.drinkPrice)
              : null,
            bottlePrice: i.bottlePrice
              ? new Prisma.Decimal(i.bottlePrice)
              : null,
            subtotal: new Prisma.Decimal(i.subtotal),
            note: i.note || "",
          },
        });
        createdOrUpdatedItems.push(newItem);
      }
    }

    return NextResponse.json({
      message: "Sale items saved successfully",
      data: createdOrUpdatedItems,
    });
  } catch (error: any) {
    console.error("POST /sales/:id/salesitem error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add sale items" },
      { status: 500 }
    );
  }
}

// ✅ Get sale items (safe for frontend map)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const saleId = id;
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: Prisma.SaleItemWhereInput = {
      salesId: saleId,
      ...(category ? { category: category as any } : {}),
      OR: search
        ? [
            { note: { contains: search, mode: "insensitive" } },
            { product: { name: { contains: search, mode: "insensitive" } } },
            { subbrand: { name: { contains: search, mode: "insensitive" } } },
          ]
        : undefined,
    };

    const [items, total] = await Promise.all([
      prisma.saleItem.findMany({
        where,
        include: {
          product: true,
          subbrand: { include: { brand: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.saleItem.count({ where }),
    ]);

    // ✅ Always return array to prevent .map error
    return NextResponse.json({
      data: items || [],
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /sales/:id/salesitem error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sale items", data: [] },
      { status: 500 }
    );
  }
}
