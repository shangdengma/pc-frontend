<template>
  <section class="public-announcements-page">
    <header class="public-announcements-hero">
      <div>
        <p class="eyebrow">公告中心</p>
        <h2>平台公告</h2>
        <p>查看系统公告、政策动态、平台活动和服务通知。</p>
      </div>
      <button class="ghost-light-btn refresh-btn" type="button" :disabled="loading" @click="loadAnnouncements">
        <RefreshCw :size="16" :class="{ spinning: loading }" />
        {{ loading ? '刷新中' : '刷新' }}
      </button>
    </header>

    <nav class="announcement-tabs" aria-label="公告分类">
      <button
        v-for="item in filters"
        :key="item.value"
        type="button"
        :class="{ active: filter === item.value }"
        @click="filter = item.value"
      >
        {{ item.label }}
      </button>
    </nav>

    <div class="announcements-panel">
      <div class="announcements-panel-head">
        <div>
          <h3>公告列表</h3>
          <p>平台发布的公告对所有企业账号长期可见</p>
        </div>
        <span>{{ filteredAnnouncements.length }} 条</span>
      </div>

      <div v-if="loading" class="announcement-loading" aria-label="正在加载公告">
        <div v-for="index in 4" :key="index" class="announcement-skeleton"></div>
      </div>
      <div v-else-if="error" class="state-box announcement-error">
        <CircleAlert :size="22" />
        <span>{{ error }}</span>
        <button type="button" @click="loadAnnouncements">重新加载</button>
      </div>
      <div v-else-if="filteredAnnouncements.length === 0" class="state-box announcement-empty">
        <Megaphone :size="28" :stroke-width="1.6" />
        <span>当前分类暂无公告</span>
      </div>
      <div v-else class="announcement-list">
        <button
          v-for="item in filteredAnnouncements"
          :key="item.id"
          class="announcement-row"
          type="button"
          @click="detail = item"
        >
          <span class="announcement-tag" :class="item.type">{{ item.tag }}</span>
          <span class="announcement-content">
            <strong>
              <span v-if="item.isTop" class="announcement-top"><Pin :size="13" />置顶</span>
              {{ item.title }}
            </strong>
            <span class="announcement-summary">{{ item.content || '点击查看公告详情' }}</span>
          </span>
          <span class="announcement-date"><CalendarDays :size="15" />{{ item.date || '-' }}</span>
        </button>
      </div>
    </div>

    <AppModal
      :open="!!detail"
      :title="detail?.title || '平台公告'"
      eyebrow="公告详情"
      :description="detail?.date || '-'"
      size="lg"
      @close="detail = null"
    >
      <template v-if="detail">
        <div class="announcement-detail-head">
          <span class="announcement-tag" :class="detail.type">{{ detail.tag }}</span>
          <span v-if="detail.isTop" class="announcement-top"><Pin :size="13" />置顶</span>
        </div>
        <div class="announcement-detail-content">{{ detail.content || '暂无公告正文' }}</div>
      </template>
    </AppModal>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarDays, CircleAlert, Megaphone, Pin, RefreshCw } from '@lucide/vue'
import AppModal from '../components/AppModal.vue'
import { getAnnouncements } from '../api/notice'

const route = useRoute()
const loading = ref(false)
const error = ref('')
const announcements = ref([])
const detail = ref(null)
const filter = ref('all')

const filters = [
  { label: '全部', value: 'all' },
  { label: '系统', value: 'system' },
  { label: '政策', value: 'policy' },
  { label: '活动', value: 'activity' },
  { label: '通知', value: 'notice' }
]

const filteredAnnouncements = computed(() => {
  if (filter.value === 'all') return announcements.value
  return announcements.value.filter(item => item.type === filter.value)
})

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function noticeTypeMeta(value) {
  const type = String(value || '').toLowerCase()
  const map = {
    system: { tag: '系统', type: 'system' },
    policy: { tag: '政策', type: 'policy' },
    activity: { tag: '活动', type: 'activity' },
    notice: { tag: '通知', type: 'notice' },
    '系统': { tag: '系统', type: 'system' },
    '政策': { tag: '政策', type: 'policy' },
    '活动': { tag: '活动', type: 'activity' },
    '通知': { tag: '通知', type: 'notice' },
    '1': { tag: '通知', type: 'notice' },
    '2': { tag: '系统', type: 'system' }
  }
  return map[type] || { tag: '系统', type: 'system' }
}

function normalizeAnnouncement(item) {
  const meta = noticeTypeMeta(item.noticeType)
  return {
    id: item.noticeId,
    title: item.noticeTitle || '平台公告',
    content: stripHtml(item.noticeContent),
    date: String(item.createTime || '').slice(0, 10),
    tag: meta.tag,
    type: meta.type,
    isTop: item.topFlag === '1' || item.topFlag === 1
  }
}

