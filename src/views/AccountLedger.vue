<template>
  <main class="main-content ledger-page">
    <!-- 统计 -->
    <div class="stat-row">
      <div class="stat-cell">
        <span class="stat-cell-label">本月收入</span>
        <span class="stat-cell-value income">+ ¥ {{ monthIncome }}</span>
        <span class="stat-cell-sub">共 {{ incomeCount }} 笔</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">本月支出</span>
        <span class="stat-cell-value expense">- ¥ {{ monthExpense }}</span>
        <span class="stat-cell-sub">共 {{ expenseCount }} 笔</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">当前余额</span>
        <span class="stat-cell-value">¥ {{ balance }}</span>
        <span class="stat-cell-sub">实时更新</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">累计流水</span>
        <span class="stat-cell-value">{{ totalCount }}</span>
        <span class="stat-cell-sub">全部记录</span>
      </div>
    </div>

    <div class="table-section business-list-shell ledger-table-card">
      <!-- 筛选 -->
      <div class="filter-bar ledger-filter-bar">
        <select v-model="filters.type" class="field-input filter-sel">
          <option value="">全部类型</option>
          <option v-for="t in ledgerTypes" :key="t.key" :value="t.key">{{ t.label }}</option>
        </select>
        <input v-model="filters.no" class="field-input filter-kw" type="text" placeholder="流水号" />
        <div class="filter-date-range">
          <DateRangePicker
            v-model:start-date="filters.startDate"
            v-model:end-date="filters.endDate"
            @change="page = 1"
          />
        </div>
        <button class="btn-primary" type="button" @click="doSearch">查询</button>
        <button class="btn-outline" type="button" @click="resetFilters">重置</button>
      </div>

      <!-- 表格 -->
      <div class="table-content ledger-table-content">
        <table class="business-list-table">
          <thead>
            <tr>
              <th style="width:16%">时间</th>
              <th style="width:12%">类型</th>
              <th style="width:12%">变动金额</th>
              <th style="width:14%">变动前余额</th>
              <th style="width:23%">说明</th>
              <th style="width:23%">流水号</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in paged" :key="r.id">
              <td class="td-date">{{ r.time }}</td>
              <td>
                <span class="ledger-type" :class="r.typeTone">{{ r.typeLabel }}</span>
              </td>
              <td :class="['amount-cell', r.amountTone]">{{ r.amountText }}</td>
              <td>¥{{ r.beforeAmount }}</td>
              <td>{{ r.reason }}</td>
              <td class="td-mono ledger-serial">{{ r.serialNo }}</td>
            </tr>
            <tr v-if="paged.length===0"><td colspan="6" class="table-empty">暂无流水记录</td></tr>
          </tbody>
        </table>
      </div>

      <BusinessTableFooter
        v-if="total > 0"
        :total="total"
        :page="page"
        :page-size="pageSize"
        :total-pages="totalPages"
        @update:page-size="changePageSize"
        @page-change="goPage"
      />
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { listMyAccountLedger } from '../api/accountLedger'
import { getUserBalance, getUserProfile } from '../api/user'
import BusinessTableFooter from '../components/BusinessTableFooter.vue'
import DateRangePicker from '../components/DateRangePicker.vue'

const balance = ref('0.00')
const filters = ref({ type: '', no: '', startDate: '', endDate: '' })
const page = ref(1)
const pageSize = ref(10)
const ledgerTypes = [{ key:'1',label:'在线充值' },{ key:'2',label:'查询扣费' },{ key:'3',label:'赠送划拨' },{ key:'4',label:'退款' },{ key:'5',label:'后台调账' },{ key:'6',label:'代理赠送' },{ key:'7',label:'额度冻结' },{ key:'8',label:'冻结释放' }]
const records = ref([])
const statRows = ref([])
const total = ref(0)
const allLedgerCount = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)
const paged = computed(() => records.value)

const monthIncome = computed(() => {
  const sum = statRows.value.filter(r => r.amountTone === 'income').reduce((s, r) => s + r.amountFen, 0)
  return yuan(sum)
})
const monthExpense = computed(() => {
  const sum = statRows.value.filter(r => r.amountTone === 'expense').reduce((s, r) => s + r.amountFen, 0)
  return yuan(sum)
})
const incomeCount = computed(() => statRows.value.filter(r => r.amountTone === 'income').length)
const expenseCount = computed(() => statRows.value.filter(r => r.amountTone === 'expense').length)
const totalCount = computed(() => allLedgerCount.value || total.value)

