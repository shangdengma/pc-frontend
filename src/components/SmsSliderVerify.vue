<template>
  <Teleport v-if="dialogMode" to="body">
    <div v-if="modelValue" class="slider-mask" role="presentation">
      <section class="slider-dialog" role="dialog" aria-modal="true" aria-labelledby="slider-title">
        <header class="slider-header">
          <div class="slider-title-group">
            <h3 id="slider-title">安全验证</h3>
            <p>拖动滑块完成校验后发送验证码</p>
          </div>
        </header>
        <div class="slider-body">
          <div class="slider-target">
            <span>验证码将发送至</span>
            <strong>{{ maskedPhone || '当前手机号' }}</strong>
          </div>
          <div class="slider-wrap" :class="{ done: verified, fail: failed, dragging: dragActive, loading: loading || verifying }">
            <div ref="trackRef" class="slider-track" @pointerdown="onDown">
              <span class="slider-hint">{{ hintText }}</span>
              <div class="slider-fill" :style="{ width: handleLeft + sliderSize + 'px' }"></div>
              <div
                ref="handleRef"
                class="slider-handle"
                :style="{ left: handleLeft + 'px' }"
              >
                <svg v-if="verified" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none"><path d="M8.5 7.5 13 12l-4.5 4.5M14 7.5l4.5 4.5L14 16.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
            </div>
          </div>
          <p class="slider-note">验证仅用于防止异常请求，不会额外收集业务信息。</p>
        </div>
      </section>
    </div>
  </Teleport>
  <div v-else class="slider-wrap" :class="{ done: verified, fail: failed, dragging: dragActive, loading: loading || verifying }">
    <div ref="trackRef" class="slider-track" @pointerdown="onDown">
      <span class="slider-hint">{{ hintText }}</span>
      <div class="slider-fill" :style="{ width: handleLeft + sliderSize + 'px' }"></div>
      <div
        ref="handleRef"
        class="slider-handle"
        :style="{ left: handleLeft + 'px' }"
      >
        <svg v-if="verified" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <svg v-else viewBox="0 0 24 24" fill="none"><path d="M8.5 7.5 13 12l-4.5 4.5M14 7.5l4.5 4.5L14 16.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount, watch } from 'vue'
import { createSmsSliderChallenge, verifySmsSliderChallenge } from '../api/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
  phone: { type: String, default: '' },
  scene: { type: String, default: 'login' }
})
const emit = defineEmits(['update:modelValue', 'verified'])

const trackRef = ref(null)
const handleRef = ref(null)
const handleLeft = ref(0)
const verified = ref(false)
const failed = ref(false)
const challengeId = ref('')
const loading = ref(false)
const verifying = ref(false)
const dragActive = ref(false)
const sliderSize = 42
const hintText = ref('向右拖动滑块完成验证')
const dialogMode = computed(() => props.modelValue !== undefined)
const maskedPhone = computed(() => {
  const phone = String(props.phone || '')
  if (!/^1[3-9]\d{9}$/.test(phone)) return ''
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
})

let dragging = false
let startX = 0
let startLeft = 0
let dragStartedAt = 0
let dragTrack = []
let closeTimer = null

watch(() => [props.phone, props.scene], reset)

function stopDrag() {
  dragging = false
  dragActive.value = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
}

function clearCloseTimer() {
  if (!closeTimer) return
  clearTimeout(closeTimer)
  closeTimer = null
}

function reset() {
  clearCloseTimer()
  stopDrag()
  verified.value = false
  failed.value = false
  challengeId.value = ''
  handleLeft.value = 0
  hintText.value = '向右拖动滑块完成验证'
}

