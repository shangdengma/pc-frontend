<template>
  <div class="records-page workspace-page workspace-page--wide">
    <header class="page-head">
      <div class="page-head-main">
        <h2>背调记录</h2>
      </div>
      <div class="page-head-actions records-head-actions">
        <button class="ghost-btn" type="button" :disabled="exporting || !records.length" @click="exportCsv">
          {{ exporting ? '导出中…' : '导出' }}
        </button>
        <router-link class="primary-btn" to="/query/create">{{ canOnlineTest ? '在线测试' : '发起背调' }}</router-link>
      </div>
    </header>

    <section class="work-card records-card workspace-surface">
    <!-- 状态放 Tab 而不是下拉：进这一页最常见的动作就是「看哪些在跑 / 哪些出了」，
         一次点击就该到位，也让各状态一眼可见 -->
    <nav class="status-tabs" aria-label="按状态筛选">
      <button
        v-for="tab in STATUS_TABS"
        :key="tab.value"
        type="button"
        :class="{ active: filters.status === tab.value }"
        @click="selectStatus(tab.value)"
      >{{ tab.label }}</button>
    </nav>

    <div class="toolbar">
      <input v-model.trim="filters.keyword" placeholder="搜索候选人姓名 / 手机号" @keyup.enter="search">
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
          <tr v-else-if="records.length === 0"><td colspan="7" class="table-empty">暂无符合条件的背调记录</td></tr>
          <tr v-for="item in records" :key="item.id" :class="{ 'row-expanded': expandedRows[item.id] }">
            <td data-label="姓名" class="record-name"><strong>{{ item.name }}</strong></td>
            <td data-label="查询类型" class="record-type">{{ item.type }}</td>
            <td data-label="身份证号" class="record-identity">{{ maskIdCard(item.idCard) }}</td>
            <td data-label="手机号" class="record-phone">{{ maskPhone(item.phone) }}</td>
            <td data-label="提交时间" class="record-time">{{ formatDateTime(item.time) }}</td>
            <td data-label="状态">
              <div class="record-status-cell">
                <span class="status-pill" :class="statusClass(item.displayStatus)">{{ statusText(item.displayStatus, item.displayStatusText) }}</span>
                <div v-if="item.statusReason" class="record-status-reason" :title="item.statusReason">{{ item.statusReason }}</div>
              </div>
            </td>
            <td data-label="操作" class="actions-cell">
              <!-- 仅窄屏出现：手机上默认只展示姓名/时间/状态，其余字段折叠 -->
              <button class="text-btn mobile-only-btn" @click="toggleRow(item.id)">
                {{ expandedRows[item.id] ? '收起' : '详情' }}
              </button>
              <!-- 邀请短信可能被运营商拦截，待授权的单子给一个手动转发链接的兜底 -->
              <button
                v-if="String(item.displayStatus) === 'waiting_auth'"
                class="text-btn"
                data-testid="copy-candidate-link"
                :disabled="linkLoadingId === item.id"
                @click="copyCandidateLink(item)"
              >
                {{ linkLoadingId === item.id ? '获取中…' : '复制链接' }}
              </button>
              <button
                v-if="String(item.displayStatus) === 'waiting_auth'"
                class="text-btn"
                :disabled="smsLoadingId === item.id"
                @click="resendSms(item)"
              >
                {{ smsLoadingId === item.id ? '发送中…' : '重发短信' }}
              </button>
              <!-- 报告类操作只在出结果后出现：没出结果时摆一对灰按钮既占位又没意义，
                   待授权行还要跟复制链接、重发短信挤在一起 -->
              <button v-if="String(item.displayStatus) === 'success'" class="text-btn" @click="openReport(item)">查看报告</button>
              <button v-if="String(item.displayStatus) === 'success'" class="text-btn" @click="downloadPdf(item)">下载PDF</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pager">
      <span>共 {{ total }} 条</span>
      <select v-model.number="filters.pageSize" @change="search">
        <option :value="5">5 条/页</option>
        <option :value="10">10 条/页</option>
        <option :value="20">20 条/页</option>
      </select>
      <button class="ghost-btn" :disabled="filters.pageNum <= 1" @click="changePage(-1)">上一页</button>
      <span>{{ filters.pageNum }} / {{ totalPages }} 页</span>
      <button class="ghost-btn" :disabled="filters.pageNum >= totalPages" @click="changePage(1)">下一页</button>
    </div>
    </section>

    <div v-if="fallbackLink" class="fallback-link-mask" @click.self="closeFallbackLink">
      <section class="fallback-link-dialog" role="dialog" aria-modal="true" aria-labelledby="fallback-link-title">
        <div class="fallback-link-head">
          <div>
            <strong id="fallback-link-title">复制候选人授权链接</strong>
            <p>浏览器未允许自动复制，请使用下方按钮重试，或手动选择链接。</p>
          </div>
          <button type="button" class="icon-btn" title="关闭" aria-label="关闭" @click="closeFallbackLink">
            <X :size="18" />
          </button>
        </div>
        <input ref="fallbackLinkInput" class="fallback-link-input" :value="fallbackLink" readonly @focus="$event.target.select()">
        <p class="fallback-link-hint">
          请把链接发给候选人本人。候选人需使用本单预留手机号
          {{ fallbackPhone }} 接收验证码后进入填写。
        </p>
        <div class="fallback-link-actions">
          <button type="button" class="ghost-btn" @click="closeFallbackLink">取消</button>
          <button type="button" class="primary-btn" @click="copyFallbackLink">
            <Copy :size="16" />
            再次复制
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useRefresh } from '../composables/pullRefresh'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Copy, X } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { listData, getCandidateLink, resendCandidateSms } from '../api/data'
import { listQueryTypeConfig } from '../api/queryType'
import { getUserProfile } from '../api/user'
import { formatDateTime, mapRecord, statusClass, statusText } from '../utils/format'

