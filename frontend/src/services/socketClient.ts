import { io, Socket } from 'socket.io-client';

interface SocketEvents {
  'complaint.created': (data: { complaint: any; timestamp: string }) => void;
  'complaint.assigned': (data: { complaint: any; officerId: number; timestamp: string }) => void;
  'complaint.status_updated': (data: { complaint: any; oldStatus: string; newStatus: string; timestamp: string }) => void;
  'complaint.escalated': (data: { complaint: any; escalationReason: string; timestamp: string }) => void;
  'complaint.resolved': (data: { complaint: any; timestamp: string }) => void;
  'join-room': (room: string) => void;
  'leave-room': (room: string) => void;
}

class SocketClientService {
  private socket: Socket<SocketEvents> | null = null;
  // private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  // Connect to Socket.IO server
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // this.token = token;

      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
      }

      // Create new socket connection
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      // Connection events
      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected, reconnect manually
          this.socket?.connect();
        }
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  // Disconnect from Socket.IO server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    // this.token = null;
    this.listeners.clear();
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Join a room
  joinRoom(room: string): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit('join-room', room);
    }
  }

  // Leave a room
  leaveRoom(room: string): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit('leave-room', room);
    }
  }

  // Set up event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Complaint events
    this.socket.on('complaint.created', (data) => {
      this.emitToListeners('complaint.created', data);
    });

    this.socket.on('complaint.assigned', (data) => {
      this.emitToListeners('complaint.assigned', data);
    });

    this.socket.on('complaint.status_updated', (data) => {
      this.emitToListeners('complaint.status_updated', data);
    });

    this.socket.on('complaint.escalated', (data) => {
      this.emitToListeners('complaint.escalated', data);
    });

    this.socket.on('complaint.resolved', (data) => {
      this.emitToListeners('complaint.resolved', data);
    });
  }

  // Add event listener
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    const eventKey = event as string;
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, []);
    }
    this.listeners.get(eventKey)?.push(callback);
  }

  // Remove event listener
  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    const eventKey = event as string;
    const callbacks = this.listeners.get(eventKey);
    if (callbacks) {
      const index = callbacks.indexOf(callback as Function);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit to all registered listeners
  private emitToListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }

  // Fallback polling for when socket fails
  private pollInterval: NodeJS.Timeout | null = null;
  private lastPollTime = 0;

  startPolling(callback: () => void, interval: number = 30000): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      if (!this.isConnected()) {
        callback();
        this.lastPollTime = Date.now();
      }
    }, interval);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Get time since last poll
  getTimeSinceLastPoll(): number {
    return this.lastPollTime ? Date.now() - this.lastPollTime : 0;
  }
}

// Singleton instance
export const socketClient = new SocketClientService();
