<template>
  <AppModal
    :open="confirmState.open"
    :title="confirmState.title"
    size="sm"
    @close="resolveConfirm(false)"
  >
    <p class="confirm-copy">{{ confirmState.content }}</p>
    <template #footer>
      <button type="button" class="ghost-btn" @click="resolveConfirm(false)">
        {{ confirmState.cancelText }}
      </button>
      <button
        type="button"
        class="primary-btn confirm-button"
        :class="{ 'confirm-button--danger': confirmState.danger }"
        @click="resolveConfirm(true)"
      >
        {{ confirmState.confirmText }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import AppModal from './AppModal.vue'
import { confirmState, resolveConfirm } from '../utils/confirm'
</script>

<style scoped>
.confirm-copy {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--fs-base);
  line-height: 1.75;
  white-space: pre-line;
}

.confirm-button--danger {
  border-color: var(--red);
  background: var(--red);
}

.confirm-button--danger:hover:not(:disabled) {
  border-color: #b42318;
  background: #b42318;
}
</style>
