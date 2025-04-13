import axios from 'axios';
import router from '@/router';
import { useToast } from 'vue-toastification';

const toast = useToast();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
});

// ✅ Всегда вставляем токен, если есть
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ⚠️ Глобальный перехват ошибок
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const config = error.config || {};

    if (!error.response) {
      toast.error('Сервер не отвечает. Проверьте подключение к интернету.');
    } else if ((status === 401 || status === 403) && !config.__skipGlobalToast) {
      toast.error('Сессия истекла. Войдите снова.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      router.push('/login');
    } else if (status >= 500 && !config.__skipGlobalToast) {
      toast.error('Ошибка сервера. Повторите попытку позже.');
    } else if (message && !config.__skipGlobalToast) {
      toast.error(message);
    } else if (!config.__skipGlobalToast) {
      toast.error('Произошла ошибка.');
    }

    return Promise.reject(error);
  }
);

export default api;
