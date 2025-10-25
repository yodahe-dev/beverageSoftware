// app/api/users/route.ts
import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { adminOnly } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true } });
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    adminOnly(req); // Only admin can create

    const { name, email, password, role } = await req.json();
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hash, role },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
