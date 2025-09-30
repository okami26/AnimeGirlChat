<script setup lang="ts">
import { ref, onMounted } from 'vue'
import WebApp from '@twa-dev/sdk'
import { useRouter } from 'vue-router'
import BottomNavigation from '@/components/BottomNavigation.vue'

function isMobile(): boolean {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera
  return /android|iphone|ipad|ipod|windows phone/i.test(ua.toLowerCase())
}

const router = useRouter()
const data = ref<any>(null)
const loadError = ref<string | null>(null)

function openChat() {
  router.push({ name: 'chat' }) // маршрут /chat (как мы добавляли ранее)
}

onMounted(async () => {
  if (isMobile()) {
    if (window.Telegram?.WebApp?.requestFullscreen) {
      window.Telegram.WebApp.requestFullscreen()
    } else {
      document.documentElement.requestFullscreen?.()
    }
  }
  WebApp.ready()
  // WebApp.setHeaderColor('#000000')
  // WebApp.setBackgroundColor('#000000')
  WebApp.setHeaderColor('#111111')
  WebApp.setBackgroundColor('#111111')

  // try {
  //   const raw =
  //     import.meta.env.VITE_API_BASE
  //   const api = raw.replace(/\/$/, '')
  //   const res = await fetch(`${api}/hello`, {
  //     headers: {
  //       'ngrok-skip-browser-warning': '1',
  //       Accept: 'application/json',
  //     },
  //   })
  //   if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  //   data.value = await res.json()
  // } catch (e: any) {
  //   loadError.value = e?.message ?? String(e)
  // }
})
</script>

<template>
  <div class="tg-app relative min-h-screen">
    <!-- где рисуем ваши страницы -->
    <RouterView />
    <BottomNavigation />
    <!-- плавающая кнопка «Открыть чат» -->

    <!-- <BottomNavigation /> -->

    <!-- отладочный вывод: ошибка загрузки /hello -->
    <!-- <p v-if="loadError" class="text-xs text-red-500 px-4 py-2">
      {{ loadError }}
    </p> -->
    <!-- отладочный вывод: результат /hello (можно скрыть) -->
    <!-- <pre v-else-if="data" class="text-xs text-white/70 px-4 py-2 whitespace-pre-wrap">
{{ JSON.stringify(data, null, 2) }}
    </pre> -->
  </div>
</template>

<style>
:root{
  /* не трогаем --nav-h, --safe-b, --safe-t здесь */
  --kb-offset: 0px; /* подъём при клавиатуре */
}

/* остальное как было */
html, body, #app{
  height: 100dvh;
  min-height: 100dvh;
}
.pb-safe-area{
  padding-bottom: calc(var(--nav-h) + var(--safe-b));
}
.footer-above-nav{
  bottom: calc(var(--nav-h) + var(--safe-b) + var(--kb-offset));
}
</style>