async function ensureChallenge() {
  if (challengeId.value) return true
  if (!/^1[3-9]\d{9}$/.test(props.phone || '')) {
    failed.value = true
    hintText.value = '请先输入正确的手机号'
    return false
  }
  loading.value = true
  hintText.value = '正在准备验证...'
  try {
    const response = await createSmsSliderChallenge(props.phone, props.scene)
    challengeId.value = response?.data?.challengeId || ''
    if (!challengeId.value) throw new Error('滑块验证加载失败')
    hintText.value = '向右拖动滑块完成验证'
    return true
  } catch (error) {
    failed.value = true
    hintText.value = error?.msg || error?.message || '滑块验证加载失败'
    return false
  } finally {
    loading.value = false
  }
}

async function onDown(e) {
  if (e.button !== undefined && e.button !== 0) return
  if (verified.value || loading.value || verifying.value) return
  if (!(await ensureChallenge())) return
  dragging = true
  dragActive.value = true
  failed.value = false
  startX = e.clientX
  startLeft = handleLeft.value
  dragStartedAt = Date.now()
  dragTrack = [0]
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
  e.preventDefault()
}

function onMove(e) {
  if (!dragging) return
  const track = trackRef.value
  const max = track ? track.offsetWidth - sliderSize : 0
  let next = startLeft + (e.clientX - startX)
  if (next < 0) next = 0
  if (next > max) next = max
  handleLeft.value = next
  const offset = max > 0 ? Math.round((next / max) * 1000) : 0
  if (dragTrack.length === 0 || Math.abs(offset - dragTrack[dragTrack.length - 1]) >= 8) {
    dragTrack.push(offset)
  }
}

function onUp() {
  if (!dragging) return
  const track = trackRef.value
  const max = track ? track.offsetWidth - sliderSize : 0
  const shouldVerify = max > 0 && handleLeft.value >= max - 2
  stopDrag()
  if (shouldVerify) {
    succeed(max)
    return
  }
  if (!verified.value && handleLeft.value > 6) {
    failed.value = true
    hintText.value = '验证失败，请重试'
    setTimeout(() => { handleLeft.value = 0; failed.value = false; hintText.value = '向右拖动滑块完成验证' }, 600)
  }
}

async function succeed(max) {
  stopDrag()
  handleLeft.value = max
  verifying.value = true
  hintText.value = '正在验证...'
  try {
    const response = await verifySmsSliderChallenge({
      challengeId: challengeId.value,
      phone: props.phone,
      scene: props.scene,
      offset: 1000,
      duration: Date.now() - dragStartedAt,
      track: [...dragTrack, 1000].slice(-80)
    })
    const ticket = response?.data?.sliderTicket
    if (!ticket) throw new Error('滑块验证失败')
    verified.value = true
    hintText.value = '验证通过'
    emit('verified', ticket)
    if (dialogMode.value) {
      clearCloseTimer()
      closeTimer = setTimeout(() => {
        closeTimer = null
        emit('update:modelValue', false)
      }, 500)
    }
  } catch (error) {
    challengeId.value = ''
    handleLeft.value = 0
    failed.value = true
    hintText.value = error?.msg || error?.message || '验证失败，请重试'
  } finally {
    verifying.value = false
  }
}

onBeforeUnmount(() => {
  clearCloseTimer()
  stopDrag()
})

watch(
  () => props.modelValue,
  visible => {
    if (!dialogMode.value) return
    if (visible) reset()
    else {
      clearCloseTimer()
      stopDrag()
    }
  }
)
</script>

