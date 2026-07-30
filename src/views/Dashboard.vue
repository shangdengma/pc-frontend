<template>
  <main class="main-content">
    <!-- Welcome Row -->
    <div class="welcome-row">
      <div>
        <div class="welcome-text">{{ greeting }}，{{ user.name }}</div>
        <div class="welcome-date">{{ todayText }} &nbsp;·&nbsp; 当前有 {{ pendingTotal }} 条待处理任务</div>
      </div>
      <router-link to="/query/create" class="btn-create">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        新建背调
      </router-link>
    </div>

    <!-- Top Stats: balance + 2x2 grid -->
    <div class="top-stats">
      <div class="balance-card">
        <div class="balance-item">
          <span class="stat-label">账户余额</span>
          <div class="balance-row">
            <span class="balance-value">¥ {{ balance.account.toFixed(2) }}</span>
            <router-link to="/recharge" class="btn-mini">立即充值</router-link>
          </div>
        </div>
        <div class="balance-item">
          <span class="stat-label">可开发票</span>
          <div class="balance-row">
            <span class="balance-value">{{ invoiceBalanceText }}</span>
            <router-link to="/invoices" class="btn-mini">去开票</router-link>
          </div>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-card" v-for="s in stats" :key="s.label">
          <span class="stat-label">{{ s.label }}</span>
          <span class="stat-value">{{ s.value }}<span class="stat-unit">{{ s.unit }}</span></span>
        </div>
      </div>
    </div>

    <!-- Content Row -->
    <div class="content-row">
      <div class="content-main">
        <!-- Table -->
        <div class="table-section">
          <div class="table-header">
            <h2>最近背调任务</h2>
            <router-link to="/records">查看全部</router-link>
          </div>
          <div class="table-content">
            <table class="dashboard-task-table">
              <thead>
                <tr>
                  <th style="width:18%">候选人</th>
                  <th style="width:16%">背调类型</th>
                  <th style="width:14%">状态</th>
                  <th style="width:26%">完成时间</th>
                  <th style="width:26%">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in records" :key="row.name">
                  <td class="td-name">{{ row.name }}</td>
                  <td class="td-type">{{ row.type }}</td>
                  <td class="td-status"><span class="status-badge">{{ row.status }}</span></td>
                  <td class="td-date">{{ row.time }}</td>
                  <td>
                    <div class="action-group dashboard-actions">
                      <router-link v-if="canOperateRecord(row)" :to="`/report/${row.id}`" class="action-link">查看报告</router-link>
                      <span v-else class="action-plain">查看报告</span>
                      <button v-if="canOperateRecord(row)" class="action-link action-btn" type="button" @click="downloadPdf(row)">下载 PDF</button>
                      <span v-else class="action-plain">下载 PDF</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="dashboard-chart-row">
          <section class="trend-card dashboard-chart-card" aria-labelledby="status-chart-title">
            <div class="trend-head">
              <h2 id="status-chart-title">查询状态分布</h2>
              <p>点击状态可跳转到查询记录并自动筛选</p>
            </div>
            <div class="dashboard-chart-box">
              <div ref="statusChartRef" class="dashboard-bar-chart" aria-label="查询状态分布图"></div>
            </div>
          </section>

          <section class="trend-card dashboard-chart-card" aria-labelledby="type-chart-title">
            <div class="trend-head">
              <h2 id="type-chart-title">背调类型分布</h2>
              <p>近 30 天使用量 Top 5</p>
            </div>
            <div class="dashboard-chart-box">
              <div ref="typeChartRef" class="dashboard-bar-chart" aria-label="背调类型分布图"></div>
            </div>
          </section>
        </div>
      </div>

      <!-- Side Widgets -->
      <div class="side-section">
        <div class="side-card notice-card">
          <h3><span>最新公告</span><router-link to="/announcements" class="side-card-more">查看全部</router-link></h3>
          <ul class="notice-list">
            <li class="notice-item" v-for="(n, i) in notices" :key="n.id || i" :class="{ selected: selectedNoticeId === n.id }" role="button" tabindex="0" @click="openNotice(n)" @keyup.enter="openNotice(n)">
              <span v-if="n.pin" class="notice-pin">置顶</span>
              <span v-if="n.cat" class="notice-cat" :class="n.cat">{{ n.catText }}</span>
              <span class="notice-text">{{ n.text }}</span>
              <span class="notice-time">{{ n.time }}</span>
            </li>
          </ul>
        </div>
        <div class="side-card task-card">
          <h3><span>待处理任务</span><router-link to="/records" class="side-card-more">查看全部</router-link></h3>
          <ul class="task-list">
            <li
              class="task-item"
              v-for="t in tasks"
              :key="t.key"
              :class="{ clickable: isTaskClickable(t) }"
              :role="isTaskClickable(t) ? 'button' : undefined"
              :tabindex="isTaskClickable(t) ? 0 : undefined"
              @click="handleTaskClick(t)"
              @keyup.enter="handleTaskClick(t)"
            >
              <span class="task-count" :class="{ zero: t.count === 0 }">{{ t.count }}</span>
              <span class="task-text">{{ t.text }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 近 30 天查询趋势 -->
      <section class="trend-card trend-card-full" aria-labelledby="trend-card-title">
        <div class="trend-head">
          <h2 id="trend-card-title">近 30 天查询趋势</h2>
          <p>按任务提交日期统计查询数量</p>
        </div>
        <div class="trend-chart">
          <div ref="trendChartRef" class="line-chart" aria-label="近30天查询趋势图"></div>
        </div>
      </section>
    </div>
  </main>

  <AppModal
    v-model="taskModalVisible"
    :title="activeTaskConfig.title"
    size="lg"
  >
    <div v-if="activeTaskConfig.type === 'table'" class="auth-table-core">
      <table class="business-list-table auth-overdue-table">
        <thead>
          <tr>
            <th v-for="column in activeTaskConfig.columns" :key="column.key" :style="{ width: column.width }">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in activeTaskRows" :key="row.id || row.name">
            <td v-for="column in activeTaskConfig.columns" :key="column.key" :class="column.className">
              <span v-if="column.key === 'status'" class="status-badge" :class="statusBadgeClass(row.status)">
                {{ statusText(row.status) }}
              </span>
              <button
                v-else-if="column.key === 'action'"
                class="action-link action-btn"
                type="button"
                @click="goTaskRecord(row, activeTaskConfig.status)"
              >
                详细
              </button>
              <span v-else>{{ tableCellText(row, column.key) }}</span>
            </td>
          </tr>
          <tr v-if="activeTaskRows.length === 0">
            <td :colspan="activeTaskConfig.columns.length" class="table-empty">{{ activeTaskConfig.emptyText }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="task-status-detail">
      <div class="task-status-row">
        <span class="task-status-label">当前状态</span>
        <span class="status-badge" :class="activeTaskStatus.tone">{{ activeTaskStatus.statusText }}</span>
      </div>
      <p class="task-status-desc">{{ activeTaskStatus.desc }}</p>
    </div>
    <template #footer="{ close }">
      <button class="btn-outline" type="button" @click="close">确认</button>
      <button v-if="activeTaskConfig.primaryAction" class="btn-primary" type="button" @click="handleTaskPrimaryAction">
        {{ activeTaskConfig.primaryAction }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { graphic, init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import AppModal from '../components/AppModal.vue'
import { listData } from '../api/data'
import { getMyEnterpriseCertList } from '../api/enterpriseCert'
import { getAnnouncements } from '../api/notice'
import { listQueryTypeConfig } from '../api/queryType'
import { listSubAccounts } from '../api/subAccount'
import { getUserBalance, getUserProfile } from '../api/user'
import { mapRecord as mapLegacyRecord } from '../utils/format'

use([GridComponent, TooltipComponent, BarChart, LineChart, PieChart, CanvasRenderer])

const router = useRouter()
const user = ref({ name: '当前用户' })
const balance = ref({ account: 0, invoice: null })
const balanceLoaded = ref(false)
const profileInfo = ref({})
const certStatus = ref('loading')
const subAccounts = ref([])
const stats = ref([
  { label: '累计背调', value: '0', unit: '人' },
  { label: '本月背调', value: '0', unit: '人' },
  { label: '待查询', value: '0', unit: '人' },
  { label: '风险预警', value: '0', unit: '人' }
])
const records = ref([])
const allRecords = ref([])
const queryTypeMap = ref({})

function canOperateRecord(row) {
  return String(row.statusCode) === '2'
}

function downloadPdf(row) {
  if (!canOperateRecord(row)) return
  if (row.pdfFilePath) {
    const path = String(row.pdfFilePath).trim()
    const base = import.meta.env.VITE_APP_BASE_API || ''
    const url = /^(https?:)?\/\//i.test(path) ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`
    const link = document.createElement('a')
    link.href = encodeURI(url)
    link.download = `背调报告_${row.name || row.id}.pdf`
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }
  const target = router.resolve({
    name: 'reportDetail',
    params: { id: row.id },
    query: { download: '1' }
  })
  window.open(target.href, '_blank', 'noopener')
}

const trendChartRef = ref(null)
const statusChartRef = ref(null)
const typeChartRef = ref(null)
let trendChart = null
let statusChart = null
let typeChart = null
let chartResizeObserver = null
const trendDailyData = ref([])

const statusChartItems = [
  { label: '待授权', statuses: ['5'], color: '#F59E0B' },
  { label: '查询中', statuses: ['1'], color: '#2563EB' },
  { label: '已完成', statuses: ['2'], color: '#16A34A' },
  { label: '查询失败', statuses: ['3'], color: '#DC2626' },
  { label: '已退款 / 已中止', statuses: ['4', '6'], color: '#94A3B8' }
]

const trendSeries = computed(() => ({
  labels: trendDailyData.value.map(item => item.label),
  values: trendDailyData.value.map(item => item.value)
}))

const statusDistributionData = computed(() =>
  statusChartItems.map(item => ({
    ...item,
    value: allRecords.value.filter(row => item.statuses.includes(String(row.status))).length
  }))
)

const typeDistributionData = computed(() => {
  const counts = new Map()
  allRecords.value
    .filter(row => isWithinDays(row.createTime || row.time, 30))
    .forEach(row => {
      const name = row.type || '未知类型'
      counts.set(name, (counts.get(name) || 0) + 1)
    })
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
})

async function renderTrendChart() {
  await nextTick()
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = init(trendChartRef.value)
  trendChart.setOption({
    animationDuration: 260,
    grid: { top: 24, right: 18, bottom: 32, left: 38 },
    tooltip: {
      trigger: 'axis',
      transitionDuration: 0.2,
      axisPointer: {
        type: 'line',
        animation: true,
        lineStyle: { color: '#cbd5e1', type: 'dashed', width: 1 }
      },
      valueFormatter: value => `${value} 次`
    },
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
      max: Math.max(3, ...trendSeries.value.values),
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
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(37,99,235,0.20)' },
          { offset: 1, color: 'rgba(37,99,235,0.02)' }
        ])
      }
    }]
  }, true)
}

