<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="title">Авторизация</h2>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            class="input"
            placeholder="Введите email"
            autofocus
          />
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            class="input"
            placeholder="Введите пароль"
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { useToast } from 'vue-toastification';
import { useNotificationStore } from '@/stores/notificationStore';

export default {
  data() {
    return {
      email: '',
      password: '',
      isLoading: false
    };
  },
  methods: {
    async login() {
      const toast = useToast();
      const store = useNotificationStore(); // 📦 Store уведомлений
      this.isLoading = true;

      try {
        const response = await this.$api.post(
          '/auth/login',
          {
            email: this.email,
            password: this.password
          },
          {
            __skipGlobalToast: true
          }
        );

        const { token, user } = response.data;

        // ✅ Сохраняем токен и пользователя
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        // 🔄 Сбрасываем уведомления предыдущего пользователя
        store.$reset();

        // 🔔 Загружаем уведомления для текущего
        await store.fetchNotifications();

        // ✅ Перенаправляем
        this.$router.push('/');
      } catch (error) {
        const status = error.response?.status;
        const msg = error.response?.data?.message || 'Произошла ошибка при входе.';

        if (status === 401) {
          toast.error('Неверный email или пароль');
        } else {
          toast.error(msg);
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-page {
  background: #f3f4f6;
  min-height: 100vh;
  display: flex;
  align-items: flex-start; /* ← сдвигаем вверх */
  justify-content: center;
  font-family: 'Inter', sans-serif;
  padding: 60px 20px 20px;
}

.login-card {
  background: #ffffff;
  padding: 48px 36px;
  border-radius: 16px;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 28px;
  color: #111827;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.input {
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  background: white;
}

.btn-primary {
  width: 100%;
  background: linear-gradient(to right, #2563eb, #1d4ed8);
  color: white;
  font-weight: 600;
  padding: 14px;
  font-size: 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s ease;
}

.btn-primary:hover {
  background: linear-gradient(to right, #1e40af, #1d4ed8);
}
</style>
