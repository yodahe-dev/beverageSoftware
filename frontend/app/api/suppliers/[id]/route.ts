// app/api/suppliers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const json = (data: any, status = 200) => NextResponse.json(data, { status });
const error = (msg: string, status = 400) => json({ error: msg }, status);

/**
 * Helper to extract id from url path
 */
function extractId(req: NextRequest) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

/**
 * GET /api/suppliers/[id] - fetch single supplier
 */
export async function GET(req: NextRequest) {
  try {
    const id = extractId(req);
    if (!id) return error("Supplier id is required", 400);

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { phones: true, store: true },
    });

    if (!supplier || supplier.deletedAt) return error("Supplier not found", 404);
    return json({ data: supplier });
  } catch (err: any) {
    console.error("GET /api/suppliers/[id] error:", err);
    return error(err?.message || "Failed to fetch supplier", 500);
  }
}

/**
 * PUT /api/suppliers/[id] - update supplier
 * Body may include:
 *  - name, email, location, note, storeId
 *  - phones: array (will replace existing phones if provided)
 */
export async function PUT(req: NextRequest) {
  try {
    const id = extractId(req);
    if (!id) return error("Supplier id is required", 400);

    const body = await req.json();
    if (!body || typeof body !== "object") return error("Invalid body", 400);

    const updateData: Prisma.SupplierUpdateInput = {};

    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.email !== undefined) updateData.email = body.email ? String(body.email).trim() : null;
    if (body.location !== undefined) updateData.location = body.location ? String(body.location).trim() : undefined;
    if (body.note !== undefined) updateData.note = body.note ? String(body.note).trim() : null;

    // If storeId provided, validate and connect
    if (body.storeId !== undefined) {
      if (body.storeId === null) {
        // disconnect is not meaningful here because relation is required by schema (storeId), so reject
        return error("storeId cannot be null", 400);
      }
      const storeExists = await prisma.store.findUnique({ where: { id: body.storeId } });
      if (!storeExists) return error("Store not found", 404);
      // connect to new store
      (updateData as any).store = { connect: { id: body.storeId } };
    }

    // Use transaction when replacing phones
    let updated;
    await prisma.$transaction(async (tx) => {
      // If phones provided, replace existing phones for supplier
      if (Array.isArray(body.phones)) {
        // delete existing phones for supplier
        await tx.supplierPhone.deleteMany({ where: { supplierId: id } });
        // create new phones (filter invalid)
        const phoneCreates = body.phones
          .filter((p: any) => p && p.phoneNumber)
          .map((p: any) => ({
            supplierId: id,
            phoneNumber: String(p.phoneNumber).trim(),
            contactName: p.contactName ? String(p.contactName).trim() : undefined,
            type: p.type || undefined,
            note: p.note ? String(p.note).trim() : undefined,
          }));
        if (phoneCreates.length) {
          await tx.supplierPhone.createMany({ data: phoneCreates });
        }
      }

      // Update supplier
      updated = await tx.supplier.update({
        where: { id },
        data: updateData as any,
        include: { phones: true, store: true },
      });
    });

    return json({ message: "Supplier updated", data: updated });
  } catch (err: any) {
    console.error("PUT /api/suppliers/[id] error:", err);
    return error(err?.message || "Failed to update supplier", 500);
  }
}

/**
 * DELETE /api/suppliers/[id]?permanent=true
 * - default: soft delete (set deletedAt)
 * - permanent=true => hard delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = extractId(req);
    if (!id) return error("Supplier id is required", 400);

    const url = new URL(req.url);
    const permanent = url.searchParams.get("permanent") === "true";

    let result;
    if (permanent) {
      // Also cascade delete phones first to avoid FK issues
      await prisma.supplierPhone.deleteMany({ where: { supplierId: id } });
      result = await prisma.supplier.delete({ where: { id } });
      return json({ message: "Supplier permanently deleted", data: result });
    } else {
      result = await prisma.supplier.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return json({ message: "Supplier soft-deleted", data: result });
    }
  } catch (err: any) {
    console.error("DELETE /api/suppliers/[id] error:", err);
    return error(err?.message || "Failed to delete supplier", 500);
  }
}
