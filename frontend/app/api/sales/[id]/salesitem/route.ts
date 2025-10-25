import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id; // matches [id] folder
    const items = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const createdItems = [];

    for (const i of items) {
      const item = await prisma.saleItem.create({
        data: {
          salesId: saleId,
          productId: i.productId,
          subbrandId: i.subbrandId,
          category: i.category,
          quantity: i.quantity,
          drinkPrice: i.drinkPrice ? new Prisma.Decimal(i.drinkPrice) : null,
          bottlePrice: i.bottlePrice ? new Prisma.Decimal(i.bottlePrice) : null,
          subtotal: new Prisma.Decimal(i.subtotal),
          note: i.note || "",
        },
      });
      createdItems.push(item);
    }

    return NextResponse.json(createdItems);
  } catch (error: any) {
    console.error("POST /sales/:id/salesitem error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to add sale items" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    const items = await prisma.saleItem.findMany({
      where: { salesId: saleId },
      include: { product: true, subbrand: true },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("GET /sales/:id/salesitem error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sale items" },
      { status: 500 }
    );
  }
}
