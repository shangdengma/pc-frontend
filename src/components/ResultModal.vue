<template>
  <AppModal
    :model-value="modelValue"
    size="sm"
    flush
    :close-on-backdrop="closeOnBackdrop"
    @update:model-value="onModelUpdate"
  >
    <div class="result-modal" :class="type">
      <button v-if="closable" class="result-close" type="button" aria-label="关闭" @click="close">
        <svg viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <div class="result-icon" aria-hidden="true">
        <svg v-if="type === 'success'" viewBox="0 0 24 24" fill="none">
          <path d="M7 12.5L10.3 15.8L17 8.8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else-if="type === 'error'" viewBox="0 0 24 24" fill="none">
          <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
        <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V13M12 17H12.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none">
          <path d="M12 11V17M12 7H12.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </div>

      <h3>{{ title }}</h3>
      <p v-if="description" class="result-desc">{{ description }}</p>
      <div v-if="countdownText" class="result-countdown">{{ countdownText }}</div>

      <div v-if="details.length" class="result-details">
        <div v-for="item in details" :key="item.label" class="result-detail-row">
          <span>{{ item.label }}</span>
          <strong :class="item.tone">{{ item.value }}</strong>
        </div>
      </div>

      <div class="result-actions">
        <button v-if="tertiaryText" class="btn-outline result-tertiary" type="button" @click="$emit('tertiary')">{{ tertiaryText }}</button>
        <button v-if="secondaryText" class="btn-outline" type="button" @click="$emit('secondary')">{{ secondaryText }}</button>
        <button v-if="primaryText" class="btn-primary" type="button" @click="$emit('primary')">{{ primaryText }}</button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import AppModal from './AppModal.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  type: { type: String, default: 'success' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  countdownText: { type: String, default: '' },
  details: { type: Array, default: () => [] },
  primaryText: { type: String, default: '确认' },
  secondaryText: { type: String, default: '' },
  tertiaryText: { type: String, default: '' },
  closable: { type: Boolean, default: true },
  closeOnBackdrop: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'close', 'primary', 'secondary', 'tertiary'])

function onModelUpdate(value) {
  emit('update:modelValue', value)
  if (!value) emit('close')
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.result-modal{position:relative;padding:32px;text-align:center;background:#fff}
.result-close{position:absolute;top:14px;right:14px;width:32px;height:32px;border:0;background:transparent;color:#64748B;display:flex;align-items:center;justify-content:center;cursor:pointer}
.result-close:hover{opacity:.72}
.result-close svg{width:16px;height:16px}
.result-icon{width:62px;height:62px;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff}
.result-icon svg{width:32px;height:32px}
.result-modal.success .result-icon{background:var(--success)}
.result-modal.error .result-icon{background:var(--error)}
.result-modal.warning .result-icon{background:var(--warning)}
.result-modal.info .result-icon{background:var(--primary)}
.result-modal h3{margin:0 0 8px;color:var(--text1);font-size:22px;font-weight:700;line-height:1.35}
.result-desc{max-width:340px;margin:0 auto 16px;color:var(--text2);font-size:14px;line-height:1.7}
.result-countdown{display:inline-flex;align-items:center;justify-content:center;min-height:30px;margin:0 auto 16px;padding:0 12px;background:#F8FAFC;color:var(--text2);font-size:13px;font-weight:600}
.result-details{display:grid;border:1px solid var(--border);background:#F8FAFC;margin:0 0 22px;text-align:left}
.result-detail-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;border-bottom:1px solid var(--border)}
.result-detail-row:last-child{border-bottom:0}
.result-detail-row span{color:var(--text2);font-size:12px}
.result-detail-row strong{color:var(--text1);font-size:15px;font-weight:700;text-align:right}
.result-detail-row strong.primary{color:var(--primary)}
.result-detail-row strong.success{color:var(--success)}
.result-detail-row strong.error{color:var(--error)}
.result-actions{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:0}
.result-actions .btn-primary,.result-actions .btn-outline{height:40px;min-width:104px;justify-content:center;text-decoration:none}
.result-tertiary{color:var(--text2)}
@media (max-width:560px){
  .result-modal{padding:28px 22px}
  .result-actions{flex-direction:column-reverse;align-items:stretch}
  .result-actions .btn-primary,.result-actions .btn-outline{width:100%}
}
</style>
