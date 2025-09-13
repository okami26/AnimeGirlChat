<script setup>
import { House, SquareUser, BookOpenCheck, Menu } from 'lucide-vue-next'
</script>

<template>
  <nav
    class="bottom-nav fixed bottom-0 left-0 right-0 bg-black/70 text-white border-t border-white/10"
  >
    <ul class="flex justify-around py-0.5">
      <li>
        <RouterLink
          to="/"
          class="flex flex-col items-center text-xs transition-colors duration-300"
          active-class="active-link"
        >
          <House class="w-5 h-5" />
          Главная
        </RouterLink>
      </li>
      <li>
        <RouterLink
          to="/catalog"
          class="flex flex-col items-center text-xs transition-colors duration-300"
          active-class="active-link"
        >
          <SquareUser class="w-5 h-5" />
          Каталог
        </RouterLink>
      </li>
      <li>
        <RouterLink
          to="/tasks"
          class="flex flex-col items-center text-xs transition-colors duration-300"
          active-class="active-link"
        >
        <BookOpenCheck class="w-5 h-5"/>
          Задания
        </RouterLink>
      </li>
      <li>
        <RouterLink
          to="/menu"
          class="flex flex-col items-center text-xs transition-colors duration-300"
          active-class="active-link"
        >
        <Menu class="w-5 h-5" />
          Меню
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style>

</style>
