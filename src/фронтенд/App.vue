<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useNotificationStore } from './stores/notificationStore';
import { useToast } from 'vue-toastification';
import { startNotificationWatcher, stopNotificationWatcher } from './utils/notificationWatcher';

const route = useRoute();
const notificationStore = useNotificationStore();
const toast = useToast();

// Проверяем, страница ли логина
const isLoginPage = computed(() => route.path === '/login');

// 🧑 Определяем менеджера по сохранённому пользователю
const user = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
});
const isManager = computed(() => user.value?.role === 'manager');

// 📦 Слежение за количеством уведомлений
watch(
  () => notificationStore.unreadCount,
  (val) => {
    console.log('📦 [Pinia] unreadCount изменился:', val);
  }
);

// 👀 Прокрутка для хедера/футера
const showHeader = ref(true);
const showFooter = ref(false);
const lastScrollY = ref(0);

const handleScroll = () => {
  const currentScroll = window.scrollY;
  showHeader.value = currentScroll < lastScrollY.value || currentScroll < 50;
  showFooter.value = window.innerHeight + currentScroll >= document.body.scrollHeight - 50;
  lastScrollY.value = currentScroll;
};

// 🧩 Переключение вотчера уведомлений
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });

  watch(
    () => route.path,
    (path) => {
      const token = localStorage.getItem('authToken');

      if (path === '/login' || !token) {
        console.log('[Watcher] ⏹ Остановлен (login или нет токена)');
        stopNotificationWatcher();
      } else {
        console.log('[Watcher] ▶️ Запущен');
        startNotificationWatcher({ store: notificationStore, toast });
      }
    },
    { immediate: true }
  );
});
</script>


<template>
  <div id="app">
    <!-- Бренд при логине -->
    <div v-if="isLoginPage" class="login-brand">
      <h1 class="login-title">UralNickel</h1>
    </div>

    <!-- Навигационная шапка -->
    <header v-if="!isLoginPage" class="main-header" :class="{ visible: showHeader }">
      <div class="header-content">
        <div class="logo">UralNickel</div>
        <nav>
          <router-link to="/">Главная</router-link>
          <router-link to="/courses">Курсы</router-link>
          <router-link to="/projects">Проекты</router-link>

          <router-link to="/notifications" class="nav-link notification-link">
            Уведомления
            <span v-if="notificationStore.unreadCount > 0" class="badge">
              {{ notificationStore.unreadCount }}
            </span>
            🔔
          </router-link>

          <router-link v-if="isManager" to="/manager/requests">Заявки</router-link>
          <router-link to="/profile">Профиль</router-link>
        </nav>
      </div>
    </header>

    <!-- Контент -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Футер -->
    <footer v-if="!isLoginPage" class="main-footer" :class="{ visible: showFooter }">
      <div class="footer-container">
        <p>© 2025 УралНикель. Все права защищены.</p>
        <p class="footer-links">
          <router-link to="/">Главная</router-link> ·
          <router-link to="/courses">Курсы</router-link> ·
          <router-link to="/about">О компании</router-link>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* === Логотип на login === */
.login-brand {
  text-align: center;
  margin-top: 60px;
  margin-bottom: -20px;
}
.login-title {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  font-family: 'Inter', sans-serif;
}

/* === Уведомления === */
.notification-link {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.badge {
  font-size: 13px;
  font-weight: 700;
  color: #1e3a8a;
  background: #facc15;
  padding: 2px 8px;
  border-radius: 12px;
}

/* === Общий стиль === */
html, body {
  overscroll-behavior-y: contain;
  scroll-behavior: smooth;
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  width: 100%;
  min-width: 320px;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f0f4ff;
  color: #1e293b;
}

/* === Шапка === */
.main-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #e0e7ff;
  padding: 20px 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.4s ease, opacity 0.4s ease;
  transform: translateY(-100%);
  opacity: 0;
}
.main-header.visible {
  transform: translateY(0);
  opacity: 1;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 16px;
  box-sizing: border-box;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: #1e3a8a;
  letter-spacing: 1px;
}

nav {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

nav a {
  font-size: 17px;
  font-weight: 600;
  color: #1e3a8a;
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
}
nav a.router-link-exact-active {
  color: #f97316;
}
nav a:hover {
  color: #ea580c;
}

/* === Контент === */
.main-content {
  flex: 1;
  padding: 30px 20px 60px;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* === Футер === */
.main-footer {
  background-color: #e6f0ff;
  padding: 30px 20px;
  color: #1e3a8a;
  font-size: 14px;
  text-align: center;
  border-top: 1px solid #dbeafe;
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.5s ease, opacity 0.5s ease;
}
.main-footer.visible {
  transform: translateY(0);
  opacity: 1;
}

.footer-container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 12px;
  box-sizing: border-box;
}

.footer-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.footer-links a {
  color: #1e3a8a;
  text-decoration: none;
  font-weight: 100;
}
.footer-links a:hover {
  text-decoration: underline;
}

/* === Мобильная адаптация === */
@media (max-width: 768px) {
  .main-header {
    padding: 16px;
  }

  .logo {
    font-size: 20px;
  }

  nav {
    flex-direction: row;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 10px;
  }

  nav a {
    font-size: 15px;
  }

  .main-content {
    padding: 20px 16px 40px;
  }

  .footer-links {
    font-size: 13px;
  }
}
</style>
