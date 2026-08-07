<template>
  <section class="messages-page workspace-page workspace-page--narrow">
    <header class="page-head">
      <div class="page-head-main">
        <h2>消息通知</h2>
      </div>
    </header>

    <div class="message-toolbar">
      <nav class="message-tabs" aria-label="消息筛选">
        <button :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</button>
        <button :class="{ active: filter === 'unread' }" @click="filter = 'unread'">未读</button>
        <button :class="{ active: filter === 'read' }" @click="filter = 'read'">已读</button>
      </nav>
      <span class="message-count">{{ unreadCount ? `${unreadCount} 条未读` : '全部已读' }}</span>
    </div>

    <div class="messages-panel">
      <div v-if="loading" class="state-box">正在加载消息...</div>
      <div v-else-if="filteredMessages.length === 0" class="state-box">暂无消息通知</div>
      <article v-for="item in filteredMessages" :key="item.id" class="message-card" :class="{ unread: !isRead(item) }" @click="openDetail(item)">
        <span class="message-icon" :class="{ unread: !isRead(item) }" aria-hidden="true">
          <Mail v-if="!isRead(item)" :size="18" />
          <MailOpen v-else :size="18" />
        </span>
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
import { Mail, MailOpen } from '@lucide/vue'
import AppModal from '../components/AppModal.vue'
import { getUserNotices, markNoticeRead } from '../api/notice'
import { getUser } from '../utils/auth'

const loading = ref(false)
const messages = ref([])
const detail = ref(null)
const filter = ref('all')
const unreadCount = computed(() => messages.value.filter(item => !isRead(item)).length)

const filteredMessages = computed(() => messages.value.filter(item => {
  if (filter.value === 'unread') return !isRead(item)
  if (filter.value === 'read') return isRead(item)
  return true
}))

function isRead(item) {
  return Number(item.status) === 1
}

function formatTime(value) {
  if (!value) return '-'
  const text = String(value)
  return text.length >= 16 ? text.slice(0, 16) : text
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
    window.dispatchEvent(new CustomEvent('zk:notice-count-refresh'))
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
  window.dispatchEvent(new CustomEvent('zk:notice-count-refresh'))
}

onMounted(loadMessages)
// 移动端下拉刷新复用同一个加载函数
useRefresh(loadMessages)
</script>

<style scoped>
.messages-page {
  width: min(960px, 100%);
  margin: 0 auto;
}

.messages-page .page-head {
  margin-bottom: 24px;
}

.messages-page .page-head h2 {
  font-size: 28px;
  line-height: 1.22;
}

.message-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 0 18px;
  border: 1px solid #dce4ee;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: #fbfcfe;
}

.message-tabs {
  display: flex;
  align-self: stretch;
  gap: 26px;
}

.message-tabs button {
  position: relative;
  height: 100%;
  padding: 0;
  border: 0;
  color: #7a8799;
  background: transparent;
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
}

.message-tabs button.active {
  color: #1a2940;
}

.message-tabs button.active::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #315a91;
}

.message-count {
  color: #7a8799;
  font-size: var(--fs-xs);
}

.messages-panel {
  overflow: hidden;
  border: 1px solid #dce4ee;
  border-radius: 0 0 8px 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(31, 45, 68, 0.045);
}

.state-box {
  min-height: 300px;
  display: grid;
  place-items: center;
  color: #7a8799;
  background: #fff;
}

.message-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-height: 92px;
  padding: 18px 22px;
  border: 0;
  border-bottom: 1px solid #e7edf4;
  background: #fff;
  cursor: pointer;
  transition: background-color .14s ease;
}

.message-card:hover {
  background: #f8fafc;
}

.message-card:last-child { border-bottom: 0; }

.message-icon {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #7f8b9d;
  background: #f1f4f8;
}

.message-icon.unread {
  color: #315a91;
  background: #eaf2fb;
}

.detail-content {
  margin: 0;
  color: var(--text-secondary);
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

.message-main {
  flex: 1;
  min-width: 0;
}

.message-line-1 {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.message-line-1 h3 {
  margin: 0;
  flex: 0 1 auto;
  font-size: var(--fs-base);
  font-weight: 600;
  color: #4c5b70;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-card.unread .message-line-1 h3 {
  color: #17243a;
  font-weight: 700;
}

.message-line-1 time {
  flex: 0 0 auto;
  margin-left: auto;
  font-size: var(--fs-xs);
  color: #8b97a8;
  font-variant-numeric: tabular-nums;
}

.message-line-2 {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-top: 4px;
}

.message-line-2 p {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: var(--fs-sm);
  line-height: 1.6;
  color: #7a8799;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.msg-read-btn {
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: none;
  color: #5e6d82;
  font-size: var(--fs-xs);
  cursor: pointer;
  opacity: 0;
  transition: opacity .14s ease, color .14s ease;
}

.message-card:hover .msg-read-btn { opacity: 1; }
.msg-read-btn:hover { color: #1a2940; }

@media (max-width: 768px) {
  .messages-page .page-head h2 { font-size: 24px; }
  .message-toolbar { padding: 0 14px; }
  .message-tabs { gap: 20px; }
  .message-card { min-height: 0; padding: 16px; }
  .message-icon { width: 34px; height: 34px; }
  .msg-read-btn {
    opacity: 1;
    align-self: flex-end;
    margin-top: 2px;
    padding: 5px 12px;
    border: 1px solid #dce4ee;
    border-radius: 6px;
    color: #4c5b70;
    background: #fff;
  }

  .message-line-1 { flex-direction: column; align-items: flex-start; gap: 2px; }
  .message-line-2 { flex-direction: column; align-items: flex-start; gap: 4px; }
  .message-line-2 p { white-space: normal; }
}
</style>