function resizeDashboardCharts() {
  trendChart?.resize()
  statusChart?.resize()
  typeChart?.resize()
}

function goStatusRecords(statuses) {
  const status = Array.isArray(statuses) ? statuses.join(',') : String(statuses || '')
  router.push({
    path: '/records',
    query: status ? { status } : {}
  })
}

async function renderStatusChart() {
  await nextTick()
  if (!statusChartRef.value) return
  if (!statusChart) statusChart = init(statusChartRef.value)
  const rows = statusDistributionData.value
  statusChart.setOption({
    animationDuration: 220,
    tooltip: {
      trigger: 'item',
      formatter: params => `${params.name}<br/>${params.value} 条，占比 ${params.percent}%`
    },
    legend: {
      top: 0,
      left: 0,
      orient: 'vertical',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#64748B', fontSize: 11 }
    },
    color: rows.map(item => item.color),
    series: [{
      name: '查询状态',
      type: 'pie',
      radius: '70%',
      center: ['58%', '55%'],
      avoidLabelOverlap: true,
      cursor: 'pointer',
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        color: '#334155',
        fontSize: 11,
        formatter: '{b} {c}'
      },
      labelLine: {
        length: 8,
        length2: 6
      },
      emphasis: {
        scaleSize: 4,
        label: { fontWeight: 700 }
      },
      data: rows.map(item => ({
        name: item.label,
        value: item.value
      }))
    }]
  }, true)
  statusChart.off('click')
  statusChart.on('click', params => {
    const item = statusDistributionData.value.find(row => row.label === params.name)
    if (item) goStatusRecords(item.statuses)
  })
}

