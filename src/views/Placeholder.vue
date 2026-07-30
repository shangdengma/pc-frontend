<template>
  <main class="main-content">
    <div class="placeholder">
      <div class="ph-mark">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C5.46 2 5 2.46 5 3V21C5 21.54 5.46 22 6 22H18C18.54 22 19 21.54 19 21V7L14 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M14 2V7H19" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="ph-title">{{ title }} · 页面建设中</div>
      <div>该模块将按新设计规范（dashboard.html）逐步接入。</div>
    </div>
  </main>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const title = route.meta.title || '模块'
</script>
