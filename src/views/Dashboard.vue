<template>
  <div class="dashboard-page workspace-page workspace-page--wide">
    <header class="page-head dashboard-head">
      <div>
        <h2>{{ greeting }}，{{ displayName }}</h2>
      </div>
      <div class="dashboard-head-actions">
        <router-link class="primary-btn dashboard-mobile-action" to="/query/create">
          <Plus :size="17" :stroke-width="2" aria-hidden="true" />
          {{ canOnlineTest ? '在线测试' : '发起背调' }}
        </router-link>
      </div>
    </header>

    <section class="status-overview" aria-label="背调任务概览">
      <router-link
        v-for="item in statusItems"
        :key="item.value"
        class="status-overview-item"
        :class="`tone-${item.tone}`"
        :to="{ path: '/records', query: { status: item.value } }"
      >
        <div class="status-overview-top">
          <span>{{ item.label }}</span>
          <component :is="item.icon" :size="18" :stroke-width="1.8" aria-hidden="true" />
        </div>
        <strong v-if="!loadingStats">{{ item.count }}</strong>
        <span v-else class="status-number-skeleton" aria-label="正在加载"></span>
        <p>{{ item.description }}</p>
      </router-link>
      <button v-if="statsError" class="overview-retry" type="button" @click="loadStatusCounts">
        <RefreshCw :size="15" aria-hidden="true" />
        重新加载概览
      </button>
    </section>

    <section class="dashboard-grid">
      <article class="dashboard-panel recent-panel">
        <div class="dashboard-panel-head">
          <h3>最近背调</h3>
          <router-link to="/records">全部记录 <ArrowRight :size="15" aria-hidden="true" /></router-link>
        </div>

        <div class="record-list">
          <div class="record-list-head" aria-hidden="true">
            <span>候选人</span>
            <span>背调套餐</span>
            <span>提交时间</span>
            <span>状态</span>
            <span>操作</span>
          </div>

          <template v-if="loadingRecords">
            <div v-for="index in 4" :key="index" class="record-row record-row-skeleton" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </template>

          <div v-else-if="recordsError" class="dashboard-empty error-state">
            <CircleAlert :size="20" aria-hidden="true" />
            <span>{{ recordsError }}</span>
            <button type="button" @click="loadRecentRecords">重新加载</button>
          </div>

          <div v-else-if="recentRecords.length === 0" class="dashboard-empty">
            <ClipboardList :size="22" aria-hidden="true" />
            <span>暂无背调记录</span>
          </div>

          <button
            v-for="row in recentRecords"
            v-else
            :key="row.id || `${row.name}-${row.time}`"
            class="record-row"
            type="button"
            @click="openRecord(row)"
          >
            <span class="record-candidate">
              <strong>{{ row.name || '-' }}</strong>
              <small>编号 {{ row.id }}</small>
            </span>
            <span class="record-type" :title="row.type">{{ row.type || '-' }}</span>
            <time>{{ formatDateTime(row.time) }}</time>
            <span>
              <em class="status-pill" :class="statusClass(row.displayStatus)">
                <i></i>{{ statusText(row.displayStatus, row.displayStatusText) }}
              </em>
            </span>
            <span class="record-action">
              {{ recordActionText(row) }}
              <ArrowRight :size="14" aria-hidden="true" />
            </span>
          </button>
        </div>
      </article>

      <article class="dashboard-panel notice-panel">
        <div class="dashboard-panel-head">
          <h3>公告栏</h3>
          <router-link to="/announcements">查看全部 <ArrowRight :size="15" aria-hidden="true" /></router-link>
        </div>

        <div class="notice-list">
          <template v-if="loadingNotices">
            <div v-for="index in 4" :key="index" class="notice-item notice-skeleton" aria-hidden="true">
              <span></span><div><strong></strong><p></p><time></time></div>
            </div>
          </template>

          <div v-else-if="noticesError" class="dashboard-empty error-state">
            <CircleAlert :size="20" aria-hidden="true" />
            <span>{{ noticesError }}</span>
            <button type="button" @click="loadNotices">重新加载</button>
          </div>

          <div v-else-if="notices.length === 0" class="dashboard-empty">
            <Megaphone :size="22" aria-hidden="true" />
            <span>暂无公告</span>
          </div>

          <router-link
            v-for="item in notices"
            v-else
            :key="item.id || item.title"
            class="notice-item"
            :to="{ path: '/announcements', query: { noticeId: item.id } }"
          >
            <span class="notice-tag" :class="item.type">{{ item.tag }}</span>
            <div class="notice-copy">
              <strong><span v-if="item.isTop" class="top-flag">置顶</span>{{ item.title }}</strong>
              <p v-if="item.content" :title="item.content">{{ item.content }}</p>
              <time>{{ item.date }}</time>
            </div>
          </router-link>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  FileSignature,
  LoaderCircle,
  Megaphone,
  Plus,
  RefreshCw
} from '@lucide/vue'
import { listData } from '../api/data'
import { getAnnouncements } from '../api/notice'
import { listQueryTypeConfig } from '../api/queryType'
import { getUserProfile } from '../api/user'
import { getUser } from '../utils/auth'
import { formatDateTime, mapRecord, statusClass, statusText } from '../utils/format'

