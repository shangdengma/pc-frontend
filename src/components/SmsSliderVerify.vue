<template>
  <Teleport to="body">
    <div v-if="modelValue" class="slider-mask" role="presentation">
      <section class="slider-dialog" role="dialog" aria-modal="true" aria-labelledby="slider-title">
        <header class="slider-header">
          <div>
            <h3 id="slider-title">安全验证</h3>
            <p>按住下方滑块，拖到最右侧完成验证</p>
          </div>
          <button class="slider-close" type="button" aria-label="关闭" @click="close">×</button>
        </header>

        <div class="slider-body">
          <div
            ref="trackElement"
            class="slider-track"
            :class="{ dragging, disabled: loading || verifying }"
          >
            <div class="slider-progress" :style="{ width: `${handleLeft + handleWidth / 2}px` }"></div>
            <span class="slider-hint">{{ sliderHint }}</span>
            <button
              class="slider-handle"
              type="button"
              :style="{ transform: `translateX(${handleLeft}px)` }"
              :disabled="loading || verifying"
              aria-label="拖动滑块完成验证"
              @pointerdown="startDrag"
            >
              <span>→</span>
            </button>
          </div>

          <div v-if="error" class="slider-error">{{ error }}</div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { createSmsSliderChallenge, verifySmsSliderChallenge } from '../api/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  phone: { type: String, default: '' },
  scene: { type: String, required: true }
})

const emit = defineEmits(['update:modelValue', 'verified'])
const trackElement = ref(null)
const challengeId = ref('')
const loading = ref(false)
const verifying = ref(false)
const dragging = ref(false)
const error = ref('')
const handleLeft = ref(0)
const handleWidth = 46
let pointerId = null
let dragStartedAt = 0
let dragStartX = 0
let dragStartLeft = 0
let dragTrack = []

const sliderHint = computed(() => {
  if (loading.value) return '正在准备验证...'
  if (verifying.value) return '正在验证...'
  if (dragging.value) return '继续拖到最右侧'
  return '按住滑块，拖到最右侧'
})

function close() {
  stopPointerListeners()
  emit('update:modelValue', false)
}

function resetDrag() {
  dragging.value = false
  handleLeft.value = 0
  pointerId = null
  dragTrack = []
}

async function loadChallenge(preserveError = false) {
  if (!props.phone || loading.value) return
  loading.value = true
  if (!preserveError) error.value = ''
  challengeId.value = ''
  resetDrag()
  try {
    const response = await createSmsSliderChallenge(props.phone, props.scene)
    const data = response?.data || {}
    challengeId.value = data.challengeId || ''
    if (!challengeId.value) {
      throw new Error('滑块验证加载失败')
    }
  } catch (err) {
    error.value = err?.msg || err?.message || '滑块验证加载失败，请重试'
  } finally {
    loading.value = false
  }
}

function maxHandleLeft() {
  const width = trackElement.value?.clientWidth || 0
  return Math.max(0, width - handleWidth)
}

function normalizeOffset(left) {
  const max = maxHandleLeft()
  return max > 0 ? Math.round((left / max) * 1000) : 0
}

function startDrag(event) {
  if (loading.value || verifying.value || !challengeId.value) return
  event.preventDefault()
  pointerId = event.pointerId
  dragStartedAt = Date.now()
  dragStartX = event.clientX
  dragStartLeft = handleLeft.value
  dragTrack = [normalizeOffset(handleLeft.value)]
  dragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
  window.addEventListener('pointermove', moveDrag)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', cancelDrag)
}

function moveDrag(event) {
  if (!dragging.value || event.pointerId !== pointerId) return
  const nextLeft = Math.min(maxHandleLeft(), Math.max(0, dragStartLeft + event.clientX - dragStartX))
  handleLeft.value = nextLeft
  const normalized = normalizeOffset(nextLeft)
  if (dragTrack.length === 0 || Math.abs(normalized - dragTrack[dragTrack.length - 1]) >= 8) {
    dragTrack.push(normalized)
  }
}

async function endDrag(event) {
  if (!dragging.value || event.pointerId !== pointerId) return
  const offset = normalizeOffset(handleLeft.value)
  dragTrack.push(offset)
  dragging.value = false
  stopPointerListeners()
  if (offset < 980) {
    error.value = '请将滑块拖到最右侧'
    resetDrag()
    return
  }
  await submitVerification(offset)
}

function cancelDrag() {
  stopPointerListeners()
  resetDrag()
}

function stopPointerListeners() {
  window.removeEventListener('pointermove', moveDrag)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', cancelDrag)
}

async function submitVerification(offset) {
  verifying.value = true
  error.value = ''
  try {
    const response = await verifySmsSliderChallenge({
      challengeId: challengeId.value,
      phone: props.phone,
      scene: props.scene,
      offset,
      duration: Date.now() - dragStartedAt,
      track: dragTrack.slice(-80)
    })
    const ticket = response?.data?.sliderTicket
    if (!ticket) throw new Error('滑块验证失败')
    emit('verified', ticket)
    emit('update:modelValue', false)
  } catch (err) {
    const message = err?.msg || err?.message || '验证失败，请重新操作'
    await loadChallenge(true)
    error.value = message
  } finally {
    verifying.value = false
  }
}

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      await nextTick()
      await loadChallenge()
    } else {
      stopPointerListeners()
      resetDrag()
    }
  }
)

onBeforeUnmount(stopPointerListeners)
</script>

<style scoped>
.slider-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.48);
}

.slider-dialog {
  width: min(390px, 100%);
  overflow: hidden;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.2);
}

.slider-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 22px 16px;
  border-bottom: 1px solid #e8edf4;
}

.slider-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 19px;
  line-height: 1.4;
}

.slider-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.slider-close {
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.slider-body {
  padding: 22px;
}

.slider-track {
  position: relative;
  height: 46px;
  overflow: hidden;
  border: 1px solid #d9e2ef;
  background: #f1f5f9;
  user-select: none;
  touch-action: none;
}

.slider-progress {
  position: absolute;
  inset: 0 auto 0 0;
  background: #dcfce7;
}

.slider-hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #64748b;
  font-size: 14px;
  pointer-events: none;
}

.slider-handle {
  position: absolute;
  top: -1px;
  left: -1px;
  z-index: 2;
  width: 46px;
  height: 46px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  cursor: grab;
  touch-action: none;
}

.slider-handle:active {
  cursor: grabbing;
}

.slider-handle span {
  font-size: 20px;
  letter-spacing: 0;
}

.slider-error {
  margin-top: 10px;
  color: #dc2626;
  font-size: 13px;
}

</style>
