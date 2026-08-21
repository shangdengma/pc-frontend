<template>
  <section class="public-announcements-page workspace-page workspace-page--narrow">
    <header class="page-head">
      <div class="page-head-main">
        <h2>平台公告</h2>
      </div>
    </header>

    <div class="announcement-toolbar">
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
      <span class="announcement-count">{{ filteredAnnouncements.length }} 条公告</span>
    </div>

    <div class="announcements-panel">
      <UiState v-if="loading" type="loading" title="正在加载公告" />
      <UiState
        v-else-if="error"
        type="error"
        title="公告加载失败"
        :description="error"
        action-label="重新加载"
        @action="loadAnnouncements"
      />
      <UiState
        v-else-if="filteredAnnouncements.length === 0"
        title="当前分类暂无公告"
        description="后续发布的平台通知会显示在这里。"
      />
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
import { useRefresh } from '../composables/pullRefresh'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarDays, Pin } from '@lucide/vue'
import AppModal from '../components/AppModal.vue'
import UiState from '../components/UiState.vue'
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
// 移动端下拉刷新复用同一个加载函数
useRefresh(loadAnnouncements)
</script>

<style scoped>
.public-announcements-page {
  width: min(960px, 100%);
  margin: 0 auto;
}

.public-announcements-page .page-head {
  margin-bottom: 24px;
}

.public-announcements-page .page-head h2 {
  font-size: 28px;
  line-height: 1.22;
}

.announcement-toolbar {
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

.announcement-tabs {
  display: flex;
  align-self: stretch;
  gap: 26px;
}

.announcement-tabs button {
  position: relative;
  height: 100%;
  padding: 0;
  border: 0;
  color: #7a8799;
  background: transparent;
  font-size: var(--fs-sm);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: color .14s ease;
}

.announcement-tabs button:hover { color: #4c5b70; }

.announcement-tabs button.active {
  color: #1a2940;
}

.announcement-tabs button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: #315a91;
}

.announcement-count {
  color: #7a8799;
  font-size: var(--fs-xs);
}

.announcements-panel {
  overflow: hidden;
  border: 1px solid #dce4ee;
  border-radius: 0 0 8px 8px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(31, 45, 68, 0.045);
}

.announcement-row {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) 124px;
  align-items: center;
  gap: 18px;
  width: 100%;
  min-height: 98px;
  padding: 18px 22px;
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
  background: #f8fafc;
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
  font-size: var(--fs-sm);
  font-weight: 700;
}

.announcement-tag.system { color: #315a91; background: #eaf2fb; }
.announcement-tag.policy { color: #326a53; background: #edf7f2; }
.announcement-tag.activity { color: #8a5b24; background: #fbf3e8; }
.announcement-tag.notice { color: #5e6d82; background: #f1f4f8; }

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
  margin-top: 8px;
  color: #7b8798;
  font-size: var(--fs-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-top {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-right: 8px;
  color: #b42318;
  font-size: var(--fs-xs);
  font-weight: 700;
}

.announcement-date,
.announcement-detail-date {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: #7b8798;
  font-size: var(--fs-sm);
}

.announcement-loading {
  padding: 12px 24px 24px;
}

.announcement-skeleton {
  height: 72px;
  margin-top: 12px;
  border-radius: var(--radius);
  background: linear-gradient(90deg, #f2f4f7 25%, var(--line-soft) 50%, #f2f4f7 75%);
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
  border-radius: var(--radius);
  color: var(--text-secondary);
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
  color: var(--text-secondary);
  line-height: 1.9;
  white-space: pre-wrap;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes skeleton { to { background-position: -200% 0; } }

@media (max-width: 760px) {
  .public-announcements-page .page-head h2 { font-size: 24px; }

  .announcement-toolbar {
    padding: 0 14px;
    overflow: hidden;
  }

  .announcement-tabs {
    flex: 1;
    gap: 18px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .announcement-tabs::-webkit-scrollbar { display: none; }

  .announcement-tabs button {
    flex: 0 0 auto;
    padding: 0;
    font-size: var(--fs-sm);
    white-space: nowrap;
  }

  .announcement-count { display: none; }

  /* 分类徽章原先独占左侧一列，把标题挤到只剩半屏、必然截断。
     改成徽章与日期共用顶行，标题拿到整行宽度并允许折两行。 */
  .announcement-row {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "tag  date"
      "body body";
    align-items: center;
    gap: 8px 10px;
    padding: 14px 16px;
    min-height: 0;
  }

  .announcement-tag { grid-area: tag; }

  .announcement-date {
    grid-area: date;
    justify-content: flex-end;
    font-size: var(--fs-xs);
  }

  .announcement-content { grid-area: body; }

  .announcement-content strong {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: normal;
    font-size: var(--fs-base);
    line-height: 1.45;
  }
}
</style>
