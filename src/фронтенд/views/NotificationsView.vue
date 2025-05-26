<template>
  <div class="notifications-page">
    <h1 class="page-title">Уведомления</h1>

    <div class="toolbar" v-if="notifications.length">
      <select v-model="filter" class="filter-select">
        <option value="all">Все</option>
        <option value="unread">Непрочитанные</option>
      </select>
      <button v-if="notifications.some(n => !n.read)" @click="markAllAsRead" class="btn-read-all">
        Пометить все как прочитанные
      </button>
    </div>

    <transition-group name="fade" tag="div" class="notifications-list" v-if="filteredNotifications.length">
      <div
        v-for="notification in sortedNotifications"
        :key="notification.id"
        class="notification-card"
        :class="{ unread: !notification.read }"
        @click="markAsRead(notification.id)"
      >
        <div class="header">
          <h3 class="title">
            <span class="emoji">{{ resolveIcon(notification.title) }}</span>
            {{ notification.title || 'Уведомление' }}
          </h3>
          <span class="date">{{ formatDate(notification.createdAt) }}</span>
        </div>
        <p class="message">{{ notification.message }}</p>
        <div v-if="notification.link" class="action">
          <!-- Внешняя ссылка (http/https) -->
          <a
            v-if="notification.link.startsWith('http')"
            :href="notification.link"
            class="link-button"
            target="_blank"
            rel="noopener noreferrer"
          >
            Перейти
          </a>

          <!-- Внутренняя ссылка -->
          <router-link
            v-else
            :to="notification.link"
            class="link-button"
          >
            Перейти
          </router-link>
        </div>
      </div>
    </transition-group>

    <div v-else class="no-notifications">
      <p>У вас нет {{ filter === 'unread' ? 'непрочитанных' : 'новых' }} уведомлений.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationsView',
  data() {
    return {
      notifications: [],
      filter: 'all',
      pollingInterval: null
    };
  },
  computed: {
    filteredNotifications() {
      return this.filter === 'unread'
        ? this.notifications.filter(n => !n.read)
        : this.notifications;
    },
    sortedNotifications() {
      return [...this.filteredNotifications].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
  },
  created() {
    this.fetchNotifications();
    this.pollingInterval = setInterval(this.fetchNotifications, 10000);
  },
  beforeUnmount() {
    clearInterval(this.pollingInterval);
  },
  methods: {
    async fetchNotifications() {
      try {
        const token = localStorage.getItem('authToken');
        const res = await this.$api.get('/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.notifications = res.data;
      } catch (err) {
        console.error('Ошибка при загрузке уведомлений:', err);
      }
    },
    async markAsRead(id) {
      try {
        await this.$api.patch(`/notifications/${id}/read`);
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.read = true;
      } catch (err) {
        console.error('Ошибка при отметке уведомления как прочитанного:', err);
      }
    },
    async markAllAsRead() {
      try {
        await Promise.all(
          this.notifications.filter(n => !n.read).map(n =>
            this.$api.patch(`/notifications/${n.id}/read`)
          )
        );
        this.notifications.forEach(n => (n.read = true));
      } catch (err) {
        console.error('Ошибка при массовой отметке уведомлений:', err);
      }
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    resolveIcon(title) {
      if (!title) return '🔔';
      if (title.includes('подтверждена')) return '✅';
      if (title.includes('отклонена')) return '❌';
      if (title.includes('Заявка')) return '📩';
      if (title.includes('курс')) return '📚';
      if (title.includes('проект')) return '🛠️';
      return '🔔';
    }
  }
};
</script>

<style scoped>
.notifications-page {
  max-width: 850px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
  color: #1e3a8a;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.btn-read-all {
  background: linear-gradient(to right, #10b981, #059669);
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.notification-card {
  background: #ffffff;
  border-left: 5px solid #2563eb;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.notification-card.unread {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.emoji {
  margin-right: 6px;
}

.date {
  font-size: 13px;
  color: #6b7280;
}

.message {
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
}

.action {
  margin-top: 8px;
}

.link-button {
  background: linear-gradient(to right, #2563eb, #1d4ed8);
  padding: 8px 14px;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s ease;
}

.link-button:hover {
  background: linear-gradient(to right, #1e40af, #1d4ed8);
}

.no-notifications {
  text-align: center;
  font-size: 16px;
  color: #6b7280;
  margin-top: 40px;
}

/* Анимация */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
@media (max-width: 768px) {
  .notifications-page {
    padding: 20px 16px;
    margin: 20px auto;
  }

  .page-title {
    font-size: 22px;
    margin-bottom: 16px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-select,
  .btn-read-all {
    width: 100%;
    font-size: 15px;
  }

  .btn-read-all {
    padding: 10px 16px;
  }

  .notification-card {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .title {
    font-size: 16px;
  }

  .date {
    font-size: 12px;
  }

  .message {
    font-size: 14px;
  }

  .link-button {
    width: 100%;
    text-align: center;
    font-size: 15px;
    padding: 10px;
  }

  .no-notifications {
    font-size: 15px;
    margin-top: 30px;
  }
}
</style>
