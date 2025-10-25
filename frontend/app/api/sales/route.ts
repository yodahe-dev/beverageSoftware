import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { customerId, paymentMethod, status, note, userId, totalAmount } = await req.json();

    const sale = await prisma.sales.create({
      data: {
        customerId: customerId || null,
        userId,
        paymentMethod,
        status,
        note,
        totalAmount: parseFloat(totalAmount || 0),
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
