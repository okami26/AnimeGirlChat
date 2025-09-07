<template>
  <div
    ref="wrap"
    class="drag-wrap"
    @pointerdown="onPointerDown"
  >
    <input
      ref="el"
      v-model="model"
      type="text"
      class="drag-input"
      :style="inputStyle"
      :placeholder="placeholder"
      @keydown.stop
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, computed, watch } from 'vue'

type Props = {
  modelValue?: string
  placeholder?: string
  /** шаг “прилипания” к сетке, px. 0 — без прилипания */
  snap?: number
  /** стартовая позиция */
  startX?: number
  startY?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Перетащи меня',
  snap: 0,
  startX: 20,
  startY: 20
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'move', xy: { x: number; y: number }): void
}>()

const model = ref(props.modelValue)
watch(model, v => emit('update:modelValue', v))

const wrap = ref<HTMLDivElement | null>(null)
const el   = ref<HTMLInputElement | null>(null)

const state = reactive({
  x: props.startX,
  y: props.startY,
  dragging: false,
  offsetX: 0,
  offsetY: 0
})

const inputStyle = computed(() => ({
  transform: `translate(${state.x}px, ${state.y}px)`
}))

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function snapTo(n: number, step: number) {
  if (!step) return n
  return Math.round(n / step) * step
}

function getBounds() {
  const w = wrap.value!
  const r = w.getBoundingClientRect()
  const i = el.value!.getBoundingClientRect()
  return {
    minX: 0,
    minY: 0,
    maxX: r.width - i.width,
    maxY: r.height - i.height
  }
}

function onPointerDown(e: PointerEvent) {
  if (e.button === 2) return
  if (!el.value || e.target !== el.value) return

  el.value.setPointerCapture(e.pointerId)
  state.dragging = true

  const elRect = el.value.getBoundingClientRect()
  state.offsetX = e.clientX - elRect.left
  state.offsetY = e.clientY - elRect.top

  document.body.style.userSelect = 'none'
}

function onPointerMove(e: PointerEvent) {
  if (!state.dragging || !wrap.value || !el.value) return

  const wrapRect = wrap.value.getBoundingClientRect()
  let nextX = e.clientX - wrapRect.left - state.offsetX
  let nextY = e.clientY - wrapRect.top  - state.offsetY

  const { minX, minY, maxX, maxY } = getBounds()
  nextX = clamp(nextX, minX, maxX)
  nextY = clamp(nextY, minY, maxY)

  nextX = snapTo(nextX, props.snap)
  nextY = snapTo(nextY, props.snap)

  state.x = nextX
  state.y = nextY

  emit('move', { x: state.x, y: state.y })
}

function onPointerUp(e: PointerEvent) {
  if (!state.dragging) return
  state.dragging = false
  document.body.style.userSelect = ''
  try {
    el.value?.releasePointerCapture(e.pointerId)
  } catch {}
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  window.addEventListener('pointercancel', onPointerUp, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
})
</script>

<style scoped>
.drag-wrap {
  position: relative;
  width: 100%;
  height: 260px;           /* можно изменить */
  border: 1px dashed #bbb;
  border-radius: 10px;
  background: #fafafa;
  overflow: hidden;
}

.drag-input {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(0, 0);
  will-change: transform;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  cursor: grab;
}
.drag-input:active {
  cursor: grabbing;
}
</style>
