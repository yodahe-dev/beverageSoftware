const express = require('express');
const { Op, Sequelize } = require('sequelize');
const { sequelize, Customer, Phone } = require('../models');
const auth = require('../middlewares/auth');

const router = express.Router();

const CUSTOMER_TYPES = ['bar', 'individual', 'shop', 'restaurant', 'other'];
const PHONE_TYPES = ['main', 'sales', 'support', 'other'];
const trim = (v) => (typeof v === 'string' ? v.trim() : null);
const err = (res, message = 'Server error', code = 500) => res.status(code).json({ error: message });
const ok = (res, payload) => res.status(200).json(payload);

// 🧠 Helper to validate phone numbers
const validatePhones = (phones = []) => {
  if (!Array.isArray(phones)) return 'Phones must be an array';
  for (const p of phones) {
    if (!p.phone_number) return 'Each phone must have a phone_number';
    if (p.type && !PHONE_TYPES.includes(p.type)) return `Phone type must be one of ${PHONE_TYPES.join(', ')}`;
  }
  return null;
};

// ✅ CREATE CUSTOMER with optional phones
router.post('/create/customer', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, address, type, note, is_active = true, phones = [] } = req.body;

    if (!name || name.length < 2) return err(res, 'Name must be at least 2 characters', 400);
    if (!address) return err(res, 'Address is required', 400);
    if (type && !CUSTOMER_TYPES.includes(type)) return err(res, `Type must be one of ${CUSTOMER_TYPES.join(', ')}`, 400);

    const phoneErr = validatePhones(phones);
    if (phoneErr) return err(res, phoneErr, 400);

    const customer = await Customer.create(
      { name: trim(name), address: trim(address), type: type || 'individual', note: trim(note), is_active },
      { transaction: t }
    );

    if (phones.length) {
      const phoneRecords = phones.map((p) => ({
        phoneable_id: customer.id,
        phoneable_type: 'customer',
        phone_number: trim(p.phone_number),
        contact_name: trim(p.contact_name),
        type: p.type || 'other',
        note: trim(p.note),
        is_active: p.is_active !== false,
      }));
      await Phone.bulkCreate(phoneRecords, { transaction: t });
    }

    await t.commit();

    const newCustomer = await Customer.findByPk(customer.id, {
      include: [{ model: Phone, as: 'phones' }],
    });

    return res.status(201).json({ message: 'Customer created successfully', customer: newCustomer });
  } catch (e) {
    console.error('CREATE CUSTOMER ERROR:', e);
    await t.rollback();
    return err(res, e.message || 'Server error');
  }
});

// ✅ UPDATE CUSTOMER + ADD/UPDATE/DELETE PHONES
router.put('/update/customer/:id', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const { name, address, type, note, is_active, phones } = req.body;

    const customer = await Customer.findByPk(id, { include: [{ model: Phone, as: 'phones' }] });
    if (!customer) return err(res, 'Customer not found', 404);

    // update customer basic fields
    if (name) customer.name = trim(name);
    if (address) customer.address = trim(address);
    if (note !== undefined) customer.note = trim(note);
    if (is_active !== undefined) customer.is_active = !!is_active;
    if (type && CUSTOMER_TYPES.includes(type)) customer.type = type;

    await customer.save({ transaction: t });

    // phones update logic
    if (phones && Array.isArray(phones)) {
      for (const p of phones) {
        if (p.id) {
          // update existing phone
          const phone = await Phone.findOne({
            where: { id: p.id, phoneable_id: id, phoneable_type: 'customer' },
          });
          if (!phone) continue;
          await phone.update(
            {
              phone_number: trim(p.phone_number) || phone.phone_number,
              contact_name: trim(p.contact_name),
              type: p.type || phone.type,
              note: trim(p.note),
              is_active: p.is_active !== undefined ? !!p.is_active : phone.is_active,
            },
            { transaction: t }
          );
        } else if (p._action === 'delete' && p.phone_number) {
          await Phone.destroy({
            where: { phoneable_id: id, phoneable_type: 'customer', phone_number: p.phone_number },
            transaction: t,
          });
        } else if (!p.id && p.phone_number) {
          // add new phone
          await Phone.create(
            {
              phoneable_id: id,
              phoneable_type: 'customer',
              phone_number: trim(p.phone_number),
              contact_name: trim(p.contact_name),
              type: p.type || 'other',
              note: trim(p.note),
              is_active: p.is_active !== false,
            },
            { transaction: t }
          );
        }
      }
    }

    await t.commit();

    const updated = await Customer.findByPk(id, { include: [{ model: Phone, as: 'phones' }] });
    return ok(res, { message: 'Customer updated', customer: updated });
  } catch (e) {
    console.error('UPDATE CUSTOMER ERROR:', e);
    await t.rollback();
    return err(res, e.message || 'Server error');
  }
});

// ✅ DELETE (soft or hard)
router.delete('/delete/customer/:id', auth, async (req, res) => {
  try {
    const { permanent } = req.query;
    const customer = await Customer.findByPk(req.params.id, { paranoid: false });
    if (!customer) return err(res, 'Customer not found', 404);

    if (permanent === 'true') {
      await customer.destroy({ force: true });
      await Phone.destroy({
        where: { phoneable_id: customer.id, phoneable_type: 'customer' },
        force: true,
      });
      return ok(res, { message: 'Customer permanently deleted' });
    } else {
      await customer.destroy();
      return ok(res, { message: 'Customer soft deleted' });
    }
  } catch (e) {
    console.error('DELETE CUSTOMER ERROR:', e);
    return err(res);
  }
});

// ✅ RESTORE
router.post('/restore/customer/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, { paranoid: false });
    if (!customer) return err(res, 'Customer not found', 404);
    if (!customer.deleted_at) return err(res, 'Customer is not deleted', 400);

    await customer.restore();
    return ok(res, { message: 'Customer restored successfully' });
  } catch (e) {
    console.error('RESTORE CUSTOMER ERROR:', e);
    return err(res);
  }
});

// ✅ GET ALL (with filters + search + pagination)
router.get('/customers', auth, async (req, res) => {
  try {
    const {
      search,
      type,
      is_active,
      page = 1,
      limit = 20,
      sort = 'name',
      dir = 'asc',
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { note: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (type && CUSTOMER_TYPES.includes(type)) where.type = type;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const offset = (page - 1) * limit;
    const order = [[sort, dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']];

    const { rows, count } = await Customer.findAndCountAll({
      where,
      include: [{ model: Phone, as: 'phones' }],
      order,
      offset,
      limit: parseInt(limit),
      distinct: true,
    });

    return ok(res, {
      meta: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit),
      },
      data: rows,
    });
  } catch (e) {
    console.error('GET CUSTOMERS ERROR:', e);
    return err(res);
  }
});

// ✅ SEARCH (for dropdowns or autocomplete)
router.get('/customers/search', auth, async (req, res) => {
  try {
    const q = trim(req.query.q);
    if (!q) return err(res, 'Missing query parameter q', 400);

    const results = await Customer.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { address: { [Op.iLike]: `%${q}%` } },
          { note: { [Op.iLike]: `%${q}%` } },
        ],
      },
      include: [{ model: Phone, as: 'phones' }],
      limit: 20,
      order: [['name', 'ASC']],
    });

    return ok(res, { results });
  } catch (e) {
    console.error('SEARCH CUSTOMER ERROR:', e);
    return err(res);
  }
});

module.exports = router;