function openRouteAnnouncement() {
  const noticeId = String(route.query.noticeId || '')
  if (!noticeId) return
  const matched = announcements.value.find(item => String(item.id) === noticeId)
  if (matched) detail.value = matched
}

async function loadAnnouncements() {
  loading.value = true
  error.value = ''
  try {
    const res = await getAnnouncements({ pageNum: 1, pageSize: 100 })
    announcements.value = (res.rows || [])
      .map(normalizeAnnouncement)
      .sort((a, b) => Number(b.isTop) - Number(a.isTop) || String(b.date).localeCompare(String(a.date)))
    openRouteAnnouncement()
  } catch (err) {
    error.value = err?.msg || err?.message || '公告加载失败，请稍后重试'
    announcements.value = []
  } finally {
    loading.value = false
  }
}

watch(() => route.query.noticeId, openRouteAnnouncement)
onMounted(loadAnnouncements)
</script>

<style scoped>
.public-announcements-page {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.public-announcements-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  min-height: auto;
  padding: 0 0 18px;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--blue);
  font-size: 13px;
  font-weight: 700;
}

.public-announcements-hero h2 {
  margin: 0;
  color: #17243a;
  font-size: 24px;
}

.public-announcements-hero p:last-child {
  margin: 8px 0 0;
  color: var(--muted);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

.announcement-tabs {
  display: flex;
  width: fit-content;
  margin: 16px 0 12px;
  padding: 3px;
  border: 1px solid #dfe6ef;
  border-radius: 7px;
  background: #f7f9fc;
}

.announcement-tabs button {
  min-width: 72px;
  height: 34px;
  border: 0;
  border-radius: 5px;
  color: #667085;
  background: transparent;
  font-weight: 700;
  cursor: pointer;
}

.announcement-tabs button.active {
  color: #174ea6;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 35, 65, 0.09);
}

.announcements-panel {
  overflow: hidden;
  border: 1px solid #e1e7ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--shadow-panel);
}

.announcements-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.announcements-panel-head h3 {
  margin: 0 0 5px;
  color: #17243a;
  font-size: 18px;
}

.announcements-panel-head p,
.announcements-panel-head > span {
  margin: 0;
  color: #7b8798;
  font-size: 13px;
}

.announcement-row {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) 118px;
  align-items: center;
  gap: 18px;
  width: 100%;
  min-height: 88px;
  padding: 16px 24px;
  border: 0;
  border-bottom: 1px solid var(--line-soft);
  color: inherit;
  text-align: left;
  background: #ffffff;
  cursor: pointer;
}

.announcement-row:last-child {
  border-bottom: 0;
}

.announcement-row:hover {
  background: #f8fbff;
}

.announcement-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 48px;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
}

.announcement-tag.system { color: #175cd3; background: #eff8ff; }
.announcement-tag.policy { color: #027a48; background: #ecfdf3; }
.announcement-tag.activity { color: #b54708; background: #fff6ed; }
.announcement-tag.notice { color: #475467; background: #f2f4f7; }

.announcement-content,
.announcement-content strong,
.announcement-summary {
  display: block;
  min-width: 0;
}

.announcement-content strong {
  overflow: hidden;
  color: #17243a;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-summary {
  overflow: hidden;
  margin-top: 7px;
  color: #7b8798;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-top {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-right: 8px;
  color: #b42318;
  font-size: 12px;
  font-weight: 700;
}

.announcement-date,
.announcement-detail-date {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: #7b8798;
  font-size: 13px;
}

.announcement-loading {
  padding: 12px 24px 24px;
}

.announcement-skeleton {
  height: 72px;
  margin-top: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f2f4f7 25%, #f8fafc 50%, #f2f4f7 75%);
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
}

.announcement-error,
.announcement-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 280px;
}

.announcement-error button {
  height: 36px;
  padding: 0 14px;
  border: 1px solid #d0d9e5;
  border-radius: 6px;
  color: #344054;
  background: #ffffff;
  cursor: pointer;
}

.announcement-detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.announcement-detail-date {
  justify-content: flex-start;
  margin: 0 0 22px;
}

.announcement-detail-content {
  padding-top: 22px;
  border-top: 1px solid var(--line-soft);
  color: #344054;
  line-height: 1.9;
  white-space: pre-wrap;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes skeleton { to { background-position: -200% 0; } }

@media (max-width: 760px) {
  .public-announcements-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .announcement-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .announcement-tabs button {
    flex: 1 0 68px;
  }

  .announcement-row {
    grid-template-columns: 54px minmax(0, 1fr);
    gap: 12px;
    padding: 15px 16px;
  }

  .announcement-date {
    grid-column: 2;
    justify-content: flex-start;
  }
}
</style>
