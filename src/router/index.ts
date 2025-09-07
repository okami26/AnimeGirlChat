import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import InputPage from '../views/InputPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/input' }, // <--- редирект на input
  { path: '/input', name: 'InputPage', component: InputPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
