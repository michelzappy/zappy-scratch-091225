import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import messageRoutes from './routes/message.routes.js';
import providerRoutes from './routes/provider.routes.js';
import patientRoutes from './routes/patient.routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads (in development)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply rate limiting to all routes
app.use('/api', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/patients', patientRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`New socket connection: ${socket.id}`);

  // Join consultation room
  socket.on('join_consultation', (consultationId) => {
    socket.join(`consultation_${consultationId}`);
    logger.info(`Socket ${socket.id} joined consultation ${consultationId}`);
  });

  // Leave consultation room
  socket.on('leave_consultation', (consultationId) => {
    socket.leave(`consultation_${consultationId}`);
    logger.info(`Socket ${socket.id} left consultation ${consultationId}`);
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    const { consultationId, message } = data;
    // Emit to all clients in the consultation room
    io.to(`consultation_${consultationId}`).emit('new_message', message);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { consultationId, userId, isTyping } = data;
    socket.to(`consultation_${consultationId}`).emit('user_typing', {
      userId,
      isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

// Export for testing
export { app, io };
