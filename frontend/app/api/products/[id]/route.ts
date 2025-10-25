import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PATCH → update a product
export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // get [id] from URL

    if (!id) return NextResponse.json({ message: "Product ID missing" }, { status: 400 });

    const {
      name,
      price,
      subbrandId,
      quantity,
      sellPrice,
      costPrice,
      category,
      note,
    } = await req.json();

    // Build dynamic update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (subbrandId !== undefined) updateData.subbrandId = subbrandId;
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (sellPrice !== undefined) updateData.sellPrice = Number(sellPrice);
    if (costPrice !== undefined) updateData.costPrice = Number(costPrice);
    if (category !== undefined) updateData.category = category;
    if (note !== undefined) updateData.note = note;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        subbrand: { include: { brand: { select: { id: true, name: true } } } },
      },
    });

    // Format decimals
    const formattedProduct = {
      ...product,
      price: parseFloat(product.price.toString()),
      sellPrice: product.sellPrice ? parseFloat(product.sellPrice.toString()) : null,
      costPrice: product.costPrice ? parseFloat(product.costPrice.toString()) : null,
    };

    return NextResponse.json(formattedProduct);
  } catch (err: any) {
    console.error("PATCH /products/[id] error:", err);
    return NextResponse.json({ message: "Failed to update product" }, { status: 500 });
  }
}

// DELETE → permanent delete a product
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // get [id] from URL

    if (!id) return NextResponse.json({ message: "Product ID missing" }, { status: 400 });

    const product = await prisma.product.delete({
      where: { id },
      include: {
        subbrand: { include: { brand: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({ message: "Product permanently deleted", product });
  } catch (err: any) {
    console.error("DELETE /products/[id] error:", err);
    return NextResponse.json({ message: "Failed to delete product" }, { status: 500 });
  }
}
