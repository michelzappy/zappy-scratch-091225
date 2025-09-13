import { io, Socket } from 'socket.io-client';
import { authService } from './auth';

class SocketManager {
  private socket: Socket | null = null;
  private isConnecting = false;

  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.socket?.connected) {
            resolve(this.socket);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;

    try {
      // Get access token from our auth service
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('No auth token available');
      }

      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        retries: 3,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        this.socket!.on('connect', () => resolve());
        this.socket!.on('connect_error', reject);
      });

      return this.socket;
    } catch (error) {
      console.error('Socket connection failed:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Consultation room management
  joinConsultation(consultationId: string) {
    this.socket?.emit('join_consultation', consultationId);
  }

  leaveConsultation(consultationId: string) {
    this.socket?.emit('leave_consultation', consultationId);
  }

  // Typing indicators
  startTyping(consultationId: string) {
    this.socket?.emit('typing_start', { consultationId });
  }

  stopTyping(consultationId: string) {
    this.socket?.emit('typing_stop', { consultationId });
  }
}

export const socketManager = new SocketManager();
