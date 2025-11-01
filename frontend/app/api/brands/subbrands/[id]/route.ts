import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET → Get subbrand by ID
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params; // await params
  const id = params.id;

  try {
    const subbrand = await prisma.subBrand.findUnique({
      where: { id },
      include: { brand: { select: { id: true, name: true } } },
    });

    if (!subbrand) {
      return NextResponse.json({ message: "Subbrand not found" }, { status: 404 });
    }

    return NextResponse.json(subbrand);
  } catch (err: any) {
    console.error("GET /subbrands/[id] error:", err);
    return NextResponse.json({ message: "Failed to fetch subbrand" }, { status: 500 });
  }
}

/**
 * PUT → Update subbrand by ID
 */
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params; // await params
  const id = params.id;

  try {
    const body = await req.json();
    const { name, note, brandId } = body;

    const existing = await prisma.subBrand.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Subbrand not found" }, { status: 404 });
    }

    const updated = await prisma.subBrand.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        note: note ?? existing.note,
        brandId: brandId ?? existing.brandId,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /subbrands/[id] error:", err);
    return NextResponse.json({ message: "Failed to update subbrand" }, { status: 500 });
  }
}

/**
 * DELETE → Permanent delete subbrand
 */
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params; // await params
  const id = params.id;

  try {
    const deleted = await prisma.subBrand.delete({ where: { id } });
    return NextResponse.json({ message: "Subbrand deleted permanently", deleted });
  } catch (err: any) {
    console.error("DELETE /subbrands/[id] error:", err);
    return NextResponse.json({ message: "Subbrand not found or already deleted" }, { status: 404 });
  }
}
