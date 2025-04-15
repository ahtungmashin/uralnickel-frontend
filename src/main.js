import { createApp } from 'vue';
import App from './App.vue';
import axios from 'axios';
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { startIdleTimer } from './utils/authWatcher';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import { createPinia } from 'pinia';
import api from '@/services/api';


const app = createApp(App);

app.config.globalProperties.$api = api;

const pinia = createPinia();

// Добавление токена ко всем запросам
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

app.config.globalProperties.$axios = axios;

app.use(pinia);
app.use(Toast); 
app.use(router);
app.mount('#app');

//Запуск слежения за бездействием (30 минут)
startIdleTimer(() => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}, 30 * 60 * 1000); // 30 минут