const router = useRouter()
const route = useRoute()

// 六个后端状态压成五个 Tab：无结果 / 查询失败 / 已退款 对用户是同一件事
// ——没拿到报告、钱已退回，分成三个 Tab 只会把高频的三项挤窄。
// 'unfinished' 由后端 FormDataMapper 的同名分支取这三者的并集。
const STATUS_TABS = [
  { value: '', label: '全部' },
  { value: 'waiting_auth', label: '待授权' },
  { value: 'processing', label: '处理中' },
  { value: 'success', label: '已完成' },
  { value: 'unfinished', label: '未出结果' }
]
const STATUS_VALUES = new Set(STATUS_TABS.map(item => item.value))

const loading = ref(false)
const exporting = ref(false)
const records = ref([])
const total = ref(0)
// 手机端记录卡默认只显示姓名/提交时间/状态/操作，
// 查询类型、身份证号、手机号折叠起来——扫列表时看的是"谁的、什么状态"，
// 脱敏后的证件号在列表里参考价值低却各占一行。
const expandedRows = ref({})
function toggleRow(id) {
  expandedRows.value = { ...expandedRows.value, [id]: !expandedRows.value[id] }
}
const queryTypeMap = ref({})
const linkLoadingId = ref(null)
const smsLoadingId = ref(null)
// 复制失败（非 HTTPS 下 clipboard 不可用）时把链接摊在页面上，让用户能手动选中
const fallbackLink = ref('')
const fallbackPhone = ref('')
const fallbackLinkInput = ref(null)
const profile = ref({})
const filters = reactive({ pageNum: 1, pageSize: 5, keyword: '', status: '' })

const totalPages = computed(() => Math.max(1, Math.ceil((total.value || 0) / filters.pageSize)))
const hasFilters = computed(() => !!(filters.keyword || filters.status))
const canOnlineTest = computed(() => profile.value && (profile.value.onlineTestEnabled === true || profile.value.onlineTestEnabled === 1 || profile.value.onlineTestEnabled === '1'))

function search() {
  filters.pageNum = 1
  loadRecords()
}

function selectStatus(value) {
  if (filters.status === value) return
  const query = { ...route.query }
  if (value) query.status = value
  else delete query.status
  router.replace({ path: route.path, query })
}

/* ---- 导出 ----
   导出的是当前筛选条件下的全部记录，不是当前这一页——
   HR 拿它做入职台账或跟财务对账，只给一页没有意义。
   证件号和手机号按列表同样的规则脱敏后再写入：
   导出的文件会离开系统（发邮件、存网盘），不该比页面上看到的更敏感。 */
const EXPORT_PAGE_SIZE = 200
const EXPORT_MAX_PAGES = 25

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  // 前导 = + - @ 会被 Excel 当公式执行，补一个单引号打断
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

