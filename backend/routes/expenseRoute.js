// routes/expenseRouter.js
const express = require('express');
const { Op, Sequelize } = require('sequelize');
const { Expense, sequelize } = require('../models');
const auth = require('../middlewares/auth');
const router = express.Router();
const { Parser } = require('json2csv'); // if installed, otherwise omit export CSV functionality

// ---------- Helpers ----------
const VALID_CATEGORIES = ['home', 'work', 'both', 'other'];
const trim = (v) => (typeof v === 'string' ? v.trim() : v);
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const err = (res, message = 'Server error', code = 500) => res.status(code).json({ error: message });
const ok = (res, payload = {}) => res.status(200).json(payload);
const validateExpenseInput = (payload = {}) => {
  const errors = [];
  if (!payload.title || String(payload.title).trim().length === 0) errors.push('title is required');
  const amount = toNumber(payload.amount);
  if (amount === null || amount < 0) errors.push('amount is required and must be >= 0');
  if (payload.quantity !== undefined) {
    const q = Number(payload.quantity);
    if (!Number.isInteger(q) || q < 1) errors.push('quantity must be integer >= 1');
  }
  if (payload.category !== undefined && !VALID_CATEGORIES.includes(payload.category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  return { ok: errors.length === 0, errors };
};

// ---------- Create Expense ----------
router.post('create/expense/', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { title, amount, quantity = 1, category = 'other', note } = req.body || {};
    const payload = { title: trim(title), amount, quantity, category, note };

    const v = validateExpenseInput(payload);
    if (!v.ok) return res.status(400).json({ errors: v.errors });

    const expense = await Expense.create(
      {
        title: payload.title,
        amount: Number(payload.amount).toFixed(2),
        quantity: Number(payload.quantity),
        category: payload.category,
        note: payload.note || null,
      },
      { transaction: t }
    );

    await t.commit();
    const created = await Expense.findByPk(expense.id);
    return res.status(201).json({ message: 'Expense created', expense: created });
  } catch (e) {
    await t.rollback();
    console.error('CREATE EXPENSE ERROR:', e);
    if (e.name === 'SequelizeValidationError') return err(res, e.message, 400);
    return err(res, 'Failed to create expense');
  }
});

// ---------- Bulk create (safe) ----------
router.post('/bulk', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    if (!Array.isArray(items) || items.length === 0) return err(res, 'Array of expenses required', 400);

    if (items.length > 1000) return err(res, 'Too many items in bulk (max 1000)', 400);

    // validate each
    const invalids = [];
    const rows = [];
    items.forEach((it, idx) => {
      const payload = {
        title: trim(it.title),
        amount: it.amount,
        quantity: it.quantity === undefined ? 1 : it.quantity,
        category: it.category || 'other',
        note: it.note,
      };
      const v = validateExpenseInput(payload);
      if (!v.ok) invalids.push({ idx, errors: v.errors });
      else
        rows.push({
          title: payload.title,
          amount: Number(payload.amount).toFixed(2),
          quantity: payload.quantity,
          category: payload.category,
          note: payload.note || null,
        });
    });

    if (invalids.length) return res.status(400).json({ error: 'Validation failed for some items', invalids });

    const created = await Expense.bulkCreate(rows, { transaction: t });
    await t.commit();
    return ok(res, { message: `Created ${created.length} expenses`, created_count: created.length });
  } catch (e) {
    await t.rollback();
    console.error('BULK CREATE ERROR:', e);
    return err(res, 'Bulk create failed');
  }
});

// ---------- Get list (search, filter, paginate, sort) ----------
/**
 * Query params:
 *  q (search in title/note)
 *  category
 *  min_amount, max_amount
 *  from (ISO date), to (ISO date)
 *  page, limit
 *  sort (created_at|amount|title), dir (asc|desc)
 *  include_deleted (true|false)
 */
