import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, ROLES } from '../middleware/auth.js';
import { getDatabase } from '../config/database.js';
import { AppError } from '../errors/AppError.js';
import { uploadLimiter } from '../middleware/rateLimiting.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'backend/uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random hash
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types for healthcare context
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`, 400, 'INVALID_FILE_TYPE'), false);
    }
  }
});

// Upload file endpoint
router.post('/upload',
  requireAuth,
  uploadLimiter, // Apply rate limiting to uploads
  upload.array('files', 5), // Allow up to 5 files
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded', 400, 'NO_FILES');
    }

    const db = getDatabase();
    const uploadedFiles = [];

    try {
      for (const file of req.files) {
        // Store file metadata in database
        const result = await db.query(`
          INSERT INTO files (
            original_name, filename, file_path, mime_type, 
            file_size, uploaded_by, uploaded_by_role,
            consultation_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *
        `, [
          file.originalname,
          file.filename,
          file.path,
          file.mimetype,
          file.size,
          req.user.id,
          req.user.role,
          req.body.consultationId || null
        ]);

        const fileRecord = result.rows[0];
        uploadedFiles.push({
          id: fileRecord.id,
          originalName: fileRecord.original_name,
          filename: fileRecord.filename,
          mimeType: fileRecord.mime_type,
          fileSize: fileRecord.file_size,
          uploadedAt: fileRecord.created_at
        });
      }

      res.status(201).json({
        success: true,
        data: uploadedFiles,
        message: `${uploadedFiles.length} file(s) uploaded successfully`
      });

    } catch (error) {
      // Clean up uploaded files if database insertion fails
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to delete file after error:', unlinkError);
        }
      }
      throw error;
    }
  })
);

// Get file by ID
router.get('/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const result = await db.query(`
      SELECT * FROM files WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }

    const file = result.rows[0];

    // Check access permissions
    const hasAccess = await checkFileAccess(db, file, req.user);
    if (!hasAccess) {
      throw new AppError('Access denied', 403, 'FILE_ACCESS_DENIED');
    }

    // Return file metadata (not the actual file)
    res.json({
      success: true,
      data: {
        id: file.id,
        originalName: file.original_name,
        filename: file.filename,
        mimeType: file.mime_type,
        fileSize: file.file_size,
        uploadedAt: file.created_at,
        uploadedBy: file.uploaded_by,
        consultationId: file.consultation_id
      }
    });
  })
);

// Download file endpoint
router.get('/:id/download',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const result = await db.query(`
      SELECT * FROM files WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }

    const file = result.rows[0];

    // Check access permissions
    const hasAccess = await checkFileAccess(db, file, req.user);
    if (!hasAccess) {
      throw new AppError('Access denied', 403, 'FILE_ACCESS_DENIED');
    }

    try {
      // Check if file exists on disk
      await fs.access(file.file_path);
      
      // Log file download for audit
      await db.query(`
        INSERT INTO file_access_logs (
          file_id, accessed_by, accessed_by_role, 
          access_type, accessed_at
        ) VALUES ($1, $2, $3, 'download', NOW())
      `, [file.id, req.user.id, req.user.role]);

      // Set appropriate headers and send file
      res.set({
        'Content-Type': file.mime_type,
        'Content-Disposition': `attachment; filename="${file.original_name}"`,
        'Content-Length': file.file_size
      });

      // Stream the file
      const fileStream = require('fs').createReadStream(file.file_path);
      fileStream.pipe(res);
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError('File not found on disk', 404, 'FILE_MISSING');
      }
      throw error;
    }
  })
);

// Delete file endpoint
router.delete('/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    
    const result = await db.query(`
      SELECT * FROM files WHERE id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }

    const file = result.rows[0];

    // Check if user can delete this file (owner or admin)
    if (file.uploaded_by !== req.user.id && req.user.role !== ROLES.ADMIN) {
      throw new AppError('Access denied', 403, 'DELETE_ACCESS_DENIED');
    }

    try {
      // Delete from database first
      await db.query('DELETE FROM files WHERE id = $1', [req.params.id]);
      
      // Then delete from disk
      try {
        await fs.unlink(file.file_path);
      } catch (unlinkError) {
        console.error('File deleted from DB but not from disk:', unlinkError);
      }

      // Log file deletion
      await db.query(`
        INSERT INTO file_access_logs (
          file_id, accessed_by, accessed_by_role, 
          access_type, accessed_at
        ) VALUES ($1, $2, $3, 'delete', NOW())
      `, [file.id, req.user.id, req.user.role]);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      throw new AppError('Failed to delete file', 500, 'DELETE_FAILED');
    }
  })
);

// List user's files
router.get('/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    const { limit = 20, offset = 0, consultationId } = req.query;

    let whereClause = 'WHERE uploaded_by = $1';
    let params = [req.user.id];
    let paramIndex = 2;

    if (consultationId) {
      whereClause += ` AND consultation_id = $${paramIndex}`;
      params.push(consultationId);
      paramIndex++;
    }

    const result = await db.query(`
      SELECT 
        id, original_name, filename, mime_type, file_size, 
        consultation_id, created_at
      FROM files 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Helper function to check file access permissions
async function checkFileAccess(db, file, user) {
  // Admin can access all files
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  // User can access their own files
  if (file.uploaded_by === user.id) {
    return true;
  }

  // If file is associated with a consultation, check access to that consultation
  if (file.consultation_id) {
    const consultationResult = await db.query(`
      SELECT patient_id, provider_id FROM consultations WHERE id = $1
    `, [file.consultation_id]);

    if (consultationResult.rows.length > 0) {
      const consultation = consultationResult.rows[0];
      
      // Patient can access files from their consultations
      if (user.role === ROLES.PATIENT && consultation.patient_id === user.id) {
        return true;
      }
      
      // Provider can access files from consultations they're handling
      if (user.role === ROLES.PROVIDER && consultation.provider_id === user.id) {
        return true;
      }
    }
  }

  return false;
}

export default router;
