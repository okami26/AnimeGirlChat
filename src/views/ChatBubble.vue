<script setup lang="ts">
import { computed } from 'vue'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  pending?: boolean
  avatar?: string
  name?: string
}

const props = defineProps<{
  message: ChatMessage
  userAvatar?: string | null
  userName?: string
  assistantAvatar?: string | null
}>()

function initials(name?: string) {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('')
}

const avatar = computed(() => {
  const m = props.message
  if (m.avatar) return { src: m.avatar }
  if (m.role === 'user') {
    return props.userAvatar
      ? { src: props.userAvatar }
      : { initials: initials(m.name || props.userName || 'Вы') }
  }
  // assistant
  return props.assistantAvatar
    ? { src: props.assistantAvatar }
    : { initials: 'AI' }
})
</script>

<template>
  <div
    class="flex items-end mb-2"
    :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <!-- аватар -->
    <div
      class="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-gray-200 text-gray-700
             flex items-center justify-center text-sm font-semibold select-none"
      :class="message.role === 'user' ? 'order-2 ml-2' : 'order-1 mr-2'"
    >
      <img
        v-if="avatar.src"
        :src="avatar.src"
        alt=""
        class="w-full h-full object-cover"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
      <span v-else>{{ avatar.initials }}</span>
    </div>

    <!-- бабл -->
    <div
      class="max-w-[75%] rounded-2xl px-4 py-2 shadow-sm leading-relaxed whitespace-pre-wrap"
      :class="message.role === 'user'
        ? 'order-1 bg-blue-500 text-white rounded-br-md'
        : 'order-2 bg-white/90 border border-gray-200 rounded-bl-md'"
    >
      <span v-if="message.pending" class="inline-flex items-center gap-2">
        <span class="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse"></span>
        <span class="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse" style="animation-delay:120ms"></span>
        <span class="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse" style="animation-delay:240ms"></span>
      </span>
      <span v-else>{{ message.content }}</span>
    </div>
  </div>
</template>