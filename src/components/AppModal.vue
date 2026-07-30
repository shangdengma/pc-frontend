<template>
  <teleport to="body">
    <transition name="app-modal">
      <div v-if="open" class="app-modal-mask" @pointerdown="onBackdropPointerDown" @click.self="onBackdrop">
        <div
          ref="panelRef"
          class="app-modal-panel"
          :class="[`size-${size}`, { flush }]"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header v-if="!flush" class="app-modal-head">
            <div>
              <div v-if="eyebrow" class="app-modal-eyebrow">{{ eyebrow }}</div>
              <h3 class="app-modal-title">{{ title }}</h3>
              <p v-if="description" class="app-modal-desc">{{ description }}</p>
            </div>
            <button class="app-modal-close" @click="close" aria-label="关闭">
              <svg viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M18 6L6 18" stroke="#64748B" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </header>
          <div class="app-modal-body" :class="{ flush }">
            <slot />
          </div>
          <footer v-if="footerVisible && $slots.footer" class="app-modal-foot">
            <slot name="footer" :close="close" />
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { watch, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg | xl
  flush: { type: Boolean, default: false },
  footerVisible: { type: Boolean, default: true },
  closeOnBackdrop: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'close'])

const open = ref(props.modelValue)
const panelRef = ref(null)
let lastFocused = null
let backdropPointerDown = false

watch(() => props.modelValue, v => {
  open.value = v
  if (v) {
    lastFocused = document.activeElement
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      const el = panelRef.value?.querySelector('input,textarea,button,a,[tabindex]')
      el?.focus()
    })
    window.addEventListener('keydown', onKeydown)
  } else {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKeydown)
    lastFocused?.focus?.()
  }
})

function onKeydown(e) {
  if (e.key === 'Escape') close()
}
function onBackdropPointerDown(e) {
  backdropPointerDown = e.target === e.currentTarget
}
function onBackdrop() {
  const shouldClose = backdropPointerDown && props.closeOnBackdrop
  backdropPointerDown = false
  if (shouldClose) close()
}
function close() {
  emit('update:modelValue', false)
  emit('close')
}
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
onMounted(() => { if (!props.modelValue) document.body.style.overflow = '' })
</script>

<style scoped>
.app-modal-mask{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:24px}
.app-modal-panel{background:#fff;border:1px solid var(--border);box-shadow:0 12px 40px rgba(15,23,42,.18);display:flex;flex-direction:column;max-height:calc(100vh - 48px);width:100%}
.size-sm{max-width:420px}.size-md{max-width:600px}.size-lg{max-width:760px}.size-xl{max-width:960px}
.app-modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:20px 24px;border-bottom:1px solid var(--border);flex-shrink:0}
.app-modal-eyebrow{font-size:12px;font-weight:600;color:var(--primary);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
.app-modal-title{font-size:17px;font-weight:700;color:var(--text1)}
.app-modal-desc{font-size:13px;color:var(--text2);margin-top:4px}
.app-modal-close{width:32px;height:32px;border-radius:50%;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;border:none}
.app-modal-close svg{width:16px;height:16px}
.app-modal-close:hover{background:transparent;opacity:.72}
.app-modal-body{padding:24px;overflow:auto}
.app-modal-body.flush{padding:0}
.app-modal-foot{display:flex;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid var(--border);flex-shrink:0}
.app-modal-enter-active,.app-modal-leave-active{transition:opacity .18s ease}
.app-modal-enter-from,.app-modal-leave-to{opacity:0}
.app-modal-enter-active .app-modal-panel,.app-modal-leave-active .app-modal-panel{transition:transform .18s ease}
.app-modal-enter-from .app-modal-panel{transform:translateY(8px)}
@media (max-width: 640px){
  .app-modal-mask{padding:12px;align-items:flex-end}
  .app-modal-panel{max-height:calc(100dvh - 24px)}
  .app-modal-head{padding:16px 18px}
  .app-modal-body{padding:18px}
  .app-modal-foot{padding:12px 18px;gap:10px;flex-wrap:wrap}
  .app-modal-foot :deep(.btn-primary),
  .app-modal-foot :deep(.btn-outline){min-width:96px;justify-content:center}
}
</style>
