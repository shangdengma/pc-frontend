<template>
  <div class="account-ledger-page workspace-page workspace-page--wide">
    <header class="page-head">
      <div class="page-head-main">
        <h2>资金流水</h2>
      </div>
    </header>

    <section class="ledger-workspace workspace-surface">
      <div class="filter-bar">
        <label>
          <span>流水类型</span>
          <select v-model="filters.changeStyle" :disabled="loading" @change="search">
            <option value="">全部类型</option>
            <option v-for="item in typeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="trade-filter">
          <span>业务流水号</span>
          <input
            v-model.trim="filters.outTradeNo"
            type="text"
            placeholder="输入完整业务流水号"
            @keyup.enter="search"
          />
        </label>
        <div class="filter-actions">
          <button class="query-btn" type="button" :disabled="loading" @click="search">
            <Search :size="16" :stroke-width="2" />
            查询
          </button>
          <button class="reset-btn" type="button" :disabled="loading" @click="resetFilters">重置</button>
        </div>
      </div>

      <div v-if="errorMessage" class="error-banner">
        <CircleAlert :size="18" :stroke-width="1.9" />
        <span>{{ errorMessage }}</span>
        <button type="button" @click="loadLedger">重新加载</button>
      </div>

      <div class="table-wrap">
        <table class="data-table ledger-table">
          <colgroup>
            <col class="ledger-col-time" />
            <col class="ledger-col-type" />
            <col class="ledger-col-amount" />
            <col class="ledger-col-balance" />
            <col class="ledger-col-balance" />
            <col class="ledger-col-reason" />
            <col class="ledger-col-trade" />
          </colgroup>
          <thead>
            <tr>
              <th>发生时间</th>
              <th>流水类型</th>
              <th class="numeric">变动金额（元）</th>
              <th class="numeric">变动前余额（元）</th>
              <th class="numeric">变动后余额（元）</th>
              <th>变动原因</th>
              <th>业务流水号</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="loading-row">
              <td colspan="7"><span></span></td>
            </tr>
            <tr v-else-if="!rows.length">
              <td colspan="7" class="empty-row">
                <ReceiptText :size="28" :stroke-width="1.6" />
                <strong>暂无资金流水</strong>
                <span>当前筛选条件下没有可展示的记录</span>
              </td>
            </tr>
            <template v-else>
              <tr v-for="row in rows" :key="row.id">
                <td data-label="发生时间" class="time-cell">{{ formatTime(row.createdAt) }}</td>
                <td data-label="流水类型"><span :class="['type-badge', typeMeta(row).tone]">{{ typeMeta(row).label }}</span></td>
                <td data-label="变动金额" :class="['numeric', 'amount-cell', amountTone(row)]">{{ amountText(row) }}</td>
                <td data-label="变动前余额" class="numeric">{{ balanceText(row.beforeMoney) }}</td>
                <td data-label="变动后余额" class="numeric balance-cell">
                  <span class="mobile-field-label">余额</span>
                  <span>{{ balanceText(row.afterMoney) }}</span>
                </td>
                <td data-label="变动原因" class="reason-cell" :title="row.reason || '-'">
                  <span class="mobile-field-label">变动原因</span>
                  <span class="reason-value">{{ row.reason || '-' }}</span>
                </td>
                <td data-label="业务流水号" class="trade-cell" :title="row.outTradeNo || '-'">
                  <span class="mobile-field-label">流水号</span>
                  <code class="trade-value">{{ row.outTradeNo || '-' }}</code>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <footer class="pagination-bar">
        <div>
          <span>共 {{ pagination.total }} 条记录</span>
          <select v-if="!isMobile" v-model.number="pagination.pageSize" :disabled="loading" @change="changePageSize">
            <option :value="10">10 条/页</option>
            <option :value="20">20 条/页</option>
            <option :value="50">50 条/页</option>
          </select>
          <span v-else class="mobile-page-size">每页 5 条</span>
        </div>
        <div class="page-controls">
          <button type="button" :disabled="pagination.pageNum <= 1 || loading" @click="changePage(-1)">上一页</button>
          <strong>{{ pagination.pageNum }} / {{ totalPages }}</strong>
          <button type="button" :disabled="pagination.pageNum >= totalPages || loading" @click="changePage(1)">下一页</button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { useRefresh } from '../composables/pullRefresh'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { CircleAlert, ReceiptText, Search } from '@lucide/vue'
import { listMyAccountLedger } from '../api/accountLedger'
import { yuanFromFen } from '../utils/format'

