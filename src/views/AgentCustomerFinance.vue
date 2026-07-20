<template>
  <div class="customer-finance-page">
    <header class="finance-page-header">
      <div>
        <button class="back-link" type="button" @click="router.push('/agent-center')">
          <ArrowLeft :size="17" :stroke-width="2" />
          返回客户管理
        </button>
        <h2>客户资金明细</h2>
        <p>独立查看该客户的充值和消费流水，数据按时间倒序展示。</p>
      </div>
      <button class="refresh-btn" type="button" :disabled="loadingCustomer || loadingRows" @click="refreshAll">
        <RefreshCw :size="17" :stroke-width="1.9" />
        刷新
      </button>
    </header>

    <section v-if="loadingCustomer" class="customer-summary summary-loading" aria-label="正在加载客户信息">
      <span v-for="item in 4" :key="item"></span>
    </section>

    <section v-else-if="customerError" class="page-error">
      <CircleAlert :size="26" :stroke-width="1.7" />
      <div>
        <strong>客户信息加载失败</strong>
        <span>{{ customerError }}</span>
      </div>
      <button type="button" @click="loadCustomer">重新加载</button>
    </section>

    <section v-else class="customer-summary">
      <div class="customer-identity">
        <span class="customer-avatar">{{ avatarText }}</span>
        <div>
          <span class="summary-label">下级客户</span>
          <strong>{{ customer.nickName || customer.userName || '-' }}</strong>
          <small>{{ customer.enterpriseName || '未填写企业名称' }} · {{ customer.phonenumber || customer.userName || '-' }}</small>
        </div>
      </div>
      <dl class="summary-metrics">
        <div><dt>当前余额</dt><dd>&yen;{{ money(customer.balanceAmount) }}</dd></div>
        <div><dt>累计充值</dt><dd>&yen;{{ money(customer.rechargeAmount) }}</dd></div>
        <div><dt>累计消费</dt><dd>&yen;{{ money(customer.consumeAmount) }}</dd></div>
        <div><dt>注册时间</dt><dd class="date-value">{{ formatTime(customer.invitedAt) }}</dd></div>
      </dl>
    </section>

    <section class="ledger-workspace">
      <header class="ledger-toolbar">
        <div>
          <h3>资金流水</h3>
          <p>每页仅加载当前所需记录，流水较多时不会拖慢客户列表。</p>
        </div>
        <div class="ledger-tabs" role="tablist" aria-label="资金流水类型">
          <button type="button" :class="{ active: activeType === 'recharge' }" @click="switchType('recharge')">
            <CirclePlus :size="16" :stroke-width="1.9" />
            充值流水
          </button>
          <button type="button" :class="{ active: activeType === 'consume' }" @click="switchType('consume')">
            <CircleMinus :size="16" :stroke-width="1.9" />
            消费流水
          </button>
        </div>
      </header>

      <div v-if="ledgerError" class="ledger-error">
        <span>{{ ledgerError }}</span>
        <button type="button" @click="loadLedger">重新加载</button>
      </div>

      <div class="ledger-table-wrap">
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
            <tr v-if="loadingRows" class="loading-row"><td colspan="7"><span></span></td></tr>
            <tr v-else-if="!rows.length"><td colspan="7" class="empty-row">暂无{{ activeType === 'recharge' ? '充值' : '消费' }}流水</td></tr>
            <template v-else>
              <tr v-for="row in rows" :key="row.id">
                <td>{{ formatTime(row.createdAt) }}</td>
                <td><span :class="['type-badge', activeType]">{{ activeType === 'recharge' ? (row.businessType || '充值') : '消费' }}</span></td>
                <td class="numeric amount" :class="activeType">{{ activeType === 'recharge' ? '+' : '-' }}&yen;{{ money(row.changeAmount) }}</td>
                <td class="numeric">{{ balanceText(row.beforeAmount) }}</td>
                <td class="numeric">{{ balanceText(row.afterAmount) }}</td>
                <td class="reason-cell">{{ row.reason || '-' }}</td>
                <td class="trade-number" :title="row.outTradeNo || '-'">{{ row.outTradeNo || '-' }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <footer class="ledger-pagination">
        <div>
          <span>共 {{ ledgerPage.total }} 条记录</span>
          <select v-model.number="ledgerPage.pageSize" :disabled="loadingRows" @change="changePageSize">
            <option :value="10">10 条/页</option>
            <option :value="20">20 条/页</option>
            <option :value="50">50 条/页</option>
          </select>
        </div>
        <div class="page-controls">
          <button type="button" :disabled="ledgerPage.pageNum <= 1 || loadingRows" @click="changePage(-1)">上一页</button>
          <strong>{{ ledgerPage.pageNum }} / {{ totalPages }}</strong>
          <button type="button" :disabled="ledgerPage.pageNum >= totalPages || loadingRows" @click="changePage(1)">下一页</button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CircleAlert, CircleMinus, CirclePlus, RefreshCw } from '@lucide/vue'
