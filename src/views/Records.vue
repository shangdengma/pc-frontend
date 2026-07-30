<template>
  <main class="main-content">
    <!-- 筛选栏 -->
    <div class="filter-bar records-filter">
      <label class="filter-field filter-field-keyword">
        <span>关键词</span>
        <input v-model="filters.keyword" class="field-input" type="text" placeholder="姓名 / 手机号 / 身份证号" />
      </label>
      <label class="filter-field filter-field-status">
        <span>查询状态</span>
        <select v-model="filters.status" class="field-input">
          <option value="">全部状态</option>
          <option value="1">查询中</option>
          <option value="2">查询成功</option>
          <option value="3">查询失败</option>
          <option value="4">已退款</option>
          <option value="5">授权中</option>
          <option value="6">背调中止</option>
          <option value="4,6">已退款 / 已中止</option>
        </select>
      </label>
      <div class="filter-field filter-field-date">
        <span>提交日期</span>
        <DateRangePicker
          v-model:start-date="filters.startDate"
          v-model:end-date="filters.endDate"
          @change="page = 1"
        />
      </div>
      <div class="filter-actions">
        <button class="btn-primary" @click="doSearch">查询</button>
        <button class="btn-outline" @click="resetFilters">重置</button>
      </div>
    </div>

    <FormAlert class="records-error" :message="loadError" type="error" />

    <!-- 表格与分页一体化卡片 -->
    <div class="table-section business-list-shell records-table-card">
      <div class="table-header">
        <h2>查询结果</h2>
        <span class="table-count">共 {{ total }} 条记录</span>
      </div>
      <div class="table-content">
        <table class="business-list-table">
          <thead>
            <tr>
              <th style="width:10%">候选人</th>
              <th style="width:12%">背调类型</th>
              <th style="width:16%">身份证号</th>
              <th style="width:12%">手机号</th>
              <th style="width:16%">提交时间</th>
              <th style="width:10%">状态</th>
              <th style="width:24%">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRecords" :key="row.id || row.name">
              <td class="td-name">{{ row.name }}</td>
              <td class="td-type">{{ row.type }}</td>
              <td class="td-mono">{{ maskIdCard(row.idCard) }}</td>
              <td class="td-mono">{{ maskPhone(row.phone) }}</td>
              <td class="td-date">{{ formatTime(row.time) }}</td>
              <td><span class="status-badge" :class="recordStatusClass(row.status)">{{ recordStatusText(row.status) }}</span></td>
              <td>
                <div class="action-group record-actions">
                  <router-link v-if="canOperateRecord(row)" :to="`/report/${row.id}`" class="action-link">查看报告</router-link>
                  <span v-else class="action-plain">查看报告</span>
                  <button v-if="canOperateRecord(row)" class="action-link action-btn" type="button" @click="downloadPdf(row)">下载 PDF</button>
                  <span v-else class="action-plain">下载 PDF</span>
                </div>
              </td>
            </tr>
            <tr v-if="pagedRecords.length === 0">
              <td colspan="7" class="table-empty">暂无查询记录，可<router-link to="/query/create">发起背调查询</router-link></td>
            </tr>
          </tbody>
        </table>
      </div>
      <BusinessTableFooter
        v-if="total > 0"
        :total="total"
        :page="page"
        :page-size="pageSize"
        :total-pages="totalPages"
        :loading="loading"
        @update:page-size="changePageSize"
        @page-change="goPage"
      />
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listData } from '../api/data'
import { listQueryTypeConfig } from '../api/queryType'
import { getUserProfile } from '../api/user'
import { mapRecord as mapLegacyRecord } from '../utils/format'
import BusinessTableFooter from '../components/BusinessTableFooter.vue'
import DateRangePicker from '../components/DateRangePicker.vue'
import FormAlert from '../components/FormAlert.vue'

const route = useRoute()
const router = useRouter()

const filters = ref({ keyword: '', status: '', startDate: '', endDate: '' })
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const records = ref([])
const queryTypeMap = ref({})
const loading = ref(false)
const ready = ref(false)
const loadError = ref('')

watch(
  () => route.query.keyword,
  value => {
    filters.value.keyword = typeof value === 'string' ? value : ''
    page.value = 1
    if (ready.value) loadRecords()
  },
  { immediate: true }
)

watch(
  () => route.query.status,
  value => {
    filters.value.status = typeof value === 'string' ? value : ''
    page.value = 1
    if (ready.value) loadRecords()
  },
  { immediate: true }
)

