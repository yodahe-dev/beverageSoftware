import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PhoneType } from "@prisma/client";

const errorResponse = (message: string, status = 500) =>
  NextResponse.json({ error: message }, { status });

interface PhoneInput {
  phoneNumber: string;
  type?: PhoneType;
  note?: string;
  contactName?: string;
}

/**
 * GET all phones for a customer
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) return errorResponse("Customer ID is required", 400);

    const phones = await prisma.customerPhone.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(phones);
  } catch (err: any) {
    console.error("GET /customers/[id]/phone error:", err);
    return errorResponse(err.message || "Failed to fetch phones");
  }
}

/**
 * POST new phones for a customer
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) return errorResponse("Customer ID is required", 400);

    const body: PhoneInput[] = await req.json();
    if (!Array.isArray(body) || body.length === 0) return errorResponse("At least one phone is required", 400);

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return errorResponse("Customer not found", 404);

    await prisma.customerPhone.createMany({
      data: body.map((p) => ({
        phoneNumber: p.phoneNumber,
        type: p.type || PhoneType.mobile,
        note: p.note || null,
        contactName: p.contactName || null,
        customerId: id,
      })),
    });

    return NextResponse.json({ message: "Phones added successfully" });
  } catch (err: any) {
    console.error("POST /customers/[id]/phone error:", err);
    return errorResponse(err.message || "Failed to add phones");
  }
}
