// routes/brandRouter.js
const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const auth = require('../middlewares/auth');
const { Brand, SubBrand } = require('../models');

/**
 * Helper utilities
 */
const VALID_TYPES = ['softdrink', 'alcohol', 'other'];
const isValidType = (t) => VALID_TYPES.includes(t);
const trimOrNull = (v) => (typeof v === 'string' ? v.trim() : null);
const okJson = (res, payload = {}) => res.status(200).json(payload);
const errJson = (res, message = 'Server error', code = 500) => res.status(code).json({ error: message });

/**
 * Create Brand
 * - body: { name, type, note }
 * - name must be unique
 */
router.post('/create/brand', auth, async (req, res) => {
  try {
    const name = trimOrNull(req.body.name);
    const type = trimOrNull(req.body.type);
    const note = trimOrNull(req.body.note);

    if (!name) return errJson(res, 'name is required', 400);
    if (!type || !isValidType(type)) return errJson(res, `type is required and must be one of ${VALID_TYPES.join(', ')}`, 400);

    // create
    const brand = await Brand.create({ name, type, note });
    return res.status(201).json({ message: 'Brand created', brand });
  } catch (err) {
    console.error('create brand error', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return errJson(res, 'Brand with this name already exists', 409);
    }
    return errJson(res);
  }
});

/**
 * Create SubBrand
 * - body: { name, brand_id, note }
 * - validates brand exists
 */
router.post('/create/subbrand', auth, async (req, res) => {
  try {
    const name = trimOrNull(req.body.name);
    const brand_id = trimOrNull(req.body.brand_id);
    const note = trimOrNull(req.body.note);

    if (!name) return errJson(res, 'name is required', 400);
    if (!brand_id) return errJson(res, 'brand_id is required', 400);

    const brand = await Brand.findByPk(brand_id);
    if (!brand) return errJson(res, 'brand not found', 404);

    const sub = await SubBrand.create({ name, brand_id, note });
    return res.status(201).json({ message: 'SubBrand created', subbrand: sub });
  } catch (err) {
    console.error('create subbrand error', err);
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return errJson(res, 'Invalid brand_id', 400);
    }
    return errJson(res);
  }
});

/**
 * Update Brand
 * - params: id
 * - body: { name?, type?, note? }
 */
router.put('/update/brand/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.body.name !== undefined ? trimOrNull(req.body.name) : undefined;
    const type = req.body.type !== undefined ? trimOrNull(req.body.type) : undefined;
    const note = req.body.note !== undefined ? trimOrNull(req.body.note) : undefined;

    const brand = await Brand.findByPk(id);
    if (!brand) return errJson(res, 'Brand not found', 404);

    if (name !== undefined && name.length === 0) return errJson(res, 'name cannot be empty', 400);
    if (type !== undefined && !isValidType(type)) return errJson(res, `type must be one of ${VALID_TYPES.join(', ')}`, 400);

    if (name !== undefined) brand.name = name;
    if (type !== undefined) brand.type = type;
    if (note !== undefined) brand.note = note;

    await brand.save();
    return okJson(res, { message: 'Brand updated', brand });
  } catch (err) {
    console.error('update brand error', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return errJson(res, 'Another brand with this name already exists', 409);
    }
    return errJson(res);
  }
});

/**
 * Update SubBrand
 * - params: id
 * - body: { name?, note?, brand_id? }
 * - if brand_id provided validate existence
 */
router.put('/update/subbrand/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.body.name !== undefined ? trimOrNull(req.body.name) : undefined;
    const note = req.body.note !== undefined ? trimOrNull(req.body.note) : undefined;
    const brand_id = req.body.brand_id !== undefined ? trimOrNull(req.body.brand_id) : undefined;

    const sub = await SubBrand.findByPk(id);
    if (!sub) return errJson(res, 'SubBrand not found', 404);

    if (brand_id) {
      const brand = await Brand.findByPk(brand_id);
      if (!brand) return errJson(res, 'brand not found for provided brand_id', 404);
      sub.brand_id = brand_id;
    }

    if (name !== undefined) {
      if (name.length === 0) return errJson(res, 'name cannot be empty', 400);
      sub.name = name;
    }

    if (note !== undefined) sub.note = note;

    await sub.save();
    return okJson(res, { message: 'SubBrand updated', subbrand: sub });
  } catch (err) {
    console.error('update subbrand error', err);
    return errJson(res);
  }
});

