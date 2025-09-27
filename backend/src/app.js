const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import utilities
const logger = require('./utils/logger');

// Import middleware
const responseWrapper = require('./middleware/responseWrapper');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { auditLogger } = require('./middleware/auditLogger');
const { encryptRequest, decryptResponse, initializeEncryption } = require('./middleware/dataEncryption');
const { requireAuth, filterResponseData } = require('./middleware/accessControl');

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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', requireAuth(), require('./routes/users'));
app.use('/api/patients', requireAuth(['admin', 'provider', 'staff']), require('./routes/patients'));
app.use('/api/appointments', requireAuth(), require('./routes/appointments'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/records', requireAuth(['admin', 'provider']), require('./routes/records'));
app.use('/api/prescriptions', requireAuth(['admin', 'provider']), require('./routes/prescriptions'));

// Admin routes
app.use('/api/admin', requireAuth('admin'), require('./routes/admin'));

// Error handling (must be last!)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
