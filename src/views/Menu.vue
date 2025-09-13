<script setup lang="ts">
import {
  PiggyBank,
  Settings,
  PersonStanding,
  Globe,
  MessageCircleMore,
  TicketPercent,
} from 'lucide-vue-next'
</script>

<template>
  <nav class="fixed top-1 left-0 right-0 z-50">
    <div class="mx-auto max-w-md px-3 py-2">
      <div class="grid grid-cols-2 gap-2">
        <RouterLink
          to="/tokens"
          class="group block rounded-2xl bg-neutral-900/70 border border-white/5 px-4 py-3 text-white shadow-sm transition-colors duration-200 hover:border-white/20 active:scale-[0.99]"
          active-class="ring-1 ring-white/30"
        >
          <div class="flex flex-col items-start">
            <!-- верх: иконка + число в ряд -->
            <div class="flex items-start gap-1">
              <PiggyBank class="w-4 h-4 mt-0.5 opacity-90" />
              <span class="text-sm font-semibold">99999</span>
            </div>

            <!-- низ: подпись -->
            <div class="text-[12px] opacity-70">Ваши токены</div>
          </div>
        </RouterLink>

        <RouterLink
          to="/subscribe"
          class="group block rounded-2xl bg-neutral-900/90 border border-white/10 px-4 py-3 text-white shadow-sm transition-colors duration-200 hover:border-white/20 active:scale-[0.99]"
          active-class="ring-1 ring-white/30"
        >
          <div class="flex items-start gap-2">
            <div class="leading-tight">
              <div class="text-sm font-semibold">Подписка</div>
              <div class="text-[12px] opacity-70">Купить</div>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped></style>
