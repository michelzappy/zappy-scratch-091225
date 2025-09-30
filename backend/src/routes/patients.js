import express from 'express';
import { requirePermission } from '../middleware/accessControl.js';
import { asyncErrorWrapper } from '../middleware/errorHandler.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import PatientService from '../services/PatientService.js';

const router = express.Router();

// Initialize service
const patientService = new PatientService();

/**
 * @route GET /api/patients
 * @desc Get all patients with pagination
 * @access Private (admin, provider, staff)
 */
router.get('/',
  requirePermission('patients', 'read'),
  asyncErrorWrapper(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    
    const filter = {};
    if (search) {
      // Add search logic here
      filter.name = { $like: `%${search}%` };
    }
    
    const result = await patientService.findAll({ 
      page: parseInt(page), 
      limit: parseInt(limit),
      filter 
    });
    
    res.paginate(
      result.data, 
      result.pagination.page, 
      result.pagination.limit, 
      result.pagination.total
    );
  })
);

/**
 * @route GET /api/patients/:id
 * @desc Get single patient by ID
 * @access Private (admin, provider, staff, patient-self)
 */
router.get('/:id',
  requirePermission('patients', 'read'),
  asyncErrorWrapper(async (req, res) => {
    const patient = await patientService.findById(req.params.id);
    res.success(patient, 'Patient retrieved successfully');
  })
);

/**
 * @route POST /api/patients
 * @desc Create new patient
 * @access Private (admin, staff)
 */
router.post('/',
  requirePermission('patients', 'create'),
  asyncErrorWrapper(async (req, res) => {
    const patient = await patientService.create(req.body);
    res.success(patient, 'Patient created successfully', 201);
  })
);

/**
 * @route PUT /api/patients/:id
 * @desc Update patient
 * @access Private (admin, provider, patient-self)
 */
router.put('/:id',
  requirePermission('patients', 'update'),
  asyncErrorWrapper(async (req, res) => {
    const patient = await patientService.update(req.params.id, req.body);
    res.success(patient, 'Patient updated successfully');
  })
);

/**
 * @route DELETE /api/patients/:id
 * @desc Delete patient (soft delete)
 * @access Private (admin only)
 */
router.delete('/:id',
  requirePermission('patients', 'delete'),
  asyncErrorWrapper(async (req, res) => {
    await patientService.delete(req.params.id, { soft: true });
    res.success(null, 'Patient deleted successfully');
  })
);

export default router;
