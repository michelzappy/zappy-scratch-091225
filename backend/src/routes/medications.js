import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all medications with pagination and search
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 25, 
    search, 
    category, 
    status = 'active',
    sort = 'name'
  } = req.query;
  
  const offset = (page - 1) * limit;
  const db = getDatabase();
  
  let query = `
    SELECT 
      m.*,
      COUNT(DISTINCT p.id) as prescription_count,
      AVG(p.price)::numeric(10,2) as avg_prescription_price
    FROM medications m
    LEFT JOIN prescriptions p ON p.medication_name = m.name
    WHERE m.status = $1
  `;
  
  const params = [status];
  let paramCount = 2;
  
  if (search) {
    query += ` AND (
      LOWER(m.name) LIKE LOWER($${paramCount}) OR 
      LOWER(m.generic_name) LIKE LOWER($${paramCount}) OR
      LOWER(m.description) LIKE LOWER($${paramCount})
    )`;
    params.push(`%${search}%`);
    paramCount++;
  }
  
  if (category) {
    query += ` AND m.category = $${paramCount}`;
    params.push(category);
    paramCount++;
  }
  
  query += ` GROUP BY m.id`;
  
  // Add sorting
  const sortOptions = {
    'name': 'm.name ASC',
    'price': 'm.base_price ASC',
    'price_desc': 'm.base_price DESC',
    'popular': 'prescription_count DESC',
    'created': 'm.created_at DESC'
  };
  
  query += ` ORDER BY ${sortOptions[sort] || 'm.name ASC'}`;
  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);
  
  const result = await db.query(query, params);
  
  // Get total count
  let countQuery = `SELECT COUNT(*) FROM medications m WHERE m.status = $1`;
  const countParams = [status];
  paramCount = 2;
  
  if (search) {
    countQuery += ` AND (
      LOWER(m.name) LIKE LOWER($${paramCount}) OR 
      LOWER(m.generic_name) LIKE LOWER($${paramCount}) OR
      LOWER(m.description) LIKE LOWER($${paramCount})
    )`;
    countParams.push(`%${search}%`);
    paramCount++;
  }
  
  if (category) {
    countQuery += ` AND m.category = $${paramCount}`;
    countParams.push(category);
  }
  
  const countResult = await db.query(countQuery, countParams);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}));

// Get single medication details
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  const result = await db.query(`
    SELECT 
      m.*,
      (
        SELECT json_agg(json_build_object(
          'id', p.id,
          'patient_name', pat.first_name || ' ' || pat.last_name,
          'prescribed_at', p.created_at,
          'quantity', p.quantity,
          'status', p.status
        ))
        FROM prescriptions p
        JOIN patients pat ON p.patient_id = pat.id
        WHERE p.medication_name = m.name
        ORDER BY p.created_at DESC
        LIMIT 10
      ) as recent_prescriptions,
      (
        SELECT COUNT(*) FROM prescriptions 
        WHERE medication_name = m.name
      ) as total_prescriptions,
      (
        SELECT COUNT(*) FROM prescriptions 
        WHERE medication_name = m.name 
        AND status = 'active'
      ) as active_prescriptions
    FROM medications m
    WHERE m.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Medication not found' });
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Create new medication (admin only)
router.post('/', 
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Medication name required'),
    body('category').notEmpty().withMessage('Category required'),
    body('base_price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('dosage_forms').isArray().withMessage('Dosage forms must be an array')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name,
      generic_name,
      category,
      description,
      dosage_forms,
      strengths,
      base_price,
      subscription_price,
      manufacturer,
      ndc_code,
      requires_prescription,
      controlled_substance,
      storage_requirements,
      warnings,
      contraindications,
      side_effects
    } = req.body;
    
    const db = getDatabase();
    
    // Check if medication already exists
    const existing = await db.query(
      'SELECT id FROM medications WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Medication already exists' });
    }
    
    const result = await db.query(`
      INSERT INTO medications (
        name, generic_name, category, description,
        dosage_forms, strengths, base_price, subscription_price,
        manufacturer, ndc_code, requires_prescription,
        controlled_substance, storage_requirements,
        warnings, contraindications, side_effects,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'active', NOW())
      RETURNING *
    `, [
      name, generic_name, category, description,
      JSON.stringify(dosage_forms), JSON.stringify(strengths || []),
      base_price, subscription_price || base_price * 0.85,
      manufacturer, ndc_code,
      requires_prescription !== false,
      controlled_substance || false,
      storage_requirements,
      warnings, contraindications, side_effects
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Medication created successfully'
    });
  })
);

// Update medication (admin only)
router.put('/:id', 
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const db = getDatabase();
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    const allowedFields = [
      'name', 'generic_name', 'category', 'description',
      'dosage_forms', 'strengths', 'base_price', 'subscription_price',
      'manufacturer', 'ndc_code', 'requires_prescription',
      'controlled_substance', 'storage_requirements',
      'warnings', 'contraindications', 'side_effects', 'status'
    ];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount++}`);
        if (field === 'dosage_forms' || field === 'strengths') {
          values.push(JSON.stringify(updates[field]));
        } else {
          values.push(updates[field]);
        }
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateFields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `
      UPDATE medications 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Medication updated successfully'
    });
  })
);

// Update medication pricing (admin only)
router.put('/:id/pricing', 
  requireAdmin,
  [
    body('base_price').isFloat({ min: 0 }).withMessage('Valid base price required')
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { base_price, subscription_price } = req.body;
    const db = getDatabase();
    
    const result = await db.query(`
      UPDATE medications
      SET 
        base_price = $1,
        subscription_price = $2,
        price_updated_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [
      base_price,
      subscription_price || base_price * 0.85,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Pricing updated successfully'
    });
  })
);

