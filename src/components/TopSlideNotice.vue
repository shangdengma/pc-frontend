<template>
  <Teleport to="body">
    <Transition name="top-slide-notice">
      <div
        v-if="modelValue && (title || message)"
        class="top-slide-notice"
        :class="noticeClass"
        role="status"
        aria-live="polite"
      >
        <span class="notice-mark" aria-hidden="true"></span>
        <div class="notice-copy">
          <strong>{{ noticeTitle }}</strong>
          <span v-if="message">{{ message }}</span>
        </div>
        <button class="notice-close" type="button" aria-label="关闭提示" @click="close">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  type: { type: String, default: 'success' },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  duration: { type: Number, default: 3200 }
})

const emit = defineEmits(['update:modelValue', 'close'])

let timer = null

const titleMap = {
  success: '操作成功',
  error: '操作失败',
  warning: '请注意',
  info: '提示'
}

const normalizedType = computed(() => ['success', 'error', 'warning', 'info'].includes(props.type) ? props.type : 'info')
const noticeClass = computed(() => `is-${normalizedType.value}`)
const noticeTitle = computed(() => props.title || titleMap[normalizedType.value])

function clearTimer() {
  if (!timer) return
  window.clearTimeout(timer)
  timer = null
}

function startTimer() {
  clearTimer()
  if (!props.duration || props.duration <= 0) return
  timer = window.setTimeout(close, props.duration)
}

function close() {
  clearTimer()
  emit('update:modelValue', false)
  emit('close')
}

watch(
  () => [props.modelValue, props.message, props.title, props.duration],
  () => {
    if (props.modelValue) startTimer()
    else clearTimer()
  },
  { immediate: true }
)

onBeforeUnmount(clearTimer)
</script>

<style scoped>
.top-slide-notice{
  position:fixed;
  top:18px;
  left:50%;
  z-index:2200;
  width:min(440px, calc(100vw - 32px));
  min-height:64px;
  padding:14px 14px 14px 16px;
  display:grid;
  grid-template-columns:28px minmax(0,1fr) 30px;
  align-items:center;
  gap:12px;
  background:#fff;
  border:1px solid #D7E0EC;
  box-shadow:0 18px 46px rgba(15,23,42,.16);
  transform:translateX(-50%);
}
.notice-mark{
  width:26px;
  height:26px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  background:#EAF3FF;
  position:relative;
}
.notice-mark::before{
  content:'';
  width:9px;
  height:9px;
  background:#014DB2;
}
.notice-copy{min-width:0;display:flex;flex-direction:column;gap:4px}
.notice-copy strong{color:var(--text1, #001B3D);font-size:15px;font-weight:700;line-height:1.3}
.notice-copy span{color:var(--text2, #51627A);font-size:13px;line-height:1.55;word-break:break-word}
.notice-close{
  width:30px;
  height:30px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:none;
  background:transparent;
  color:#6B7B92;
  cursor:pointer;
  padding:0;
}
.notice-close:hover{color:#001B3D}
.notice-close svg{width:17px;height:17px}
.top-slide-notice.is-success{border-color:#BFE9D7}
.top-slide-notice.is-success .notice-mark{background:#EAF8F1}
.top-slide-notice.is-success .notice-mark::before{background:#14A66D}
.top-slide-notice.is-error{border-color:#F2C8C8}
.top-slide-notice.is-error .notice-mark{background:#FFF0F0}
.top-slide-notice.is-error .notice-mark::before{background:#EF4444}
.top-slide-notice.is-warning{border-color:#F5D9A6}
.top-slide-notice.is-warning .notice-mark{background:#FFF7E6}
.top-slide-notice.is-warning .notice-mark::before{background:#D97706}
.top-slide-notice-enter-active,
.top-slide-notice-leave-active{transition:opacity .22s ease, transform .22s ease}
.top-slide-notice-enter-from,
.top-slide-notice-leave-to{opacity:0;transform:translate(-50%, -18px)}
</style>
