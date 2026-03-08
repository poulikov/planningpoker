import { io, Socket } from 'socket.io-client';
import { config } from './config';

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const getSocket = (): Socket => {
  if (!socket) {
    // In production with nginx proxy, use relative URL (same origin)
    // In development, use configured wsUrl
    const wsUrl = config.wsUrl || window.location.origin;
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Start heartbeat when socket connects
    socket.on('connect', () => {
      console.log('[Socket] Connected, starting heartbeat');
      startHeartbeat();
    });

    // Stop heartbeat when socket disconnects
    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected, stopping heartbeat');
      stopHeartbeat();
    });
  }
  return socket;
};

const startHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  heartbeatInterval = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit('ping');
      console.log('[Socket] Heartbeat sent');
    }
  }, HEARTBEAT_INTERVAL);
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

export const disconnectSocket = () => {
  stopHeartbeat();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
