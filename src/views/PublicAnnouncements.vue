<template>
  <main class="main-content notice-list-page">
    <div class="notice-panel-head">
      <div>
        <h3>公告列表</h3>
        <p>平台发布的公告对所有企业账号长期可见</p>
      </div>
      <span>{{ filtered.length }} 条</span>
    </div>

    <!-- Tab -->
    <div class="tab-bar">
      <button v-for="t in tabs" :key="t.key" class="tab-item" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- 公告列表 -->
    <div class="card list-card">
      <div v-if="filtered.length === 0" class="empty">暂无公告</div>
      <div v-else class="notice-list">
        <div v-for="item in pagedNotices" :key="item.id" class="notice-item" :class="{ selected: detail && detail.id === item.id }" @click="openDetail(item)">
          <span class="notice-tag" :class="item.type">{{ item.tag }}</span>
          <div class="notice-content">
            <div class="notice-title">
              <span v-if="item.topFlag" class="title-pin">置顶</span>
              {{ item.title }}
            </div>
            <div class="notice-preview">{{ item.content || '点击查看公告详情' }}</div>
          </div>
          <div class="notice-time">{{ item.time }}</div>
        </div>
      </div>
      <BusinessTableFooter
        v-if="filtered.length > 0"
        :total="filtered.length"
        :page="page"
        :page-size="pageSize"
        :total-pages="totalPages"
        @update:page-size="changeNoticePageSize"
        @page-change="changeNoticePage"
      />
    </div>

    <!-- 详情弹窗 -->
    <AppModal v-model="detailOpen" :title="detail?.title || '平台公告'" eyebrow="公告详情" :description="detail?.time || ''" size="md">
      <template v-if="detail">
        <div class="notice-detail-meta">
          <span class="notice-tag" :class="detail.type">{{ detail.tag }}</span>
          <span v-if="detail.topFlag" class="notice-detail-pin">置顶</span>
        </div>
        <div class="message-detail-body public-notice-detail-body">
          <p>{{ detail.content || '暂无公告正文' }}</p>
        </div>
      </template>
      <template #footer>
        <button class="btn-primary message-confirm-btn" type="button" @click="detail = null">确认</button>
      </template>
    </AppModal>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppModal from '../components/AppModal.vue'
import BusinessTableFooter from '../components/BusinessTableFooter.vue'
import { getAnnouncements } from '../api/notice'

const route = useRoute()
const router = useRouter()
const tabs = [{ key: 'all', label: '全部' }, { key: 'system', label: '系统' }, { key: 'policy', label: '政策' }, { key: 'activity', label: '活动' }, { key: 'notice', label: '通知' }]
const activeTab = ref('all')
const detail = ref(null)
const notices = ref([])
const page = ref(1)
const pageSize = ref(10)

const filtered = computed(() => {
  let list = [...notices.value].sort((a, b) => Number(b.topFlag) - Number(a.topFlag) || String(b.time).localeCompare(String(a.time)))
  if (activeTab.value !== 'all') list = list.filter(n => n.type === activeTab.value)
  return list
})
const detailOpen = computed({
  get: () => !!detail.value,
  set: value => {
    if (!value) detail.value = null
  }
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const pagedNotices = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
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
  return map[type] || { tag: '通知', type: 'notice' }
}
function openDetail(item) { detail.value = item }
function changeNoticePageSize(size) {
  pageSize.value = size
  page.value = 1
}
function changeNoticePage(nextPage) {
  page.value = nextPage
}
function clearRouteDetailQuery() {
  if (route.query.id == null && route.query.noticeId == null) return
  const { id, noticeId, ...query } = route.query
  router.replace({ path: route.path, query })
}
function openQueryDetail() {
  const id = route.query.id || route.query.noticeId
  if (!id) return
  const target = notices.value.find(item => String(item.id) === String(id))
  if (target) {
    detail.value = target
    clearRouteDetailQuery()
  }
}

function mapNotice(item) {
  const meta = noticeTypeMeta(item.noticeType || item.type)
  return {
    id: item.noticeId || item.id,
    title: item.noticeTitle || item.title || '平台公告',
    content: stripHtml(item.noticeContent || item.content),
    time: String(item.createTime || item.time || '').slice(0, 10),
    tag: meta.tag,
    type: meta.type,
    topFlag: item.topFlag === true || item.topFlag === '1' || item.topFlag === 1
  }
}

async function loadNotices() {
  const params = { pageNum: 1, pageSize: 100 }
  if (activeTab.value !== 'all') params.noticeType = activeTab.value
  const res = await getAnnouncements(params)
  notices.value = (res.rows || []).map(mapNotice)
  openQueryDetail()
}

watch(activeTab, () => {
  page.value = 1
  loadNotices()
})
watch(pageSize, () => {
  page.value = 1
})
watch(filtered, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})
watch(() => [route.query.id, route.query.noticeId], openQueryDetail)
onMounted(loadNotices)
</script>

