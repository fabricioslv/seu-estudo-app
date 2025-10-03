
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

let socket;

export const initSocket = () => {
  // Evita múltiplas conexões
  if (socket) return;

  socket = io(SOCKET_URL);

  socket.on('connect', () => {
    console.log('Conectado ao servidor WebSocket!');
  });

  socket.on('disconnect', () => {
    console.log('Desconectado do servidor WebSocket.');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket não inicializado. Chame initSocket primeiro.");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (room) => {
  getSocket().emit('join_room', room);
};

export const sendMessage = (room, message, user) => {
  getSocket().emit('send_message', { room, message, user });
};

export const onReceiveMessage = (callback) => {
  getSocket().on('receive_message', callback);
};

export const offReceiveMessage = () => {
    getSocket().off('receive_message');
}
