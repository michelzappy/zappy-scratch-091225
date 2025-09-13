import { supabase } from '../config/auth.js';
import { getDatabase } from '../config/database.js';
import { consultations } from '../models/index.js';
import { eq } from 'drizzle-orm';

export function setupSocketHandlers(io) {
  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // If Supabase is configured, verify token
      if (supabase) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          return next(new Error('Authentication error: Invalid token'));
        }
        
        socket.userId = user.id;
        socket.userRole = user.user_metadata?.role || 'patient';
      } else {
        // Development mode without Supabase
        socket.userId = 'dev-user-id';
        socket.userRole = 'patient';
      }
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Handle joining consultation rooms
    socket.on('join_consultation', async (consultationId) => {
      try {
        // Verify user has access to this consultation
        const hasAccess = await verifyConsultationAccess(consultationId, socket.userId, socket.userRole);
        
        if (hasAccess) {
          socket.join(`consultation_${consultationId}`);
          console.log(`User ${socket.userId} joined consultation ${consultationId}`);
          
          // Notify others in the consultation
          socket.to(`consultation_${consultationId}`).emit('user_joined_consultation', {
            userId: socket.userId,
            userRole: socket.userRole,
            timestamp: new Date()
          });
        } else {
          socket.emit('error', { message: 'Access denied to consultation' });
        }
      } catch (error) {
        console.error('Join consultation error:', error);
        socket.emit('error', { message: 'Failed to join consultation' });
      }
    });

    // Handle leaving consultation rooms
    socket.on('leave_consultation', (consultationId) => {
      socket.leave(`consultation_${consultationId}`);
      console.log(`User ${socket.userId} left consultation ${consultationId}`);
      
      // Notify others in the consultation
      socket.to(`consultation_${consultationId}`).emit('user_left_consultation', {
        userId: socket.userId,
        userRole: socket.userRole,
        timestamp: new Date()
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      socket.to(`consultation_${data.consultationId}`).emit('user_typing', {
        userId: socket.userId,
        userRole: socket.userRole,
        isTyping: true,
        timestamp: new Date()
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`consultation_${data.consultationId}`).emit('user_typing', {
        userId: socket.userId,
        userRole: socket.userRole,
        isTyping: false,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.userId} (${reason})`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
}

// Helper function to verify consultation access
async function verifyConsultationAccess(consultationId, userId, userRole) {
  try {
    const db = getDatabase();
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, consultationId))
      .limit(1);

    if (!consultation) return false;

    if (userRole === 'patient') {
      return consultation.patientId === userId;
    }

    if (userRole === 'provider') {
      return consultation.providerId === userId;
    }

    if (userRole === 'admin') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Consultation access verification error:', error);
    return false;
  }
}
