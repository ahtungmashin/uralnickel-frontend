import { defineStore } from 'pinia';
import api from '@/services/api';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    unreadCount: 0,
    notifications: []
  }),

  actions: {
    // Установить точное количество
    setUnread(count) {
      this.unreadCount = count;
    },

    // Увеличить счётчик (по сокету)
    increment() {
      this.unreadCount++;
    },

    // Загрузить все уведомления
    async fetchNotifications() {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('[notificationStore] ⛔ fetchNotifications пропущен: токен отсутствует');
        return;
      }

      try {
        const res = await api.get('/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.notifications = res.data;
        this.unreadCount = res.data.filter(n => !n.read).length;
      } catch (err) {
        console.error('[notificationStore] Ошибка при получении уведомлений:', err);
      }
    },

    // Сброс состояния при logout
    $reset() {
      this.unreadCount = 0;
      this.notifications = [];
    }
  }
});