async function renderTypeChart() {
  await nextTick()
  if (!typeChartRef.value) return
  if (!typeChart) typeChart = init(typeChartRef.value)
  const rows = [...typeDistributionData.value].reverse()
  typeChart.setOption({
    animationDuration: 220,
    grid: { top: 14, right: 24, bottom: 24, left: 86, containLabel: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: value => `${value} 次`
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#7a8799', fontSize: 11 },
      splitLine: { lineStyle: { color: '#edf1f6' } }
    },
    yAxis: {
      type: 'category',
      data: rows.map(item => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#334155', fontSize: 12 }
    },
    series: [{
      name: '使用量',
      type: 'bar',
      barWidth: 14,
      itemStyle: { color: '#2563EB' },
      label: {
        show: true,
        position: 'right',
        color: '#475569',
        fontSize: 11
      },
      data: rows.map(item => item.value)
    }]
  }, true)
}

async function renderDashboardCharts() {
  await Promise.all([renderTrendChart(), renderStatusChart(), renderTypeChart()])
}

const notices = ref([])
const selectedNoticeId = ref(null)
const taskModalVisible = ref(false)
const activeTaskKey = ref('auth')
const MONEY_WARNING_LINE = 500

const pendingTotal = computed(() => tasks.value.reduce((sum, t) => sum + t.count, 0))
const invoiceBalanceText = computed(() => balance.value.invoice == null ? '--' : `¥ ${balance.value.invoice.toFixed(2)}`)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const todayText = computed(() =>
  new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
)

function yuan(value) {
  return Number(value || 0) / 100
}

function parseDate(value) {
  const parsed = new Date(String(value || '').replace(/-/g, '/'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function shortDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function isWithinDays(value, days) {
  const parsed = parseDate(value)
  if (!parsed) return false
  const start = new Date()
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)
  return parsed >= start
}

function isOlderThanHours(value, hours) {
  const parsed = parseDate(value)
  if (!parsed) return false
  return Date.now() - parsed.getTime() >= hours * 60 * 60 * 1000
}

function formatSubmitTime(value) {
  return value ? String(value).slice(0, 16) : '-'
}

function overdueHoursText(value) {
  const parsed = parseDate(value)
  if (!parsed) return '-'
  const hours = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (60 * 60 * 1000)))
  return `${hours} 小时`
}

function statusText(status) {
  const map = { '1': '查询中', '2': '已完成', '3': '查询失败', '4': '已退款', '5': '待授权', '6': '背调中止' }
  return map[String(status)] || '未知'
}

function recordTime(row) {
  if (String(row.status) === '5') return '等待候选人确认'
  if (String(row.status) === '1') return '处理中'
  return String(row.updateTime || row.createTime || row.time || '').slice(0, 16)
}

function mapRecord(row) {
  const mapped = mapLegacyRecord(row, queryTypeMap.value)
  return {
    ...mapped,
    status: statusText(mapped.status),
    statusCode: String(mapped.status ?? ''),
    time: recordTime(mapped)
  }
}

function buildTrend(rows) {
  const buckets = []
  const counts = new Map()
  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const key = dateKey(date)
    buckets.push({ key, label: shortDate(date), value: 0 })
    counts.set(key, 0)
  }
  rows.forEach(row => {
    const parsed = parseDate(row.createTime || row.time)
    if (!parsed) return
    const key = dateKey(parsed)
    if (counts.has(key)) counts.set(key, counts.get(key) + 1)
  })
  trendDailyData.value = buckets.map(item => ({ ...item, value: counts.get(item.key) || 0 }))
}

