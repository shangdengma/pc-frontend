<template>
  <main class="main-content agent-customer-finance-page">
    <!-- 客户摘要 -->
    <div class="stat-row finance-stat-row">
      <div class="stat-cell customer-info-stat">
        <div class="customer-info-layout">
          <div class="customer-info-main">
            <span class="stat-cell-label">当前客户信息</span>
            <span class="stat-cell-value customer-name">{{ customer.name }}</span>
          </div>
          <div class="customer-meta-list">
            <span>
              <b>客户账号</b>
              <em>{{ customer.userName }}</em>
            </span>
            <span>
              <b>手机号</b>
              <em>{{ customer.phone }}</em>
            </span>
            <span>
              <b>注册时间</b>
              <em>{{ customer.regTime }}</em>
            </span>
          </div>
        </div>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">账户余额</span>
        <span class="stat-cell-value">¥ {{ customer.balance.toLocaleString() }}</span>
        <span class="stat-cell-sub">当前可用</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">累计充值</span>
        <span class="stat-cell-value income">¥ {{ customer.recharge.toLocaleString() }}</span>
        <span class="stat-cell-sub">共 {{ rechargeTotal }} 笔</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">累计消费</span>
        <span class="stat-cell-value expense">¥ {{ customer.consume.toLocaleString() }}</span>
        <span class="stat-cell-sub">共 {{ consumeTotal }} 笔</span>
      </div>
    </div>

    <!-- Tab -->
    <div class="tab-bar">
      <button class="tab-item" :class="{ active: tab==='recharge' }" @click="switchTab('recharge')">充值记录</button>
      <button class="tab-item" :class="{ active: tab==='consume' }" @click="switchTab('consume')">消费记录</button>
    </div>

    <!-- 表格 -->
    <div class="table-section business-list-shell">
      <div class="table-content">
        <table class="business-list-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>变动金额</th>
              <th>变动前余额</th>
              <th>变动后余额</th>
              <th>说明</th>
              <th>业务流水号</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td class="td-date">{{ r.createdAt }}</td>
              <td>{{ tab === 'recharge' ? (r.businessType || '充值') : '消费' }}</td>
              <td :class="{ add: tab==='recharge', sub: tab==='consume' }">
                {{ tab==='recharge'?'+':'-' }}¥{{ money(r.changeAmount) }}
              </td>
              <td>{{ balanceText(r.beforeAmount) }}</td>
              <td>{{ balanceText(r.afterAmount) }}</td>
              <td>{{ r.reason || '-' }}</td>
              <td class="td-mono">{{ r.outTradeNo || '-' }}</td>
            </tr>
            <tr v-if="rows.length===0">
              <td colspan="7" class="table-empty">{{ loading ? '正在加载...' : '暂无记录' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <BusinessTableFooter
        v-if="page.total > 0"
        :total="page.total"
        :page="page.pageNum"
        :page-size="page.pageSize"
        :total-pages="totalPages"
        :loading="loading"
        @update:page-size="changePageSize"
        @page-change="goPage"
      />
      <FormAlert class="finance-error" :message="errorMessage" type="error" />
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAgentCustomer, listAgentCustomerConsumptions, listAgentCustomerRecharges } from '../api/agent'
import BusinessTableFooter from '../components/BusinessTableFooter.vue'
import FormAlert from '../components/FormAlert.vue'

const route = useRoute()
const router = useRouter()
const customer = ref({ name:'-', userName:'-', phone:'-', balance:0, recharge:0, consume:0, regTime:'-' })
const tab = ref(route.query.type === 'consume' ? 'consume' : 'recharge')
const rows = ref([])
const rechargeTotal = ref(0)
const consumeTotal = ref(0)
const loading = ref(false)
const errorMessage = ref('')
const page = reactive({ pageNum: 1, pageSize: 20, total: 0 })
const totalPages = computed(() => Math.max(1, Math.ceil(page.total / page.pageSize)))

function money(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function balanceText(value) {
  if (value === null || value === undefined || value === '') return '-'
  return `¥${money(value)}`
}

function mapLedger(item) {
  return {
    ...item,
    id: item.id,
    createdAt: String(item.createdAt || '').replace('T', ' ').slice(0, 19),
    changeAmount: Number(item.changeAmount || 0),
    beforeAmount: item.beforeAmount,
    afterAmount: item.afterAmount,
    reason: item.reason || '',
    outTradeNo: item.outTradeNo || '',
    businessType: item.businessType || ''
  }
}

async function loadCustomer() {
  const userId = route.params.userId
  const customerRes = await getAgentCustomer(userId)
  const data = customerRes.data || {}
  customer.value = {
    name: data.enterpriseName || data.nickName || data.userName || '-',
    userName: data.userName || '-',
    phone: data.phonenumber || data.phone || '-',
    balance: Number(data.balanceAmount || 0),
    recharge: Number(data.rechargeAmount || 0),
    consume: Number(data.consumeAmount || 0),
    regTime: String(data.invitedAt || '').replace('T', ' ').slice(0, 16)
  }
  if (customer.value.name && customer.value.name !== '-' && route.query.customerName !== customer.value.name) {
    router.replace({ path: route.path, query: { ...route.query, customerName: customer.value.name } })
  }
}

async function loadLedger() {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = { pageNum: page.pageNum, pageSize: page.pageSize }
    const response = tab.value === 'recharge'
      ? await listAgentCustomerRecharges(route.params.userId, params)
      : await listAgentCustomerConsumptions(route.params.userId, params)
    const data = response.data || {}
    rows.value = (data.rows || []).map(mapLedger)
    page.total = Number(data.total || 0)
    page.pageNum = Number(data.pageNum || page.pageNum)
    page.pageSize = Number(data.pageSize || page.pageSize)
    if (tab.value === 'recharge') rechargeTotal.value = page.total
    else consumeTotal.value = page.total
  } catch (error) {
    rows.value = []
    page.total = 0
    errorMessage.value = error?.msg || error?.message || '流水加载失败'
  } finally {
    loading.value = false
  }
}

function switchTab(type) {
  if (type === tab.value) return
  router.replace({ query: { ...route.query, type } })
}

function changePage(step) {
  const target = page.pageNum + step
  if (target < 1 || target > totalPages.value) return
  page.pageNum = target
  loadLedger()
}

function changePageSize(size) {
  page.pageSize = size
  page.pageNum = 1
  loadLedger()
}

function goPage(target) {
  if (target === page.pageNum) return
  page.pageNum = target
  loadLedger()
}

watch(() => route.query.type, value => {
  tab.value = value === 'consume' ? 'consume' : 'recharge'
  page.pageNum = 1
  loadLedger()
})

onMounted(async () => {
  try {
    await Promise.all([loadCustomer(), loadLedger()])
  } catch (error) {
    errorMessage.value = error?.msg || error?.message || '客户信息加载失败'
  }
})
</script>

<style scoped>
.agent-customer-finance-page{gap:0;min-height:0}
.agent-customer-finance-page .tab-bar{border:1px solid var(--border);border-top:0;flex-shrink:0}
.agent-customer-finance-page .business-list-shell{border-top:0;flex:1;min-height:0}
.stat-cell-value.income{color:var(--success)}
.stat-cell-value.expense{color:var(--error)}
.finance-stat-row{grid-template-columns:minmax(500px,1.75fr) repeat(3,minmax(150px,.8fr))}
.finance-stat-row .stat-cell:not(.customer-info-stat){padding:16px 18px}
.finance-stat-row .stat-cell:not(.customer-info-stat) .stat-cell-value{font-size:22px}
.finance-stat-row .customer-info-stat{min-width:0;padding:14px 24px;justify-content:center}
.customer-info-layout{display:grid;width:100%;grid-template-columns:minmax(0,1fr) minmax(220px,max-content);align-items:start;gap:20px;min-width:0}
.customer-info-main{min-width:0;display:flex;flex-direction:column;gap:6px}
.customer-name{font-size:21px;line-height:1.28;white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere;word-break:break-word}
.customer-meta-list{display:flex;min-width:0;justify-self:end;align-self:start;flex-direction:column;gap:6px}
.customer-meta-list span{display:grid;grid-template-columns:64px minmax(0,1fr);align-items:center;gap:10px;min-width:0}
.customer-meta-list b{margin:0;color:var(--text3);font-size:12px;font-weight:500;line-height:1.2;white-space:nowrap}
.customer-meta-list em{display:block;min-width:0;color:var(--text2);font-size:13px;font-style:normal;line-height:1.3;overflow-wrap:anywhere}
.add{color:var(--success);font-weight:600}
.sub{color:var(--error);font-weight:600}
.finance-error{margin:12px 20px}
@media (max-width:1100px){
  .finance-stat-row{grid-template-columns:repeat(3,1fr)}
  .customer-info-stat{grid-column:1 / -1;border-right:none;border-bottom:1px solid var(--border2)}
}
@media (max-width:768px){
  .finance-stat-row{grid-template-columns:1fr}
  .customer-info-layout{grid-template-columns:1fr}
  .customer-meta-list{justify-self:stretch}
  .customer-meta-list span{grid-template-columns:1fr;gap:4px}
}
</style>
