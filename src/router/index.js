import { createRouter, createWebHistory } from 'vue-router';
import { setupGuards } from './guards'; // 👈 наш новый файл

// Views
import Home from '../views/HomeView.vue';
import About from '../views/AboutView.vue';
import Profile from '../views/ProfileView.vue';
import Courses from '../views/CoursesView.vue';
import Login from '../views/LoginView.vue';
import CourseDetails from '../views/CourseDetails.vue';
import ProjectsView from '../views/ProjectsView.vue';
import ManagerRequestsView from '../views/ManagerRequestsView.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/about', component: About, meta: { requiresAuth: true } },
  { path: '/courses', component: Courses, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/courses/:id', component: CourseDetails, meta: { requiresAuth: true } },
  { path: '/projects', name: 'Projects', component: ProjectsView },
  { path: '/admin/news', name: 'AdminNews', component: () => import('../views/AdminNews.vue'), meta: { requiresAuth: true, requiresAdmin: true }},
  { path: '/admin/projects', name: 'AdminProjects', component: () => import('../views/AdminProjectsView.vue'), meta: { requiresAuth: true, requiresAdmin: true }},
  { path: '/admin/courses', name: 'AdminCourse', component: () => import('../views/EditCourse.vue'), meta: { requiresAuth: true, requiresAdmin: true }},
  { path: '/manager/requests', component: ManagerRequestsView, meta: { requiresAuth: true, requiresManager: true }},
  { path: '/notifications', name: 'Notifications', component: () => import('@/views/NotificationsView.vue'), meta: { requiresAuth: true }}
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

setupGuards(router); // 👈 устанавливаем навигационные правила

export default router;