router.get('/expence/search', auth, async (req, res) => {
  try {
    const {
      q,
      category,
      min_amount,
      max_amount,
      from,
      to,
      page = 1,
      limit = 25,
      sort = 'created_at',
      dir = 'desc',
      include_deleted = 'false',
    } = req.query;

    const where = {};

    if (q && String(q).trim() !== '') {
      const like = { [Op.iLike]: `%${String(q).trim()}%` };
      where[Op.or] = [{ title: like }, { note: like }];
    }

    if (category && VALID_CATEGORIES.includes(category)) where.category = category;

    const min = toNumber(min_amount);
    const max = toNumber(max_amount);
    if (min !== null || max !== null) {
      where.amount = {};
      if (min !== null) where.amount[Op.gte] = min;
      if (max !== null) where.amount[Op.lte] = max;
    }

    // date filters
    if (from || to) where.created_at = {};
    if (from) {
      const d = new Date(from);
      if (isNaN(d)) return err(res, 'Invalid "from" date', 400);
      where.created_at[Op.gte] = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d)) return err(res, 'Invalid "to" date', 400);
      // include full day if user passed date without time
      where.created_at[Op.lte] = d;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(500, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * lim;

    const orderField = ['amount', 'title'].includes(sort) ? sort : 'created_at';
    const orderDir = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const findOptions = {
      where,
      order: [[Sequelize.literal(`"${orderField}"`), orderDir]],
      offset,
      limit: lim,
    };

    if (include_deleted === 'true') findOptions.paranoid = false;

    const { rows, count } = await Expense.findAndCountAll(findOptions);

    return ok(res, {
      meta: { total: count, page: pageNum, limit: lim, pages: Math.ceil(count / lim) },
      data: rows,
    });
  } catch (e) {
    console.error('GET EXPENSES ERROR:', e);
    return err(res);
  }
});

// ---------- Get single expense ----------
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByPk(id, { paranoid: false });
    if (!expense) return err(res, 'Expense not found', 404);
    return ok(res, { expense });
  } catch (e) {
    console.error('GET EXPENSE ERROR:', e);
    return err(res);
  }
});

// ---------- Update expense ----------
router.put('/:id', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const payload = {
      title: req.body.title !== undefined ? trim(req.body.title) : undefined,
      amount: req.body.amount !== undefined ? req.body.amount : undefined,
      quantity: req.body.quantity !== undefined ? req.body.quantity : undefined,
      category: req.body.category !== undefined ? req.body.category : undefined,
      note: req.body.note !== undefined ? req.body.note : undefined,
    };

    const expense = await Expense.findByPk(id, { paranoid: false });
    if (!expense) {
      await t.rollback();
      return err(res, 'Expense not found', 404);
    }

    // validate partial
    const v = validateExpenseInput({ ...expense.dataValues, ...payload });
    if (!v.ok) {
      await t.rollback();
      return res.status(400).json({ errors: v.errors });
    }

    if (payload.title !== undefined) expense.title = payload.title;
    if (payload.amount !== undefined) expense.amount = Number(payload.amount).toFixed(2);
    if (payload.quantity !== undefined) expense.quantity = Number(payload.quantity);
    if (payload.category !== undefined) expense.category = payload.category;
    if (payload.note !== undefined) expense.note = payload.note;

    await expense.save({ transaction: t });
    await t.commit();

    const updated = await Expense.findByPk(id);
    return ok(res, { message: 'Expense updated', expense: updated });
  } catch (e) {
    await t.rollback();
    console.error('UPDATE EXPENSE ERROR:', e);
    if (e.name === 'SequelizeValidationError') return err(res, e.message, 400);
    return err(res);
  }
});

// ---------- Delete expense (soft by default) ----------
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const permanent = String(req.query.permanent || 'false').toLowerCase() === 'true';

    const expense = await Expense.findByPk(id, { paranoid: false });
    if (!expense) return err(res, 'Expense not found', 404);

    if (permanent) {
      await expense.destroy({ force: true });
      return ok(res, { message: 'Expense permanently deleted' });
    } else {
      await expense.destroy();
      return ok(res, { message: 'Expense soft-deleted' });
    }
  } catch (e) {
    console.error('DELETE EXPENSE ERROR:', e);
    return err(res);
  }
});

