<template>
  <section class="messages-page">
    <header class="page-head">
      <div class="page-head-main">
        <p class="page-head-eyebrow">日常业务</p>
        <h2>消息通知</h2>
      </div>
    </header>

    <div class="message-tabs">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</button>
      <button :class="{ active: filter === 'unread' }" @click="filter = 'unread'">未读</button>
      <button :class="{ active: filter === 'read' }" @click="filter = 'read'">已读</button>
    </div>

    <div class="messages-panel">
      <div v-if="loading" class="state-box">正在加载消息...</div>
      <div v-else-if="filteredMessages.length === 0" class="state-box">暂无消息通知</div>
      <!-- 两行结构：标题+时间 / 摘要+操作。
           去掉了原来的「站内信」标签（用户就在站内信页里，是废话）
           和「已读/未读」标签（左侧圆点已经表达） -->
      <article v-for="item in filteredMessages" :key="item.id" class="message-card" :class="{ unread: !isRead(item) }" @click="openDetail(item)">
        <span class="message-status-dot" :title="isRead(item) ? '已读' : '未读'"></span>
        <div class="message-main">
          <div class="message-line-1">
            <h3>{{ item.title || '消息通知' }}</h3>
            <time>{{ formatTime(item.createTime) }}</time>
          </div>
          <div class="message-line-2">
            <p>{{ item.content || '-' }}</p>
            <button v-if="!isRead(item)" class="msg-read-btn" type="button" @click.stop="markRead(item)">标记已读</button>
          </div>
        </div>
      </article>
    </div>

    <AppModal
      :open="!!detail"
      :title="detail?.title || '消息通知'"
      eyebrow="消息详情"
      :description="detail ? formatTime(detail.createTime) : ''"
      size="md"
      :footer-visible="!!detail && (!isRead(detail) || !!detail.link)"
      @close="detail = null"
    >
      <template v-if="detail">
        <p class="detail-content">{{ detail.content || '-' }}</p>
        <div v-if="imageList(detail).length" class="message-images">
          <img v-for="url in imageList(detail)" :key="url" :src="url" alt="通知图片" />
        </div>
      </template>
      <template #footer>
        <template v-if="detail">
          <button v-if="!isRead(detail)" class="primary-btn" type="button" @click="markRead(detail)">标记已读</button>
          <a v-if="detail.link" class="ghost-btn" :href="detail.link">查看相关内容</a>
        </template>
      </template>
    </AppModal>
  </section>
</template>

<script setup>
import { useRefresh } from '../composables/pullRefresh'
import { computed, onMounted, ref } from 'vue'
import AppModal from '../components/AppModal.vue'
import { getUserNotices, markNoticeRead } from '../api/notice'
import { getUser } from '../utils/auth'
import { formatDateTime } from '../utils/format'

const loading = ref(false)
const messages = ref([])
const detail = ref(null)
const filter = ref('all')

const filteredMessages = computed(() => messages.value.filter(item => {
  if (filter.value === 'unread') return !isRead(item)
  if (filter.value === 'read') return isRead(item)
  return true
}))

function isRead(item) {
  return Number(item.status) === 1
}

function formatTime(value) {
  return value ? formatDateTime(value) : '-'
}

function channelLabels(value) {
  const raw = String(value || '站内信')
  return raw.split(',').map(item => item.trim()).filter(Boolean)
}

function imageList(item) {
  const raw = item?.pictureUrls || ''
  return raw.split(',').map(url => url.trim()).filter(Boolean)
}

async function loadMessages() {
  loading.value = true
  try {
    const user = getUser()
    const res = await getUserNotices(user.userId, { pageNum: 1, pageSize: 100 })
    messages.value = res.rows || []
  } finally {
    loading.value = false
  }
}

function openDetail(item) {
  detail.value = item
}

async function markRead(item) {
  await markNoticeRead(item.id)
  item.status = 1
  if (detail.value && detail.value.id === item.id) {
    detail.value.status = 1
  }
}

onMounted(loadMessages)
// 移动端下拉刷新复用同一个加载函数
useRefresh(loadMessages)
</script>

<style scoped>
.messages-page {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--blue);
  font-size: var(--fs-sm);
  font-weight: 700;
}

