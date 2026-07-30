<template>
  <div class="notfound">
    <div class="nf-code">404</div>
    <h2 class="nf-title">页面不存在</h2>
    <p class="nf-desc">你访问的页面已移动、删除或暂未上线</p>
    <router-link to="/dashboard" class="btn-primary nf-back">
      <svg viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      返回工作台
    </router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.notfound{height:100vh;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.nf-code{font-size:96px;font-weight:800;color:var(--primary);letter-spacing:4px;line-height:1;opacity:.15}
.nf-title{font-size:22px;font-weight:700;color:var(--text1);margin-top:-40px}
.nf-desc{font-size:14px;color:var(--text2)}
.nf-back{height:44px;padding:0 24px;margin-top:8px;text-decoration:none}
</style>
