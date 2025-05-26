export function setupGuards(router) {
  router.beforeEach((to, from, next) => {
    const requiresAuth = to.meta.requiresAuth;
    const requiresAdmin = to.meta.requiresAdmin;
    const requiresManager = to.meta.requiresManager;

    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    let role = null;
    try {
      role = userData ? JSON.parse(userData).role : null;
    } catch {
      role = null;
    }

    if (requiresAuth && !token) {
      return next('/login');
    }

    if (requiresAdmin && role !== 'admin') {
      return next('/');
    }

    if (requiresManager && role !== 'manager') {
      return next('/');
    }

    if (to.path === '/login' && token) {
      return next('/');
    }

    next();
  });
}