// ---------- Restore ----------
router.post('/:id/restore', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByPk(id, { paranoid: false });
    if (!expense) return err(res, 'Expense not found', 404);

    if (!expense.deletedAt && !expense.deleted_at) return err(res, 'Expense is not deleted', 400);

    await expense.restore();
    return ok(res, { message: 'Expense restored', expense });
  } catch (e) {
    console.error('RESTORE EXPENSE ERROR:', e);
    return err(res);
  }
});

// ---------- Stats: sum, avg, count, min, max for a filter (useful for dashboard) ----------
/**
 * Query params same as list: category, from, to, include_deleted
 */
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { category, from, to, include_deleted = 'false' } = req.query;
    const where = {};
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (from || to) where.created_at = {};
    if (from) {
      const d = new Date(from);
      if (isNaN(d)) return err(res, 'Invalid from date', 400);
      where.created_at[Op.gte] = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d)) return err(res, 'Invalid to date', 400);
      where.created_at[Op.lte] = d;
    }

    const queryOptions = { where };
    if (include_deleted === 'true') queryOptions.paranoid = false;

    const stats = await Expense.findAll({
      ...queryOptions,
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'sum'],
        [Sequelize.fn('AVG', Sequelize.col('amount')), 'avg'],
        [Sequelize.fn('MIN', Sequelize.col('amount')), 'min'],
        [Sequelize.fn('MAX', Sequelize.col('amount')), 'max'],
      ],
      raw: true,
    });

    return ok(res, { stats: stats[0] || {} });
  } catch (e) {
    console.error('STATS SUMMARY ERROR:', e);
    return err(res);
  }
});

// ---------- Category breakdown (sum per category) ----------
router.get('/stats/category-breakdown', auth, async (req, res) => {
  try {
    const { from, to, include_deleted = 'false' } = req.query;
    const where = {};
    if (from || to) where.created_at = {};
    if (from) {
      const d = new Date(from);
      if (isNaN(d)) return err(res, 'Invalid from date', 400);
      where.created_at[Op.gte] = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d)) return err(res, 'Invalid to date', 400);
      where.created_at[Op.lte] = d;
    }

    const queryOptions = { where };
    if (include_deleted === 'true') queryOptions.paranoid = false;

    const rows = await Expense.findAll({
      ...queryOptions,
      attributes: ['category', [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_amount'], [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['category'],
      order: [[Sequelize.fn('SUM', Sequelize.col('amount')), 'DESC']],
      raw: true,
    });

    return ok(res, { breakdown: rows });
  } catch (e) {
    console.error('CATEGORY BREAKDOWN ERROR:', e);
    return err(res);
  }
});

// ---------- Time series aggregation for charts ----------
// granularity: day | month | year
// returns array of { period: '2025-10' | '2025-10-12' | '2025', total_amount, count }
router.get('/stats/time-series', auth, async (req, res) => {
  try {
    const { from, to, granularity = 'month', include_deleted = 'false' } = req.query;
    const valid = ['day', 'month', 'year'];
    if (!valid.includes(granularity)) return err(res, 'Invalid granularity (day|month|year)', 400);

    const where = {};
    if (from || to) where.created_at = {};
    if (from) {
      const d = new Date(from);
      if (isNaN(d)) return err(res, 'Invalid from date', 400);
      where.created_at[Op.gte] = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d)) return err(res, 'Invalid to date', 400);
      where.created_at[Op.lte] = d;
    }

    const queryOptions = { where };
    if (include_deleted === 'true') queryOptions.paranoid = false;

    // Use DB date_trunc (Postgres) or fallback to formatting
    // We'll try to use Sequelize.literal with date_trunc for Postgres
    let periodExpr;
    if (granularity === 'day') {
      periodExpr = Sequelize.literal(`to_char(date_trunc('day', created_at), 'YYYY-MM-DD')`);
    } else if (granularity === 'month') {
      periodExpr = Sequelize.literal(`to_char(date_trunc('month', created_at), 'YYYY-MM')`);
    } else {
      periodExpr = Sequelize.literal(`to_char(date_trunc('year', created_at), 'YYYY')`);
    }

    const rows = await Expense.findAll({
      ...queryOptions,
      attributes: [[periodExpr, 'period'], [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_amount'], [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['period'],
      order: [[Sequelize.literal('period'), 'ASC']],
      raw: true,
    });

    return ok(res, { series: rows });
  } catch (e) {
    console.error('TIME SERIES ERROR:', e);
    return err(res);
  }
});

