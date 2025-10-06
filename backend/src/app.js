import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
config();

// Import utilities
import logger from './utils/logger.js';

// Import middleware
import responseWrapper from './middleware/responseWrapper.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { auditLogger } from './middleware/auditLogger.js';
import { encryptRequest, decryptResponse, initializeEncryption } from './middleware/dataEncryption.js';
import { requireAuth, filterResponseData } from './middleware/accessControl.js';
import { verifyStackAuth } from './config/stackAuth.js';
// Initialize Redis (non-blocking)
import { setupRedis } from './config/redis.js';
setupRedis().then(() => {
  console.log('Redis setup completed');
}).catch(error => {
  console.log('Redis setup failed:', error.message);
});

// Import route handlers

// Import route handlers
import authRoutes from './routes/auth.js';
import patientsRoutes from './routes/patients.js';
import providersRoutes from './routes/providers.js';
import prescriptionsRoutes from './routes/prescriptions.js';
import consultationsRoutes from './routes/consultations.js';
import medicationsRoutes from './routes/medications.js';
import ordersRoutes from './routes/orders.js';
import messagesRoutes from './routes/messages.js';
import filesRoutes from './routes/files.js';
import webhooksRoutes from './routes/webhooks.js';
import refillCheckinsRoutes from './routes/refill-checkins.js';
import treatmentPlansRoutes from './routes/treatment-plans.js';
import comprehensiveHealthRoutes from './routes/comprehensive-health.js';
import aiConsultationRoutes from './routes/ai-consultation.js';
import providerConsultationsRoutes from './routes/provider-consultations.js';
import adminRoutes from './routes/admin.js';
import adminPatientsRoutes from './routes/admin-patients.js';
import authHealthRoutes from './routes/auth-health.js';

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
// app.use(auditLogger); // Audit PHI access
// app.use(encryptRequest); // Encrypt incoming PHI
// app.use(decryptResponse); // Decrypt outgoing PHI

// Stack Auth middleware - must come before routes that need authentication
// This will attach req.user to the request if authenticated
app.use(verifyStackAuth);

// app.use(filterResponseData()); // Filter based on roles

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
// Note: Patient routes handle their own auth per-endpoint to allow patients to access their own data
app.use('/api/patients', patientsRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/prescriptions', requireAuth(['admin', 'provider']), prescriptionsRoutes);
app.use('/api/consultations', requireAuth(), consultationsRoutes);
app.use('/api/medications', requireAuth(), medicationsRoutes);

app.use('/api/orders', requireAuth(), ordersRoutes);
app.use('/api/messages', requireAuth(), messagesRoutes);
app.use('/api/files', requireAuth(), filesRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/refill-checkins', requireAuth(), refillCheckinsRoutes);
app.use('/api/treatment-plans', requireAuth(), treatmentPlansRoutes);
app.use('/api/comprehensive-health', requireAuth(), comprehensiveHealthRoutes);
app.use('/api/ai-consultation', requireAuth(), aiConsultationRoutes);
app.use('/api/provider-consultations', requireAuth(['admin', 'provider']), providerConsultationsRoutes);
app.use('/api/admin', requireAuth(['admin']), adminRoutes);
app.use('/api/admin-patients', requireAuth(['admin']), adminPatientsRoutes);
app.use('/api/auth-health', authHealthRoutes);

// Error handling (must be last!)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  // Add global error handlers
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  const PORT = process.env.PORT || 5001;
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  }).on('error', (error) => {
    logger.error('Server failed to start:', error);
    process.exit(1);
  });
}

export default app;