<style scoped>
.slider-mask{position:fixed;inset:0;z-index:3000;background:rgba(15,23,42,.36);display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(3px)}
.slider-dialog{width:min(390px,100%);background:#fff;border:1px solid var(--border);box-shadow:0 24px 60px rgba(15,23,42,.18);overflow:hidden}
.slider-header{display:flex;align-items:flex-start;justify-content:flex-start;padding:23px 24px 18px;border-bottom:1px solid var(--border2)}
.slider-title-group{min-width:0}
.slider-header h3{font-size:18px;font-weight:700;color:var(--text1);margin:0 0 7px;line-height:1.25}
.slider-header p{font-size:13px;color:var(--text2);margin:0;line-height:1.45}
.slider-body{padding:22px 24px 24px}
.slider-target{height:40px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 14px;margin-bottom:16px;background:#F8FAFC;border:1px solid var(--border2);font-size:13px;color:var(--text2)}
.slider-target strong{color:var(--text1);font-size:14px;font-weight:700}
.slider-wrap{width:100%}
.slider-track{position:relative;height:44px;background:linear-gradient(180deg,#F8FAFC 0%,#EEF3F8 100%);border:1px solid #C8D4E4;border-radius:4px;overflow:hidden;user-select:none;cursor:pointer;touch-action:none;box-shadow:inset 0 1px 2px rgba(15,23,42,.06),0 1px 0 rgba(255,255,255,.9)}
.slider-track::before{content:"";position:absolute;inset:1px;z-index:0;border-radius:3px;background:linear-gradient(180deg,rgba(255,255,255,.72),rgba(255,255,255,0));pointer-events:none}
.slider-hint{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;font-size:13px;color:#536579;pointer-events:none;transition:color .18s ease}
.slider-fill{position:absolute;top:0;left:0;z-index:1;height:100%;background:linear-gradient(90deg,#18B957 0%,#39DD74 100%);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),0 0 14px rgba(34,197,94,.18);transition:width .18s ease}
.slider-fill::after{content:"";position:absolute;top:0;bottom:0;width:84px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.78),rgba(255,255,255,0));transform:translateX(-96px);animation:slider-breathe 1.28s ease-in-out infinite}
.slider-handle{position:absolute;top:0.5px;z-index:4;box-sizing:border-box;width:42px;height:42px;background:linear-gradient(180deg,#FFFFFF 0%,#F7FAFD 100%);border:1px solid #C8D4E4;border-radius:3px;color:#16A34A;display:flex;align-items:center;justify-content:center;cursor:grab;box-shadow:0 2px 8px rgba(15,23,42,.14),inset 0 1px 0 rgba(255,255,255,.95);transition:left .18s ease,background .18s ease,color .18s ease,box-shadow .18s ease,border-color .18s ease}
.slider-handle svg{width:20px;height:20px;display:block}
.slider-wrap.dragging .slider-fill,
.slider-wrap.dragging .slider-handle{transition:none}
.slider-wrap.dragging .slider-track{border-color:#86DDA7}
.slider-wrap.dragging .slider-handle{cursor:grabbing;border-color:#9FDEC0;box-shadow:0 4px 14px rgba(22,163,74,.2),inset 0 1px 0 rgba(255,255,255,.95)}
.slider-wrap.loading .slider-hint{color:var(--primary)}
.slider-wrap.done .slider-track{border-color:#22C55E;background:#22C55E;box-shadow:none}
.slider-wrap.done .slider-track::before{display:none}
.slider-wrap.done .slider-hint{color:#fff;font-weight:600}
.slider-wrap.done .slider-fill{background:#22C55E;box-shadow:none}
.slider-wrap.done .slider-fill::after{display:none}
.slider-wrap.done .slider-handle{background:transparent;color:#fff;border-color:transparent;box-shadow:none}
.slider-wrap.fail .slider-track{border-color:#F2B8B5;background:#FFF7F7;box-shadow:inset 0 1px 2px rgba(127,29,29,.06)}
.slider-wrap.fail .slider-fill{background:#FDECEC}
.slider-wrap.fail .slider-hint{color:var(--error)}
.slider-note{margin:12px 0 0;color:var(--text3);font-size:12px;line-height:1.45}
@keyframes slider-breathe{
  0%{transform:translateX(-96px);opacity:.35}
  50%{opacity:.95}
  100%{transform:translateX(360px);opacity:.35}
}
@media (max-width:520px){
  .slider-mask{padding:16px}
  .slider-header{padding:22px 20px 18px}
  .slider-body{padding:20px}
  .slider-target{align-items:flex-start;height:auto;min-height:40px;flex-direction:column;justify-content:center;gap:2px;padding:9px 12px}
}
</style>