<style scoped>
.notice-list-page{gap:0;min-height:0;overflow:hidden}
.notice-panel-head{min-height:72px;padding:16px 24px;border:1px solid var(--border);border-bottom:0;display:flex;align-items:center;justify-content:space-between;gap:16px;background:#fff;flex-shrink:0}
.notice-panel-head h3{margin:0;color:var(--text1);font-size:16px;font-weight:700}
.notice-panel-head p{margin:6px 0 0;color:var(--text3);font-size:13px}
.notice-panel-head>span{color:var(--text3);font-size:13px;white-space:nowrap}
.notice-list-page .tab-bar{border:1px solid var(--border);border-bottom:0;flex-shrink:0}
.list-card{padding:0;overflow:hidden;display:flex;flex:1;min-height:0;flex-direction:column;border-top:0}
.notice-list{display:block;flex:1;min-height:0;overflow-y:auto}
.list-card .empty{flex:1;display:flex;align-items:center;justify-content:center}
.notice-item{display:grid;grid-template-columns:62px minmax(0,1fr)120px;align-items:center;gap:20px;min-height:96px;padding:18px 24px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background .12s}
.notice-item:last-child{border-bottom:none}
.notice-item:hover{background:#F8FAFC}
.notice-item.selected{background:#EEF4FF}

.notice-tag{height:28px;display:inline-flex;align-items:center;justify-content:center;padding:0 12px;font-size:12px;font-weight:700;white-space:nowrap}
.notice-tag.system{background:var(--primary-light);color:var(--primary)}
.notice-tag.policy{background:var(--warning-bg);color:var(--warning)}
.notice-tag.activity{background:#F1ECFB;color:#6D4FD6}
.notice-tag.notice{background:var(--success-bg);color:var(--success)}
.title-pin{height:22px;display:inline-flex;align-items:center;padding:0 8px;margin-right:8px;background:var(--warning-bg);color:var(--warning);font-size:12px;font-weight:700;vertical-align:1px}

.notice-content{min-width:0}
.notice-title{font-size:16px;font-weight:600;color:var(--text1);line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.notice-preview{margin-top:8px;font-size:13px;color:var(--text2);line-height:1.7;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

.notice-time{font-size:13px;color:var(--text3);justify-self:end;white-space:nowrap}
.notice-detail-meta{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.public-notice-detail-body{padding:0;background:#fff;line-height:1.9}
.public-notice-detail-body p{margin:0;padding:0;border:0;background:transparent;color:var(--text1);font-size:16px;line-height:1.85;white-space:pre-wrap}
.notice-detail-pin{height:24px;display:inline-flex;align-items:center;padding:0 9px;background:var(--error);color:#fff;font-size:12px;font-weight:700}

@media (max-width:760px){
  .notice-list-page{overflow:auto}
  .notice-panel-head{align-items:flex-start;flex-direction:column}
  .notice-item{grid-template-columns:1fr;gap:10px;align-items:flex-start}
  .notice-time{justify-self:start}
}
</style>
