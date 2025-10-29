// app/api/suppliers/[id]/phone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PhoneType } from "@prisma/client";

const json = (data: any, status = 200) => NextResponse.json(data, { status });
const error = (msg: string, status = 400) => json({ error: msg }, status);

const isValidPhoneType = (t: any): t is PhoneType => {
  if (t === undefined || t === null) return false;
  return Object.values(PhoneType).includes(String(t) as PhoneType);
};

/** GET phones for supplier */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id;
    if (!supplierId) return error("Supplier id required", 400);

    const phones = await prisma.supplierPhone.findMany({
      where: { supplierId },
      orderBy: { createdAt: "desc" },
    });
    return json(phones);
  } catch (err: any) {
    console.error("GET /api/suppliers/[id]/phone error:", err);
    return error("Failed to fetch phones", 500);
  }
}

/** POST new phone for supplier */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id;
    if (!supplierId) return error("Supplier id required", 400);

    const body = await req.json();
    if (!body || typeof body !== "object") return error("Invalid body", 400);

    const { phoneNumber, contactName, type, note } = body;
    if (!phoneNumber || String(phoneNumber).trim() === "") return error("phoneNumber is required", 400);

    // ensure supplier exists
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) return error("Supplier not found", 404);

    const phone = await prisma.supplierPhone.create({
      data: {
        supplier: { connect: { id: supplierId } },
        phoneNumber: String(phoneNumber).trim(),
        contactName: contactName ? String(contactName).trim() : undefined,
        note: note ? String(note).trim() : undefined,
        type: isValidPhoneType(type) ? (type as PhoneType) : undefined,
      },
    });

    return json(phone, 201);
  } catch (err: any) {
    console.error("POST /api/suppliers/[id]/phone error:", err);
    return error(err?.message || "Failed to add phone", 500);
  }
}