function yuan(value) {
  return (Number(value || 0) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseLedgerDate(value) {
  const parsed = new Date(String(value || '').replace(/-/g, '/'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isCurrentMonth(value) {
  const date = parseLedgerDate(value)
  const now = new Date()
  return Boolean(date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth())
}

function typeMeta(row) {
  const style = String(row.changeStyle ?? row.type ?? '')
  const map = {
    1: { label: '在线充值', tone: 'income' },
    2: { label: '查询扣费', tone: 'expense' },
    3: { label: '赠送划拨', tone: 'income' },
    4: { label: '退款', tone: 'income' },
    5: { label: '后台调账', tone: Number(row.changeCent || 0) < 0 ? 'expense' : 'adjust' },
    6: { label: '代理赠送', tone: 'expense' },
    7: { label: '额度冻结', tone: 'frozen' },
    8: { label: '冻结释放', tone: 'released' }
  }
  return map[style] || { label: '其他', tone: 'adjust' }
}

function amountTone(row) {
  if (String(row.changeStyle) === '7') return 'frozen'
  if (String(row.changeStyle) === '8') return 'neutral'
  return Number(row.changeCent || 0) < 0 ? 'expense' : 'income'
}

function amountText(row) {
  const value = Number(row.changeCent || 0)
  if (String(row.changeStyle) === '7') return `¥${yuan(Math.abs(value))}`
  const prefix = String(row.changeStyle) === '8' ? '' : value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}¥${yuan(Math.abs(value))}`
}

function mapLedger(row) {
  const amount = Number(row.changeCent || 0)
  const meta = typeMeta(row)
  const tone = amountTone(row)
  return {
    id: row.id,
    time: String(row.createdAt || row.createTime || row.time || '').replace('T', ' ').slice(0, 16),
    type: String(row.changeStyle || ''),
    typeLabel: meta.label,
    typeTone: meta.tone,
    changeAmount: yuan(Math.abs(amount)),
    amountFen: Math.abs(amount),
    amountTone: tone,
    amountText: amountText(row),
    changeType: tone === 'income' ? 'add' : tone === 'expense' ? 'sub' : tone,
    beforeAmount: yuan(row.beforeMoney ?? row.beforeCent ?? 0),
    reason: row.reason || row.remark || '-',
    serialNo: row.outTradeNo || row.serialNo || '-'
  }
}

async function loadBalance() {
  const profile = await getUserProfile()
  const user = profile.data || profile.user || {}
  const result = await getUserBalance(user.userId || user.id)
  balance.value = yuan(result.data || result.balance || 0)
}

async function loadLedger() {
  const params = {
    pageNum: page.value,
    pageSize: pageSize.value
  }
  if (filters.value.type) params.changeStyle = Number(filters.value.type)
  if (filters.value.no) params.outTradeNo = filters.value.no
  if (filters.value.startDate) params['params[beginTime]'] = `${filters.value.startDate} 00:00:00`
  if (filters.value.endDate) params['params[endTime]'] = `${filters.value.endDate} 23:59:59`
  const response = await listMyAccountLedger(params)
  records.value = (response.rows || []).map(mapLedger)
  total.value = Number(response.total || records.value.length)
}

function extractLedgerRows(response) {
  const rows = response.rows || response.data?.rows || response.data || []
  return Array.isArray(rows) ? rows : []
}

async function fetchAllLedgerRows(baseParams = {}) {
  const rows = []
  const pageLimit = 200
  const fullPageSize = 500
  let pageNum = 1
  let totalCount = null

  while (pageNum <= pageLimit) {
    const response = await listMyAccountLedger({
      ...baseParams,
      pageNum,
      pageSize: fullPageSize
    })
    const pageRows = extractLedgerRows(response)
    const responseTotal = Number(response.total ?? response.data?.total ?? 0)
    if (responseTotal > 0) totalCount = responseTotal
    rows.push(...pageRows)
    if (!pageRows.length) break
    if (totalCount !== null && rows.length >= totalCount) break
    if (totalCount === null && pageRows.length < fullPageSize) break
    pageNum += 1
  }

  return rows
}

async function loadStats() {
  try {
    const rows = await fetchAllLedgerRows()
    allLedgerCount.value = rows.length
    statRows.value = rows.filter(row => isCurrentMonth(row.createdAt || row.createTime || row.time)).map(mapLedger)
  } catch (error) {
    allLedgerCount.value = 0
    statRows.value = []
  }
}

function doSearch(){page.value=1; loadLedger()}
function resetFilters(){filters.value={type:'',no:'',startDate:'',endDate:''};page.value=1; loadLedger()}
function changePageSize(size){pageSize.value=size;page.value=1}
function goPage(target){page.value=target}

watch([page, pageSize], loadLedger)

onMounted(async () => {
  await Promise.all([loadBalance(), loadStats(), loadLedger()])
})
</script>

<style scoped>
.ledger-page{min-height:0;overflow:hidden;gap:16px}
.ledger-page .stat-row{flex-shrink:0}
.ledger-page .stat-cell{padding:14px 20px}
.ledger-page .stat-cell-value{font-size:22px}
.stat-cell-value.income{color:var(--success)}
.stat-cell-value.expense{color:var(--error)}
.filter-date-range{width:342px}

.ledger-table-card{gap:0;flex:1;min-height:0}
.ledger-filter-bar{border:0;border-bottom:1px solid var(--border);padding:14px 20px 12px;flex-shrink:0}
.ledger-table-content{flex:1;min-height:0;overflow:auto}
.ledger-type{font-size:13px;font-weight:600}
.ledger-type.income{color:var(--success)}
.ledger-type.expense{color:var(--error)}
.ledger-type.adjust{color:#B7791F}
.ledger-type.frozen{color:#2F6FE4}
.ledger-type.released{color:var(--text2)}
.ledger-serial{font-size:14px}
.amount-cell{font-weight:600;font-variant-numeric:tabular-nums}
.amount-cell.income{color:var(--success)}
.amount-cell.expense{color:var(--error)}
.amount-cell.frozen{color:#B7791F}
.amount-cell.neutral{color:var(--text2)}

@media (max-width:768px){
  .ledger-page{overflow:auto}
  .filter-date-range{width:100%}
  .ledger-table-card{flex:none;min-height:auto}
  .ledger-table-content{flex:none;max-height:56vh}
}
</style>