async function exportCsv() {
  if (exporting.value) return
  exporting.value = true
  try {
    const base = { pageSize: EXPORT_PAGE_SIZE }
    if (filters.keyword) base.searchKeyword = filters.keyword
    if (filters.status) base.displayStatusFilter = filters.status

    const all = []
    for (let page = 1; page <= EXPORT_MAX_PAGES; page += 1) {
      const res = await listData({ ...base, pageNum: page })
      const rows = res.rows || []
      all.push(...rows.map(item => mapRecord(item, queryTypeMap.value)))
      if (all.length >= (res.total || 0) || rows.length < EXPORT_PAGE_SIZE) break
    }

    if (!all.length) {
      show('当前条件下没有可导出的记录', 'error')
      return
    }

    const header = ['姓名', '查询类型', '身份证号', '手机号', '提交时间', '状态']
    const lines = [header.map(csvCell).join(',')]
    all.forEach(item => {
      lines.push([
        item.name,
        item.type,
        maskIdCard(item.idCard),
        maskPhone(item.phone),
        formatDateTime(item.time),
        statusText(item.displayStatus, item.displayStatusText)
      ].map(csvCell).join(','))
    })

    // BOM 必须有，否则 Excel 按 GBK 解析这份 UTF-8 文件，中文全是乱码
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const stamp = new Date().toISOString().slice(0, 10)
    link.download = `背调记录_${stamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    show(`已导出 ${all.length} 条记录`)
  } catch (err) {
    show(err?.msg || '导出失败，请稍后重试', 'error')
  } finally {
    exporting.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  if (filters.status) {
    const query = { ...route.query }
    delete query.status
    router.replace({ path: route.path, query })
  } else {
    search()
  }
}

// 重发邀请短信。后端限制累计 2 次 + 60 秒冷却，超限会返回明确原因
async function resendSms(item) {
  if (smsLoadingId.value) return
  smsLoadingId.value = item.id
  try {
    const res = await resendCandidateSms(item.id)
    show(res?.msg || `已向 ${item.name} 重新发送邀请短信`, 'success')
  } catch (e) {
    show(e?.msg || e?.message || '短信发送失败', 'error')
  } finally {
    smsLoadingId.value = null
  }
}

// 邀请短信被运营商拦截时，企业侧自己把链接转给候选人
async function copyCandidateLink(item) {
  if (linkLoadingId.value) return
  linkLoadingId.value = item.id
  fallbackLink.value = ''
  try {
    const res = await getCandidateLink(item.id)
    const link = res?.candidateLink
    if (!link) throw new Error('未获取到链接')
    fallbackPhone.value = res.candidatePhone || ''
    const copied = await copyText(link)
    if (copied) {
      show(`已复制 ${item.name} 的授权链接，可直接发给候选人`, 'success')
    } else {
      fallbackLink.value = link
      show('浏览器未允许自动复制，请在弹窗中重试', 'info')
    }
  } catch (e) {
    const errorMessage = e?.msg || e?.message || '获取授权链接失败'
    show(errorMessage.includes('授权链接已过期')
      ? '该授权链接已过期，请重新发起查询'
      : errorMessage, 'error')
  } finally {
    linkLoadingId.value = null
  }
}

async function copyText(text) {
  const value = String(text || '').trim()
  if (!value) return false

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    let timeoutId
    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise((resolve, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('clipboard timeout')), 1800)
        })
      ])
      return true
    } catch (e) {
      // 继续使用兼容复制方案。
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)
  try {
    return document.execCommand('copy')
  } catch (e) {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

async function copyFallbackLink() {
  if (await copyText(fallbackLink.value)) {
    closeFallbackLink()
    show('授权链接已复制', 'success')
    return
  }
  fallbackLinkInput.value?.focus()
  fallbackLinkInput.value?.select()
  show('仍无法自动复制，链接已为你选中，请按 Ctrl+C', 'info')
}

function closeFallbackLink() {
  fallbackLink.value = ''
  fallbackPhone.value = ''
}

function show(text, type = 'info') {
  if (!text) return
  const notify = typeof toast[type] === 'function' ? toast[type] : toast
  notify(text)
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

// 连续切换状态 Tab 会同时挂起多个请求，而这个接口并不快。
// 没有序号的话，先发的请求后返回就会覆盖掉后发的结果——
// 表现为「点了已完成，列表里却是待授权的数据」。只认最后一次发出的请求。
let loadSeq = 0

async function loadRecords() {
  const seq = ++loadSeq
  loading.value = true
  try {
    const params = { pageNum: filters.pageNum, pageSize: filters.pageSize }
    if (filters.keyword) params.searchKeyword = filters.keyword
    if (filters.status) params.displayStatusFilter = filters.status
    const res = await listData(params)
    if (seq !== loadSeq) return
    total.value = res.total || 0
    records.value = (res.rows || []).map(item => mapRecord(item, queryTypeMap.value))
  } catch (err) {
    if (seq !== loadSeq) return
    show(err?.msg || '背调记录加载失败', 'error')
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

function changePage(delta) {
  filters.pageNum += delta
  loadRecords()
}

function openReport(item) {
  if (String(item.displayStatus) !== 'success') return show('该记录尚未生成报告，暂时无法查看', 'error')
  router.push(`/report/${item.id}`)
}

function downloadPdf(item) {
  if (String(item.displayStatus) !== 'success') return show('报告尚未生成，暂时无法下载', 'error')
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
  const routeStatus = String(route.query.status || '')
  filters.status = STATUS_VALUES.has(routeStatus) ? routeStatus : ''
  const profilePromise = getUserProfile().then(res => { profile.value = res.data || res.user || {} }).catch(() => {})
  await Promise.all([loadQueryTypes(), profilePromise])
  await loadRecords()
})

watch(() => route.query.status, value => {
  const routeStatus = String(value || '')
  const nextStatus = STATUS_VALUES.has(routeStatus) ? routeStatus : ''
  if (nextStatus === filters.status) return
  filters.status = nextStatus
  filters.pageNum = 1
  loadRecords()
})
// 移动端下拉刷新复用同一个加载函数
useRefresh(loadRecords)
</script>