const rows = ref([])
const loading = ref(false)
const errorMessage = ref('')
const filters = reactive({ changeStyle: '', outTradeNo: '' })
const pagination = reactive({ pageNum: 1, pageSize: 20, total: 0 })
const isMobile = ref(false)
const desktopPageSize = ref(20)
let mobileMediaQuery = null

const typeOptions = [
  { value: '1', label: '在线充值' },
  { value: '2', label: '查询扣费' },
  { value: '3', label: '赠送或划拨入账' },
  { value: '4', label: '退款入账' },
  { value: '5', label: '后台调账' },
  { value: '6', label: '代理赠送支出' },
  { value: '7', label: '额度冻结' },
  { value: '8', label: '冻结释放' }
]

const totalPages = computed(() => Math.max(1, Math.ceil(pagination.total / pagination.pageSize)))

function typeMeta(row) {
  const style = String(row.changeStyle ?? '')
  const map = {
    1: { label: '在线充值', tone: 'income' },
    2: { label: '查询扣费', tone: 'expense' },
    3: { label: '赠送或划拨', tone: 'income' },
    4: { label: '退款入账', tone: 'income' },
    5: { label: '后台调账', tone: Number(row.changeCent || 0) < 0 ? 'expense' : 'adjust' },
    6: { label: '代理赠送', tone: 'expense' },
    7: { label: '额度冻结', tone: 'frozen' },
    8: { label: '冻结释放', tone: 'released' }
  }
  return map[style] || { label: '其他变动', tone: 'adjust' }
}

function amountTone(row) {
  if (String(row.changeStyle) === '7') return 'frozen'
  if (String(row.changeStyle) === '8') return 'neutral'
  return Number(row.changeCent || 0) < 0 ? 'expense' : 'income'
}

