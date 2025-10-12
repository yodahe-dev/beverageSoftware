const express = require('express');
const router = express.Router();
const { Sales, SaleItem, Product, Customer, User, SubBrand, sequelize } = require('../models');
const { Op } = require('sequelize');

// ✅ CREATE SALE (with multiple sale items)
router.post('/create/sale', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, phone, payment_method, status, note, customer_id, user_id, items } = req.body;

    if (!payment_method || !user_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields or no items provided.' });
    }

    // Validate each sale item
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid sale item detected.' });
      }
    }

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) throw new Error(`Product not found: ${item.product_id}`);

      if (product.quantity < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      const drinkPrice = parseFloat(item.drink_price || product.sell_price || 0);
      const bottlePrice = parseFloat(item.bottle_price || 0);

      let subtotal = 0;
      if (item.category === 'drink') subtotal = item.quantity * drinkPrice;
      else if (item.category === 'bottle') subtotal = item.quantity * bottlePrice;
      else subtotal = item.quantity * (drinkPrice + bottlePrice);

      totalAmount += subtotal;
    }

    // Create Sale
    const sale = await Sales.create(
      { name, phone, total_amount: totalAmount, payment_method, status, note, customer_id, user_id },
      { transaction: t }
    );

    // Create SaleItems and update product quantity
    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      const subbrand_id = product.subbrand_id;

      // Deduct stock
      product.quantity -= item.quantity;
      await product.save({ transaction: t });

      const drinkPrice = parseFloat(item.drink_price || product.sell_price || 0);
      const bottlePrice = parseFloat(item.bottle_price || 0);
      let subtotal = 0;
      if (item.category === 'drink') subtotal = item.quantity * drinkPrice;
      else if (item.category === 'bottle') subtotal = item.quantity * bottlePrice;
      else subtotal = item.quantity * (drinkPrice + bottlePrice);

      await SaleItem.create(
        {
          category: item.category,
          quantity: item.quantity,
          drink_price: drinkPrice,
          bottle_price: bottlePrice,
          subtotal,
          sales_id: sale.id,
          product_id: product.id,
          subbrand_id,
          note: item.note,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({ success: true, message: 'Sale completed successfully', data: sale });
  } catch (error) {
    await t.rollback();
    console.error('❌ Sale creation failed:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ✅ GET ALL SALES
router.get('/all/sales', async (req, res) => {
  try {
    const sales = await Sales.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sell_price'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    console.error('❌ Error fetching sales:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ GET SINGLE SALE BY ID
router.get('/sale/:id', async (req, res) => {
  try {
    const sale = await Sales.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'user' },
        {
          model: SaleItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['name', 'category'] },
            { model: SubBrand, as: 'subbrand', attributes: ['name'] },
          ],
        },
      ],
    });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    console.error('❌ Error getting sale:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ UPDATE SALE STATUS OR DETAILS
router.put('/update/sale/:id', async (req, res) => {
  try {
    const sale = await Sales.findByPk(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

    await sale.update(req.body);
    res.status(200).json({ success: true, message: 'Sale updated successfully', data: sale });
  } catch (error) {
    console.error('❌ Error updating sale:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ DELETE SALE (soft delete)
router.delete('/delete/sale/:id', async (req, res) => {
  try {
    const deleted = await Sales.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.status(200).json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting sale:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ SEARCH SALES (by name, phone, or date)
router.get('/search/sales', async (req, res) => {
  try {
    const { name, phone, startDate, endDate, status } = req.query;
    const filters = {};

    if (name) filters.name = { [Op.iLike]: `%${name}%` };
    if (phone) filters.phone = { [Op.iLike]: `%${phone}%` };
    if (status) filters.status = status;
    if (startDate && endDate) filters.createdAt = { [Op.between]: [startDate, endDate] };

    const sales = await Sales.findAll({ where: filters, include: [{ model: SaleItem, as: 'items' }] });
    res.status(200).json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    console.error('❌ Error searching sales:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ✅ SALES STATS (for dashboard & graphs)
router.get('/stats/sales', async (req, res) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) AS total_sales,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_sale_value,
        COUNT(CASE WHEN status='completed' THEN 1 END) AS completed_sales,
        COUNT(CASE WHEN status='pending' THEN 1 END) AS pending_sales
      FROM sales
      WHERE deleted_at IS NULL;
    `);

    res.status(200).json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('❌ Error generating stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
