<template>
  <main class="not-found">
    <router-link class="not-found__brand" to="/login" aria-label="返回钟馗背调登录页">
      <span aria-hidden="true">钟馗</span>
      <strong>钟馗背调</strong>
    </router-link>

    <section class="not-found__panel">
      <span class="not-found__icon" aria-hidden="true">
        <FileQuestion :size="30" :stroke-width="1.7" />
      </span>
      <p>页面无法访问</p>
      <h1>没有找到这个页面</h1>
      <div>地址可能填写有误，或页面已经调整位置。</div>
      <nav aria-label="页面导航">
        <router-link class="primary-btn" to="/dashboard">返回工作台</router-link>
        <button class="ghost-btn" type="button" @click="$router.back()">返回上一页</button>
      </nav>
    </section>
  </main>
</template>

<script setup>
import { FileQuestion } from '@lucide/vue'
</script>

<style scoped>
.not-found {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 88px 24px 48px;
  background: var(--bg);
}

.not-found__brand {
  position: absolute;
  top: 28px;
  left: 32px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
}

.not-found__brand > span {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  color: #fff;
  background: var(--cinnabar);
  font-family: "Songti SC", "SimSun", serif;
  font-size: 11px;
  font-weight: 700;
  writing-mode: vertical-rl;
  transform: rotate(-2deg);
}

.not-found__brand strong { font-size: var(--fs-base); }

.not-found__panel {
  width: min(560px, 100%);
  padding: 56px 48px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--card);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.not-found__icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  margin: 0 auto 20px;
  border-radius: 16px;
  color: var(--cinnabar);
  background: #fbf0ef;
}

.not-found__panel p {
  margin: 0 0 8px;
  color: var(--cinnabar);
  font-size: var(--fs-xs);
  font-weight: 700;
}

.not-found__panel h1 {
  margin: 0;
  color: var(--text);
  font-size: 30px;
  line-height: 1.3;
}

.not-found__panel > div {
  margin-top: 12px;
  color: var(--muted);
  font-size: var(--fs-base);
}

.not-found__panel nav {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 30px;
}

.not-found__panel nav > * {
  min-width: 116px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 560px) {
  .not-found { align-items: start; padding: 104px 16px 32px; }
  .not-found__brand { top: 22px; left: 20px; }
  .not-found__panel { padding: 42px 22px; }
  .not-found__panel h1 { font-size: 25px; }
  .not-found__panel nav { flex-direction: column; }
  .not-found__panel nav > * { width: 100%; }
}
</style>
