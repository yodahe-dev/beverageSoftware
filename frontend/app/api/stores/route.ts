import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";

    const stores = await prisma.store.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(stores);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to fetch stores" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, address, note, isActive } = await req.json();
    if (!name || !address) {
      return NextResponse.json({ message: "Name and address are required" }, { status: 400 });
    }

    const store = await prisma.store.create({
      data: { name, address, note, isActive: isActive ?? true },
    });

    return NextResponse.json(store);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to create store" }, { status: 500 });
  }
}
