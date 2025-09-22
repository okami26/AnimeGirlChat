<script setup>
import { MessageCircle, SquareUser, BookOpenCheck, Menu } from 'lucide-vue-next'
</script>

<template>
  <nav
    class="bottom-nav fixed bottom-0 left-0 right-0 bg-black/70 text-white border-t border-white/5 backdrop-blur-sm"
    :style="{
      // не наезжать на home-бар
      paddingBottom: 'max(var(--safe-b), 8px)',
      // высота панели с учётом safe-area
      height: 'calc(var(--nav-h) + var(--safe-b))'
    }"
  >
    <!-- h-full чтобы список занял всю высоту панели -->
    <ul class="flex justify-center items-center gap-10 h-full">
      <li class="nav-item">
        <RouterLink to="/chat" class="nav-btn" active-class="active-link">
          <MessageCircle class="icon"/>
          <span class="label">Чат</span>
        </RouterLink>
      </li>

      <li class="nav-item">
        <RouterLink to="/catalog" class="nav-btn" active-class="active-link">
          <SquareUser class="icon"/>
          <span class="label">Каталог</span>
        </RouterLink>
      </li>

      <li class="nav-item">
        <RouterLink to="/tasks" class="nav-btn" active-class="active-link">
          <BookOpenCheck class="icon"/>
          <span class="label">Задания</span>
        </RouterLink>
      </li>

      <li class="nav-item">
        <RouterLink to="/menu" class="nav-btn" active-class="active-link">
          <Menu class="icon"/>
          <span class="label">Меню</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/* li тоже тянем на всю высоту, чтобы кнопка могла центрироваться */
.nav-item{ height: 100%; }

/* кнопка занимает всю высоту ячейки и центрирует содержимое */
.nav-btn{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;   /* <-- вертикальный центр */
  height: 100%;             /* <-- растянуть на высоту панели */
  min-height: var(--tap-min);
  padding: 0 10px;          /* убрали вертикальные паддинги */
  gap: 2px;                 /* было gap:1 (невалидно) */
  font-size: 12px;
  opacity:.9;
  transition: color .2s ease, opacity .2s ease;
  -webkit-tap-highlight-color: transparent;
}

.icon{ width: 24px; height: 24px; }
.label{ line-height: 1; }

.active-link{ color:#60a5fa; opacity:1; }

@media (min-width: 768px){
  .nav-btn{ padding: 0 8px; font-size: 0.75rem; } /* только горизонтальные */
  .icon{ width:20px; height:20px; }
}
</style>
