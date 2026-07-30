<template>
  <div class="password-input-wrap">
    <input
      v-bind="$attrs"
      :value="modelValue"
      class="field-input password-input"
      :class="{ invalid }"
      :type="visible ? 'text' : 'password'"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <button
      type="button"
      class="password-eye-btn"
      :aria-label="visible ? '隐藏密码' : '显示密码'"
      @click="visible = !visible"
    >
      <svg v-if="!visible" viewBox="0 0 24 24" fill="none" class="password-eye-icon">
        <path d="M2.5 12S5.8 5.5 12 5.5 21.5 12 21.5 12 18.2 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" stroke-width="1.8"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" class="password-eye-icon">
        <path d="M3 3L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M10.6 5.7c.45-.13.91-.2 1.4-.2 6.2 0 9.5 6.5 9.5 6.5a17.7 17.7 0 0 1-2.75 3.55M6.42 6.98C3.83 8.72 2.5 12 2.5 12s3.3 6.5 9.5 6.5c1.64 0 3.08-.45 4.31-1.12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9.85 9.85a3.2 3.2 0 0 0 4.3 4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { type: String, default: '' },
  invalid: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])

const visible = ref(false)
</script>

<style scoped>
.password-input-wrap{position:relative}
.field-input{height:44px;border:1px solid var(--border);background:#fff;padding:0 14px;font-size:14px;color:var(--text1);outline:none;font-family:inherit}
.field-input:focus{border-color:var(--primary)}
.field-input.invalid{border-color:var(--error)}
.password-input{width:100%;padding-right:42px}
.password-input::-ms-reveal,
.password-input::-ms-clear{display:none;width:0;height:0}
.password-eye-btn{position:absolute;top:1px;right:1px;width:42px;height:42px;border:none;background:transparent;color:var(--text3);display:flex;align-items:center;justify-content:center;cursor:pointer}
.password-eye-btn:hover{background:#F8FAFC;color:var(--primary)}
.password-eye-icon{width:18px;height:18px;display:block}
</style>
