// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type OrderCreateBody = {
  name: string;
  phoneNumbers: any; // allow array of strings or objects
  location: string;
  note?: string;
  status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  deliveryPerson?: string;
  deliveryDate?: string; // ISO
  deliveryNote?: string;
  customerId?: string | null;
  salesId: string;
};

/**
 * GET /api/orders
 * Query params:
 *  - page (default 1)
 *  - limit (default 20)
 *  - search (search by name or phone)
 *  - status
 *  - customerId
 *  - salesId
 *  - dateFrom (ISO)
 *  - dateTo (ISO)
 *  - sortBy (createdAt, deliveryDate, updatedAt) default createdAt
 *  - sortOrder (asc|desc) default desc
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const search = url.searchParams.get("search")?.trim() || null;
    const status = url.searchParams.get("status") || null;
    const customerId = url.searchParams.get("customerId") || null;
    const salesId = url.searchParams.get("salesId") || null;
    const dateFrom = url.searchParams.get("dateFrom") || null;
    const dateTo = url.searchParams.get("dateTo") || null;
    const sortBy = (url.searchParams.get("sortBy") as string) || "createdAt";
    const sortOrder = (url.searchParams.get("sortOrder") as string) === "asc" ? "asc" : "desc";

    const where: any = {
      deletedAt: null,
    };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (salesId) where.salesId = salesId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      // search in name or inside phoneNumbers json array (string match)
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        // phoneNumbers stored as JSON. We do a string comparison via Prisma raw or JSON_CONTAINS is DB-specific.
        // For Postgres we can use text search on JSONB by casting to text.
        {
          // Use raw filter
          // We'll use prisma.$queryRaw for the search special case below.
        },
      ];
    }

    // If search present we build a raw query to get ids matching phoneNumbers OR names.
    if (search) {
      // Safe parameterization
      const offset = (page - 1) * limit;

      // Raw SQL for Postgres: cast phoneNumbers to text and ILIKE
      const idsResult: Array<{ id: string }> = await prisma.$queryRawUnsafe(
        `
        SELECT id FROM "Order"
        WHERE "deletedAt" IS NULL
          AND (
            "name" ILIKE $1
            OR CAST("phoneNumbers" AS TEXT) ILIKE $1
          )
        ORDER BY "${sortBy}" ${sortOrder}
        LIMIT $2 OFFSET $3
      `,
        `%${search}%`,
        limit,
        offset
      );

      const ids = idsResult.map((r) => r.id);

      const countResult: Array<{ count: string }> = await prisma.$queryRawUnsafe(
        `
        SELECT count(*) FROM "Order"
        WHERE "deletedAt" IS NULL
          AND (
            "name" ILIKE $1
            OR CAST("phoneNumbers" AS TEXT) ILIKE $1
          )
      `,
        `%${search}%`
      );

      const total = parseInt(countResult[0]?.count || "0", 10);

      const items = await prisma.order.findMany({
        where: { id: { in: ids } },
        include: { sale: true, customer: true },
        orderBy: { [sortBy]: sortOrder },
      });

      return NextResponse.json({
        items,
        meta: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    // non-search flow using prisma findMany with where
    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: { sale: true, customer: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

/**
 * POST /api/orders
 * Create order. Validates salesId exists.
 * Accepts phoneNumbers as array (strings or objects).
 */
export async function POST(req: NextRequest) {
  try {
    const body: OrderCreateBody = await req.json();

    // basic validation
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { name, phoneNumbers, location, salesId } = body;

    if (!name || !salesId || !location) {
      return NextResponse.json(
        { error: "Missing required fields: name, location, salesId" },
        { status: 400 }
      );
    }

    // sales must exist
    const sale = await prisma.sales.findUnique({
      where: { id: salesId },
    });
    if (!sale) {
      return NextResponse.json({ error: "salesId not found" }, { status: 404 });
    }

    // normalize phoneNumbers
    let phones: any = [];
    if (Array.isArray(phoneNumbers)) {
      phones = phoneNumbers.map((p) => {
        if (typeof p === "string") return p;
        // if object, keep minimal fields
        if (typeof p === "object" && p !== null) {
          return {
            number: p.number ?? p.phone ?? p.phoneNumber ?? null,
            contactName: p.contactName ?? p.name ?? null,
            type: p.type ?? null,
            extra: Object.keys(p)
              .filter((k) => !["number", "phone", "phoneNumber", "contactName", "name", "type"].includes(k))
              .reduce((acc: any, k) => {
                acc[k] = p[k];
                return acc;
              }, {}),
          };
        }
        return String(p);
      });
    } else if (typeof phoneNumbers === "string") {
      phones = [phoneNumbers];
    } else {
      phones = [];
    }

    // create order in transaction
    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          name,
          phoneNumbers: phones as any,
          location,
          note: body.note ?? null,
          status: body.status ?? "pending",
          deliveryPerson: body.deliveryPerson ?? null,
          deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
          deliveryNote: body.deliveryNote ?? null,
          customerId: body.customerId ?? null,
          salesId,
        },
        include: { sale: true, customer: true },
      });

      return order;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