function amountText(row) {
  const value = Number(row.changeCent || 0)
  if (String(row.changeStyle) === '7') return `¥${yuanFromFen(Math.abs(value))}`
  const prefix = String(row.changeStyle) === '8' ? '' : value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}¥${yuanFromFen(Math.abs(value))}`
}

function balanceText(value) {
  if (value === null || value === undefined || value === '') return '-'
  return `¥${yuanFromFen(value)}`
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ')
  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function loadLedger() {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    if (filters.changeStyle) params.changeStyle = Number(filters.changeStyle)
    if (filters.outTradeNo) params.outTradeNo = filters.outTradeNo

    const response = await listMyAccountLedger(params)
    rows.value = response.rows || []
    pagination.total = Number(response.total || 0)
  } catch (error) {
    rows.value = []
    pagination.total = 0
    errorMessage.value = error?.msg || error?.message || '资金流水加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function search() {
  pagination.pageNum = 1
  loadLedger()
}

function resetFilters() {
  filters.changeStyle = ''
  filters.outTradeNo = ''
  search()
}

function changePage(step) {
  const target = pagination.pageNum + step
  if (target < 1 || target > totalPages.value) return
  pagination.pageNum = target
  loadLedger()
}

function changePageSize() {
  desktopPageSize.value = pagination.pageSize
  pagination.pageNum = 1
  loadLedger()
}

function applyViewportPageSize(matches, shouldLoad = true) {
  if (matches === isMobile.value && pagination.pageSize === (matches ? 5 : desktopPageSize.value)) {
    if (shouldLoad) loadLedger()
    return
  }

  if (matches && !isMobile.value) desktopPageSize.value = pagination.pageSize
  isMobile.value = matches
  pagination.pageSize = matches ? 5 : desktopPageSize.value
  pagination.pageNum = 1
  if (shouldLoad) loadLedger()
}

function handleViewportChange(event) {
  applyViewportPageSize(event.matches)
}

function refreshPage() {
  // 必须把 Promise 交出去：下拉刷新要靠它判断何时收起指示器
  return loadLedger()
}

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 768px)')
  applyViewportPageSize(mobileMediaQuery.matches)
  mobileMediaQuery.addEventListener('change', handleViewportChange)
})

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', handleViewportChange)
})
// 移动端下拉刷新复用同一个加载函数
useRefresh(refreshPage)
</script>

<style scoped>
.account-ledger-page { width: min(1280px, 100%); margin: 0 auto; color: #172033; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 2px 0 18px; border-bottom: 1px solid var(--line); }
.page-header h2 { margin: 10px 0 0; font-size: var(--fs-2xl); line-height: 1.3; letter-spacing: 0; }
.page-header p { margin: 6px 0 0; color: var(--muted); font-size: var(--fs-base); }
.back-link { display: inline-flex; align-items: center; gap: 7px; padding: 0; border: 0; color: var(--blue); background: transparent; font: inherit; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; }
.refresh-btn { height: 40px; display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; border: 1px solid var(--line); border-radius: var(--radius); color: var(--text-secondary); background: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.refresh-btn:hover:not(:disabled) { border-color: #9fb4cf; background: var(--line-soft); }
.refresh-btn:disabled { opacity: .55; cursor: not-allowed; }

.ledger-workspace { overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius); background: #fff; box-shadow: 0 8px 24px rgba(31, 50, 81, .05); }
.filter-bar { display: flex; align-items: flex-end; gap: 14px; padding: 18px 20px; border-bottom: 1px solid var(--line); background: #fbfcfe; }
.filter-bar label { display: grid; gap: 7px; }
.filter-bar label > span { color: var(--muted); font-size: var(--fs-xs); font-weight: 700; }
.filter-bar select, .filter-bar input { height: 40px; border: 1px solid #d5deea; border-radius: var(--radius); outline: none; color: #273449; background: #fff; font: inherit; font-size: var(--fs-sm); }
.filter-bar select { min-width: 185px; padding: 0 34px 0 12px; }
.filter-bar input { width: min(420px, 36vw); padding: 0 12px; }
.filter-bar select:focus, .filter-bar input:focus { border-color: #4f83e4; box-shadow: 0 0 0 3px rgba(47, 111, 228, .1); }
.filter-actions { display: flex; gap: 8px; }
.query-btn, .reset-btn { height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 16px; border-radius: var(--radius); font: inherit; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; }
.query-btn { border: 1px solid var(--blue); color: #fff; background: var(--blue); }
.reset-btn { border: 1px solid var(--line); color: var(--muted); background: #fff; }
.query-btn:disabled, .reset-btn:disabled { opacity: .55; cursor: not-allowed; }

.error-banner { display: flex; align-items: center; gap: 9px; margin: 16px 20px 0; padding: 11px 12px; border: 1px solid #f0c9c9; border-radius: var(--radius); color: #b42318; background: #fff7f7; font-size: var(--fs-sm); }
.error-banner span { flex: 1; }
.error-banner button { border: 0; color: #b42318; background: transparent; font: inherit; font-weight: 700; cursor: pointer; }
.table-wrap { overflow-x: auto; }
/* 表头背景、字重、行高、边框色一律继承全局 .data-table，
   这里只留本页特有的列宽与最小宽度。原先这套私有样式让资金流水的
   表头是灰底 700 字重、行高 54px、边框用 #dfe6ee/#e9edf3 两个硬编码色，
   和查询记录（透明表头、600、51px、token 色）明显不是一套。 */
.ledger-table { width: 100%; min-width: 1000px; table-layout: fixed; }
/* 各列宽度之和原为 1230px，而工作区容器只有 1136px，桌面端一直在横向溢出。
   收紧固定列，把「变动原因」留成弹性列吃掉剩余宽度。 */
.ledger-col-time { width: 13%; }
.ledger-col-type { width: 10%; }
.ledger-col-amount { width: 11%; }
.ledger-col-balance { width: 12%; }
.ledger-col-reason { width: 21%; }
.ledger-col-trade { width: 21%; }
.numeric { text-align: right !important; font-variant-numeric: tabular-nums; }
.amount-cell { font-weight: 800; }
.amount-cell.income { color: #16875d; }
.amount-cell.expense { color: #c2413b; }
.amount-cell.frozen { color: #b35c00; }
.amount-cell.neutral { color: var(--blue); }
.type-badge { display: inline-flex; align-items: center; min-height: 24px; padding: 3px 9px; border-radius: var(--radius); font-size: var(--fs-xs); font-weight: 700; }
.type-badge.income { color: #137a54; background: #e9f8f0; }
.type-badge.expense { color: #b93832; background: #fff0ef; }
.type-badge.adjust { color: #75531a; background: #fff6df; }
.type-badge.frozen { color: #245fc8; background: var(--line-soft); }
.type-badge.released { color: #5d6675; background: #eef1f5; }
.time-cell { white-space: nowrap; }
.reason-cell, .trade-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.trade-cell { color: #5f6d82; font-family: Consolas, 'Courier New', monospace; font-size: var(--fs-xs) !important; }
.mobile-field-label { display: none; }
.trade-value { color: inherit; font: inherit; }
.loading-row td { height: 210px; text-align: center; }
.loading-row span { width: 28px; height: 28px; display: inline-block; border: 3px solid #dce6f6; border-top-color: var(--blue); border-radius: 50%; animation: spin .8s linear infinite; }
.empty-row { height: 230px; text-align: center; color: #8390a3 !important; }
.empty-row svg, .empty-row strong, .empty-row span { display: block; margin: 0 auto; }
.empty-row strong { margin-top: 10px; color: #5b687c; font-size: var(--fs-base); }
.empty-row span { margin-top: 5px; font-size: var(--fs-xs); }
.pagination-bar { min-height: 62px; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 10px 20px; border-top: 1px solid var(--line); color: #68758a; font-size: var(--fs-sm); }
.pagination-bar > div { display: flex; align-items: center; gap: 12px; }
.pagination-bar select, .page-controls button { height: 34px; border: 1px solid var(--line); border-radius: var(--radius); color: var(--text-secondary); background: #fff; font: inherit; font-size: var(--fs-xs); }
.pagination-bar select { padding: 0 28px 0 10px; }
.page-controls button { min-width: 66px; padding: 0 12px; cursor: pointer; }
.page-controls button:disabled { color: #a8b2c1; background: #f7f9fb; cursor: not-allowed; }
.page-controls strong { min-width: 62px; color: var(--text-secondary); text-align: center; font-size: var(--fs-xs); }
.mobile-page-size { color: var(--muted); white-space: nowrap; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .page-header { align-items: flex-start; }
  .filter-bar { align-items: stretch; flex-direction: column; }
  .filter-bar input, .filter-bar select { width: 100%; }
  .filter-actions { justify-content: flex-end; }
}

/* 移动端：筛选与汇总单列 */
@media (max-width: 768px) {
  .ledger-filters, .ledger-summary { grid-template-columns: minmax(0, 1fr) !important; }
  .ledger-filters input, .ledger-filters select, .ledger-filters button { width: 100%; }
  .pagination-bar { align-items: stretch; flex-direction: column; gap: 10px; padding: 12px 14px; }
  .pagination-bar > div { width: 100%; justify-content: space-between; }
}

/* 移动端：每条流水只保留一套卡片布局，避免与全局 data-table 的
   data-label 伪元素叠加后出现重复标签、右对齐和长文本挤压。 */
@media (max-width: 768px) {
  .ledger-workspace {
    overflow: visible;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
  .table-wrap { overflow: visible; }

  .ledger-table {
    width: 100%;
    min-width: 0;
    table-layout: auto;
    display: block;
  }
  .ledger-table thead { display: none; }
  .ledger-table tbody { display: block; }
  .ledger-table th { width: auto !important; }

  .ledger-table tbody tr {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "type   amount"
      "time   after"
      "reason reason"
      "trade  trade";
    gap: 7px 14px;
    margin-bottom: 10px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: #fff;
  }
  .ledger-table tbody tr:last-child { margin-bottom: 0; }

  .ledger-table tbody td {
    display: block;
    min-width: 0;
    padding: 0 !important;
    border: 0;
    text-align: left;
  }

  /* 全局移动端表格会通过 ::before 自动输出 data-label，本页使用显式标签。 */
  .ledger-table tbody td::before {
    content: none !important;
    display: none !important;
  }

  .ledger-table td[data-label="流水类型"] {
    grid-area: type;
    align-self: center;
    text-align: left !important;
  }
  .ledger-table td[data-label="变动金额"] {
    grid-area: amount;
    align-self: center;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.25;
    text-align: right !important;
  }
  .ledger-table td[data-label="发生时间"] {
    grid-area: time;
    color: var(--muted);
    font-size: var(--fs-xs);
    line-height: 1.5;
    text-align: left !important;
  }
  .ledger-table td[data-label="变动后余额"] {
    grid-area: after;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    color: var(--muted);
    font-size: var(--fs-xs);
    line-height: 1.5;
    text-align: right !important;
  }

  .ledger-table td[data-label="变动前余额"] { display: none; }

  .ledger-table td[data-label="变动原因"] {
    grid-area: reason;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 10px;
    margin-top: 3px;
    padding-top: 10px !important;
    border-top: 1px solid var(--line-soft);
    color: var(--text-secondary);
    font-size: var(--fs-xs);
    line-height: 1.65;
    text-align: left !important;
    white-space: normal;
  }
  .ledger-table td[data-label="业务流水号"] {
    grid-area: trade;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    color: #8a94a6;
    font-size: var(--fs-xs);
    line-height: 1.55;
    text-align: left !important;
    white-space: normal;
  }
  .ledger-table .mobile-field-label {
    display: inline;
    color: var(--muted);
    font-family: inherit;
    font-weight: 500;
    white-space: nowrap;
  }
  .ledger-table .reason-value,
  .ledger-table .trade-value {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .ledger-table .trade-value {
    color: #758197;
    font-family: Consolas, 'Courier New', monospace;
  }

  .ledger-table .loading-row, .ledger-table .empty-row { display: block; }
  .ledger-table .loading-row td, .ledger-table .empty-row { display: block; text-align: center; }
}
</style>
