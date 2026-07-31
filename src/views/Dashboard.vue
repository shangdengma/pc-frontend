<template>
  <div class="dashboard-page">
    <header class="page-head">
      <div class="page-head-main">
        <p class="page-head-eyebrow">企业背调工作台</p>
        <h2>{{ greeting }}，{{ displayName }}</h2>
      </div>
      <div class="page-head-actions">
        <router-link class="primary-btn" to="/query/create">
          <Plus :size="17" :stroke-width="2" />
          {{ canOnlineTest ? '在线测试' : '发起背调' }}
        </router-link>
      </div>
    </header>

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
            <h3>最近背调记录</h3>
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
            <tr v-else-if="recentRecords.length === 0"><td colspan="4" class="table-empty">暂无查询记录</td></tr>
            <tr v-for="row in recentRecords" :key="row.id || row.name + row.time">
              <td data-label="姓名"><strong>{{ row.name }}</strong></td>
              <td data-label="查询类型">{{ row.type }}</td>
              <td data-label="提交时间">{{ formatDateTime(row.time) }}</td>
              <td data-label="状态"><span class="status-pill" :class="statusClass(row.displayStatus)"><i></i>{{ statusText(row.displayStatus, row.displayStatusText) }}</span></td>
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

      <article v-if="hasTrendData" class="panel chart-panel">
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

    </section>

  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import {
  ArrowRight,
  BarChart3,
  FileSignature,
  LoaderCircle,
  Megaphone,
  Plus
} from '@lucide/vue'
import { listData } from '../api/data'
import { getAnnouncements } from '../api/notice'
import { listQueryTypeConfig } from '../api/queryType'
import { getUserBalance, getUserProfile } from '../api/user'
import { getUser } from '../utils/auth'
import { formatDateTime, mapRecord, statusClass, statusText } from '../utils/format'

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
const recentRecords = computed(() => records.value.slice(0, 5))
const runningCount = computed(() => records.value.filter(r => ['processing', 'waiting_auth'].includes(String(r.displayStatus))).length)
const authCount = computed(() => records.value.filter(r => String(r.displayStatus) === 'waiting_auth').length)
const canOnlineTest = computed(() => profile.value && (profile.value.onlineTestEnabled === true || profile.value.onlineTestEnabled === 1 || profile.value.onlineTestEnabled === '1'))
// 余额已常驻顶栏，不必在工作台再占一格；「近 30 天查询」下方的趋势图已经表达了同样的信息。
// 剩下两项是当前真正需要盯的进行中事务，说明文字对老用户是噪音，去掉。
const metrics = computed(() => [
  { label: '背调中', value: `${runningCount.value} 单`, icon: LoaderCircle },
  { label: '待授权', value: `${authCount.value} 单`, icon: FileSignature }
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

async function renderTrendChart() {
  await nextTick()
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    animationDuration: 260,
    grid: { top: 24, right: 18, bottom: 32, left: 38 },
    tooltip: { trigger: 'axis', valueFormatter: value => `${value} 次` },
    // 下面这些颜色不能写 var(--x)：ECharts 绘制在 canvas 上，
    // 不走 CSS 变量解析，写了等于没设置。值已对齐全站灰阶。
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendSeries.value.labels,
      axisLine: { lineStyle: { color: '#e3e5e9' } },
      axisTick: { show: false },
      axisLabel: { color: '#667085', interval: 4, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#667085', fontSize: 11 },
      splitLine: { lineStyle: { color: '#eef0f3' } }
    },
    series: [{
      name: '查询量',
      type: 'line',
      data: trendSeries.value.values,
      smooth: 0.28,
      symbol: 'none',
      // 图表用蓝：这是数据可视化的取色，不是品牌装饰，跟全站去蓝无关。
      // 另外 ECharts 画在 canvas 上，不认 CSS 变量，这里必须写实际色值。
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
.notice-item {
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.notice-item {
  color: inherit;
  text-decoration: none;
}
</style>
