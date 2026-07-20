<template>
  <div class="dashboard-page">
    <div class="welcome-row">
      <div>
        <span class="welcome-kicker">企业背调工作台</span>
        <h2>{{ greeting }}，{{ displayName }}</h2>
        <p>{{ todayText }}，以下是账户最新业务概况。</p>
      </div>
      <router-link class="new-query-btn" to="/query/create">
        <Plus :size="18" :stroke-width="2" />
        {{ canOnlineTest ? '在线测试' : '发起背调查询' }}
      </router-link>
    </div>

    <section class="metric-grid">
      <article class="metric-card" v-for="item in metrics" :key="item.label">
        <div class="metric-top">
          <span>{{ item.label }}</span>
          <span class="metric-icon">
            <component :is="item.icon" :size="18" :stroke-width="1.8" />
          </span>
        </div>
        <strong>{{ item.value }}</strong>
        <p v-if="item.desc">{{ item.desc }}</p>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel recent-panel">
        <div class="panel-head">
          <div>
            <h3>最近查询记录</h3>
            <p>当前账号最近提交的背调任务</p>
          </div>
          <router-link to="/records">查看全部 <ArrowRight :size="15" /></router-link>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>查询类型</th>
              <th>提交时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingRecords" class="skeleton-table-row"><td colspan="4"><span></span></td></tr>
            <tr v-else-if="recentRecords.length === 0"><td colspan="4" class="table-empty">暂无查询记录，可点击右上角发起首次查询</td></tr>
            <tr v-for="row in recentRecords" :key="row.id || row.name + row.time">
              <td><strong>{{ row.name }}</strong></td>
              <td>{{ row.type }}</td>
              <td>{{ formatDateTime(row.time) }}</td>
              <td><span class="status-pill" :class="statusClass(row.status, row.displayStatus)"><i></i>{{ statusText(row.status, row.displayStatusText) }}</span></td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="panel notice-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title-icon"><Megaphone :size="18" />公告栏</h3>
            <p>平台公告、政策与服务通知</p>
          </div>
          <router-link class="more-link" to="/announcements">查看全部 <ArrowRight :size="15" /></router-link>
        </div>
        <div class="notice-list">
          <div v-if="notices.length === 0" class="empty-inline">暂无公告</div>
          <router-link
            v-for="item in notices"
            :key="item.id || item.title"
            class="notice-item"
            :to="{ path: '/announcements', query: { noticeId: item.id } }"
          >
            <span class="notice-tag" :class="item.type">{{ item.tag }}</span>
            <div>
              <strong><span v-if="item.isTop" class="top-flag">置顶</span>{{ item.title }}</strong>
              <p>{{ item.date }}</p>
            </div>
          </router-link>
        </div>
      </article>

      <article class="panel chart-panel">
        <div class="panel-head">
          <div>
            <h3>近 30 天查询趋势</h3>
            <p>按任务提交日期统计查询数量</p>
          </div>
        </div>
        <div v-if="hasTrendData" ref="trendChartRef" class="line-chart" aria-label="近30天查询趋势图"></div>
        <div v-else class="chart-empty">
          <BarChart3 :size="24" :stroke-width="1.6" />
          <span>近 30 天暂无查询数据</span>
        </div>
      </article>

      <article class="panel todo-panel">
        <div class="panel-head">
          <div>
            <h3>待办提醒</h3>
            <p>需要关注的授权与账户事项</p>
          </div>
        </div>
        <div class="todo-list">
          <div v-for="item in reminders" :key="item.title" class="todo-item">
            <div class="todo-icon" :class="item.tone">
              <component :is="item.icon" :size="18" :stroke-width="1.8" />
            </div>
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.desc }}</p>
            </div>
            <b :class="item.tone">{{ item.count }}</b>
          </div>
        </div>
      </article>
    </section>

  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import {
  ArrowRight,
  BarChart3,
  CircleAlert,
  FileSignature,
  LoaderCircle,
  Megaphone,
  PenLine,
  Plus,
  Search,
  WalletCards
} from '@lucide/vue'
import { listData } from '../api/data'
import { getAnnouncements } from '../api/notice'
import { listQueryTypeConfig } from '../api/queryType'
import { getUserBalance, getUserProfile } from '../api/user'
import { getUser } from '../utils/auth'
import { formatDateTime, mapRecord, statusClass, statusText, yuanFromFen } from '../utils/format'

const records = ref([])
const notices = ref([])
const loadingRecords = ref(false)
const trendChartRef = ref(null)
let trendChart = null
let chartResizeObserver = null
const profile = ref(getUser())
const balance = ref(0)
const queryTypeMap = ref({})