function noticeTypeMeta(value) {
  const map = {
    system: { cat: 'sec', catText: '系统' },
    policy: { cat: 'rule', catText: '合规' },
    activity: { cat: 'feat', catText: '活动' },
    notice: { cat: 'data', catText: '通知' }
  }
  return map[value] || { cat: 'data', catText: '通知' }
}

function openNotice(notice) {
  selectedNoticeId.value = notice.id || null
  router.push({
    path: '/announcements',
    query: notice.id ? { noticeId: notice.id } : {}
  })
}

function isTaskClickable(task) {
  return ['auth', 'failed', 'report', 'balance', 'cert', 'sub-quota'].includes(task.key)
}

function handleTaskClick(task) {
  if (!isTaskClickable(task)) return
  activeTaskKey.value = task.key
  taskModalVisible.value = true
}

function goTaskRecord(row, status) {
  taskModalVisible.value = false
  router.push({
    path: '/records',
    query: {
      status,
      keyword: row.idCard || row.phone || row.name || ''
    }
  })
}

function handleTaskPrimaryAction() {
  taskModalVisible.value = false
  if (activeTaskKey.value === 'cert') router.push('/enterprise-cert')
  if (activeTaskKey.value === 'balance') router.push('/recharge')
  if (activeTaskKey.value === 'sub-quota') router.push('/sub-accounts')
}