const router = useRouter()
const profile = ref(getUser() || {})
const recentRecords = ref([])
const notices = ref([])
const queryTypeMap = ref({})
const loadingStats = ref(true)
const loadingRecords = ref(true)
const loadingNotices = ref(true)
const statsError = ref('')
const recordsError = ref('')
const noticesError = ref('')
const statusCounts = reactive({ waiting_auth: 0, processing: 0 })

const STATUS_DEFINITIONS = [
  { value: 'waiting_auth', label: '待授权', description: '等待候选人完成授权', icon: FileSignature, tone: 'warning' },
  { value: 'processing', label: '处理中', description: '正在核验或人工处理', icon: LoaderCircle, tone: 'info' }
]
const RECORD_FILTER_STATUSES = new Set(['waiting_auth', 'processing', 'success', 'unfinished'])

const statusItems = computed(() => STATUS_DEFINITIONS.map(item => ({
  ...item,
  count: statusCounts[item.value]
})))
const displayName = computed(() => profile.value.enterpriseName || profile.value.nickName || profile.value.userName || '当前用户')
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '上午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})
const canOnlineTest = computed(() => profile.value && (profile.value.onlineTestEnabled === true || profile.value.onlineTestEnabled === 1 || profile.value.onlineTestEnabled === '1'))
async function loadProfile() {
  const response = await getUserProfile().catch(() => null)
  if (response) profile.value = response.data || response.user || profile.value
}

async function loadStatusCounts() {
  loadingStats.value = true
  statsError.value = ''
  try {
    const responses = await Promise.all(STATUS_DEFINITIONS.map(item => listData({
      pageNum: 1,
      pageSize: 1,
      displayStatusFilter: item.value
    })))
    responses.forEach((response, index) => {
      statusCounts[STATUS_DEFINITIONS[index].value] = Number(response?.total) || 0
    })
  } catch (err) {
    statsError.value = err?.msg || '概览加载失败'
  } finally {
    loadingStats.value = false
  }
}

async function loadQueryTypes() {
  try {
    const response = await listQueryTypeConfig({ pageNum: 1, pageSize: 1000 })
    const map = {}
    ;(response.rows || []).forEach(item => {
      if (item.id != null) map[String(item.id)] = item.callTypeName || item.name || `类型${item.id}`
    })
    queryTypeMap.value = map
  } catch (err) {
    queryTypeMap.value = {}
  }
}

async function loadRecentRecords() {
  loadingRecords.value = true
  recordsError.value = ''
  try {
    const [, response] = await Promise.all([
      loadQueryTypes(),
      listData({ pageNum: 1, pageSize: 5 })
    ])
    recentRecords.value = (response.rows || []).map(item => mapRecord(item, queryTypeMap.value))
  } catch (err) {
    recentRecords.value = []
    recordsError.value = err?.msg || '最近背调加载失败'
  } finally {
    loadingRecords.value = false
  }
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function noticeTypeMeta(value) {
  const map = {
    system: { tag: '系统', type: 'system' },
    policy: { tag: '政策', type: 'policy' },
    activity: { tag: '活动', type: 'activity' },
    notice: { tag: '通知', type: 'notice' },
    '1': { tag: '通知', type: 'notice' },
    '2': { tag: '公告', type: 'system' }
  }
  return map[String(value || '')] || { tag: '公告', type: 'system' }
}

async function loadNotices() {
  loadingNotices.value = true
  noticesError.value = ''
  try {
    const response = await getAnnouncements({ pageNum: 1, pageSize: 4 })
    notices.value = (response.rows || []).map(item => {
      const meta = noticeTypeMeta(item.noticeType)
      return {
        id: item.noticeId,
        title: item.noticeTitle || '平台公告',
        content: stripHtml(item.noticeContent),
        date: (item.createTime || '').slice(0, 10),
        tag: meta.tag,
        type: meta.type,
        isTop: item.topFlag === '1' || item.topFlag === 1
      }
    })
  } catch (err) {
    notices.value = []
    noticesError.value = err?.msg || '公告加载失败'
  } finally {
    loadingNotices.value = false
  }
}

function recordActionText(row) {
  return String(row.displayStatus) === 'success' ? '查看报告' : '查看进度'
}

function openRecord(row) {
  if (String(row.displayStatus) === 'success') {
    router.push(`/report/${row.id}`)
    return
  }
  const status = RECORD_FILTER_STATUSES.has(String(row.displayStatus))
    ? String(row.displayStatus)
    : ''
  router.push({ path: '/records', query: status ? { status } : {} })
}

onMounted(() => {
  Promise.all([
    loadProfile(),
    loadStatusCounts(),
    loadRecentRecords(),
    loadNotices()
  ])
})
</script>

<style scoped>
.dashboard-page {
  width: min(1280px, 100%);
  margin: 0 auto;
}

.dashboard-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 48px;
}

