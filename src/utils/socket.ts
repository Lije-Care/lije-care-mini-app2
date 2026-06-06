import { io, Socket } from 'socket.io-client';

const resolveSocketUrl = () => {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (explicitSocketUrl) {
    return explicitSocketUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (!apiUrl) {
    return window.location.origin;
  }

  const parsed = new URL(apiUrl);
  parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  parsed.pathname = '';
  parsed.search = '';
  parsed.hash = '';

  return parsed.toString().replace(/\/$/, '');
};

const socket: Socket = io(resolveSocketUrl(), {
  transports: ['websocket'],
});

export default socket;
