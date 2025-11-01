import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, BrandType } from "@prisma/client";

const prisma = new PrismaClient();

// PATCH: update a brand by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, type, note } = await req.json();

    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && Object.values(BrandType).includes(type as BrandType) && { type }),
        ...(note !== undefined && { note }),
      },
    });

    return NextResponse.json(brand);
  } catch (err: any) {
    console.error("PATCH /brands error:", err);
    return NextResponse.json({ message: "Failed to update brand" }, { status: 500 });
  }
}

// DELETE: permanently delete a brand by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const brand = await prisma.brand.delete({
      where: { id: params.id },
    });

    return NextResponse.json(brand);
  } catch (err: any) {
    console.error("DELETE /brands error:", err);
    return NextResponse.json({ message: "Failed to delete brand" }, { status: 500 });
  }
}
