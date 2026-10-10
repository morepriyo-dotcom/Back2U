import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { NotificationItem } from '../types';
import { firebaseDbService } from '../services/firebase';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Attach real-time Firebase Firestore listener if configured
    let unsubscribeFirestore: (() => void) | undefined;
    if (firebaseDbService.isConfigured && user?.id) {
      try {
        unsubscribeFirestore = firebaseDbService.subscribeUserNotifications(user.id, (liveNotifs) => {
          if (liveNotifs && liveNotifs.length > 0) {
            // Live Firestore update received -> refresh list
            fetchNotifications();
          }
        });
      } catch (err) {
        console.warn('[Firebase] Notification subscription deferred:', err);
      }
    }

    const interval = setInterval(fetchNotifications, 15000);
    return () => {
      clearInterval(interval);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [isAuthenticated, user?.id]);

  const markAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