const displayName = computed(() => profile.value.enterpriseName || profile.value.nickName || profile.value.userName || '当前用户')
const greeting = computed(() => new Date().getHours() < 12 ? '上午好' : '下午好')
const todayText = computed(() => new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }))
const recentRecords = computed(() => records.value.slice(0, 5))
const monthCount = computed(() => records.value.filter(item => isWithinDays(item.time, 30)).length)
const runningCount = computed(() => records.value.filter(r => ['1', '5'].includes(String(r.status))).length)
const authCount = computed(() => records.value.filter(r => String(r.status) === '5').length)
const isSubAccount = computed(() => profile.value && profile.value.parentUserId != null)
const canOnlineTest = computed(() => profile.value && (profile.value.onlineTestEnabled === true || profile.value.onlineTestEnabled === 1 || profile.value.onlineTestEnabled === '1'))
const subAccountTotalQuota = computed(() => Number(profile.value?.subAccountQuota || 0))
const subAccountRemainingQuota = computed(() => Number(balance.value || 0))
const metrics = computed(() => [
  {
    label: isSubAccount.value ? '剩余可用额度' : '账户余额',
    value: `¥${yuanFromFen(balance.value)}`,
    desc: isSubAccount.value ? `分配总额度 ¥${yuanFromFen(subAccountTotalQuota.value)}` : '可用于背调查询结算',
    icon: WalletCards
  },
  { label: '近 30 天查询', value: `${monthCount.value} 次`, desc: '按提交时间统计', icon: Search },
  { label: '查询中', value: `${runningCount.value} 单`, desc: '包含授权后执行任务', icon: LoaderCircle },
  { label: '待授权', value: `${authCount.value} 单`, desc: '等待候选人完成授权', icon: FileSignature }
])
const reminders = computed(() => [
  { title: '授权待签署', desc: `${authCount.value} 份电子授权等待被查询人确认`, count: authCount.value, tone: 'warn', icon: PenLine },
  { title: '查询失败可重试', desc: '失败记录建议重新发起或联系客服', count: records.value.filter(r => String(r.status) === '3').length, tone: 'danger', icon: CircleAlert },
  { title: isSubAccount.value ? '额度状态' : '余额状态', desc: isSubAccount.value ? '分配总额度 ¥' + yuanFromFen(subAccountTotalQuota.value) + '，剩余可用 ¥' + yuanFromFen(subAccountRemainingQuota.value) : '当前可用余额 ¥' + yuanFromFen(balance.value), count: balance.value > 0 ? '正常' : '不足', tone: 'info', icon: WalletCards }
])

const trendSeries = computed(() => {
  const buckets = []
  const counts = new Map()
  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    const key = dateKey(date)
    buckets.push({ key, label: `${date.getMonth() + 1}/${date.getDate()}` })
    counts.set(key, 0)
  }
  records.value.forEach(item => {
    const parsed = parseDate(item.time)
    if (!parsed) return
    const key = dateKey(parsed)
    if (counts.has(key)) counts.set(key, counts.get(key) + 1)
  })
  return {
    labels: buckets.map(item => item.label),
    values: buckets.map(item => counts.get(item.key) || 0)
  }
})
const hasTrendData = computed(() => trendSeries.value.values.some(value => value > 0))

function parseDate(value) {
  if (!value) return null
  const parsed = new Date(String(value).replace(/-/g, '/'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isWithinDays(value, days) {
  const parsed = parseDate(value)
  return parsed ? Date.now() - parsed.getTime() <= days * 24 * 60 * 60 * 1000 : false
}

async function renderTrendChart() {
  await nextTick()
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    animationDuration: 260,
    grid: { top: 24, right: 18, bottom: 32, left: 38 },
    tooltip: { trigger: 'axis', valueFormatter: value => `${value} 次` },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendSeries.value.labels,
      axisLine: { lineStyle: { color: '#dce4ee' } },
      axisTick: { show: false },
      axisLabel: { color: '#7a8799', interval: 4, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#7a8799', fontSize: 11 },
      splitLine: { lineStyle: { color: '#edf1f6' } }
    },
    series: [{
      name: '查询量',
      type: 'line',
      data: trendSeries.value.values,
      smooth: 0.28,
      symbol: 'none',
      lineStyle: { color: '#2563eb', width: 2.5 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(37,99,235,0.20)' },
          { offset: 1, color: 'rgba(37,99,235,0.02)' }
        ])
      }
    }]
  }, true)
}

async function loadQueryTypes() {
  try {
    const res = await listQueryTypeConfig({ pageNum: 1, pageSize: 1000 })
    const map = {}
    ;(res.rows || []).forEach(item => {
      if (item.id != null) map[String(item.id)] = item.callTypeName || item.name || `类型${item.id}`
    })
    queryTypeMap.value = map
  } catch (err) {
    queryTypeMap.value = {}
  }
}

async function loadProfile() {
  try {
    const res = await getUserProfile()
    profile.value = res.data || res.user || profile.value
    if (profile.value.userId) {
      const b = await getUserBalance(profile.value.userId)
      balance.value = b.data || 0
    } else {
      balance.value = profile.value.money || 0
    }
  } catch (err) {}
}

async function loadRecords() {
  loadingRecords.value = true
  try {
    const res = await listData({ pageNum: 1, pageSize: 200 })
    records.value = (res.rows || []).map(item => mapRecord(item, queryTypeMap.value))
  } finally {
    loadingRecords.value = false
  }
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
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
  try {
    const res = await getAnnouncements({ pageNum: 1, pageSize: 5 })
    notices.value = (res.rows || []).map(item => {
      const meta = noticeTypeMeta(item.noticeType)
      return {
        id: item.noticeId,
        title: item.noticeTitle || '公告',
        content: stripHtml(item.noticeContent),
        date: (item.createTime || '').slice(0, 10),
        tag: meta.tag,
        type: meta.type,
        isTop: item.topFlag === '1' || item.topFlag === 1
      }
    })
  } catch (err) {
    console.warn('公告列表加载失败', err)
    notices.value = []
  }
}

onMounted(async () => {
  await loadQueryTypes()
  await loadProfile()
  await Promise.all([loadRecords(), loadNotices()])
  await renderTrendChart()
  if (trendChartRef.value && 'ResizeObserver' in window) {
    chartResizeObserver = new ResizeObserver(() => trendChart?.resize())
    chartResizeObserver.observe(trendChartRef.value)
  }
})

watch(trendSeries, renderTrendChart, { deep: true })

onBeforeUnmount(() => {
  chartResizeObserver?.disconnect()
  trendChart?.dispose()
  trendChart = null
})
</script>

<style scoped>
.metric-card,
.notice-item,
.todo-item {
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.notice-item {
  color: inherit;
  text-decoration: none;
}
</style>