// ---------- Top N expenses (by amount) ----------
router.get('/top', auth, async (req, res) => {
  try {
    const n = Math.max(1, Math.min(100, parseInt(req.query.n || '10', 10)));
    const { from, to, category } = req.query;
    const where = {};
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (from || to) where.created_at = {};
    if (from) {
      const d = new Date(from);
      if (isNaN(d)) return err(res, 'Invalid from date', 400);
      where.created_at[Op.gte] = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d)) return err(res, 'Invalid to date', 400);
      where.created_at[Op.lte] = d;
    }

    const rows = await Expense.findAll({
      where,
      order: [['amount', 'DESC']],
      limit: n,
      raw: false,
    });

    return ok(res, { top: rows });
  } catch (e) {
    console.error('TOP EXPENSES ERROR:', e);
    return err(res);
  }
});

// ---------- CSV export ----------
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { from, to, category } = req.query;
    const where = {};
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (from || to) where.created_at = {};
    if (from) {
      const d = new Date(from);
      if (isNaN(d)) return err(res, 'Invalid from date', 400);
      where.created_at[Op.gte] = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d)) return err(res, 'Invalid to date', 400);
      where.created_at[Op.lte] = d;
    }

    const rows = await Expense.findAll({
      where,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'amount', 'quantity', 'category', 'note', 'created_at'],
      raw: true,
    });

    // Try to stream CSV using json2csv if available
    try {
      const fields = ['id', 'title', 'amount', 'quantity', 'category', 'note', 'created_at'];
      const parser = new Parser({ fields });
      const csv = parser.parse(rows);

      res.header('Content-Type', 'text/csv');
      res.attachment(`expenses_${Date.now()}.csv`);
      return res.send(csv);
    } catch (csvErr) {
      console.warn('CSV export fallback, json2csv not available or failed:', csvErr);
      // fallback to JSON
      return ok(res, { exported_count: rows.length, data: rows });
    }
  } catch (e) {
    console.error('EXPORT CSV ERROR:', e);
    return err(res);
  }
});

// ---------- Bulk delete (soft/hard) ----------
router.post('/bulk/delete', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { ids, permanent = false } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      await t.rollback();
      return err(res, 'ids array is required', 400);
    }
    if (permanent) {
      await Expense.destroy({ where: { id: { [Op.in]: ids } }, force: true, transaction: t });
    } else {
      await Expense.destroy({ where: { id: { [Op.in]: ids } }, transaction: t });
    }
    await t.commit();
    return ok(res, { message: `Bulk delete executed (permanent=${permanent})`, count: ids.length });
  } catch (e) {
    await t.rollback();
    console.error('BULK DELETE ERROR:', e);
    return err(res);
  }
});

// ---------- Quick health route (counts) ----------
router.get('/meta/counts', auth, async (req, res) => {
  try {
    const total = await Expense.count();
    const deleted = await Expense.count({ paranoid: false, where: { deletedAt: { [Op.ne]: null } } });
    const recent = await Expense.count({ where: { created_at: { [Op.gte]: Sequelize.literal("NOW() - INTERVAL '7 days'") } } });
    return ok(res, { total, deleted, recent_7_days: recent });
  } catch (e) {
    console.error('META COUNTS ERROR:', e);
    return err(res);
  }
});

module.exports = router;
