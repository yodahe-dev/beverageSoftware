import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET a specific sale
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await prisma.sales.findUnique({
      where: { id: params.id },
      include: { 
        items: {
          include: {
            product: true,
            subbrand: {
              include: {
                brand: true
              }
            }
          }
        }, 
        user: true, 
        customer: {
          include: {
            phones: true
          }
        } 
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
      { status: 500 }
    );
  }
}

// UPDATE a sale
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { totalAmount, paymentMethod, status, note, customerId } = body;

    console.log('Updating sale:', { id: params.id, body });

    // Validate status
    const validStatuses = ["pending", "completed", "cancelled", "partially_paid"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = ["cash", "transfer", "credit"];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Check if sale exists
    const existingSale = await prisma.sales.findUnique({
      where: { id: params.id }
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount);
    if (status !== undefined) updateData.status = status;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (note !== undefined) updateData.note = note;
    if (customerId !== undefined) updateData.customerId = customerId || null;

    const updatedSale = await prisma.sales.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
            subbrand: {
              include: {
                brand: true
              }
            }
          }
        },
        customer: {
          include: {
            phones: true
          }
        },
        user: true
      }
    });

    console.log('Successfully updated sale:', updatedSale);

    return NextResponse.json(updatedSale);
  } catch (error: any) {
    console.error('Error updating sale:', error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

// DELETE a sale
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting sale:', params.id);

    // Check if sale exists
    const existingSale = await prisma.sales.findUnique({
      where: { id: params.id },
      include: { items: true }
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    // Delete all sale items first (due to foreign key constraints)
    if (existingSale.items.length > 0) {
      await prisma.saleItem.deleteMany({
        where: { salesId: params.id }
      });
    }

    // Then delete the sale
    await prisma.sales.delete({
      where: { id: params.id },
    });

    console.log('Successfully deleted sale and associated items');

    return NextResponse.json({ 
      message: "Sale and associated items deleted successfully" 
    });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}