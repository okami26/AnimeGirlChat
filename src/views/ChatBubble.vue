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

function playAudioOnce() {
  if (!props.message.audio_base64) return
  try {
    // предпочитаем wav, если mime не передали — пробуем wav, затем mp3
    const mime = (props.message as any).audio_mime || 'audio/wav'
    audioEl = mime.includes('wav')
      ? playBase64Wav(props.message.audio_base64)
      : playBase64Audio(props.message.audio_base64, mime)

    playing.value = true
    audioEl.addEventListener('ended', () => { playing.value = false }, { once: true })
    audioEl.addEventListener('pause', () => { playing.value = false })
  } catch {
    try {
      audioEl = playBase64Audio(props.message.audio_base64, 'audio/mpeg')
      playing.value = true
      audioEl.addEventListener('ended', () => { playing.value = false }, { once: true })
      audioEl.addEventListener('pause', () => { playing.value = false })
    } catch {}
  }
}

function stopAudio() {
  if (audioEl) {
    try { audioEl.pause() } catch {}
    revokeObjectUrlFromAudio(audioEl)
    audioEl = null
  }
  playing.value = false
}

onBeforeUnmount(() => stopAudio())

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
      class="relative max-w-[75%] rounded-2xl px-4 py-2 shadow-sm leading-relaxed whitespace-pre-wrap break-words"
      :class="message.role === 'user'
        ? 'order-1 bg-blue-500 text-white rounded-br-md'
        : 'order-2 bg-white/20 border-gray-200 rounded-bl-md'"
    >
      <span v-if="message.pending" class="inline-flex items-center gap-2">
        <span class="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse"></span>
        <span class="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse" style="animation-delay:120ms"></span>
        <span class="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse" style="animation-delay:240ms"></span>
      </span>
      <span v-else>{{ message.content }}</span>

      <!-- КНОПКА ПРОИГРЫВАНИЯ (в нижнем правом углу бабла) -->
      <button
        v-if="message.role === 'assistant' && message.audio_base64"
        type="button"
        class="absolute -bottom-0 -right-0 h-5 w-5 rounded-full bg-black/70 text-white
               flex items-center justify-center shadow-md hover:bg-black/80 active:scale-95
               focus:outline-none border border-white/20"
        :title="playing ? 'Остановить' : 'Воспроизвести'"
        @click="playing ? stopAudio() : playAudioOnce()"
      >
        <AudioLines :size="12" class="opacity-90" />
      </button>
    </div>
  </div>
</template>