function latestCert(list) {
  return list.find(item => item?.status === 'approved')
    || list.find(item => item?.status === 'pending' || item?.status === 'reviewing')
    || list.find(item => item?.status === 'draft')
    || list.find(item => item?.status === 'rejected')
    || list.find(Boolean)
    || null
}

function certTaskCopy(status) {
  const map = {
    approved: { statusText: '已认证', desc: '企业认证资料已通过审核，可正常发起背调、充值和开票。', action: '查看认证', count: 0, tone: 'success' },
    pending: { statusText: '待审核', desc: '企业认证资料已提交，请关注审核结果。审核通过前部分企业能力可能受限。', action: '查看进度', count: 1, tone: 'warning' },
    reviewing: { statusText: '审核中', desc: '认证资料正在审核中，请保持联系人和手机号可用，便于审核反馈。', action: '查看进度', count: 1, tone: 'warning' },
    draft: { statusText: '待提交', desc: '企业认证资料尚未提交，建议尽快补全资料，避免影响企业背调能力。', action: '继续认证', count: 1, tone: 'warning' },
    rejected: { statusText: '未通过', desc: '企业认证未通过，请根据驳回原因修改资料后重新提交。', action: '重新认证', count: 1, tone: 'error' },
    none: { statusText: '未认证', desc: '企业尚未完成认证，完成后可使用完整背调、财务和开票能力。', action: '去认证', count: 1, tone: 'error' },
    loading: { statusText: '加载中', desc: '正在获取企业认证状态。', action: '查看认证', count: 0, tone: 'neutral' }
  }
  return map[status] || map.none
}

function subRemaining(item) {
  return Math.max(0, Number(item.subAccountQuota || item.quota || 0) - Number(item.subAccountUsed || item.used || 0))
}

