import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import InputPage from '../views/InputPage.vue'
import Test from '@/views/Test.vue'
import Menu from '@/views/Menu.vue'

const Catalog = { template: '<div><h1>Каталог (заглушка)</h1></div>' }
const Tasks = { template: '<div><h1>Задания (заглушка)</h1></div>' }
const Tokens = { template: '<div><h1>Ваши токены (заглушка)</h1></div>' }
const Subscribe = { template: '<div><h1>Подписка (заглушка)</h1></div>' }

// const Menu = { template: '<div><h1>Меню (заглушка)</h1></div>' }

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/input' }, // <--- редирект на input
  { path: '/input', name: 'InputPage', component: InputPage },
]

// const routes: RouteRecordRaw[] = [
//   { path: '/', redirect: '/test' },
//   { path: '/test', name: 'Test', component: Test },
// ]

// const routes = [
//   { path: '/', component: Test },
//   { path: '/catalog', component: Catalog },
//   { path: '/tasks', component: Tasks },
//   { path: '/menu', component: Menu },
//   { path: '/tokens', component: Tokens},
//   { path: '/subscribe', component: Subscribe}
// ]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
