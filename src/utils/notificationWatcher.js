import { io } from 'socket.io-client';

let socket = null;
let intervalId = null;
let watcherStarted = false;

export function startNotificationWatcher({ store, toast }) {
  if (watcherStarted) return;
  watcherStarted = true;

  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id || !token) return;

  socket = io('http://localhost:5000', {
    auth: { token }
  });

  const channel = `notification-${user.id}`;

  socket.off(channel);
  socket.on(channel, (notification) => {
    console.log('[SOCKET] ✅ Новое уведомление:', notification);
    toast.info(notification?.title || notification?.message || '🔔 Уведомление', {
      timeout: 5000
    });
    store?.increment();
  });

  // 🔄 Первый fetch
  store.fetchNotifications();

  // ⏱ Интервал автообновления
  intervalId = setInterval(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('[Watcher] ⛔ Прерываем fetchNotifications — токен отсутствует');
      return;
    }
    store.fetchNotifications();
  }, 5000);
}

export function stopNotificationWatcher() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Watcher] ⏹ Интервал остановлен');
  }

  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Watcher] ⛔ Socket отключён');
  }

  watcherStarted = false;
}
