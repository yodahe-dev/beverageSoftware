// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: { sale: true, customer: true },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json(order);
  } catch (err) {
    console.error("GET /api/orders/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/:id
 * Allows updating safe fields: status, deliveryPerson, deliveryDate, deliveryNote, location, note, phoneNumbers
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const allowed: string[] = [
      "status",
      "deliveryPerson",
      "deliveryDate",
      "deliveryNote",
      "location",
      "note",
      "phoneNumbers",
      "customerId",
    ];

    const dataToUpdate: any = {};
    for (const k of allowed) {
      if (k in body) {
        if (k === "deliveryDate" && body.deliveryDate) dataToUpdate.deliveryDate = new Date(body.deliveryDate);
        else dataToUpdate[k] = body[k];
      }
    }

    const updated = await prisma.order.updateMany({
      where: { id, deletedAt: null },
      data: { ...dataToUpdate, updatedAt: new Date() },
    });

    if (updated.count === 0) return NextResponse.json({ error: "Order not found or not updated" }, { status: 404 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { sale: true, customer: true },
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error("PATCH /api/orders/[id] error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/:id
 * Soft delete: set deletedAt
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const res = await prisma.order.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (res.count === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/orders/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
