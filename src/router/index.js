import { createRouter, createWebHashHistory } from 'vue-router';

// 导入您的路由组件
// 例如: import Home from '../views/Home.vue';

const routes = [
  // 您的路由配置
  // 例如: { path: '/', name: 'Home', component: Home }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
