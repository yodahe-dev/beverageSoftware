import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, CustomerType, PhoneType } from "@prisma/client";

const errorResponse = (message: string, status = 500) =>
  NextResponse.json({ error: message }, { status });

interface PhoneInput {
  phoneNumber: string;
  type?: PhoneType;
  note?: string;
  contactName?: string;
}

/**
 * Create a new customer with optional phones
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, name, address = "", type = "other", note = "", isActive = true, phones = [] } = body;

    if (!storeId || !name) return errorResponse("storeId and name are required", 400);

    // Validate customer type
    const allowedTypes: CustomerType[] = ["bar", "individual", "shop", "restaurant", "other"];
    const finalType: CustomerType = allowedTypes.includes(type as CustomerType) ? (type as CustomerType) : "other";

    // Create customer
    const customer = await prisma.customer.create({
      data: { storeId, name, address, type: finalType, note, isActive },
    });

    // Insert phones for this customer
    if (Array.isArray(phones) && phones.length > 0) {
      const phoneData = phones.map((p: PhoneInput) => ({
        phoneNumber: p.phoneNumber,
        type: p.type || PhoneType.mobile,
        contactName: p.contactName || null,
        note: p.note || null,
        customerId: customer.id,
      }));

      await prisma.customerPhone.createMany({ data: phoneData });
    }

    // Return full customer with phones
    const fullCustomer = await prisma.customer.findUnique({
      where: { id: customer.id },
      include: { phones: true, store: true },
    });

    return NextResponse.json(fullCustomer, { status: 201 });
  } catch (err: any) {
    console.error("POST /customers error:", err);
    return errorResponse(err.message || "Failed to create customer");
  }
}

/**
 * Get customers with optional search & pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") as CustomerType | null;
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(type ? { type } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { address: { contains: search, mode: "insensitive" } },
              { note: { contains: search, mode: "insensitive" } },
              { phones: { some: { phoneNumber: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { phones: true, store: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      data: customers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error("GET /customers error:", err);
    return errorResponse(err.message || "Failed to fetch customers");
  }
}
