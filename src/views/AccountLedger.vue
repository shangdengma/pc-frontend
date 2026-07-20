<template>
  <div class="account-ledger-page">
    <header class="page-header">
      <div>
        <button class="back-link" type="button" @click="router.push('/recharge')">
          <ArrowLeft :size="17" :stroke-width="2" />
          返回账户充值
        </button>
        <h2>资金流水</h2>
        <p>查看账户充值、扣费、退款、冻结及释放记录。</p>
      </div>
      <button class="refresh-btn" type="button" :disabled="loading" @click="refreshPage">
        <RefreshCw :size="17" :stroke-width="1.9" />
        刷新
      </button>
    </header>

    <section class="balance-summary">
      <div class="balance-icon"><WalletCards :size="24" :stroke-width="1.8" /></div>
      <div>
        <span>当前可用余额</span>
        <strong>&yen;{{ yuanFromFen(balance) }}</strong>
      </div>
      <p>资金金额统一按元展示，数据来自账户资金流水。</p>
    </section>

    <section class="ledger-workspace">
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
        <table class="ledger-table">
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
                <td class="time-cell">{{ formatTime(row.createdAt) }}</td>
                <td><span :class="['type-badge', typeMeta(row).tone]">{{ typeMeta(row).label }}</span></td>
                <td :class="['numeric', 'amount-cell', amountTone(row)]">{{ amountText(row) }}</td>
                <td class="numeric">{{ balanceText(row.beforeMoney) }}</td>
                <td class="numeric">{{ balanceText(row.afterMoney) }}</td>
                <td class="reason-cell" :title="row.reason || '-'">{{ row.reason || '-' }}</td>
                <td class="trade-cell" :title="row.outTradeNo || '-'">{{ row.outTradeNo || '-' }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <footer class="pagination-bar">
        <div>
          <span>共 {{ pagination.total }} 条记录</span>
          <select v-model.number="pagination.pageSize" :disabled="loading" @change="changePageSize">
            <option :value="10">10 条/页</option>
            <option :value="20">20 条/页</option>
            <option :value="50">50 条/页</option>
          </select>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CircleAlert, ReceiptText, RefreshCw, Search, WalletCards } from '@lucide/vue'
import { listMyAccountLedger } from '../api/accountLedger'
import { getUserBalance, getUserProfile } from '../api/user'
import { yuanFromFen } from '../utils/format'

const router = useRouter()
const rows = ref([])
const balance = ref(0)
const userId = ref('')
const loading = ref(false)
const errorMessage = ref('')
const filters = reactive({ changeStyle: '', outTradeNo: '' })
const pagination = reactive({ pageNum: 1, pageSize: 20, total: 0 })

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
  if (['7', '8'].includes(String(row.changeStyle))) return 'neutral'
  return Number(row.changeCent || 0) < 0 ? 'expense' : 'income'
}

