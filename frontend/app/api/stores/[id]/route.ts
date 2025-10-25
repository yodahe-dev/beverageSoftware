import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: params.id },
    });

    if (!store) return NextResponse.json({ message: "Store not found" }, { status: 404 });

    return NextResponse.json(store);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to fetch store" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, address, note, isActive } = await req.json();

    const store = await prisma.store.update({
      where: { id: params.id },
      data: { name, address, note, isActive },
    });

    return NextResponse.json(store);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to update store" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const store = await prisma.store.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Store deleted", store });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to delete store" }, { status: 500 });
  }
}
