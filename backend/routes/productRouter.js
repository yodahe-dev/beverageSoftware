const express = require('express');
const router = express.Router();
const { Product, Supplier, SubBrand } = require('../models');
const { Op } = require('sequelize');

// ✅ CREATE PRODUCT
router.post('/create/products', async (req, res) => {
  try {
    const { name, quantity, sell_price, cost_price, category, note, supplier_id, subbrand_id } = req.body;

    if (!name || !supplier_id || !subbrand_id)
      return res.status(400).json({ success: false, message: 'Name, supplier_id, and subbrand_id are required.' });

    const product = await Product.create({
      name,
      quantity,
      sell_price,
      cost_price,
      category,
      note,
      supplier_id,
      subbrand_id,
    });

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// ✅ GET ALL PRODUCTS
router.get('/all/products', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'location'] },
        { model: SubBrand, as: 'subbrand', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// ✅ GET PRODUCT BY ID
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: SubBrand, as: 'subbrand' },
      ],
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('❌ Error getting product:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// ✅ UPDATE PRODUCT
router.put('/update/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Product.update(req.body, { where: { id } });

    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });

    const updatedProduct = await Product.findByPk(id);
    res.status(200).json({ success: true, message: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// ✅ DELETE PRODUCT (soft delete)
router.delete('/delete/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// ✅ SEARCH PRODUCTS (for analytics, dashboard)
router.get('/search/products', async (req, res) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;
    const conditions = {};

    if (name) conditions.name = { [Op.iLike]: `%${name}%` };
    if (category) conditions.category = category;
    if (minPrice || maxPrice)
      conditions.sell_price = {
        [Op.between]: [minPrice || 0, maxPrice || 999999],
      };

    const products = await Product.findAll({
      where: conditions,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['name', 'location'] },
        { model: SubBrand, as: 'subbrand', attributes: ['name'] },
      ],
    });

    res.status(200).json({
      success: true,
      count: products.length,
      message: `${products.length} product(s) found.`,
      data: products,
    });
  } catch (error) {
    console.error('❌ Error searching products:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