function moneyText(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusBadgeClass(status) {
  const map = {
    '1': 'info',
    '2': 'success',
    '3': 'error',
    '4': 'neutral',
    '5': 'warning',
    '6': 'neutral'
  }
  return map[String(status)] || 'neutral'
}

function tableCellText(row, key) {
  const valueMap = {
    name: row.name || '-',
    type: row.type || '-',
    submitTime: formatSubmitTime(row.createTime || row.time),
    finishTime: formatSubmitTime(row.updateTime || row.createTime || row.time),
    overdue: overdueHoursText(row.createTime || row.time),
    reason: row.failureReason || row.failReason || row.reason || '查询失败，请确认候选人信息后重新处理',
    reportNo: row.reportNo || '-'
  }
  return valueMap[key] ?? '-'
}

const authOverdueRecords = computed(() =>
  allRecords.value.filter(item =>
    String(item.status) === '5' && isOlderThanHours(item.createTime || item.time, 24)
  )
)

const failedRecords = computed(() =>
  allRecords.value.filter(item => String(item.status) === '3')
)

const completedRecords = computed(() =>
  allRecords.value.filter(item => String(item.status) === '2')
)

const lowSubQuotaAccounts = computed(() =>
  subAccounts.value
    .map(item => ({
      ...item,
      remaining: subRemaining(item),
      displayName: item.nickName || item.userName || item.phonenumber || '未命名子账号'
    }))
    .filter(item => item.remaining < MONEY_WARNING_LINE)
)

const taskTableConfigs = {
  auth: {
    title: '候选人待授权超过 24 小时',
    status: '5',
    emptyText: '暂无超过 24 小时未授权的候选人',
    columns: [
      { key: 'name', label: '人名', width: '16%', className: 'td-name' },
      { key: 'type', label: '背调类型', width: '18%', className: 'td-type' },
      { key: 'submitTime', label: '提交时间', width: '22%', className: 'td-date' },
      { key: 'overdue', label: '距今时长', width: '16%', className: 'td-date' },
      { key: 'status', label: '状态', width: '14%' },
      { key: 'action', label: '操作', width: '14%' }
    ]
  },
  failed: {
    title: '查询失败任务需要确认原因',
    status: '3',
    emptyText: '暂无查询失败任务',
    columns: [
      { key: 'name', label: '人名', width: '15%', className: 'td-name' },
      { key: 'type', label: '背调类型', width: '16%', className: 'td-type' },
      { key: 'submitTime', label: '提交时间', width: '20%', className: 'td-date' },
      { key: 'reason', label: '失败原因', width: '23%' },
      { key: 'status', label: '状态', width: '12%' },
      { key: 'action', label: '操作', width: '14%' }
    ]
  },
  report: {
    title: '报告已完成待查看',
    status: '2',
    emptyText: '暂无已完成待查看报告',
    columns: [
      { key: 'name', label: '人名', width: '16%', className: 'td-name' },
      { key: 'type', label: '背调类型', width: '18%', className: 'td-type' },
      { key: 'finishTime', label: '完成时间', width: '22%', className: 'td-date' },
      { key: 'reportNo', label: '报告编号', width: '20%' },
      { key: 'status', label: '状态', width: '12%' },
      { key: 'action', label: '操作', width: '12%' }
    ]
  }
}

const activeTaskConfig = computed(() => {
  if (taskTableConfigs[activeTaskKey.value]) {
    return { ...taskTableConfigs[activeTaskKey.value], type: 'table' }
  }
  if (activeTaskKey.value === 'cert') {
    const certCopy = certTaskCopy(certStatus.value)
    return {
      title: '企业认证状态',
      type: 'status',
      primaryAction: certCopy.action
    }
  }
  if (activeTaskKey.value === 'balance') {
    return {
      title: '账户余额低于预警线',
      type: 'status',
      primaryAction: '立即充值'
    }
  }
  if (activeTaskKey.value === 'sub-quota') {
    return {
      title: '子账号额度不足',
      type: 'status',
      primaryAction: '查看子账号'
    }
  }
  return { title: '待处理任务', type: 'status' }
})

const activeTaskRows = computed(() => {
  if (activeTaskKey.value === 'auth') return authOverdueRecords.value
  if (activeTaskKey.value === 'failed') return failedRecords.value
  if (activeTaskKey.value === 'report') return completedRecords.value
  return []
})

const activeTaskStatus = computed(() => {
  if (activeTaskKey.value === 'cert') return certTaskCopy(certStatus.value)
  if (activeTaskKey.value === 'balance') {
    const low = balanceLoaded.value && balance.value.account < MONEY_WARNING_LINE
    return {
      statusText: low ? '余额预警' : '余额正常',
      desc: low
        ? `当前账户余额为 ¥ ${moneyText(balance.value.account)}，低于预警线 ¥ ${moneyText(MONEY_WARNING_LINE)}。`
        : `当前账户余额为 ¥ ${moneyText(balance.value.account)}，预警线为 ¥ ${moneyText(MONEY_WARNING_LINE)}，当前未触发预警。`,
      tone: low ? 'warning' : 'success'
    }
  }
  if (activeTaskKey.value === 'sub-quota') {
    if (lowSubQuotaAccounts.value.length > 0) {
      const names = lowSubQuotaAccounts.value
        .slice(0, 3)
        .map(item => `${item.displayName} 当前剩余额度为 ¥ ${moneyText(item.remaining)}`)
        .join('；')
      const more = lowSubQuotaAccounts.value.length > 3 ? `；其余 ${lowSubQuotaAccounts.value.length - 3} 个子账号也低于预警线` : ''
      return {
        statusText: '额度预警',
        desc: `${names}${more}，低于预警线 ¥ ${moneyText(MONEY_WARNING_LINE)}。`,
        tone: 'warning'
      }
    }
    return {
      statusText: '额度正常',
      desc: `所有子账号剩余额度均不低于预警线 ¥ ${moneyText(MONEY_WARNING_LINE)}。`,
      tone: 'success'
    }
  }
  return { statusText: '正常', desc: '暂无需要处理的任务。', tone: 'success' }
})

const tasks = computed(() => {
  const waitAuthOverdueCount = authOverdueRecords.value.length
  const failedCount = failedRecords.value.length
  const completedCount = completedRecords.value.length
  const lowBalanceCount = balanceLoaded.value && balance.value.account < MONEY_WARNING_LINE ? 1 : 0
  const certCopy = certTaskCopy(certStatus.value)
  const lowSubQuotaCount = lowSubQuotaAccounts.value.length

  return [
    {
      key: 'auth',
      count: waitAuthOverdueCount,
      text: '候选人待授权超过 24 小时'
    },
    {
      key: 'failed',
      count: failedCount,
      text: '查询失败任务需要确认原因'
    },
    {
      key: 'report',
      count: completedCount,
      text: '报告已完成待查看'
    },
    {
      key: 'balance',
      count: lowBalanceCount,
      text: '账户余额低于预警线'
    },
    {
      key: 'cert',
      count: certCopy.count,
      text: '企业认证状态'
    },
    {
      key: 'sub-quota',
      count: lowSubQuotaCount,
      text: '子账号额度不足'
    }
  ]
})

async function loadQueryTypes() {
  const res = await listQueryTypeConfig({ pageNum: 1, pageSize: 1000 })
  queryTypeMap.value = Object.fromEntries((res.rows || []).map(item => [
    String(item.id),
    item.callTypeName || item.name || `类型${item.id}`
  ]))
}

async function loadProfile() {
  const res = await getUserProfile()
  const info = res.data || res.user || {}
  profileInfo.value = info
  user.value = { name: info.enterpriseName || info.nickName || info.userName || '当前用户' }
  const balanceRes = await getUserBalance(info.userId || info.id)
  balance.value.account = yuan(balanceRes.data || balanceRes.balance || 0)
  balanceLoaded.value = true
}

async function loadCertStatus() {
  try {
    const res = await getMyEnterpriseCertList()
    const item = latestCert(res.rows || res.data || [])
    certStatus.value = item?.status || 'none'
  } catch (error) {
    certStatus.value = profileInfo.value.certStatus || 'none'
  }
}

async function loadSubAccountSummary() {
  try {
    const res = await listSubAccounts()
    subAccounts.value = res.rows || res.data || []
  } catch (error) {
    subAccounts.value = []
  }
}

async function loadRecords() {
  const res = await listData({ pageNum: 1, pageSize: 200 })
  allRecords.value = (res.rows || []).map(item => mapLegacyRecord(item, queryTypeMap.value))
  records.value = allRecords.value.slice(0, 4).map(mapRecord)
  const monthCount = allRecords.value.filter(item => isWithinDays(item.createTime || item.time, 30)).length
  const runningCount = allRecords.value.filter(item => ['1', '5'].includes(String(item.status))).length
  const riskCount = allRecords.value.filter(item => String(item.status) === '3').length
  stats.value = [
    { label: '累计背调', value: allRecords.value.length.toLocaleString(), unit: '人' },
    { label: '本月背调', value: monthCount.toLocaleString(), unit: '人' },
    { label: '待查询', value: runningCount.toLocaleString(), unit: '人' },
    { label: '风险预警', value: riskCount.toLocaleString(), unit: '人' }
  ]
  buildTrend(allRecords.value)
}

async function loadNotices() {
  const res = await getAnnouncements({ pageNum: 1, pageSize: 5 })
  notices.value = (res.rows || []).map(item => {
    const meta = noticeTypeMeta(item.noticeType)
    return {
      id: item.noticeId || item.id,
      pin: Boolean(item.topFlag),
      cat: item.topFlag ? '' : meta.cat,
      catText: meta.catText,
      text: item.noticeTitle || item.title,
      time: String(item.createTime || item.time || '').slice(0, 10)
    }
  })
}

async function loadDashboard() {
  await loadQueryTypes()
  await loadProfile()
  await Promise.all([loadRecords(), loadNotices(), loadCertStatus(), loadSubAccountSummary()])
}

onMounted(async () => {
  await loadDashboard()
  await renderDashboardCharts()
  if ('ResizeObserver' in window) {
    chartResizeObserver = new ResizeObserver(resizeDashboardCharts)
    const chartElements = [trendChartRef.value, statusChartRef.value, typeChartRef.value]
    chartElements.forEach(el => {
      if (el) chartResizeObserver.observe(el)
    })
  }
})

watch([trendSeries, statusDistributionData, typeDistributionData], renderDashboardCharts, { deep: true })

onBeforeUnmount(() => {
  chartResizeObserver?.disconnect()
  trendChart?.dispose()
  statusChart?.dispose()
  typeChart?.dispose()
  trendChart = null
  statusChart = null
  typeChart = null
})

</script>

<style scoped>
.btn-create{
  height:45px;
  padding:0 24px;
  background:var(--primary);
  color:#fff;
  border:none;
  font-size:14px;
  font-weight:600;
  display:inline-flex;
  align-items:center;
  gap:8px;
  cursor:pointer;
  text-decoration:none;
  transition:opacity .15s;
  white-space:nowrap;
}
.btn-create:hover{opacity:.9}
.btn-create svg{width:16px;height:16px;flex-shrink:0}
.content-row{flex:none;min-height:0;align-items:start}
.trend-card{background:#fff;border:1px solid var(--border);overflow:hidden;flex-shrink:0;box-shadow:var(--shadow-sm)}
.trend-card-full{width:100%;grid-column:1 / -1}
.trend-head{height:80px;padding:16px 24px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;justify-content:center}
.trend-head h2{font-size:18px;font-weight:700;color:var(--text1);line-height:1.2}
.trend-head p{font-size:14px;color:var(--text3);margin-top:9px;line-height:1.3}
.trend-chart{height:238px;padding:10px 18px 14px}
.line-chart{width:100%;height:100%}
.dashboard-chart-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.dashboard-chart-card{min-width:0}
.dashboard-chart-box{height:260px;padding:14px 18px 16px}
.dashboard-bar-chart{width:100%;height:100%}
.dashboard-task-table .td-status .status-badge{padding:0;background:transparent;color:var(--text1);font-size:14px;font-weight:500;line-height:1}
.dashboard-task-table .td-status .status-badge::before{display:none}
.dashboard-actions{display:flex;align-items:center;gap:14px}
.action-btn{padding:0;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:500;line-height:inherit}
.action-plain{font-size:13px;color:var(--text3);font-weight:500;white-space:nowrap}
.side-section{display:flex;flex-direction:column;gap:16px;align-self:start}
.notice-card,.task-card{flex:none;min-height:0;overflow:hidden}
.notice-card .notice-list,.task-card .task-list{gap:0}
.notice-card .notice-item{min-height:40px;cursor:pointer;transition:background .12s}
.notice-card .notice-item:hover{background:#F1F5F9}
.notice-card .notice-item.selected{background:#EAF1FB}
.task-card .task-item.clickable{cursor:pointer}
.task-card .task-count.zero{background:#F1F5F9;color:#94A3B8}
.auth-table-core{overflow:visible}
.auth-overdue-table{min-width:0}
.auth-overdue-table th,.auth-overdue-table td{padding:8px!important;text-align:center}
.auth-overdue-table .action-btn{font-size:13px}
.task-status-detail{padding:4px 0 8px;color:var(--text1)}
.task-status-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--border)}
.task-status-label{font-size:14px;color:var(--text2)}
.task-status-desc{margin:16px 0 0;font-size:15px;line-height:1.8;color:var(--text2)}
@media (max-width: 1180px){
  .dashboard-chart-row{grid-template-columns:1fr}
}
</style>
