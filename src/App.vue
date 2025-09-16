<script setup lang="ts">
import { ref, onMounted } from 'vue'
import WebApp from '@twa-dev/sdk'
import BottomNavigation from '@/components/BottomNavigation.vue'
import { useTelegramViewport } from '@/composables/useTelegramViewport'

function isMobile(): boolean {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|iphone|ipad|ipod|windows phone/i.test(ua.toLowerCase());
}
const data = ref<any>(null)


onMounted(async () => {
  if (isMobile()) {
    if (window.Telegram?.WebApp?.requestFullscreen) {
      window.Telegram.WebApp.requestFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }
  WebApp.ready()

  WebApp.setHeaderColor('#000000')
  WebApp.setBackgroundColor('#000000')

  const api = import.meta.env.VITE_API_BASE
  const res = await fetch(`${api}/hello`)
  data.value = await res.json()
})
</script>

<template>
  <div class="tg-app">
    <RouterView />
    <!-- <BottomNavigation /> -->
  </div>
</template>
