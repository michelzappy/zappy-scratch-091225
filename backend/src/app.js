import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Import utilities
import logger from './utils/logger.js';

// Import middleware
import responseWrapper from './middleware/responseWrapper.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { auditLogger } from './middleware/auditLogger.js';
import { encryptRequest, decryptResponse, initializeEncryption } from './middleware/dataEncryption.js';
import { requireAuth, filterResponseData } from './middleware/accessControl.js';

// Import route handlers
import authRoutes from './routes/auth.js';
import patientsRoutes from './routes/patients.js';
import providersRoutes from './routes/providers.js';
import prescriptionsRoutes from './routes/prescriptions.js';
import consultationsRoutes from './routes/consultations.js';
import medicationsRoutes from './routes/medications.js';
import adminRoutes from './routes/admin.js';

// Create Express app
const app = express();

// Initialize encryption
if (process.env.NODE_ENV !== 'test') {
  initializeEncryption();
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global middleware (order matters!)
app.use(responseWrapper); // Standardize responses
app.use(auditLogger); // Audit PHI access
app.use(encryptRequest); // Encrypt incoming PHI
app.use(decryptResponse); // Decrypt outgoing PHI
app.use(filterResponseData()); // Filter based on roles

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.success({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes (add authentication as needed)
app.use('/api/auth', authRoutes);
app.use('/api/patients', requireAuth(['admin', 'provider', 'staff']), patientsRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/prescriptions', requireAuth(['admin', 'provider']), prescriptionsRoutes);
app.use('/api/consultations', requireAuth(), consultationsRoutes);
app.use('/api/medications', requireAuth(), medicationsRoutes);

// Admin routes
app.use('/api/admin', requireAuth('admin'), adminRoutes);

// Error handling (must be last!)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
