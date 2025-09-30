<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import type { ChatMessage } from '@/utils/types'
import { AudioLines } from 'lucide-vue-next'
import { playBase64Wav, playBase64Audio, revokeObjectUrlFromAudio } from '@/utils/audio'

const props = defineProps<{
  message: ChatMessage
  userAvatar?: string | null
  userName?: string
  assistantAvatar?: string | null
}>()

const playing = ref(false)
let audioEl: HTMLAudioElement | null = null

function playAudioOnce() { /* как у тебя */ }
function stopAudio() { /* как у тебя */ }
onBeforeUnmount(() => stopAudio())

function initials(name?: string) { /* как у тебя */ }

const avatar = computed(() => {
  const m = props.message
  if (m.avatar) return { src: m.avatar }
  if (m.role === 'user') {
    return props.userAvatar ? { src: props.userAvatar } : { initials: initials(m.name || props.userName || 'Вы') }
  }
  return props.assistantAvatar ? { src: props.assistantAvatar } : { initials: 'AI' }
})
</script>

<template>
  <div
    class="flex items-start mb-2"
    :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <!-- АВАТАР (всегда прижат по верху) -->
    <div
      class="shrink-0 w-7.5 h-7.5 rounded-full overflow-hidden bg-gray-200 text-gray-700
             flex items-center justify-center text-sm font-semibold select-none mt-0.5"
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

    <!-- БАБЛ (одинаково скруглён со всех сторон и ближе к аватару) -->
    <div
      class="relative max-w-[75%] rounded-xl px-3.5 py-2 shadow-sm whitespace-pre-wrap break-words
             translate-y-[1px] text-sm leading-snug"
      :class="message.role === 'user'
        ? 'order-1 bg-pink-900 text-white'
        : 'order-2 bg-white/10 border-gray-200'"
    >
      <span v-if="message.pending" class="inline-flex items-center gap-2">
        <span class="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse"></span>
        <span class="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse" style="animation-delay:120ms"></span>
        <span class="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse" style="animation-delay:240ms"></span>
      </span>
      <span v-else>{{ message.content }}</span>

      <!-- КНОПКА ПРОИГРЫВАНИЯ (чуть меньше и ближе к краю) -->
      <button
        v-if="message.role === 'assistant' && message.audio_base64"
        type="button"
        class="absolute -bottom-0 -right-0 h-4 w-4 rounded-full bg-black/70 text-white
               flex items-center justify-center shadow-md hover:bg-black/80 active:scale-95
               focus:outline-none border border-white/20"
        :title="playing ? 'Остановить' : 'Воспроизвести'"
        @click="playing ? stopAudio() : playAudioOnce()"
      >
        <AudioLines :size="10" class="opacity-90" />
      </button>
    </div>
  </div>
</template>
