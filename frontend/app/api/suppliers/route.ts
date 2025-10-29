// app/api/suppliers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, PhoneType } from "@prisma/client";

const json = (data: any, status = 200) => NextResponse.json(data, { status });
const error = (msg: string, status = 400) => json({ error: msg }, status);

/** helper to validate phone type */
const isValidPhoneType = (t: any): t is PhoneType => {
  if (t === undefined || t === null) return false;
  return Object.values(PhoneType).includes(String(t) as PhoneType);
};

/**
 * GET /api/suppliers
 * Query params:
 *  - search: string (searches name, email, location, note)
 *  - storeId: string (filter by store)
 *  - page: number (default 1)
 *  - limit: number (default 20, max 200)
 *  - sort_by: "createdAt" | "name" (default createdAt)
 *  - sort_order: "asc" | "desc" (default desc)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const storeId = url.searchParams.get("storeId") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;
    const sortBy = (url.searchParams.get("sort_by") || "createdAt") as "createdAt" | "name";
    const sortOrder = (url.searchParams.get("sort_order") || "desc") as "asc" | "desc";

    const where: Prisma.SupplierWhereInput = { deletedAt: null };

    if (storeId) where.storeId = storeId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy = sortBy === "name" ? { name: sortOrder } : { createdAt: sortOrder };

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: { phones: true, store: true },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      filters: { search: search ?? null, storeId: storeId ?? null, sortBy, sortOrder },
    });
  } catch (err: any) {
    console.error("GET /api/suppliers error:", err);
    return error(err?.message || "Failed to fetch suppliers", 500);
  }
}

/**
 * POST /api/suppliers
 * Body:
 * {
 *   storeId: string,     // required
 *   name: string,        // required
 *   email?: string,
 *   location?: string,
 *   note?: string,
 *   phones?: [{ phoneNumber, contactName?, type?, note? }, ...]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") return error("Invalid body", 400);

    const { storeId, name, email, location, note, phones } = body;

    if (!storeId) return error("storeId is required", 400);
    if (!name || String(name).trim() === "") return error("name is required", 400);

    // Validate store exists
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return error("Store not found", 404);

    // Normalize phones if provided and coerce type to PhoneType where valid
    const phoneCreates =
      Array.isArray(phones) && phones.length > 0
        ? phones.map((p: any) => {
            const phoneNumber = String(p.phoneNumber || "").trim();
            const contactName = p.contactName ? String(p.contactName).trim() : undefined;
            const noteVal = p.note ? String(p.note).trim() : undefined;
            const typeVal = isValidPhoneType(p.type) ? (p.type as PhoneType) : undefined;
            return {
              phoneNumber,
              contactName,
              note: noteVal,
              type: typeVal,
            };
          })
        : [];

    // Create supplier using nested relation for store (required by typed create)
    const supplier = await prisma.supplier.create({
      data: {
        // use nested relation connect for store (this satisfies SupplierCreateInput)
        store: { connect: { id: storeId } },
        name: String(name).trim(),
        email: email ? String(email).trim() : null,
        // location is required by model - ensure string fallback
        location: location ? String(location).trim() : "",
        note: note ? String(note).trim() : null,
        ...(phoneCreates.length ? { phones: { create: phoneCreates as any } } : {}),
      },
      include: { phones: true, store: true },
    });

    return json(supplier, 201);
  } catch (err: any) {
    console.error("POST /api/suppliers error:", err);
    return error(err?.message || "Failed to create supplier", 500);
  }
}
