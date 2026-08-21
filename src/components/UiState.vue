<template>
  <div
    class="ui-state"
    :class="`ui-state--${type}`"
    :role="type === 'error' ? 'alert' : 'status'"
    :aria-live="type === 'error' ? 'assertive' : 'polite'"
  >
    <template v-if="type === 'loading'">
      <div class="ui-state__skeleton" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="sr-only">{{ title || '正在加载' }}</span>
    </template>

    <template v-else>
      <span class="ui-state__icon" aria-hidden="true">
        <CircleAlert v-if="type === 'error'" :size="22" :stroke-width="1.8" />
        <CircleCheck v-else-if="type === 'success'" :size="22" :stroke-width="1.8" />
        <Inbox v-else :size="22" :stroke-width="1.8" />
      </span>
      <strong>{{ title || defaultTitle }}</strong>
      <p v-if="description">{{ description }}</p>
      <button v-if="actionLabel" type="button" class="ghost-btn ui-state__action" @click="$emit('action')">
        <RefreshCw v-if="type === 'error'" :size="15" :stroke-width="2" />
        {{ actionLabel }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CircleAlert, CircleCheck, Inbox, RefreshCw } from '@lucide/vue'

const props = defineProps({
  type: {
    type: String,
    default: 'empty',
    validator: value => ['loading', 'empty', 'error', 'success'].includes(value)
  },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' }
})

defineEmits(['action'])

const defaultTitle = computed(() => ({
  empty: '暂无数据',
  error: '加载失败',
  success: '操作完成'
})[props.type] || '')
</script>

<style scoped>
.ui-state {
  min-height: 184px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 32px 24px;
  color: var(--muted);
  text-align: center;
}

.ui-state__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-bottom: 13px;
  border-radius: 12px;
  color: var(--muted);
  background: var(--line-soft);
}

.ui-state--error .ui-state__icon {
  color: var(--red);
  background: var(--red-soft);
}

.ui-state--success .ui-state__icon {
  color: var(--green);
  background: var(--green-soft);
}

.ui-state strong {
  color: var(--text);
  font-size: var(--fs-base);
  line-height: 1.45;
}

.ui-state p {
  max-width: 48ch;
  margin: 7px 0 0;
  font-size: var(--fs-sm);
  line-height: 1.65;
}

.ui-state__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 16px;
}

.ui-state__skeleton {
  width: min(520px, 100%);
  display: grid;
  gap: 12px;
}

.ui-state__skeleton span {
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #eef1f5 25%, #f8fafc 50%, #eef1f5 75%);
  background-size: 200% 100%;
  animation: ui-state-shimmer 1.25s ease-in-out infinite;
}

.ui-state__skeleton span:nth-child(2) { width: 84%; }
.ui-state__skeleton span:nth-child(3) { width: 62%; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes ui-state-shimmer {
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-state__skeleton span { animation: none; }
}

@media (max-width: 640px) {
  .ui-state { min-height: 156px; padding: 26px 18px; }
}
</style>
