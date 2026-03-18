import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';

// 路由守卫：验证登录状态
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    next();
  } else {
    next('/login');
  }
};

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard, beforeEnter: requireAuth }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