watch([page, pageSize], () => {
  if (ready.value) loadRecords()
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)
const pagedRecords = computed(() => records.value)

function syncKeywordQuery(keyword) {
  const query = { ...route.query }
  if (keyword) query.keyword = keyword
  else delete query.keyword
  router.replace({ path: '/records', query })
}
function syncStatusQuery(status) {
  const query = { ...route.query }
  if (status) query.status = status
  else delete query.status
  router.replace({ path: '/records', query })
}
function doSearch() {
  page.value = 1
  const keyword = filters.value.keyword.trim()
  const routeChanged = String(route.query.keyword || '') !== keyword || String(route.query.status || '') !== String(filters.value.status || '')
  syncKeywordQuery(keyword)
  syncStatusQuery(filters.value.status)
  if (!routeChanged) loadRecords()
}
function resetFilters() {
  filters.value = { keyword: '', status: '', startDate: '', endDate: '' }
  page.value = 1
  const routeChanged = Boolean(route.query.keyword || route.query.status)
  syncKeywordQuery('')
  syncStatusQuery('')
  if (!routeChanged) loadRecords()
}
function changePageSize(size) {
  pageSize.value = size
  page.value = 1
}
function goPage(target) {
  page.value = target
}
function canOperateRecord(row) {
  return String(row.status) === '2'
}
function downloadPdf(row) {
  if (!canOperateRecord(row)) return
  try {
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
  } catch (error) {
    loadError.value = error?.msg || error?.message || 'PDF 下载失败'
  }
}
function maskIdCard(v) { return v ? v.slice(0, 3) + '***********' + v.slice(-4) : '-' }
function maskPhone(v) { return v ? v.slice(0, 3) + '****' + v.slice(-4) : '-' }
function formatTime(t) {
  if (!t) return '-'
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}年${m}月${day}日 ${h}:${min}`
}
function recordStatusText(s) {
  const m = { '1': '查询中', '2': '查询成功', '3': '查询失败', '4': '已退款', '5': '授权中', '6': '背调中止' }
  return m[String(s)] || '未知'
}
function recordStatusClass(s) {
  const m = { '1': 'info', '2': 'success', '3': 'error', '4': 'neutral', '5': 'warning', '6': 'neutral' }
  return m[String(s)] || 'neutral'
}

function mapRecord(row) {
  const mapped = mapLegacyRecord(row, queryTypeMap.value)
  return { ...mapped, status: String(mapped.status ?? '') }
}

async function loadQueryTypes() {
  const res = await listQueryTypeConfig({ pageNum: 1, pageSize: 1000 })
  queryTypeMap.value = Object.fromEntries((res.rows || []).map(item => [
    String(item.id),
    item.callTypeName || item.name || `类型${item.id}`
  ]))
}

async function loadRecords() {
  loading.value = true
  loadError.value = ''
  try {
    const params = {
      pageNum: page.value,
      pageSize: pageSize.value
    }
    if (filters.value.keyword.trim()) params.idCard = filters.value.keyword.trim()
    if (filters.value.status) params.searchStatus = filters.value.status
    if (filters.value.startDate) params['params[beginTime]'] = `${filters.value.startDate} 00:00:00`
    if (filters.value.endDate) params['params[endTime]'] = `${filters.value.endDate} 23:59:59`
    const res = await listData(params)
    records.value = (res.rows || []).map(mapRecord)
    total.value = Number(res.total || records.value.length)
  } catch (error) {
    records.value = []
    total.value = 0
    loadError.value = error?.msg || error?.message || '查询记录加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadQueryTypes(), getUserProfile().catch(() => null)])
  ready.value = true
  await loadRecords()
})
</script>

<style scoped>
.table-count{font-size:13px;color:var(--text2);font-weight:400}
.records-error{margin:0}
.action-group{display:flex;align-items:center;gap:16px}
.record-actions{gap:14px}
.action-btn{padding:0;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:500;line-height:inherit}
.action-plain{font-size:13px;color:var(--text3);font-weight:500;white-space:nowrap}

.records-filter{align-items:flex-end;gap:14px;padding:16px 20px}
.filter-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.filter-field > span{font-size:12px;font-weight:600;color:var(--text2)}
.filter-field-keyword{width:280px}
.filter-field-status{width:150px}
.filter-field-date{width:342px}
.filter-actions{display:flex;align-items:center;gap:10px;margin-left:auto}
.filter-actions .btn-primary,.filter-actions .btn-outline{height:40px}

/* 表格卡片一体化 */
.records-table-card{display:flex;flex-direction:column;min-height:0}
.records-table-card .table-content{overflow:auto}
@media (max-width:980px){
  .filter-field-keyword,.filter-field-status,.filter-field-date{width:100%}
  .filter-actions{width:100%;margin-left:0}
  .filter-actions .btn-primary,.filter-actions .btn-outline{flex:1;justify-content:center}
}
</style>
