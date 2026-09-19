import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { notifications } from '../services/api';
import { TOKEN_KEY } from './AuthContext';

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_ORIGIN.replace(/\/api$/, '');

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latest, setLatest] = useState(null);
  const socketRef = useRef(null);

  const refreshUnread = useCallback(async () => {
    try {
      const { data } = await notifications.unreadCount();
      setUnreadCount(data.count);
    } catch {
      // ignored — count refresh is best-effort
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return undefined;

    refreshUnread();

    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('[socket] connected');
    });
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect error', err.message);
    });
    socket.on('notification', (notification) => {
      setLatest(notification);
      setUnreadCount((prev) => (notification.read ? prev : prev + 1));
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refreshUnread]);

  const markAsRead = useCallback(
    async (id) => {
      await notifications.markAsRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    await notifications.markAllAsRead();
    setUnreadCount(0);
  }, []);

  const value = { unreadCount, latest, refreshUnread, markAsRead, markAllAsRead };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}