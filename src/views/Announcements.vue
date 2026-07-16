<template>
  <section class="messages-page">
    <div class="messages-hero">
      <div>
        <p class="eyebrow">消息中心</p>
        <h2>消息通知</h2>
      </div>
      <button class="ghost-light-btn" :disabled="loading" @click="loadMessages">
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <div class="message-tabs">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</button>
      <button :class="{ active: filter === 'unread' }" @click="filter = 'unread'">未读</button>
      <button :class="{ active: filter === 'read' }" @click="filter = 'read'">已读</button>
    </div>

    <div class="messages-panel">
      <div v-if="loading" class="state-box">正在加载消息...</div>
      <div v-else-if="filteredMessages.length === 0" class="state-box">暂无消息通知</div>
      <article v-for="item in filteredMessages" :key="item.id" class="message-card" :class="{ unread: !isRead(item) }" @click="openDetail(item)">
        <div class="message-status-dot"></div>
        <div class="message-main">
          <div class="message-title-row">
            <h3>{{ item.title || '消息通知' }}</h3>
            <span class="message-time">{{ formatTime(item.createTime) }}</span>
          </div>
          <p>{{ item.content || '-' }}</p>
          <div class="message-meta">
            <span v-for="channel in channelLabels(item.badge)" :key="channel" class="channel-tag">{{ channel }}</span>
            <span class="read-tag" :class="{ unread: !isRead(item) }">{{ isRead(item) ? '已读' : '未读' }}</span>
          </div>
        </div>
        <button v-if="!isRead(item)" class="text-btn" type="button" @click.stop="markRead(item)">标记已读</button>
      </article>
    </div>

    <AppModal
      :open="!!detail"
      :title="detail?.title || '消息通知'"
      eyebrow="消息详情"
      :description="detail ? formatTime(detail.createTime) : ''"
      size="md"
      @close="detail = null"
    >
      <template v-if="detail">
        <p class="detail-content">{{ detail.content || '-' }}</p>
        <div v-if="imageList(detail).length" class="message-images">
          <img v-for="url in imageList(detail)" :key="url" :src="url" alt="通知图片" />
        </div>
        <div class="detail-actions">
          <button v-if="!isRead(detail)" class="primary-btn" type="button" @click="markRead(detail)">标记已读</button>
          <a v-if="detail.link" class="ghost-btn" :href="detail.link">查看相关内容</a>
        </div>
      </template>
    </AppModal>
  </section>
</template>

<script setup>
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
</script>

<style scoped>
.messages-page {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.messages-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  min-height: auto;
  padding: 0 0 18px;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  border-radius: 0;
  color: #101828;
  background: transparent;
  box-shadow: none;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--blue);
  font-size: 13px;
  font-weight: 700;
}

.messages-hero h2 {
  margin: 0;
  font-size: 24px;
}

.messages-hero p:last-child {
  margin: 10px 0 0;
  color: var(--muted);
}

.ghost-light-btn {
  min-width: 92px;
  height: 38px;
  border: 1px solid #d8e1ee;
  border-radius: 7px;
  color: #344054;
  background: #ffffff;
  font-weight: 700;
}

.message-tabs {
  display: flex;
  gap: 0;
  margin: 16px 0 12px;
  padding: 3px;
  width: fit-content;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  background: #f6f8fb;
}

.message-tabs button {
  min-width: 82px;
  height: 36px;
  border: 0;
  border-radius: 6px;
  color: #667085;
  background: transparent;
  font-weight: 700;
}

.message-tabs button.active {
  color: var(--blue);
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.08);
}

.messages-panel {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--shadow-panel);
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
  min-height: 92px;
  padding: 18px 20px;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: #ffffff;
  box-shadow: none;
  cursor: pointer;
}

.message-card:hover {
  background: #f8fbff;
}

.message-card:last-child { border-bottom: 0; }

.message-status-dot {
  width: 10px;
  height: 10px;
  margin-top: 8px;
  border-radius: 50%;
  background: #cbd5e1;
}

.message-card.unread .message-status-dot {
  background: var(--blue);
  box-shadow: 0 0 0 4px #eaf1ff;
}

.message-main {
  flex: 1;
  min-width: 0;
}

.message-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.message-title-row h3 {
  margin: 0;
  color: #101828;
  font-size: 17px;
}

.message-time {
  flex: none;
  color: #98a2b3;
  font-size: 13px;
}

.message-main p {
  display: -webkit-box;
  overflow: hidden;
  margin: 8px 0 0;
  color: #667085;
  line-height: 1.7;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.message-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.channel-tag,
.read-tag {
  height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border-radius: 999px;
  color: #175cd3;
  background: #eff8ff;
  font-size: 12px;
  font-weight: 700;
}

.read-tag {
  color: #667085;
  background: #f2f4f7;
}

.read-tag.unread {
  color: #b54708;
  background: #fffaeb;
}

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
  border-radius: 8px;
  object-fit: cover;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 760px) {
  .messages-hero { align-items: stretch; flex-direction: column; }
  .ghost-light-btn { width: 100%; }
  .message-title-row { align-items: flex-start; flex-direction: column; gap: 6px; }
  .message-card { padding: 16px; }
}
</style>