/**
 * Get brands list with advanced filtering, sorting, pagination
 * Query params:
 * - search (string) : searches name & note & type
 * - type (softdrink|alcohol|other)
 * - page (number)
 * - limit (number)
 * - include_subbrands (true|false)
 * - sort (name|createdAt) default name
 * - dir (asc|desc)
 */
router.get('/brands', async (req, res) => {
  try {
    let { search, type, page = 1, limit = 25, include_subbrands = 'false', sort = 'name', dir = 'asc' } = req.query;
    page = Math.max(1, parseInt(page || 1, 10));
    limit = Math.min(200, Math.max(1, parseInt(limit || 25, 10)));
    include_subbrands = String(include_subbrands).toLowerCase() === 'true';
    dir = (dir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    sort = sort === 'createdAt' ? 'createdAt' : 'name';

    const where = {};
    if (type && isValidType(type)) where.type = type;

    if (search && String(search).trim() !== '') {
      const q = `%${String(search).trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: q } },
        { note: { [Op.iLike]: q } },
        { type: { [Op.iLike]: q } },
      ];
    }

    const include = [];
    if (include_subbrands) {
      include.push({
        model: SubBrand,
        as: 'subbrands',
        attributes: ['id', 'name', 'note', 'created_at', 'updated_at'],
      });
    }

    const { rows, count } = await Brand.findAndCountAll({
      where,
      include,
      order: [[Sequelize.literal(`"${sort}"`), dir]],
      offset: (page - 1) * limit,
      limit,
      distinct: true,
      attributes: ['id', 'name', 'type', 'note', 'created_at', 'updated_at'],
    });

    return okJson(res, {
      meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
      data: rows,
    });
  } catch (err) {
    console.error('brands list error', err);
    return errJson(res);
  }
});

/**
 * Fast in-memory search endpoint (optional) for frontend typeahead / dropdown
 * - query params:
 *   - q (required)
 *   - max (optional) default 50
 *
 * NOTE: This will fetch up to limit*pages brands from DB; intended for moderate dataset sizes.
 * For extremely large datasets use DB full-text index or a search service.
 */
router.get('/brands/search', async (req, res) => {
  try {
    const q = trimOrNull(req.query.q);
    const max = Math.min(200, Math.max(5, parseInt(req.query.max || 50, 10)));

    if (!q) return errJson(res, 'q (query) is required', 400);
    const needle = q.toLowerCase();

    // Fetch a reasonable superset (server-side filtering by name partially to reduce rows)
    const candidates = await Brand.findAll({
      where: {
        name: { [Op.iLike]: `%${q}%` },
      },
      attributes: ['id', 'name', 'type', 'note'],
      limit: 1000, // safety cap
    });

    // Build quick index maps for O(1) lookups if needed
    // and perform final in-memory ranking
    const results = candidates
      .map((b) => ({
        id: b.id,
        name: b.name,
        nameLower: b.name.toLowerCase(),
        type: b.type,
        note: b.note || '',
      }))
      .filter((b) => {
        // rank: name startsWith > name includes > type includes > note includes
        return (
          b.nameLower.includes(needle) ||
          (b.type && b.type.toLowerCase().includes(needle)) ||
          (b.note && b.note.toLowerCase().includes(needle))
        );
      })
      .sort((a, b) => {
        // simple ranking: startsWith first, then alphabetic
        const aStarts = a.nameLower.startsWith(needle) ? 0 : 1;
        const bStarts = b.nameLower.startsWith(needle) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.nameLower.localeCompare(b.nameLower);
      })
      .slice(0, max)
      .map((r) => ({ id: r.id, name: r.name, type: r.type, note: r.note }));

    return okJson(res, { total: results.length, results });
  } catch (err) {
    console.error('brands search error', err);
    return errJson(res);
  }
});

/**
 * Get single Brand (with optional subbrands)
 */
router.get('/brand/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const include_subbrands = String(req.query.include_subbrands || 'false').toLowerCase() === 'true';

    const brand = await Brand.findByPk(id, {
      include: include_subbrands
        ? [{ model: SubBrand, as: 'subbrands', attributes: ['id', 'name', 'note', 'created_at'] }]
        : [],
    });
    if (!brand) return errJson(res, 'Brand not found', 404);
    return okJson(res, { brand });
  } catch (err) {
    console.error('get brand error', err);
    return errJson(res);
  }
});

/**
 * Get SubBrands list by brand (or all)
 * Query: brand_id (optional), search, page, limit, sort, dir
 */
router.get('/subbrands', async (req, res) => {
  try {
    let { brand_id, search, page = 1, limit = 25, sort = 'name', dir = 'asc' } = req.query;
    page = Math.max(1, parseInt(page || 1, 10));
    limit = Math.min(200, Math.max(1, parseInt(limit || 25, 10)));
    dir = (dir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    sort = sort === 'createdAt' ? 'createdAt' : 'name';

    const where = {};
    if (brand_id) where.brand_id = brand_id;
    if (search && String(search).trim() !== '') {
      const q = `%${String(search).trim()}%`;
      where[Op.or] = [{ name: { [Op.iLike]: q } }, { note: { [Op.iLike]: q } }];
    }

    const { rows, count } = await SubBrand.findAndCountAll({
      where,
      order: [[Sequelize.literal(`"${sort}"`), dir]],
      offset: (page - 1) * limit,
      limit,
      attributes: ['id', 'name', 'brand_id', 'note', 'created_at', 'updated_at'],
    });

    return okJson(res, { meta: { total: count, page, limit, pages: Math.ceil(count / limit) }, data: rows });
  } catch (err) {
    console.error('subbrands list error', err);
    return errJson(res);
  }
});

/**
 * Delete Brand (soft delete by default, permanent if ?permanent=true)
 */
router.delete('/delete/brand/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const permanent = String(req.query.permanent || 'false').toLowerCase() === 'true';

    const brand = await Brand.findByPk(id, { paranoid: false });
    if (!brand) return errJson(res, 'Brand not found', 404);

    if (permanent) {
      await brand.destroy({ force: true });
      return okJson(res, { message: 'Brand permanently deleted' });
    } else {
      await brand.destroy(); // soft-delete
      return okJson(res, { message: 'Brand soft-deleted' });
    }
  } catch (err) {
    console.error('delete brand error', err);
    return errJson(res);
  }
});

/**
 * Delete SubBrand (soft by default, permanent if ?permanent=true)
 */
router.delete('/delete/subbrand/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const permanent = String(req.query.permanent || 'false').toLowerCase() === 'true';

    const sub = await SubBrand.findByPk(id, { paranoid: false });
    if (!sub) return errJson(res, 'SubBrand not found', 404);

    if (permanent) {
      await sub.destroy({ force: true });
      return okJson(res, { message: 'SubBrand permanently deleted' });
    } else {
      await sub.destroy();
      return okJson(res, { message: 'SubBrand soft-deleted' });
    }
  } catch (err) {
    console.error('delete subbrand error', err);
    return errJson(res);
  }
});

/**
 * Restore soft-deleted Brand or SubBrand
 * - POST /restore/brand/:id
 * - POST /restore/subbrand/:id
 */
router.post('/restore/brand/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const brand = await Brand.findByPk(id, { paranoid: false });
    if (!brand) return errJson(res, 'Brand not found', 404);
    if (!brand.deleted_at && !brand.deletedAt) {
      // some sequelize versions store deletedAt
      return errJson(res, 'Brand is not deleted', 400);
    }
    await brand.restore();
    return okJson(res, { message: 'Brand restored', brand });
  } catch (err) {
    console.error('restore brand error', err);
    return errJson(res);
  }
});

router.post('/restore/subbrand/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const sub = await SubBrand.findByPk(id, { paranoid: false });
    if (!sub) return errJson(res, 'SubBrand not found', 404);
    if (!sub.deleted_at && !sub.deletedAt) return errJson(res, 'SubBrand is not deleted', 400);
    await sub.restore();
    return okJson(res, { message: 'SubBrand restored', subbrand: sub });
  } catch (err) {
    console.error('restore subbrand error', err);
    return errJson(res);
  }
});

module.exports = router;