.ghost-light-btn {
  min-width: 92px;
  height: 38px;
  border: 1px solid #d8e1ee;
  border-radius: var(--radius);
  color: #344054;
  background: #ffffff;
  font-weight: 700;
}

/* 下划线式切换，去掉胶囊底色块 */
.message-tabs {
  display: flex;
  gap: var(--sp-6);
  /* 同上：Tab 与下方消息面板之间需要留出呼吸，否则两条横线叠在一起 */
  margin: var(--sp-4) 0 var(--sp-5);
  padding: 0;
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
}

.message-tabs button {
  position: relative;
  min-width: 0;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--muted);
  background: transparent;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
}

.message-tabs button.active {
  color: var(--text);
  background: transparent;
  font-weight: 600;
  box-shadow: none;
}
.message-tabs button.active::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -1px;
  height: 2px;
  background: var(--text);
}

/* 一整块面 + 细线分行，而不是一条消息一张卡 */
.messages-panel {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  box-shadow: none;
}

.state-box {
  min-height: 260px;
  display: grid;
  place-items: center;
  border: 0;
  color: #667085;
  background: #ffffff;
}

.message-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 13px 18px;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: #ffffff;
  box-shadow: none;
  cursor: pointer;
}

.message-card:hover {
  background: var(--line-soft);
}

.message-card:last-child { border-bottom: 0; }

/* 标签退化为纯文字：一行里堆两三个彩色胶囊，整列看下来就是密密麻麻的色块 */

.text-btn {
  border: 0;
  color: var(--blue);
  background: transparent;
  font-weight: 700;
}

.detail-content {
  margin: 0;
  color: #344054;
  line-height: 1.9;
  white-space: pre-wrap;
}

.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.message-images img {
  width: 138px;
  height: 96px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  object-fit: cover;
}

@media (max-width: 760px) {
  .ghost-light-btn { width: 100%; }
  .message-title-row { align-items: flex-start; flex-direction: column; gap: 6px; }
  .message-card { padding: 16px; }
}

/* 移动端：公告列表与正文改为上下排列 */
@media (max-width: 768px) {
  .messages-layout { grid-template-columns: minmax(0, 1fr) !important; }
}

/* ---- 消息行：两行结构，密度优先 ---- */
.message-card {
  align-items: flex-start;
  gap: 12px;
}

.message-status-dot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  margin-top: 7px;
  border-radius: 50%;
  background: transparent;
}

.message-card.unread .message-status-dot {
  background: var(--cinnabar);
}

.message-main {
  flex: 1;
  min-width: 0;
}

.message-line-1 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.message-line-1 h3 {
  margin: 0;
  font-size: var(--fs-base);
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-card.unread .message-line-1 h3 {
  font-weight: 600;
  color: var(--text);
}

.message-line-1 time {
  flex: 0 0 auto;
  font-size: var(--fs-xs);
  color: var(--faint);
  font-variant-numeric: tabular-nums;
}

.message-line-2 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;
}

/* 摘要只占一行，超出省略——列表是用来扫的，细节点进去看 */
.message-line-2 p {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: var(--fs-sm);
  line-height: 1.6;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.msg-read-btn {
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted);
  font-size: var(--fs-xs);
  cursor: pointer;
  opacity: 0;
  transition: opacity .14s ease, color .14s ease;
}

/* 「标记已读」平时隐藏，悬停整行才出现，避免每行都挂个按钮 */
.message-card:hover .msg-read-btn { opacity: 1; }
.msg-read-btn:hover { color: var(--text); }

@media (max-width: 768px) {
  /* 手机没有 hover，按钮只能常驻；但常驻后它是无边框纯文字、又落在正文正下方，
     读起来像正文的最后一行，所以这里给它明确的按钮外观并靠右站开 */
  .msg-read-btn {
    opacity: 1;
    align-self: flex-end;
    margin-top: 2px;
    padding: 5px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    background: #fff;
  }

  .message-line-1 { flex-direction: column; align-items: flex-start; gap: 2px; }
  .message-line-2 { flex-direction: column; align-items: flex-start; gap: 4px; }
  .message-line-2 p { white-space: normal; }
}
</style>
