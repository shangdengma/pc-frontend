<template>
  <section class="public-announcements-page">
    <header class="page-head">
      <div class="page-head-main">
        <p class="page-head-eyebrow">日常业务</p>
        <h2>平台公告</h2>
        <p class="page-head-desc">查看系统公告、政策动态、平台活动和服务通知。</p>
      </div>
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
      <!-- 页头已经写明「平台公告 / 查看系统公告、政策动态…」，
           这里原本还有一组「公告列表 + 平台发布的公告对所有企业账号长期可见」，
           是同一句话说两遍，只留条数 -->
      <div class="announcements-panel-head">
        <span>{{ filteredAnnouncements.length }} 条公告</span>
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
import { useRefresh } from '../composables/pullRefresh'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarDays, CircleAlert, Megaphone, Pin } from '@lucide/vue'
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
// 移动端下拉刷新复用同一个加载函数
useRefresh(loadAnnouncements)
</script>

<style scoped>
.public-announcements-page {
  /* 与消息通知取同一宽度：两页都是用来扫的列表，行长要压下来 */
  width: min(960px, 100%);
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--blue);
  font-size: var(--fs-sm);
  font-weight: 700;
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

/* 与查询记录、消息通知统一为下划线式。
   原先是胶囊分段控件——同一个系统里出现两种 Tab 形态，
   正是「规则不统一」的典型表现。 */
.announcement-tabs {
  display: flex;
  gap: var(--sp-6);
  width: 100%;
  margin: var(--sp-4) 0 var(--sp-5);
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
}

.announcement-tabs button {
  position: relative;
  min-width: 0;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--muted);
  background: transparent;
  font-size: var(--fs-sm);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: color .14s ease;
}

.announcement-tabs button:hover { color: var(--text-secondary); }

.announcement-tabs button.active {
  color: var(--text);
  background: transparent;
  font-weight: 600;
  box-shadow: none;
}

.announcement-tabs button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--text);
}

.announcements-panel {
  overflow: hidden;
  border: 1px solid #e1e7ef;
  border-radius: var(--radius);
  background: #ffffff;
  box-shadow: var(--shadow-panel);
}

/* 只剩一个条数了，不需要原来那么厚的内边距 */
.announcements-panel-head {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 18px;
  border-bottom: 1px solid var(--line-soft);
}

.announcements-panel-head > span {
  margin: 0;
  color: var(--muted);
  font-size: var(--fs-xs);
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
  border-radius: var(--radius);
  font-size: var(--fs-sm);
  font-weight: 700;
}

.announcement-tag.system { color: #175cd3; background: #eff8ff; }
.announcement-tag.policy { color: #027a48; background: #ecfdf3; }
.announcement-tag.activity { color: #b54708; background: #fff6ed; }
.announcement-tag.notice { color: var(--text-secondary); background: #f2f4f7; }

.announcement-content,
.announcement-content strong,
.announcement-summary {
  display: block;
  min-width: 0;
}

.announcement-content strong {
  overflow: hidden;
  color: #17243a;
  font-size: var(--fs-base);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-summary {
  overflow: hidden;
  margin-top: 7px;
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

  .announcement-tabs {
    width: 100%;
    /* 五个分类在 375px 上正好平分；overflow 是将来加分类时的兜底 */
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .announcement-tabs::-webkit-scrollbar { display: none; }

  .announcement-tabs button {
    /* 桌面端的 min-width:72px 会把容器撑到 368px 超出屏宽，必须解除 */
    flex: 1 1 auto;
    min-width: 0;
    padding: 0 8px;
    font-size: var(--fs-sm);
    white-space: nowrap;
  }

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

@media (max-width: 768px) {
  .public-layout, .messages-layout { grid-template-columns: minmax(0, 1fr) !important; }
}
</style>
