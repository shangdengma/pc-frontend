<template>
  <div v-if="message" class="form-alert" :class="type" role="status">
    <span class="form-alert-icon" aria-hidden="true">
      <svg v-if="type === 'success'" viewBox="0 0 24 24" fill="none">
        <path d="M7 12.5L10.2 15.7L17 8.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else-if="type === 'error'" viewBox="0 0 24 24" fill="none">
        <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
      </svg>
      <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none">
        <path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M10.4 4.4L2.7 18A2 2 0 0 0 4.4 21H19.6A2 2 0 0 0 21.3 18L13.6 4.4A1.85 1.85 0 0 0 10.4 4.4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none">
        <path d="M12 11V17M12 7H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
      </svg>
    </span>
    <span class="form-alert-text">{{ message }}</span>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }
})
</script>

<style scoped>
.form-alert{display:flex;align-items:flex-start;gap:10px;margin-top:12px;padding:11px 12px;border:1px solid var(--border);background:#fff;color:var(--text2);font-size:13px;line-height:1.55;text-align:left}
.form-alert-icon{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 18px;margin-top:1px;color:var(--primary)}
.form-alert-icon svg{width:18px;height:18px}
.form-alert-text{min-width:0}
.form-alert.info{border-color:#CFE0F8;background:#F8FBFF;color:#315985}
.form-alert.info .form-alert-icon{color:var(--primary)}
.form-alert.success{border-color:#BFEAD5;background:#F7FEFA;color:#067647}
.form-alert.success .form-alert-icon{color:var(--success)}
.form-alert.error{border-color:#F5C5C5;background:#FFF8F8;color:#B42318}
.form-alert.error .form-alert-icon{color:var(--error)}
.form-alert.warning{border-color:#F8DDAA;background:#FFFCF5;color:#B54708}
.form-alert.warning .form-alert-icon{color:var(--warning)}
</style>
