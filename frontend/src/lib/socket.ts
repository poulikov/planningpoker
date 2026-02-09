import { io, Socket } from 'socket.io-client';
import { config } from './config';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // In production with nginx proxy, use current host (empty string)
    // In development, use configured wsUrl
    const wsUrl = config.wsUrl || window.location.host;
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
