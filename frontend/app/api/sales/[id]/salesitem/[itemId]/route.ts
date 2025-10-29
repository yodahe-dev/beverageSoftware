import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET a specific sale item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { id: saleId, itemId } = params;

    const saleItem = await prisma.saleItem.findFirst({
      where: { 
        id: itemId,
        salesId: saleId
      },
      include: {
        product: true,
        subbrand: {
          include: {
            brand: true
          }
        }
      }
    });

    if (!saleItem) {
      return NextResponse.json(
        { error: 'Sale item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(saleItem);
  } catch (error) {
    console.error('Error fetching sale item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale item' },
      { status: 500 }
    );
  }
}

// UPDATE a sale item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { id: saleId, itemId } = params;
    const body = await request.json();

    console.log('Updating sale item:', { saleId, itemId, body });

    // Verify the sale exists
    const sale = await prisma.sales.findUnique({
      where: { id: saleId }
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Verify the sale item exists and belongs to this sale
    const existingItem = await prisma.saleItem.findFirst({
      where: { 
        id: itemId,
        salesId: saleId
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Sale item not found for this sale' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (body.category !== undefined) updateData.category = body.category;
    if (body.quantity !== undefined) updateData.quantity = parseInt(body.quantity);
    if (body.drinkPrice !== undefined) updateData.drinkPrice = body.drinkPrice ? parseFloat(body.drinkPrice) : null;
    if (body.bottlePrice !== undefined) updateData.bottlePrice = body.bottlePrice ? parseFloat(body.bottlePrice) : null;
    if (body.subtotal !== undefined) updateData.subtotal = parseFloat(body.subtotal);
    if (body.note !== undefined) updateData.note = body.note;
    if (body.productId !== undefined) updateData.productId = body.productId;
    if (body.subbrandId !== undefined) updateData.subbrandId = body.subbrandId || null;

    // Update the sale item
    const updatedItem = await prisma.saleItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        product: true,
        subbrand: {
          include: {
            brand: true
          }
        }
      }
    });

    console.log('Successfully updated sale item:', updatedItem);

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating sale item:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Sale item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update sale item' },
      { status: 500 }
    );
  }
}

// DELETE a sale item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { id: saleId, itemId } = params;

    console.log('Deleting sale item:', { saleId, itemId });

    // Verify the sale exists
    const sale = await prisma.sales.findUnique({
      where: { id: saleId }
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Verify the sale item exists and belongs to this sale
    const existingItem = await prisma.saleItem.findFirst({
      where: { 
        id: itemId,
        salesId: saleId
      },
      include: {
        product: true
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Sale item not found for this sale' },
        { status: 404 }
      );
    }

    // Delete the sale item
    await prisma.saleItem.delete({
      where: { id: itemId }
    });

    console.log('Successfully deleted sale item');

    return NextResponse.json({ 
      message: 'Sale item deleted successfully',
      deletedItem: existingItem
    });
  } catch (error) {
    console.error('Error deleting sale item:', error);
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Sale item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete sale item' },
      { status: 500 }
    );
  }
}