import { getAgentCustomer, listAgentCustomerConsumptions, listAgentCustomerRecharges } from '../api/agent'

const route = useRoute()
const router = useRouter()
const customer = ref({})
const rows = ref([])
const loadingCustomer = ref(false)
const loadingRows = ref(false)
const customerError = ref('')
const ledgerError = ref('')
const activeType = ref(route.query.type === 'consume' ? 'consume' : 'recharge')
const ledgerPage = reactive({ pageNum: 1, pageSize: 20, total: 0 })

const userId = computed(() => route.params.userId)
const totalPages = computed(() => Math.max(1, Math.ceil(ledgerPage.total / ledgerPage.pageSize)))
const avatarText = computed(() => String(customer.value.nickName || customer.value.userName || '?').slice(0, 1).toUpperCase())

watch(() => route.query.type, value => {
  const nextType = value === 'consume' ? 'consume' : 'recharge'
  if (nextType === activeType.value) return
  activeType.value = nextType
  ledgerPage.pageNum = 1
  loadLedger()
})

function money(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function balanceText(value) {
  if (value === null || value === undefined || value === '') return '-'
  return `¥${money(value)}`
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ')
  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function loadCustomer() {
  loadingCustomer.value = true
  customerError.value = ''
  try {
    const response = await getAgentCustomer(userId.value)
    customer.value = response.data || {}
  } catch (error) {
    customerError.value = error?.msg || error?.message || '请稍后重试'
  } finally {
    loadingCustomer.value = false
  }
}

async function loadLedger() {
  loadingRows.value = true
  ledgerError.value = ''
  try {
    const params = { pageNum: ledgerPage.pageNum, pageSize: ledgerPage.pageSize }
    const response = activeType.value === 'recharge'
      ? await listAgentCustomerRecharges(userId.value, params)
      : await listAgentCustomerConsumptions(userId.value, params)
    const page = response.data || {}
    rows.value = page.rows || []
    ledgerPage.total = Number(page.total || 0)
    ledgerPage.pageNum = Number(page.pageNum || ledgerPage.pageNum)
    ledgerPage.pageSize = Number(page.pageSize || ledgerPage.pageSize)
  } catch (error) {
    rows.value = []
    ledgerPage.total = 0
    ledgerError.value = error?.msg || error?.message || '流水加载失败'
  } finally {
    loadingRows.value = false
  }
}

function switchType(type) {
  if (type === activeType.value) return
  router.replace({ query: { ...route.query, type } })
}

function changePage(step) {
  const target = ledgerPage.pageNum + step
  if (target < 1 || target > totalPages.value) return
  ledgerPage.pageNum = target
  loadLedger()
}

function changePageSize() {
  ledgerPage.pageNum = 1
  loadLedger()
}

function refreshAll() {
  Promise.all([loadCustomer(), loadLedger()])
}

onMounted(refreshAll)
</script>

<style scoped>
.customer-finance-page { width: min(1440px, 100%); margin: 0 auto; display: grid; gap: 18px; color: #172033; }
.finance-page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 2px 0 18px; border-bottom: 1px solid #dfe6ef; }
.finance-page-header h2 { margin: 10px 0 0; font-size: 25px; line-height: 1.3; letter-spacing: 0; }
.finance-page-header p { margin: 6px 0 0; color: #6b778c; font-size: 14px; }
.back-link { display: inline-flex; align-items: center; gap: 7px; padding: 0; border: 0; color: #2f6fe4; background: transparent; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.refresh-btn { height: 40px; display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; border: 1px solid #d6dfeb; border-radius: 7px; color: #344054; background: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.refresh-btn:hover:not(:disabled) { border-color: #9fb4cf; background: #f8fafc; }
.refresh-btn:disabled { opacity: .55; cursor: not-allowed; }

.customer-summary { min-height: 128px; display: grid; grid-template-columns: minmax(300px, .9fr) minmax(680px, 2fr); overflow: hidden; border: 1px solid #dfe6ef; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(31, 50, 81, .05); }
.customer-identity { display: flex; align-items: center; gap: 15px; padding: 22px 24px; border-right: 1px solid #e6ebf2; background: #f7faff; }
.customer-avatar { width: 48px; height: 48px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 8px; color: #245fc8; background: #e5efff; font-size: 19px; font-weight: 800; }
.summary-label { display: block; margin-bottom: 5px; color: #68758a; font-size: 12px; font-weight: 700; }
.customer-identity strong { display: block; color: #172033; font-size: 19px; }
.customer-identity small { display: block; max-width: 360px; margin-top: 6px; overflow: hidden; color: #6f7b8e; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.summary-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; }
.summary-metrics div { display: flex; flex-direction: column; justify-content: center; padding: 20px; border-right: 1px solid #edf1f6; }
.summary-metrics div:last-child { border-right: 0; }
.summary-metrics dt { margin-bottom: 10px; color: #68758a; font-size: 13px; }
.summary-metrics dd { margin: 0; color: #172033; font-size: 20px; font-weight: 750; font-variant-numeric: tabular-nums; }
.summary-metrics .date-value { font-size: 14px; line-height: 1.5; }
.summary-loading { grid-template-columns: repeat(4, 1fr); padding: 24px; gap: 18px; }
.summary-loading span { height: 70px; border-radius: 7px; background: linear-gradient(90deg, #eef2f7, #f8fafc, #eef2f7); background-size: 200% 100%; animation: loading 1.4s infinite; }

.page-error { min-height: 108px; display: flex; align-items: center; gap: 14px; padding: 22px 24px; border: 1px solid #f0c9c9; border-radius: 8px; color: #b42318; background: #fff7f7; }
.page-error div { flex: 1; }
.page-error strong, .page-error span { display: block; }
.page-error span { margin-top: 4px; font-size: 13px; }
.page-error button, .ledger-error button { border: 0; color: #245fc8; background: transparent; font: inherit; font-weight: 700; cursor: pointer; }

.ledger-workspace { overflow: hidden; border: 1px solid #dfe6ef; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(31, 50, 81, .05); }
.ledger-toolbar { min-height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 20px; border-bottom: 1px solid #e3e9f1; }
.ledger-toolbar h3 { margin: 0 0 5px; font-size: 18px; }
.ledger-toolbar p { margin: 0; color: #758196; font-size: 13px; }
.ledger-tabs { display: flex; align-items: center; gap: 4px; padding: 4px; border: 1px solid #dfe6ef; border-radius: 7px; background: #f5f7fa; }
.ledger-tabs button { height: 34px; display: inline-flex; align-items: center; gap: 7px; padding: 0 13px; border: 0; border-radius: 5px; color: #657287; background: transparent; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.ledger-tabs button.active { color: #245fc8; background: #fff; box-shadow: 0 1px 4px rgba(31, 50, 81, .1); }
.ledger-error { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 16px 20px 0; padding: 10px 12px; border: 1px solid #f0c9c9; border-radius: 6px; color: #b42318; background: #fff7f7; font-size: 13px; }
.ledger-table-wrap { overflow: auto; }
.ledger-table { width: 100%; min-width: 1180px; border-collapse: collapse; table-layout: fixed; }
.ledger-table th { padding: 12px 14px; border-bottom: 1px solid #dfe6ee; color: #637087; background: #f6f8fb; text-align: left; font-size: 12px; font-weight: 700; }
.ledger-table td { padding: 14px; border-bottom: 1px solid #e9edf3; color: #344054; font-size: 13px; vertical-align: middle; }
.ledger-table tbody tr:last-child td { border-bottom: 0; }
.ledger-table tbody tr:hover { background: #f9fbfd; }
.ledger-table th:nth-child(1) { width: 155px; }
.ledger-table th:nth-child(2) { width: 90px; }
.ledger-table th:nth-child(3), .ledger-table th:nth-child(4), .ledger-table th:nth-child(5) { width: 145px; }
.ledger-table th:nth-child(6) { width: 260px; }
.ledger-table th:nth-child(7) { width: 250px; }
.numeric { text-align: right !important; font-variant-numeric: tabular-nums; }
.amount { font-weight: 800; }
.amount.recharge { color: #16875d; }
.amount.consume { color: #c2413b; }
.type-badge { display: inline-flex; align-items: center; height: 24px; padding: 0 9px; border-radius: 5px; font-size: 12px; font-weight: 700; }
.type-badge.recharge { color: #137b55; background: #e8f7f0; }
.type-badge.consume { color: #b63b36; background: #fff0ef; }
.reason-cell { line-height: 1.5; overflow-wrap: anywhere; }
.trade-number { overflow: hidden; color: #5f6c80; font-family: Consolas, monospace; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.empty-row { height: 220px; color: #8792a4 !important; text-align: center; }
.loading-row td { height: 220px; padding: 30px; }
.loading-row span { display: block; height: 72px; border-radius: 7px; background: linear-gradient(90deg, #eef2f7, #f8fafc, #eef2f7); background-size: 200% 100%; animation: loading 1.4s infinite; }
.ledger-pagination { min-height: 66px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 12px 20px; border-top: 1px solid #e6ebf2; color: #69768b; font-size: 13px; }
.ledger-pagination > div { display: flex; align-items: center; gap: 12px; }
.ledger-pagination select, .page-controls button { height: 34px; border: 1px solid #d6dfeb; border-radius: 6px; color: #344054; background: #fff; font: inherit; }
.ledger-pagination select { padding: 0 30px 0 10px; }
.page-controls button { min-width: 70px; padding: 0 12px; cursor: pointer; }
.page-controls button:hover:not(:disabled) { border-color: #9fb4cf; background: #f8fafc; }
.page-controls button:disabled { opacity: .45; cursor: not-allowed; }
.page-controls strong { min-width: 68px; color: #344054; text-align: center; }

@keyframes loading { to { background-position: -200% 0; } }
@media (max-width: 1180px) {
  .customer-summary { grid-template-columns: 1fr; }
  .customer-identity { border-right: 0; border-bottom: 1px solid #e6ebf2; }
  .summary-metrics { min-height: 110px; }
}
@media (max-width: 760px) {
  .finance-page-header, .ledger-toolbar, .ledger-pagination { align-items: stretch; flex-direction: column; }
  .refresh-btn { width: 100%; justify-content: center; }
  .summary-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-metrics div:nth-child(2) { border-right: 0; }
  .summary-metrics div:nth-child(-n+2) { border-bottom: 1px solid #edf1f6; }
  .ledger-tabs { width: 100%; }
  .ledger-tabs button { flex: 1; justify-content: center; }
  .ledger-pagination > div { justify-content: space-between; }
}
</style>
