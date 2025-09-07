<script setup lang="ts">
import { ref, onMounted } from 'vue'

const data = ref<any>(null)

onMounted(async () => {
  const api = import.meta.env.VITE_API_BASE
  const res = await fetch(`${api}/hello`)
  data.value = await res.json()
})
</script>


<template>
  <div class="tg-app">
    <RouterView />
  </div>
</template>

<style>
/* растягиваем фон на весь экран и убираем отступы */
html, body, #app, .tg-app {
  height: 100%;
  margin: 0;
}

/* сам фон */
.tg-app {
  min-height: 100%;
  background: url("/anton.png") center / cover no-repeat;
}

/* иногда белый фон даёт системная тема/библиотеки — делаем прозрачным */
html, body {
  background: transparent !important;
}

/* сверху полупрозрачная плашка, чтобы текст читался */
.topbar {
  padding: 10px;
  background: rgba(238, 238, 238, 0.7);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}
</style>