// Get medication categories
router.get('/meta/categories', requireAuth, asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  const result = await db.query(`
    SELECT DISTINCT 
      category,
      COUNT(*) as medication_count
    FROM medications
    WHERE status = 'active'
    GROUP BY category
    ORDER BY category ASC
  `);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get medication statistics (admin only)
router.get('/stats/overview', requireAdmin, asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  const stats = await db.query(`
    SELECT
      COUNT(*) as total_medications,
      COUNT(*) FILTER (WHERE status = 'active') as active_medications,
      COUNT(*) FILTER (WHERE controlled_substance = true) as controlled_substances,
      COUNT(DISTINCT category) as categories,
      AVG(base_price)::numeric(10,2) as average_price,
      MIN(base_price)::numeric(10,2) as min_price,
      MAX(base_price)::numeric(10,2) as max_price
    FROM medications
  `);
  
  const popularMedications = await db.query(`
    SELECT 
      m.id,
      m.name,
      m.generic_name,
      m.category,
      m.base_price,
      COUNT(p.id) as prescription_count
    FROM medications m
    LEFT JOIN prescriptions p ON p.medication_name = m.name
    WHERE m.status = 'active'
    GROUP BY m.id
    ORDER BY prescription_count DESC
    LIMIT 10
  `);
  
  const categoryStats = await db.query(`
    SELECT 
      category,
      COUNT(*) as medication_count,
      AVG(base_price)::numeric(10,2) as avg_price
    FROM medications
    WHERE status = 'active'
    GROUP BY category
    ORDER BY medication_count DESC
  `);
  
  res.json({
    success: true,
    data: {
      overview: stats.rows[0],
      popularMedications: popularMedications.rows,
      categoryStats: categoryStats.rows
    }
  });
}));

// Search medications for autocomplete
router.get('/search/autocomplete', requireAuth, asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ success: true, data: [] });
  }
  
  const db = getDatabase();
  
  const result = await db.query(`
    SELECT 
      id, name, generic_name, category, base_price
    FROM medications
    WHERE status = 'active'
    AND (
      LOWER(name) LIKE LOWER($1) OR
      LOWER(generic_name) LIKE LOWER($1)
    )
    ORDER BY 
      CASE 
        WHEN LOWER(name) LIKE LOWER($2) THEN 1
        WHEN LOWER(generic_name) LIKE LOWER($2) THEN 2
        ELSE 3
      END,
      name ASC
    LIMIT 10
  `, [`%${q}%`, `${q}%`]);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

export default router;
