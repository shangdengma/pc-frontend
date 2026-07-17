<template>
  <Teleport to="body">
    <Transition name="app-modal-fade">
      <div
        v-if="open"
        class="app-modal-mask"
        role="presentation"
        @click.self="emit('close')"
      >
        <section
          ref="modalRef"
          class="app-modal"
          :class="[`app-modal--${size}`, { 'app-modal--flush': flush }]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <header class="app-modal__header">
            <div class="app-modal__heading">
              <p v-if="eyebrow" class="app-modal__eyebrow">{{ eyebrow }}</p>
              <h3 :id="titleId">{{ title }}</h3>
              <p v-if="description" class="app-modal__description">{{ description }}</p>
            </div>
            <button ref="closeButtonRef" class="app-modal__close" type="button" aria-label="关闭" @click="emit('close')">
              <X :size="19" :stroke-width="2" />
            </button>
          </header>

          <div class="app-modal__body" :class="{ 'app-modal__body--flush': flush }">
            <slot />
          </div>

          <footer v-if="$slots.footer && footerVisible" class="app-modal__footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' },
  flush: { type: Boolean, default: false },
  footerVisible: { type: Boolean, default: true }
})

const emit = defineEmits(['close'])
const titleId = computed(() => `app-modal-${String(props.title).replace(/\s+/g, '-').toLowerCase()}`)
const modalRef = ref(null)
const closeButtonRef = ref(null)
let previousActiveElement = null
let previousBodyOverflow = ''

function handleKeydown(event) {
  if (!props.open) return
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !modalRef.value) return

  const focusable = [...modalRef.value.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )]
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.open, async (open) => {
  if (open) {
    previousActiveElement = document.activeElement
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    closeButtonRef.value?.focus()
    return
  }
  document.body.style.overflow = previousBodyOverflow
  previousActiveElement?.focus?.()
})

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = previousBodyOverflow
})
</script>
