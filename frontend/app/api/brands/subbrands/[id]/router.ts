import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET → Get subbrand by ID
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const subbrand = await prisma.subBrand.findUnique({
    where: { id },
    include: { brand: { select: { id: true, name: true } } },
  });

  if (!subbrand) return NextResponse.json({ message: "Subbrand not found" }, { status: 404 });
  return NextResponse.json(subbrand);
}

/**
 * PUT → Update subbrand by ID
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { name, note, brandId } = body;

  const existing = await prisma.subBrand.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "Subbrand not found" }, { status: 404 });

  const updated = await prisma.subBrand.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      note: note ?? existing.note,
      brandId: brandId ?? existing.brandId,
    },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE → Soft delete subbrand
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  const existing = await prisma.subBrand.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "Subbrand not found" }, { status: 404 });

  const deleted = await prisma.subBrand.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ message: "Subbrand deleted successfully", deleted });
}
