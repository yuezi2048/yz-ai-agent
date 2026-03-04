import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/pages/HomePage.vue';
import LoveMasterPage from '@/pages/LoveMasterPage.vue';
import SuperManusPage from '@/pages/SuperManusPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/love', name: 'love', component: LoveMasterPage },
    { path: '/manus', name: 'manus', component: SuperManusPage },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
});

export default router;
