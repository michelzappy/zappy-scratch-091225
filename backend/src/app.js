import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import configurations
import { connectDatabase } from './config/database.js';
import { setupRedis } from './config/redis.js';

// Import middleware
import { globalErrorHandler } from './middleware/errorHandler.js';
import { hipaaAuditLogger } from './middleware/hipaaAudit.js';
import { generalLimiter } from './middleware/rateLimiting.js';
import { startSessionCleanup } from './middleware/hipaaSession.js';

// Import routes
import authRoutes from './routes/auth.js';
import consultationRoutes from './routes/consultations.js';
import messageRoutes from './routes/messages.js';
import patientRoutes from './routes/patients.js';
import providerRoutes from './routes/providers.js';
import providerConsultationRoutes from './routes/provider-consultations.js';
import orderRoutes from './routes/orders.js';
import prescriptionRoutes from './routes/prescriptions.js';
import medicationRoutes from './routes/medications.js';
import fileRoutes from './routes/files.js';
import adminRoutes from './routes/admin.js';
import adminPatientsRoutes from './routes/admin-patients.js';
import webhookRoutes from './routes/webhooks.js';
import treatmentPlanRoutes from './routes/treatment-plans.js';
import aiConsultationRoutes from './routes/ai-consultation.js';
import authHealthRoutes from './routes/auth-health.js';

// Import socket handlers
import { setupSocketHandlers } from './sockets/index.js';

// Load environment variables
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make io available globally
app.set('io', io);

// Basic middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ["http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Webhook routes (before rate limiting and audit logging)
// These routes need raw body parsing and different middleware
app.use('/webhooks', webhookRoutes);

// Rate limiting
app.use(generalLimiter);

// HIPAA audit logging (must be before routes)
app.use(hipaaAuditLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth-system', authHealthRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/provider/consultations', providerConsultationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/patients', adminPatientsRoutes);
app.use('/api/treatment-plans', treatmentPlanRoutes);
app.use('/api/ai-consultation', aiConsultationRoutes);

// Frontend compatibility routes (without /api prefix)
// These provide compatibility for frontend requests expecting routes without /api prefix
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);
app.use('/consultations', consultationRoutes);
app.use('/messages', messageRoutes);
app.use('/orders', orderRoutes);
app.use('/providers', providerRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Try to connect to database (optional)
    try {
      await connectDatabase();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.warn('⚠️  Database connection failed - running without database:', dbError.message);
      console.log('ℹ️  API will run with limited functionality');
    }

    // Try to setup Redis (optional)
    try {
      await setupRedis();
      console.log('✅ Redis connected successfully');
    } catch (redisError) {
      console.warn('⚠️  Redis connection failed - running without Redis:', redisError.message);
      console.log('ℹ️  Sessions and caching will not be available');
    }

    // Setup Socket.io handlers
    setupSocketHandlers(io);
    console.log('✅ Socket.io handlers initialized');

    // Start HIPAA session cleanup
    const sessionCleanupStop = startSessionCleanup();
    console.log('✅ HIPAA session management initialized');
    
    // Store cleanup function for graceful shutdown
    app.set('sessionCleanupStop', sessionCleanupStop);

    // Start server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔒 Authentication Health: http://localhost:${PORT}/api/auth-system/health`);
      console.log(`🛡️  Enhanced Security: ${process.env.ENABLE_ENHANCED_AUTH !== 'false' ? 'Enabled' : 'Disabled'}`);
      console.log(`📋 HIPAA Sessions: ${process.env.ENABLE_HIPAA_SESSIONS !== 'false' ? 'Enabled' : 'Disabled'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}, shutting down gracefully`);
  
  // Stop session cleanup
  const sessionCleanupStop = app.get('sessionCleanupStop');
  if (sessionCleanupStop) {
    sessionCleanupStop();
    console.log('✅ Session cleanup stopped');
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the application
startServer();

export { app, io };
