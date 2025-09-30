<script setup lang="ts">
import {
  PiggyBank,
  Settings,
  PersonStanding,
  Globe,
  MessageCircleMore,
  TicketPercent,
} from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { useTelegramUser } from '@/composables/useTelegramUser'

const tgUser = useTelegramUser()

onMounted(() => {
  // подтянем данные один раз при открытии меню
  tgUser.refreshOnce()
})

const displayName = computed(() => tgUser.userName.value || 'Вы')
const avatarUrl = computed(() => tgUser.userAvatar.value || '')

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '??'
  )
}
</script>

<template>
  <div class="p-4">
    <!-- Профиль -->
    <div class="flex items-center gap-3 mb-6">
      <!-- Аватар -->
      <div class="relative">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="displayName"
          class="w-12 h-12 rounded-full object-cover border border-white/20 shadow"
        />
        <div
          v-else
          class="w-12 h-12 rounded-full bg-white/10 border border-white/20 grid place-items-center text-white font-semibold"
        >
          {{ initials(displayName) }}
        </div>
      </div>

      <!-- Имя -->
      <div class="min-w-0">
        <div class="text-white font-semibold truncate">
          {{ displayName }}
        </div>
        <div class="text-xs text-white/60">Профиль</div>
      </div>
    </div>
  </div>
</template>