.dashboard-head h2 {
  margin: 0;
  font-size: clamp(25px, 2vw, 29px);
  line-height: 1.25;
}

.dashboard-head-actions,
.dashboard-mobile-action {
  display: none;
}

.status-overview {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid #dfe2e7;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(23, 25, 30, .035);
}

.status-overview-item {
  position: relative;
  min-width: 0;
  padding: 19px 20px 18px;
  border-right: 1px solid #eceef1;
  color: #17191e;
  text-decoration: none;
  transition: background-color .16s ease;
}

.status-overview-item:last-of-type { border-right: 0; }
.status-overview-item:hover { background: #fafafa; }

.status-overview-item::after {
  content: '';
  position: absolute;
  right: 18px;
  bottom: 0;
  left: 18px;
  height: 2px;
  opacity: 0;
  background: currentColor;
  transition: opacity .16s ease;
}

.status-overview-item:hover::after { opacity: .55; }

.status-overview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #68707c;
  font-size: 13px;
  font-weight: 600;
}

.status-overview-item.tone-warning .status-overview-top svg { color: #c26b16; }
.status-overview-item.tone-info .status-overview-top svg { color: #426b94; }
.status-overview-item.tone-success .status-overview-top svg { color: #168455; }
.status-overview-item.tone-danger .status-overview-top svg { color: #b7453b; }

.status-overview-item > strong {
  display: block;
  margin-top: 13px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.status-overview-item > p {
  margin: 6px 0 0;
  overflow: hidden;
  color: #8a9099;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-number-skeleton {
  display: block;
  width: 46px;
  height: 30px;
  margin-top: 13px;
  border-radius: 4px;
  background: #eceef1;
  animation: dashboard-pulse 1.25s ease-in-out infinite;
}

.overview-retry {
  position: absolute;
  right: 10px;
  bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 7px;
  border: 0;
  color: #a43b32;
  background: #fff;
  font-size: 11px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(300px, .88fr);
  gap: 18px;
  align-items: start;
}

.dashboard-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #dfe2e7;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(23, 25, 30, .035);
}

.dashboard-panel-head {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 12px 20px;
  border-bottom: 1px solid #eceef1;
}

.dashboard-panel-head h3 {
  margin: 0;
  color: #9a352c;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

.dashboard-panel-head > a {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  color: #5f6671;
  font-size: 12px;
  font-weight: 600;
}

.dashboard-panel-head > a:hover { color: #8f3027; }

.record-list-head,
.record-row {
  display: grid;
  grid-template-columns: minmax(120px, 1.05fr) minmax(150px, 1.35fr) minmax(130px, .95fr) minmax(104px, .7fr) 92px;
  align-items: center;
  gap: 14px;
}

.record-list-head {
  min-height: 42px;
  padding: 0 20px;
  color: #777e89;
  background: #fafafa;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.record-row {
  width: 100%;
  min-height: 70px;
  padding: 10px 20px;
  border: 0;
  border-top: 1px solid #f0f1f3;
  color: #353a43;
  background: #fff;
  font-size: 13px;
  text-align: center;
}

.record-list-head + .record-row { border-top: 0; }
.record-row:hover { background: #fafafa; }

.record-row > span,
.record-row > time {
  min-width: 0;
}

.record-candidate {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.record-candidate strong {
  overflow: hidden;
  color: #20232a;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-candidate small {
  margin-top: 3px;
  overflow: hidden;
  color: #9a9fa7;
  font-size: 10px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-type {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-row time {
  color: #747b86;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.record-row .status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto;
  font-size: 12px;
  font-style: normal;
}

.record-action {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  color: #73342f;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.record-row-skeleton > span {
  height: 12px;
  border-radius: 3px;
  background: #eceef1;
  animation: dashboard-pulse 1.25s ease-in-out infinite;
}

.record-row-skeleton > span:nth-child(4),
.record-row-skeleton > span:nth-child(5) { width: 64px; margin: 0 auto; }

.notice-list { padding: 0 18px; }

.notice-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  min-height: 88px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f1f3;
  color: inherit;
}

.notice-item:last-child { border-bottom: 0; }
.notice-item:hover .notice-copy strong { color: #8f3027; }

.notice-tag {
  min-width: 38px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
}

.notice-tag.system { color: #315f8a; background: #eef5fb; }
.notice-tag.policy { color: #18734d; background: #edf8f2; }
.notice-tag.activity { color: #a55a10; background: #fff5e8; }
.notice-tag.notice { color: #814a73; background: #f8f0f5; }

.notice-copy { min-width: 0; }

.notice-copy strong {
  display: block;
  overflow: hidden;
  color: #262a31;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-flag {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 4px;
  border-radius: 3px;
  color: #a43b32;
  background: #fbefee;
  font-size: 10px;
}

.notice-copy p {
  margin: 5px 0 0;
  overflow: hidden;
  color: #777e89;
  font-size: 12px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-copy time {
  display: block;
  margin-top: 4px;
  color: #a0a5ad;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.notice-skeleton > span,
.notice-skeleton strong,
.notice-skeleton p,
.notice-skeleton time {
  display: block;
  border-radius: 3px;
  background: #eceef1;
  animation: dashboard-pulse 1.25s ease-in-out infinite;
}

.notice-skeleton > span { width: 38px; height: 22px; }
.notice-skeleton strong { width: 72%; height: 12px; }
.notice-skeleton p { width: 92%; height: 10px; margin-top: 8px; }
.notice-skeleton time { width: 60px; height: 9px; margin-top: 8px; }

.dashboard-empty {
  min-height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  padding: 32px;
  color: #8b919a;
  font-size: 12px;
  text-align: center;
}

.dashboard-empty button {
  padding: 4px 0;
  border: 0;
  color: #8f3027;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
}

.error-state { color: #a43b32; }

@keyframes dashboard-pulse {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}

@media (max-width: 1080px) {
  .dashboard-grid { grid-template-columns: minmax(0, 1fr); }
  .notice-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 20px; }
  .notice-item:nth-child(odd) { border-right: 1px solid #f0f1f3; padding-right: 20px; }
}

@media (max-width: 768px) {
  .dashboard-head {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .dashboard-head > div:first-child { min-width: 0; }
  .dashboard-head h2 { font-size: 23px; }

  .dashboard-head-actions {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .dashboard-mobile-action { display: inline-flex; width: 100%; height: 40px; padding: 0 14px; }

  .status-overview { margin-bottom: 14px; }
  .status-overview-item { padding: 15px 15px 14px; }
  .status-overview-item > strong { font-size: 24px; }
  .status-overview-item > p { font-size: 11px; }

  .dashboard-grid { gap: 14px; }
  .dashboard-panel-head { min-height: 64px; padding: 12px 15px; }
  .record-list-head { display: none; }

  .record-row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "candidate status" "type action";
    gap: 6px 14px;
    min-height: 84px;
    padding: 13px 15px;
    text-align: left;
  }

  .record-row:not(.record-row-skeleton):nth-of-type(n + 3) { display: none; }
  .record-row-skeleton:nth-of-type(n + 4) { display: none; }
  .record-candidate { grid-area: candidate; }
  .record-type { grid-area: type; color: #777e89; font-size: 12px; }
  .record-row > time { display: none; }
  .record-row > span:nth-child(4) { grid-area: status; }
  .record-row .status-pill { margin: 0; }
  .record-action { grid-area: action; justify-content: flex-end; }

  .record-row-skeleton { display: grid; }
  .record-row-skeleton > span:nth-child(3) { display: none; }

  .notice-list { display: block; padding: 0 15px; }
  .notice-item:nth-child(odd) { border-right: 0; padding-right: 0; }
}

@media (max-width: 520px) {
  .dashboard-head {
    gap: 12px;
  }
  .status-overview-top { gap: 6px; }
  .status-overview-top svg { width: 16px; height: 16px; }
  .status-overview-item > p { white-space: normal; line-height: 1.4; }
}
</style>
