import { io, Socket } from 'socket.io-client';

const socket: Socket = io('wss://lije-care-api-dev.zikollab.com', {
  transports: ['websocket'],
});

export default socket;