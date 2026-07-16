<template>
  <section class="work-card records-card">
    <div class="work-card-head records-head">
      <div>
        <h2>查询记录</h2>
      </div>
      <router-link class="primary-btn" to="/query/create">发起查询</router-link>
    </div>

    <div class="toolbar">
      <input v-model.trim="filters.keyword" placeholder="搜索姓名 / 身份证号" @keyup.enter="search">
      <select v-model="filters.status" @change="search">
        <option value="">全部状态</option>
        <option value="5">授权中</option>
        <option value="1">查询中</option>
        <option value="2">查询成功</option>
        <option value="3">查询失败</option>
        <option value="4">已退款</option>
        <option value="6">背调中止</option>
      </select>
      <span class="toolbar-label">提交时间</span>
      <input v-model="filters.beginTime" type="date" @change="search">
      <span class="toolbar-sep">—</span>
      <input v-model="filters.endTime" type="date" @change="search">
      <button class="ghost-btn" @click="search">查询</button>
      <button v-if="hasFilters" class="text-btn" @click="resetFilters">重置</button>
    </div>

    <div class="records-table-wrap">
      <table class="data-table large records-table">
        <colgroup>
          <col class="record-col-name">
          <col class="record-col-type">
          <col class="record-col-id">
          <col class="record-col-phone">
          <col class="record-col-time">
          <col class="record-col-status">
          <col class="record-col-actions">
        </colgroup>
        <thead>
          <tr><th>姓名</th><th>查询类型</th><th>身份证号</th><th>手机号</th><th>提交时间</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="skeleton-table-row"><td colspan="7"><span></span></td></tr>
          <tr v-else-if="records.length === 0"><td colspan="7" class="table-empty">暂无符合条件的查询记录</td></tr>
          <tr v-for="item in records" :key="item.id">
            <td class="record-name"><strong>{{ item.name }}</strong></td>
            <td class="record-type">{{ item.type }}</td>
            <td class="record-identity">{{ maskIdCard(item.idCard) }}</td>
            <td class="record-phone">{{ maskPhone(item.phone) }}</td>
            <td class="record-time">{{ formatDateTime(item.time) }}</td>
            <td>
              <div class="record-status-cell">
                <span class="status-pill" :class="statusClass(item.status, item.displayStatus)">{{ statusText(item.status, item.displayStatusText) }}</span>
                <div v-if="item.statusReason" class="record-status-reason">{{ item.statusReason }}</div>
              </div>
            </td>
            <td class="actions-cell">
              <button class="text-btn" :disabled="String(item.status) !== '2'" @click="openReport(item)">查看报告</button>
              <button class="text-btn" :disabled="String(item.status) !== '2'" @click="downloadPdf(item)">下载PDF</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pager">
      <span>共 {{ total }} 条</span>
      <select v-model.number="filters.pageSize" @change="search">
        <option :value="10">10 条/页</option>
        <option :value="20">20 条/页</option>
        <option :value="50">50 条/页</option>
      </select>
      <button class="ghost-btn" :disabled="filters.pageNum <= 1" @click="changePage(-1)">上一页</button>
      <span>{{ filters.pageNum }} / {{ totalPages }} 页</span>
      <button class="ghost-btn" :disabled="filters.pageNum >= totalPages" @click="changePage(1)">下一页</button>
    </div>

    <div v-if="message" class="form-message" :class="messageType">{{ message }}</div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listData } from '../api/data'
import { listQueryTypeConfig } from '../api/queryType'
import { formatDateTime, mapRecord, statusClass, statusText } from '../utils/format'

const router = useRouter()
const loading = ref(false)
const records = ref([])
const total = ref(0)
const queryTypeMap = ref({})
const message = ref('')
const messageType = ref('info')
const filters = reactive({ pageNum: 1, pageSize: 10, keyword: '', status: '', beginTime: '', endTime: '' })

const totalPages = computed(() => Math.max(1, Math.ceil((total.value || 0) / filters.pageSize)))
const hasFilters = computed(() => !!(filters.keyword || filters.status || filters.beginTime || filters.endTime))

function search() {
  filters.pageNum = 1
  loadRecords()
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.beginTime = ''
  filters.endTime = ''
  search()
}

function show(text, type = 'info') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 2500)
}

function maskIdCard(value) {
  if (!value) return '-'
  const s = String(value)
  if (s.length <= 7) return s
  return `${s.slice(0, 3)}${'*'.repeat(Math.max(0, s.length - 7))}${s.slice(-4)}`
}

function maskPhone(value) {
  if (!value) return '-'
  const s = String(value)
  if (s.length !== 11) return s
  return `${s.slice(0, 3)}****${s.slice(-4)}`
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

async function loadRecords() {
  loading.value = true
  try {
    const params = { pageNum: filters.pageNum, pageSize: filters.pageSize }
    if (filters.keyword) params.idCard = filters.keyword
    if (filters.status) params.searchStatus = filters.status
    if (filters.beginTime) params['params[beginTime]'] = `${filters.beginTime} 00:00:00`
    if (filters.endTime) params['params[endTime]'] = `${filters.endTime} 23:59:59`
    const res = await listData(params)
    total.value = res.total || 0
    records.value = (res.rows || []).map(item => mapRecord(item, queryTypeMap.value))
  } catch (err) {
    show(err?.msg || '查询记录加载失败', 'error')
  } finally {
    loading.value = false
  }
}

function changePage(delta) {
  filters.pageNum += delta
  loadRecords()
}

function openReport(item) {
  if (String(item.status) !== '2') return show('当前状态不能查看报告', 'error')
  router.push(`/report/${item.id}`)
}

function downloadPdf(item) {
  if (String(item.status) !== '2') return show('报告尚未生成，暂时无法下载', 'error')
  try {
    if (item.pdfFilePath) {
      const path = String(item.pdfFilePath).trim()
      const base = import.meta.env.VITE_APP_BASE_API || ''
      const url = /^(https?:)?\/\//i.test(path) ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`
      const link = document.createElement('a')
      link.href = encodeURI(url)
      link.download = `背调报告_${item.name || item.id}.pdf`
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    const target = router.resolve({
      name: 'reportDetail',
      params: { id: item.id },
      query: { download: '1' }
    })
    window.open(target.href, '_blank', 'noopener')
  } catch (err) {
    show(err?.msg || 'PDF 下载失败', 'error')
  }
}

onMounted(async () => {
  await loadQueryTypes()
  await loadRecords()
})
</script>



