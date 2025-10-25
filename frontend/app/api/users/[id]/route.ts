// app/api/users/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { adminOnly } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    adminOnly(req as unknown as NextRequest);

    const { name, email, password, role, isActive } = await req.json();
    const data: any = { name, email, role, isActive };
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    adminOnly(req as unknown as NextRequest);

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "User deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