function amountText(row) {
  const value = Number(row.changeCent || 0)
  const prefix = ['7', '8'].includes(String(row.changeStyle)) ? '' : value > 0 ? '+' : value < 0 ? '-' : ''
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

async function loadBalance() {
  try {
    const profile = await getUserProfile()
    const user = profile.data || {}
    userId.value = user.userId || user.id || ''
    balance.value = user.money || 0
    if (userId.value) {
      const result = await getUserBalance(userId.value)
      balance.value = result.data || 0
    }
  } catch (error) {
    console.warn('[account-ledger] load balance failed', error)
  }
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
  pagination.pageNum = 1
  loadLedger()
}

function refreshPage() {
  Promise.all([loadBalance(), loadLedger()])
}

onMounted(refreshPage)
</script>

<style scoped>
.account-ledger-page { width: min(1440px, 100%); margin: 0 auto; display: grid; gap: 18px; color: #172033; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 2px 0 18px; border-bottom: 1px solid #dfe6ef; }
.page-header h2 { margin: 10px 0 0; font-size: 25px; line-height: 1.3; letter-spacing: 0; }
.page-header p { margin: 6px 0 0; color: #6b778c; font-size: 14px; }
.back-link { display: inline-flex; align-items: center; gap: 7px; padding: 0; border: 0; color: #2f6fe4; background: transparent; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.refresh-btn { height: 40px; display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; border: 1px solid #d6dfeb; border-radius: 7px; color: #344054; background: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.refresh-btn:hover:not(:disabled) { border-color: #9fb4cf; background: #f8fafc; }
.refresh-btn:disabled { opacity: .55; cursor: not-allowed; }

.balance-summary { min-height: 108px; display: flex; align-items: center; gap: 16px; padding: 20px 24px; border: 1px solid #dce5f0; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(31, 50, 81, .05); }
.balance-icon { width: 48px; height: 48px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 8px; color: #2467dc; background: #eaf1ff; }
.balance-summary span { display: block; margin-bottom: 6px; color: #6b778c; font-size: 13px; }
.balance-summary strong { font-size: 26px; font-variant-numeric: tabular-nums; }
.balance-summary p { margin: 0 0 0 auto; color: #7b8799; font-size: 13px; }

.ledger-workspace { overflow: hidden; border: 1px solid #dfe6ef; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(31, 50, 81, .05); }
.filter-bar { display: flex; align-items: flex-end; gap: 14px; padding: 18px 20px; border-bottom: 1px solid #e3e9f1; background: #fbfcfe; }
.filter-bar label { display: grid; gap: 7px; }
.filter-bar label > span { color: #526077; font-size: 12px; font-weight: 700; }
.filter-bar select, .filter-bar input { height: 40px; border: 1px solid #d5deea; border-radius: 7px; outline: none; color: #273449; background: #fff; font: inherit; font-size: 13px; }
.filter-bar select { min-width: 185px; padding: 0 34px 0 12px; }
.filter-bar input { width: min(420px, 36vw); padding: 0 12px; }
.filter-bar select:focus, .filter-bar input:focus { border-color: #4f83e4; box-shadow: 0 0 0 3px rgba(47, 111, 228, .1); }
.filter-actions { display: flex; gap: 8px; }
.query-btn, .reset-btn { height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 16px; border-radius: 7px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.query-btn { border: 1px solid #2f6fe4; color: #fff; background: #2f6fe4; }
.reset-btn { border: 1px solid #d6dfeb; color: #526077; background: #fff; }
.query-btn:disabled, .reset-btn:disabled { opacity: .55; cursor: not-allowed; }

.error-banner { display: flex; align-items: center; gap: 9px; margin: 16px 20px 0; padding: 11px 12px; border: 1px solid #f0c9c9; border-radius: 6px; color: #b42318; background: #fff7f7; font-size: 13px; }
.error-banner span { flex: 1; }
.error-banner button { border: 0; color: #b42318; background: transparent; font: inherit; font-weight: 700; cursor: pointer; }
.table-wrap { overflow-x: auto; }
.ledger-table { width: 100%; min-width: 1180px; border-collapse: collapse; table-layout: fixed; }
.ledger-table th { padding: 12px 14px; border-bottom: 1px solid #dfe6ee; color: #637087; background: #f6f8fb; text-align: left; font-size: 12px; font-weight: 700; }
.ledger-table td { padding: 14px; border-bottom: 1px solid #e9edf3; color: #344054; font-size: 13px; vertical-align: middle; }
.ledger-table tbody tr:last-child td { border-bottom: 0; }
.ledger-table tbody tr:hover { background: #f9fbfd; }
.ledger-table th:nth-child(1) { width: 155px; }
.ledger-table th:nth-child(2) { width: 130px; }
.ledger-table th:nth-child(3), .ledger-table th:nth-child(4), .ledger-table th:nth-child(5) { width: 145px; }
.ledger-table th:nth-child(6) { width: 260px; }
.ledger-table th:nth-child(7) { width: 250px; }
.numeric { text-align: right !important; font-variant-numeric: tabular-nums; }
.amount-cell { font-weight: 800; }
.amount-cell.income { color: #16875d; }
.amount-cell.expense { color: #c2413b; }
.amount-cell.neutral { color: #2f6fe4; }
.type-badge { display: inline-flex; align-items: center; min-height: 24px; padding: 3px 9px; border-radius: 5px; font-size: 12px; font-weight: 700; }
.type-badge.income { color: #137a54; background: #e9f8f0; }
.type-badge.expense { color: #b93832; background: #fff0ef; }
.type-badge.adjust { color: #75531a; background: #fff6df; }
.type-badge.frozen { color: #245fc8; background: #eaf1ff; }
.type-badge.released { color: #5d6675; background: #eef1f5; }
.time-cell { white-space: nowrap; }
.reason-cell, .trade-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.trade-cell { color: #5f6d82; font-family: Consolas, 'Courier New', monospace; font-size: 12px !important; }
.loading-row td { height: 210px; text-align: center; }
.loading-row span { width: 28px; height: 28px; display: inline-block; border: 3px solid #dce6f6; border-top-color: #2f6fe4; border-radius: 50%; animation: spin .8s linear infinite; }
.empty-row { height: 230px; text-align: center; color: #8390a3 !important; }
.empty-row svg, .empty-row strong, .empty-row span { display: block; margin: 0 auto; }
.empty-row strong { margin-top: 10px; color: #5b687c; font-size: 14px; }
.empty-row span { margin-top: 5px; font-size: 12px; }
.pagination-bar { min-height: 62px; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 10px 20px; border-top: 1px solid #e3e9f1; color: #68758a; font-size: 13px; }
.pagination-bar > div { display: flex; align-items: center; gap: 12px; }
.pagination-bar select, .page-controls button { height: 34px; border: 1px solid #d6dfeb; border-radius: 6px; color: #455269; background: #fff; font: inherit; font-size: 12px; }
.pagination-bar select { padding: 0 28px 0 10px; }
.page-controls button { min-width: 66px; padding: 0 12px; cursor: pointer; }
.page-controls button:disabled { color: #a8b2c1; background: #f7f9fb; cursor: not-allowed; }
.page-controls strong { min-width: 62px; color: #455269; text-align: center; font-size: 12px; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .page-header { align-items: flex-start; }
  .balance-summary { align-items: flex-start; flex-wrap: wrap; }
  .balance-summary p { width: 100%; margin: 0; }
  .filter-bar { align-items: stretch; flex-direction: column; }
  .filter-bar input, .filter-bar select { width: 100%; }
  .filter-actions { justify-content: flex-end; }
}
</style>
