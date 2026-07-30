<template>
  <main ref="pageRef" class="main-content agent-center-page">
    <TopSlideNotice
      v-model="noticeVisible"
      :type="noticeType"
      :title="noticeTitle"
      :message="noticeMessage"
    />

    <nav v-if="isAgent" class="agent-depth-nav">
      <button
        v-for="item in sectionTabs"
        :key="item.key"
        type="button"
        class="agent-depth-tab"
        :class="{ active: activeTab === item.key }"
        @click="switchAgentSection(item.key)"
      >
        <strong>{{ item.title }}</strong>
      </button>
    </nav>

    <div v-if="isAgent && activeTab === 'overview'" class="stat-row agent-stat-row">
      <div v-for="item in overviewStats" :key="item.label" class="stat-cell">
        <span class="stat-cell-label">{{ item.label }}</span>
        <span class="stat-cell-main">
          <span class="stat-cell-value" :class="{ primary: item.primary }">{{ item.value }}</span>
          <span v-if="item.trend" class="stat-trend" :class="item.trend.type">
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path
                v-if="item.trend.type === 'up'"
                d="M6 2.2v7.6M6 2.2 2.8 5.4M6 2.2l3.2 3.2"
              />
              <path
                v-else
                d="M6 9.8V2.2M6 9.8 2.8 6.6M6 9.8l3.2-3.2"
              />
            </svg>
            {{ item.trend.text }}
          </span>
        </span>
      </div>
    </div>

    <div v-if="!isAgent && !loading" class="card permission-card">
      当前账号未开通代理权限，请联系平台管理员完成配置。
    </div>

    <template v-else>
    <div v-if="activeTab === 'overview'" class="agent-ops-grid agent-depth-pane">
      <section class="agent-panel follow-panel">
        <div class="agent-panel-head">
          <div>
            <h2>客户待跟进</h2>
          </div>
        </div>
        <div class="follow-list">
          <button
            v-for="item in followUpItems"
            :key="item.key"
            type="button"
            class="follow-item"
            :class="{ empty: item.count === 0 }"
            @click="focusFollowUp(item)"
          >
            <span class="follow-count" :class="{ zero: item.count === 0 }">{{ item.count }}</span>
            <span class="follow-text">{{ item.title }}</span>
          </button>
        </div>
      </section>

      <section class="agent-panel conversion-panel">
        <div class="agent-panel-head">
          <div>
            <h2>邀请转化分析</h2>
          </div>
        </div>
        <div ref="conversionChartRef" class="conversion-chart" aria-label="邀请转化柱状图"></div>
        <div class="conversion-summary">
          <span>邀请码使用率 <b>{{ inviteUsageRate }}%</b></span>
          <span>客户活跃率 <b>{{ customerActiveRate }}%</b></span>
        </div>
      </section>
    </div>

    <section v-if="activeTab === 'finance'" class="agent-panel finance-panel agent-depth-pane">
      <div class="agent-panel-head finance-head">
        <div>
          <h2>资金与分成概览</h2>
          <p>沉淀代理余额、客户资金和分成结算的关键入口</p>
        </div>
        <div class="finance-entry-actions">
          <button type="button" class="btn-outline" @click="openSettlementHistory">历史结算记录</button>
          <button type="button" class="btn-primary" @click="openFinanceSummary">资金与分成明细</button>
        </div>
      </div>
      <div class="finance-metric-grid">
        <div v-for="item in financeMetrics" :key="item.label" class="finance-metric">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <div class="rank-board">
        <div v-for="group in customerRankGroups" :key="group.title" class="rank-card">
          <div class="rank-card-head">
            <h3>{{ group.title }}</h3>
          </div>
          <ol>
            <li v-for="row in group.rows" :key="row.id" :class="{ top: row.rank === 1 }">
              <span class="rank-index">{{ row.rank }}</span>
              <span class="rank-main">
                <strong>{{ row.name }}</strong>
                <small>{{ row.meta }}</small>
              </span>
              <span class="rank-value">{{ row.value }}</span>
            </li>
            <li v-if="group.rows.length === 0" class="rank-empty">暂无客户数据</li>
          </ol>
        </div>
      </div>
    </section>

    <!-- 客户管理 -->
    <div v-if="activeTab === 'customers'" class="table-section business-list-shell customer-business-list agent-depth-pane">
      <div class="table-header">
        <div class="customer-title-wrap">
          <h2>客户列表</h2>
          <button v-if="activeFollowItem" type="button" class="follow-filter-chip" @click="clearFollowFilter">
            {{ activeFollowItem.title }} ×
          </button>
        </div>
        <div class="customer-tools">
          <input v-model.trim="customerKeyword" class="field-input customer-search" placeholder="搜索客户名称、账号或手机号" />
          <span class="table-count">共 {{ customerDisplayTotal }} 个客户</span>
        </div>
      </div>
      <div class="table-content">
        <table class="business-list-table agent-customer-table">
          <thead>
            <tr>
              <th style="width:18%">客户</th>
              <th style="width:18%">企业名称</th>
              <th style="width:14%">注册时间</th>
              <th style="width:12%">当前余额</th>
              <th style="width:12%">累计充值</th>
              <th style="width:12%">累计消费</th>
              <th style="width:14%">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in displayCustomers" :key="c.id">
              <td>
                <div class="agent-customer-cell">
                  <span class="agent-customer-main">
                    <strong>{{ c.customerLabel }}</strong>
                    <small>{{ c.customerSub }}</small>
                  </span>
                </div>
              </td>
              <td class="td-name">{{ c.enterpriseName }}</td>
              <td class="td-date">{{ c.time }}</td>
              <td>¥{{ money(c.balance) }}</td>
              <td>¥{{ money(c.totalRecharge) }}</td>
              <td>¥{{ money(c.totalConsume) }}</td>
              <td>
                <div class="action-group">
                  <router-link :to="`/agent-center/customers/${c.id}/finance`" class="action-link">资金明细</router-link>
                  <span class="action-link" @click="allocCustomer = c">分配余额</span>
                </div>
              </td>
            </tr>
            <tr v-if="displayCustomers.length===0"><td colspan="7" class="table-empty">暂无客户</td></tr>
          </tbody>
        </table>
      </div>
      <BusinessTableFooter
        v-if="customerDisplayTotal > 0"
        :total="customerDisplayTotal"
        :page="customerPage.pageNum"
        :page-size="customerPage.pageSize"
        :total-pages="customerDisplayPageCount"
        :loading="customerLoading"
        @update:page-size="changeCustomerPageSize"
        @page-change="goCustomerPage"
      />
    </div>

    <!-- 邀请码管理 -->
    <div v-if="activeTab === 'invites'" class="table-section business-list-shell agent-depth-pane">
      <div class="table-header">
        <h2>邀请码列表</h2>
        <button class="btn-mini invite-create-btn" type="button" @click="openCreate">新建邀请码</button>
      </div>
      <div class="table-content">
        <table class="business-list-table agent-invite-table">
          <thead>
            <tr>
              <th style="width:18%">邀请码</th>
              <th style="width:11%">状态</th>
              <th style="width:13%">注册赠送</th>
              <th style="width:13%">使用情况</th>
              <th style="width:16%">有效期</th>
              <th style="width:15%">备注</th>
              <th style="width:14%">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in pagedInviteCodes" :key="inv.id">
              <td class="td-name mono">{{ inv.code }}</td>
              <td class="td-status">
                <span class="invite-status-pill" :class="inv.statusClass">{{ inv.statusText }}</span>
              </td>
              <td>¥{{ inv.gift }}</td>
              <td>{{ inv.usage }}</td>
              <td class="td-date">{{ inv.expire }}</td>
              <td class="invite-remark">{{ inv.remark || '-' }}</td>
              <td>
                <div class="action-group invite-actions">
                  <span class="action-link" @click="copyInvite(inv)">复制</span>
                  <span class="action-link" @click="openEdit(inv)">编辑</span>
                  <button
                    type="button"
                    class="invite-switch"
                    :class="{ active: inv.active }"
                    :aria-pressed="inv.active"
                    :disabled="togglingInviteId === inv.id || inv.statusLocked"
                    @click="toggleInvite(inv)"
                  >
                    <span class="switch-knob"></span>
                    <span class="switch-text">{{ inv.active ? 'ON' : 'OFF' }}</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="inviteCodes.length===0"><td colspan="7" class="table-empty">暂无邀请码</td></tr>
          </tbody>
        </table>
      </div>
      <BusinessTableFooter
        v-if="inviteCodes.length > 0"
        :total="inviteCodes.length"
        :page="invitePage.pageNum"
        :page-size="invitePage.pageSize"
        :total-pages="invitePageCount"
        :loading="loading"
        @update:page-size="changeInvitePageSize"
        @page-change="goInvitePage"
      />
    </div>
    </template>

    <!-- 新建邀请码弹窗 -->
    <div
      v-if="showInviteAdd"
      class="modal-mask"
      @pointerdown="agentBackdropGuard.pointerDown"
      @click.self="agentBackdropGuard.click(closeInviteDialog)"
    >
      <div class="modal-card">
        <h3 class="modal-title">{{ editingInvite ? '调整邀请码' : '新建邀请码' }}</h3>
        <label class="field">
          <span class="field-label">赠送额度 <span class="required">*</span></span>
          <input v-model="inviteForm.giftAmount" class="field-input" type="number" placeholder="¥" />
        </label>
        <label class="field">
          <span class="field-label">最大使用次数 <span class="required">*</span></span>
          <input v-model="inviteForm.maxUses" class="field-input" type="number" placeholder="例如 50" />
        </label>
        <label class="field">
          <span class="field-label">过期时间</span>
          <DateRangePicker
            single
            start-placeholder="请选择过期时间"
            v-model:start-date="inviteForm.expireTime"
          />
        </label>
        <label class="field">
          <span class="field-label">备注</span>
          <input v-model="inviteForm.remark" class="field-input" placeholder="邀请码用途" />
        </label>
        <div class="modal-actions">
          <button class="btn-outline" @click="closeInviteDialog">取消</button>
          <button class="btn-primary" :disabled="saving" @click="onSaveInvite">{{ saving ? '提交中...' : '确认保存' }}</button>
        </div>
        <FormAlert :message="formMessage" type="error" />
      </div>
    </div>

    <!-- 分配余额弹窗 -->
    <div
      v-if="allocCustomer"
      class="modal-mask"
      @pointerdown="agentBackdropGuard.pointerDown"
      @click.self="agentBackdropGuard.click(closeAllocDialog)"
    >
      <div class="modal-card">
        <h3 class="modal-title">分配余额 - {{ allocCustomer.name }}</h3>
        <label class="field">
          <span class="field-label">客户当前余额</span>
          <div class="field-input" style="line-height:44px;color:var(--text2)">¥{{ money(allocCustomer.balance) }}</div>
        </label>
        <label class="field">
          <span class="field-label">分配金额 <span class="required">*</span></span>
          <input v-model="allocAmount" class="field-input" type="number" placeholder="¥" />
        </label>
        <label class="field">
          <span class="field-label">分配说明（选填）</span>
          <input v-model.trim="allocRemark" class="field-input" maxlength="100" placeholder="例如：业务测试额度" />
        </label>
        <FormAlert :message="allocationMessage" type="error" />
        <div class="modal-actions">
          <button class="btn-outline" @click="closeAllocDialog">取消</button>
          <button class="btn-primary" :disabled="allocationSaving" @click="onAlloc">{{ allocationSaving ? '处理中...' : '确认分配' }}</button>
        </div>
      </div>
    </div>
    <div v-if="toast" class="agent-toast">{{ toast }}</div>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { allocateAgentCustomerBalance, createAgentInviteCode, getAgentOverview, listAgentCustomers, listAgentInviteCodes, updateAgentInviteCode } from '../api/agent'
import BusinessTableFooter from '../components/BusinessTableFooter.vue'
import DateRangePicker from '../components/DateRangePicker.vue'
import FormAlert from '../components/FormAlert.vue'
import TopSlideNotice from '../components/TopSlideNotice.vue'
import { createBackdropGuard } from '../utils/backdropGuard'

use([GridComponent, TooltipComponent, BarChart, CanvasRenderer])

const route = useRoute()
const router = useRouter()
const pageRef = ref(null)
const conversionChartRef = ref(null)
const overview = ref({
  balance: 0,
  commissionRate: 0,
  customerCount: 0,
  totalRecharge: 0,
  monthlyNewCustomerCount: 0,
  monthlyRecharge: 0,
  monthlyConsume: 0,
  allocatedAmount: 0,
  settledCommission: 0,
  unsettledCommission: 0,
  activeCustomerCount: 0,
  customerGrowthRate: 0,
  monthlyNewCustomerGrowthRate: 0,
  monthlyRechargeGrowthRate: 0,
  monthlyConsumeGrowthRate: 0,
  unsettledCommissionGrowthRate: 0,
  activeCustomerGrowthRate: 0
})
const customers = ref([])
const allCustomers = ref([])
const inviteCodes = ref([])
const activeTab = ref('overview')
const isAgent = ref(true)
const loading = ref(false)
const customerLoading = ref(false)
const customerKeyword = ref('')
const activeFollowFilter = ref('')
const customerPage = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const customerPageCount = computed(() => Math.max(1, Math.ceil(customerPage.total / customerPage.pageSize)))
const invitePage = reactive({ pageNum: 1, pageSize: 10 })
const invitePageCount = computed(() => Math.max(1, Math.ceil(inviteCodes.value.length / invitePage.pageSize)))
const pagedInviteCodes = computed(() => {
  const start = (invitePage.pageNum - 1) * invitePage.pageSize
  return inviteCodes.value.slice(start, start + invitePage.pageSize)
})
const showInviteAdd = ref(false)
const editingInvite = ref(null)
const saving = ref(false)
const formMessage = ref('')
const allocCustomer = ref(null)
const allocAmount = ref('')
const allocRemark = ref('')
const allocationRequestId = ref('')
const allocationSaving = ref(false)
const allocationMessage = ref('')
const toast = ref('')
const togglingInviteId = ref(null)
const noticeVisible = ref(false)
const noticeType = ref('success')
const noticeTitle = ref('')
const noticeMessage = ref('')
const agentBackdropGuard = createBackdropGuard()
const inviteForm = ref({ giftAmount: '', maxUses: 0, expireTime: '', remark: '' })
let customerSearchTimer
let conversionChart = null

const balanceWarningLine = 500
const sectionTabs = [
  { key: 'overview', title: '经营概览' },
  { key: 'customers', title: '客户管理' },
  { key: 'invites', title: '邀请码管理' },
  { key: 'finance', title: '资金与分成' }
]

const customerMetricRows = computed(() => allCustomers.value.length ? allCustomers.value : customers.value)
const loadedCustomerCount = computed(() => customerMetricRows.value.length)
const rechargeCustomerCount = computed(() => customerMetricRows.value.filter(item => item.totalRecharge > 0).length)
const activeCustomerCount = computed(() => Number(overview.value.activeCustomerCount || customerMetricRows.value.filter(item => item.active).length || 0))
const lowBalanceCustomers = computed(() => filterFollowCustomers(customerMetricRows.value, 'lowBalance'))
const unrechargedCustomers = computed(() => filterFollowCustomers(customerMetricRows.value, 'noRecharge'))
const dormantAfterRechargeCustomers = computed(() => filterFollowCustomers(customerMetricRows.value, 'dormantAfterRecharge'))
const decliningCustomers = computed(() => filterFollowCustomers(customerMetricRows.value, 'declining'))
const newPendingAllocationCustomers = computed(() => filterFollowCustomers(customerMetricRows.value, 'newPendingAllocation'))

function statTrend(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number) || number === 0) return null
  return {
    type: number > 0 ? 'up' : 'down',
    text: `${number > 0 ? '+' : ''}${number.toFixed(1)}%`
  }
}

const overviewStats = computed(() => [
  { label: '可分配余额', value: yuanText(overview.value.balance), primary: true },
  { label: '下级客户数', value: String(overview.value.customerCount || customerPage.total || loadedCustomerCount.value), trend: statTrend(overview.value.customerGrowthRate) },
  { label: '本月新增客户', value: String(overview.value.monthlyNewCustomerCount || monthNewCustomerCount()), trend: statTrend(overview.value.monthlyNewCustomerGrowthRate) },
  { label: '活跃客户数', value: String(activeCustomerCount.value), trend: statTrend(overview.value.activeCustomerGrowthRate) },
  { label: '本月客户充值', value: yuanText(overview.value.monthlyRecharge), trend: statTrend(overview.value.monthlyRechargeGrowthRate) },
  { label: '本月客户消费', value: yuanText(overview.value.monthlyConsume), trend: statTrend(overview.value.monthlyConsumeGrowthRate) },
  { label: '待结算分成', value: yuanText(overview.value.unsettledCommission), trend: statTrend(overview.value.unsettledCommissionGrowthRate) },
  { label: '已结算分成', value: yuanText(overview.value.settledCommission) }
])

const followUpItems = computed(() => [
  { key: 'lowBalance', title: '余额低于预警线的客户', desc: `预警线 ¥${money(balanceWarningLine)}`, count: lowBalanceCustomers.value.length },
  { key: 'noRecharge', title: '注册后未充值的客户', desc: '建议联系完成首充或分配试用额度', count: unrechargedCustomers.value.length },
  { key: 'dormantAfterRecharge', title: '充值后长期未消费的客户', desc: '已充值但近期没有查询消耗', count: dormantAfterRechargeCustomers.value.length },
  { key: 'declining', title: '最近 30 天消费下降的客户', desc: '本期消费低于上一周期', count: decliningCustomers.value.length },
  { key: 'newPendingAllocation', title: '新注册客户待分配额度', desc: '注册 7 天内且额度较低', count: newPendingAllocationCustomers.value.length }
])

const activeFollowItem = computed(() => followUpItems.value.find(item => item.key === activeFollowFilter.value) || null)
const filteredFollowCustomers = computed(() => {
  if (!activeFollowFilter.value) return []
  return applyCustomerKeyword(filterFollowCustomers(customerMetricRows.value, activeFollowFilter.value), customerKeyword.value)
})
const customerDisplayTotal = computed(() => activeFollowFilter.value ? filteredFollowCustomers.value.length : customerPage.total)
const customerDisplayPageCount = computed(() => Math.max(1, Math.ceil(customerDisplayTotal.value / customerPage.pageSize)))
const displayCustomers = computed(() => {
  if (!activeFollowFilter.value) return customers.value
  const start = (customerPage.pageNum - 1) * customerPage.pageSize
  return filteredFollowCustomers.value.slice(start, start + customerPage.pageSize)
})

const inviteConversionBars = computed(() => {
  const used = inviteCodes.value.reduce((sum, item) => sum + Number(item.used || 0), 0)
  const customerCount = overview.value.customerCount || customerPage.total || loadedCustomerCount.value
  const rechargeCount = rechargeCustomerCount.value
  const activeCount = activeCustomerCount.value
  const base = Math.max(used, customerCount, rechargeCount, activeCount, 1)
  return [
    { label: '邀请码使用', value: used, percent: percentOf(used, base) },
    { label: '注册客户', value: customerCount, percent: percentOf(customerCount, base) },
    { label: '充值客户', value: rechargeCount, percent: percentOf(rechargeCount, base) },
    { label: '活跃客户', value: activeCount, percent: percentOf(activeCount, base) }
  ]
})

const inviteUsageRate = computed(() => {
  const max = inviteCodes.value.reduce((sum, item) => sum + Number(item.max || 0), 0)
  const used = inviteCodes.value.reduce((sum, item) => sum + Number(item.used || 0), 0)
  return max > 0 ? Math.round((used / max) * 100) : 0
})

const customerActiveRate = computed(() => {
  const total = overview.value.customerCount || customerPage.total || loadedCustomerCount.value
  return total > 0 ? Math.round((activeCustomerCount.value / total) * 100) : 0
})

const financeMetrics = computed(() => [
  { label: '代理可用余额', value: yuanText(overview.value.balance) },
  { label: '已分配给客户金额', value: yuanText(overview.value.allocatedAmount || customerMetricRows.value.reduce((sum, item) => sum + item.balance, 0)) },
  { label: '客户累计充值', value: yuanText(overview.value.totalRecharge) },
  { label: '客户累计消费', value: yuanText(overview.value.totalConsume || customerMetricRows.value.reduce((sum, item) => sum + item.totalConsume, 0)) },
  { label: '待结算分成', value: yuanText(overview.value.unsettledCommission) },
  { label: '已结算分成', value: yuanText(overview.value.settledCommission) }
])

const customerRankGroups = computed(() => [
  { key: 'recharge', title: '充值最高客户', rows: rankCustomers('totalRecharge', 'money', 'desc') },
  { key: 'consume', title: '消费最高客户', rows: rankCustomers('totalConsume', 'money', 'desc') },
  { key: 'active', title: '最近活跃客户', rows: rankCustomers('lastActiveAt', 'date', 'desc') },
  { key: 'new', title: '新增客户', rows: rankCustomers('time', 'date', 'desc') }
])

function normalizeAgentSection(value) {
  const key = Array.isArray(value) ? value[0] : value
  return sectionTabs.some(item => item.key === key) ? key : 'overview'
}

function scrollPageTop() {
  requestAnimationFrame(() => {
    pageRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function switchAgentSection(key, options = {}) {
  const next = normalizeAgentSection(key)
  if (next !== 'customers' || !options.keepFollowFilter) activeFollowFilter.value = ''
  activeTab.value = next
  const query = { ...route.query }
  if (next === 'overview') delete query.section
  else query.section = next
  router.replace({ path: '/agent-center', query })
  scrollPageTop()
}

watch(
  () => route.query.section,
  value => {
    activeTab.value = normalizeAgentSection(value)
  },
  { immediate: true }
)

watch(customerKeyword, () => {
  customerPage.pageNum = 1
  if (activeFollowFilter.value) return
  window.clearTimeout(customerSearchTimer)
  customerSearchTimer = window.setTimeout(() => {
    loadCustomers()
  }, 320)
})

watch(allocCustomer, value => {
  if (!value) {
    allocAmount.value = ''
    allocRemark.value = ''
    allocationRequestId.value = ''
    allocationMessage.value = ''
    return
  }
  allocationRequestId.value = newRequestId()
})

watch(inviteConversionBars, renderInviteConversionChart, { deep: true })

watch(activeTab, value => {
  if (value === 'overview') {
    renderInviteConversionChart()
  } else {
    disposeConversionChart()
  }
})

watch(customerDisplayPageCount, total => {
  if (customerPage.pageNum > total) customerPage.pageNum = total
})

function money(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function yuanText(value) {
  return `¥ ${money(value)}`
}

function percentOf(value, total) {
  if (!total) return 0
  const current = Number(value || 0)
  if (current <= 0) return 0
  return Math.max(4, Math.min(100, Math.round((current / total) * 100)))
}

function disposeConversionChart() {
  if (!conversionChart) return
  conversionChart.dispose()
  conversionChart = null
}

async function renderInviteConversionChart() {
  await nextTick()
  if (activeTab.value !== 'overview' || !conversionChartRef.value) return
  if (!conversionChart) conversionChart = init(conversionChartRef.value)
  const rows = inviteConversionBars.value
  conversionChart.setOption({
    animationDuration: 260,
    color: ['#0B58BF'],
    grid: { left: 36, right: 18, top: 28, bottom: 34 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(11,88,191,.06)' } },
      formatter: params => {
        const row = params?.[0]
        if (!row) return ''
        return `${row.name}<br/>数量：${row.value}`
      }
    },
    xAxis: {
      type: 'category',
      data: rows.map(item => item.label),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#D8E0EA' } },
      axisLabel: { color: '#667085', fontSize: 12, interval: 0 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#8A96AA', fontSize: 12 },
      splitLine: { lineStyle: { color: '#EEF2F7' } }
    },
    series: [
      {
        type: 'bar',
        barWidth: 30,
        data: rows.map(item => item.value),
        itemStyle: { color: '#0B58BF' },
        label: {
          show: true,
          position: 'top',
          color: '#475467',
          fontSize: 12,
          fontWeight: 700
        }
      }
    ]
  })
}

function resizeConversionChart() {
  conversionChart?.resize()
}

function parseTime(value) {
  if (!value) return null
  const date = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

function daysSince(value) {
  const date = parseTime(value)
  if (!date) return 999
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000))
}

function monthNewCustomerCount() {
  const now = new Date()
  return customerMetricRows.value.filter(item => {
    const date = parseTime(item.time)
    return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  }).length
}

function rankCustomers(field, type = 'money', direction = 'desc') {
  const rows = [...customerMetricRows.value].sort((a, b) => {
    const left = type === 'date' ? (parseTime(a[field])?.getTime() || 0) : Number(a[field] || 0)
    const right = type === 'date' ? (parseTime(b[field])?.getTime() || 0) : Number(b[field] || 0)
    return direction === 'asc' ? left - right : right - left
  }).slice(0, 5)
  return rows.map((item, index) => ({
    id: `${field}-${item.id}`,
    rank: index + 1,
    name: item.enterpriseName || item.name || item.customerLabel,
    meta: item.customerLabel && item.customerLabel !== item.enterpriseName
      ? `${item.customerLabel} · ${item.customerSub || item.userName || '-'}`
      : (item.customerSub || item.userName || '-'),
    value: type === 'date'
      ? (String(item[field] || '-').replace('T', ' ').slice(0, 10) || '-')
      : yuanText(item[field])
  }))
}

function filterFollowCustomers(rows, key) {
  const list = Array.isArray(rows) ? rows : []
  if (key === 'lowBalance') return list.filter(item => item.balance < balanceWarningLine)
  if (key === 'noRecharge') return list.filter(item => item.totalRecharge <= 0)
  if (key === 'dormantAfterRecharge') {
    return list.filter(item => item.totalRecharge > 0 && (item.totalConsume <= 0 || daysSince(item.lastConsumeAt || item.lastActiveAt) > 30))
  }
  if (key === 'declining') return list.filter(item => item.previousConsume > 0 && item.recentConsume < item.previousConsume)
  if (key === 'newPendingAllocation') return list.filter(item => daysSince(item.time) <= 7 && item.balance < 1000)
  return list
}

function applyCustomerKeyword(rows, keyword) {
  const text = String(keyword || '').trim().toLowerCase()
  if (!text) return rows
  return rows.filter(item =>
    String(item.customerLabel || '').toLowerCase().includes(text) ||
    String(item.customerSub || '').toLowerCase().includes(text) ||
    String(item.userName || '').toLowerCase().includes(text) ||
    String(item.phone || '').toLowerCase().includes(text) ||
    String(item.enterpriseName || '').toLowerCase().includes(text)
  )
}

function apiDate(value) {
  if (!value) return null
  return String(value).replace('T', ' ') + (String(value).length === 16 ? ':00' : '')
}

function showToast(text) {
  toast.value = text
  window.clearTimeout(showToast.timer)
  showToast.timer = window.setTimeout(() => { toast.value = '' }, 1800)
}

function showAgentNotice(title, message, type = 'success') {
  noticeVisible.value = false
  noticeType.value = type
  noticeTitle.value = title
  noticeMessage.value = message
  window.setTimeout(() => {
    noticeVisible.value = true
  }, 0)
}

function mapCustomer(item) {
  const customerLabel = item.nickName || item.userName || '-'
  const customerSub = item.phonenumber || item.phone || item.userName || '-'
  const enterpriseName = item.enterpriseName || '-'
  return {
    ...item,
    id: item.invitedUserId || item.userId || item.id,
    name: enterpriseName !== '-' ? enterpriseName : customerLabel,
    customerLabel,
    customerSub,
    enterpriseName,
    userName: item.userName || '-',
    phone: item.phonenumber || item.phone || '-',
    balance: Number(item.balanceAmount || 0),
    totalRecharge: Number(item.rechargeAmount || 0),
    totalConsume: Number(item.consumeAmount || 0),
    allocatedAmount: Number(item.allocatedAmount || item.balanceAmount || 0),
    recentConsume: Number(item.recentConsumeAmount || item.recentConsume || 0),
    previousConsume: Number(item.previousConsumeAmount || item.previousConsume || 0),
    lastActiveAt: item.lastActiveAt || item.lastLoginTime || item.updateTime || item.invitedAt || '',
    lastConsumeAt: item.lastConsumeAt || item.lastConsumeTime || '',
    active: Boolean(item.active ?? item.isActive ?? (daysSince(item.lastActiveAt || item.invitedAt) <= 30)),
    time: String(item.invitedAt || item.createTime || item.registerTime || '').replace('T', ' ').slice(0, 16) || '-'
  }
}

function parseExpireDate(value) {
  if (!value) return null
  const text = String(value).trim().replace(' ', 'T')
  const normalized = text.length === 10 ? `${text}T23:59:59` : text
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function inviteStatusMeta(item, max, remaining) {
  const rawStatus = String(item.status ?? 0)
  if (rawStatus === '2') return { key: 'expired', text: '已过期', className: 'expired' }
  if (rawStatus === '3') return { key: 'usedUp', text: '已用完', className: 'used-up' }
  if (rawStatus !== '0') return { key: 'disabled', text: '停用', className: 'off' }

  const expireDate = parseExpireDate(item.expireTime)
  if (expireDate && expireDate.getTime() < Date.now()) {
    return { key: 'expired', text: '已过期', className: 'expired' }
  }
  if (max > 0 && remaining <= 0) {
    return { key: 'usedUp', text: '已用完', className: 'used-up' }
  }
  return { key: 'enabled', text: '启用', className: 'enabled' }
}

function applyInviteStatus(inv) {
  const remaining = Number(inv.remainingUses ?? Math.max(0, Number(inv.max || inv.maxUses || 0) - Number(inv.used || inv.usedCount || 0)))
  const max = Number(inv.max || inv.maxUses || 0)
  const meta = inviteStatusMeta(inv, max, remaining)
  inv.statusKey = meta.key
  inv.statusText = meta.text
  inv.statusClass = meta.className
  inv.active = meta.key === 'enabled'
  inv.statusLocked = meta.key === 'expired' || meta.key === 'usedUp'
}

function mapInvite(item) {
  const max = Number(item.maxUses || 0)
  const used = item.usedCount != null
    ? Number(item.usedCount)
    : Math.max(0, max - Number(item.remainingUses ?? max))
  const remaining = item.remainingUses != null ? Number(item.remainingUses) : Math.max(0, max - used)
  const meta = inviteStatusMeta(item, max, remaining)
  return {
    ...item,
    id: item.id,
    code: item.inviteCode || '',
    gift: money(item.giftAmount),
    used,
    max,
    remainingUses: remaining,
    usage: max <= 0 ? '不限次数' : `剩余 ${remaining}/${max} 次`,
    expire: item.expireTime ? String(item.expireTime).replace('T', ' ').slice(0, 16) : '长期有效',
    status: Number(item.status || 0),
    active: meta.key === 'enabled',
    statusKey: meta.key,
    statusText: meta.text,
    statusClass: meta.className,
    statusLocked: meta.key === 'expired' || meta.key === 'usedUp',
    remark: item.remark || '-'
  }
}

function applyCustomerPage(data) {
  const page = data || {}
  customers.value = (page.rows || []).map(mapCustomer)
  customerPage.total = Number(page.total || 0)
  customerPage.pageNum = Number(page.pageNum || customerPage.pageNum)
  customerPage.pageSize = Number(page.pageSize || customerPage.pageSize)
  overview.value.customerCount = customerPage.total
  if (page.totalRecharge != null) overview.value.totalRecharge = Number(page.totalRecharge || 0)
}

async function loadOverview() {
  const res = await getAgentOverview()
  const data = res.data || {}
  overview.value = {
    balance: Number(data.availableBalanceAmount || 0),
    commissionRate: Number(data.commissionRate || 0),
    customerCount: overview.value.customerCount,
    totalRecharge: Number(data.totalRechargeAmount || 0),
    totalConsume: Number(data.totalConsumeAmount || 0),
    monthlyNewCustomerCount: Number(data.monthlyNewCustomerCount || 0),
    monthlyRecharge: Number(data.monthlyRechargeAmount || 0),
    monthlyConsume: Number(data.monthlyConsumeAmount || 0),
    allocatedAmount: Number(data.allocatedAmount || data.allocatedBalanceAmount || 0),
    settledCommission: Number(data.settledCommissionAmount || 0),
    unsettledCommission: Number(data.unsettledCommissionAmount || data.pendingSettlementAmount || 0),
    activeCustomerCount: Number(data.activeCustomerCount || 0),
    customerGrowthRate: Number(data.customerGrowthRate || 0),
    monthlyNewCustomerGrowthRate: Number(data.monthlyNewCustomerGrowthRate || 0),
    monthlyRechargeGrowthRate: Number(data.monthlyRechargeGrowthRate || 0),
    monthlyConsumeGrowthRate: Number(data.monthlyConsumeGrowthRate || 0),
    unsettledCommissionGrowthRate: Number(data.unsettledCommissionGrowthRate || 0),
    activeCustomerGrowthRate: Number(data.activeCustomerGrowthRate || 0)
  }
}

async function loadCustomers() {
  customerLoading.value = true
  try {
    const res = await listAgentCustomers({
      pageNum: customerPage.pageNum,
      pageSize: customerPage.pageSize,
      keyword: customerKeyword.value || undefined
    })
    applyCustomerPage(res.data)
  } catch (error) {
    showToast(error?.msg || error?.message || '客户列表加载失败')
  } finally {
    customerLoading.value = false
  }
}

async function loadAllCustomers() {
  try {
    const res = await listAgentCustomers({
      pageNum: 1,
      pageSize: 9999
    })
    const data = res.data || {}
    allCustomers.value = (data.rows || []).map(mapCustomer)
  } catch (error) {
    allCustomers.value = [...customers.value]
  }
}

async function loadInviteCodes() {
  const res = await listAgentInviteCodes()
  const data = res.data || []
  inviteCodes.value = (Array.isArray(data) ? data : data.rows || []).map(mapInvite)
  if (invitePage.pageNum > invitePageCount.value) invitePage.pageNum = invitePageCount.value
}

async function loadAll() {
  loading.value = true
  try {
    await loadOverview()
    await Promise.all([loadCustomers(), loadAllCustomers(), loadInviteCodes()])
    isAgent.value = true
  } catch (error) {
    isAgent.value = false
  } finally {
    loading.value = false
  }
}

function changeCustomerPage(step) {
  const target = customerPage.pageNum + step
  if (target < 1 || target > customerPageCount.value) return
  customerPage.pageNum = target
  loadCustomers()
}

function changeCustomerPageSize(size) {
  customerPage.pageSize = size
  customerPage.pageNum = 1
  if (activeFollowFilter.value) return
  loadCustomers()
}

function goCustomerPage(target) {
  if (target === customerPage.pageNum) return
  customerPage.pageNum = target
  if (activeFollowFilter.value) return
  loadCustomers()
}

function changeInvitePageSize(size) {
  invitePage.pageSize = size
  invitePage.pageNum = 1
}

function goInvitePage(target) {
  invitePage.pageNum = target
}

function resetInviteForm() {
  inviteForm.value = { giftAmount: '', maxUses: 0, expireTime: '', remark: '' }
  formMessage.value = ''
}

function openCreate() {
  editingInvite.value = null
  resetInviteForm()
  showInviteAdd.value = true
}

function closeInviteDialog() {
  if (saving.value) return
  showInviteAdd.value = false
  editingInvite.value = null
  resetInviteForm()
}

function closeAllocDialog() {
  if (allocationSaving.value) return
  allocCustomer.value = null
}

function openEdit(inv) {
  editingInvite.value = inv
  inviteForm.value = {
    giftAmount: inv.giftAmount || '',
    maxUses: inv.maxUses || 0,
    expireTime: inv.expireTime ? String(inv.expireTime).slice(0, 10) : '',
    remark: inv.remark || ''
  }
  formMessage.value = ''
  showInviteAdd.value = true
}

async function onSaveInvite() {
  formMessage.value = ''
  if (!inviteForm.value.giftAmount || Number(inviteForm.value.giftAmount) <= 0) {
    formMessage.value = '请输入大于 0 的赠送额度'
    return
  }
  if (Number(inviteForm.value.maxUses) < 0) {
    formMessage.value = '最大使用次数不能小于 0'
    return
  }
  saving.value = true
  try {
    const isEdit = Boolean(editingInvite.value)
    const resultInfo = {
      giftAmount: inviteForm.value.giftAmount,
      maxUses: Number(inviteForm.value.maxUses || 0),
      expireTime: inviteForm.value.expireTime || '长期有效'
    }
    const data = {
      giftAmount: inviteForm.value.giftAmount,
      maxUses: Number(inviteForm.value.maxUses || 0),
      expireTime: apiDate(inviteForm.value.expireTime),
      remark: inviteForm.value.remark
    }
    if (editingInvite.value) await updateAgentInviteCode(editingInvite.value.id, data)
    else await createAgentInviteCode(data)
    showInviteAdd.value = false
    editingInvite.value = null
    resetInviteForm()
    await loadInviteCodes()
    showAgentNotice(
      isEdit ? '邀请码已更新' : '邀请码已创建',
      `赠送额度 ¥${money(resultInfo.giftAmount)}，最大使用 ${resultInfo.maxUses} 次，过期时间：${resultInfo.expireTime}。`
    )
  } catch (error) {
    formMessage.value = error?.msg || error?.message || '提交失败'
    showAgentNotice(editingInvite.value ? '邀请码更新失败' : '邀请码创建失败', formMessage.value, 'error')
  } finally {
    saving.value = false
  }
}

async function toggleInvite(inv) {
  if (togglingInviteId.value !== null) return
  if (inv.statusLocked) return
  togglingInviteId.value = inv.id
  const oldActive = inv.active
  const oldStatus = inv.status
  const oldStatusKey = inv.statusKey
  const oldStatusText = inv.statusText
  const oldStatusClass = inv.statusClass
  const oldStatusLocked = inv.statusLocked
  const nextActive = !oldActive
  inv.active = nextActive
  inv.status = nextActive ? 0 : 1
  applyInviteStatus(inv)
  try {
    await updateAgentInviteCode(inv.id, { status: nextActive ? 0 : 1 })
    showToast(nextActive ? '邀请码已启用' : '邀请码已停用')
  } catch (error) {
    inv.active = oldActive
    inv.status = oldStatus
    inv.statusKey = oldStatusKey
    inv.statusText = oldStatusText
    inv.statusClass = oldStatusClass
    inv.statusLocked = oldStatusLocked
    showToast(error?.msg || error?.message || '操作失败')
  } finally {
    togglingInviteId.value = null
  }
}

function newRequestId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID().replaceAll('-', '')
  return `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

async function onAlloc() {
  allocationMessage.value = ''
  const amount = Number(allocAmount.value)
  if (!Number.isFinite(amount) || amount <= 0) return (allocationMessage.value = '请输入大于0的分配金额')
  if (!/^\d+(\.\d{1,2})?$/.test(String(allocAmount.value))) return (allocationMessage.value = '分配金额最多保留两位小数')
  if (amount > Number(overview.value.balance || 0)) return (allocationMessage.value = '分配金额不能超过代理可用余额')
  if (!allocCustomer.value) return (allocationMessage.value = '请选择下级客户')
  allocationSaving.value = true
  try {
    const resultInfo = {
      customerName: allocCustomer.value.name,
      amount
    }
    await allocateAgentCustomerBalance(allocCustomer.value.id, {
      amount: allocAmount.value,
      remark: allocRemark.value,
      requestId: allocationRequestId.value
    })
    allocCustomer.value = null
    await Promise.all([loadOverview(), loadCustomers(), loadAllCustomers()])
    showAgentNotice(
      '余额分配成功',
      `已向「${resultInfo.customerName}」分配 ¥${money(resultInfo.amount)}，可在客户资金明细中查看流水记录。`
    )
  } catch (error) {
    allocationMessage.value = error?.msg || error?.message || '余额分配失败'
    showAgentNotice('余额分配失败', allocationMessage.value, 'error')
  } finally {
    allocationSaving.value = false
  }
}

async function copyInvite(inv) {
  try {
    await navigator.clipboard.writeText(inv.code)
    showToast('邀请码已复制')
  } catch (error) {
    showToast('复制失败，请手动复制')
  }
}

function focusFollowUp(item) {
  if (!item.count) {
    showToast('当前没有需要跟进的客户')
    return
  }
  activeFollowFilter.value = item.key
  customerPage.pageNum = 1
  customerKeyword.value = ''
  switchAgentSection('customers', { keepFollowFilter: true })
  showToast(`已切换到客户列表，可处理「${item.title}」`)
}

function clearFollowFilter() {
  activeFollowFilter.value = ''
  customerPage.pageNum = 1
  loadCustomers()
}

function openSettlementHistory() {
  showAgentNotice('历史结算记录', '结算记录接口已预留，可接入代理分成结算列表。', 'info')
}

function openFinanceSummary() {
  switchAgentSection('customers')
  showToast('可在客户列表中进入单个客户资金明细')
}

onMounted(() => {
  window.addEventListener('resize', resizeConversionChart)
  loadAll().finally(renderInviteConversionChart)
})
onBeforeUnmount(() => {
  window.clearTimeout(customerSearchTimer)
  window.removeEventListener('resize', resizeConversionChart)
  disposeConversionChart()
})
</script>

<style scoped>
.agent-center-page{gap:0;min-height:0}
.agent-depth-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--border);margin-bottom:30px;background:#fff}
.agent-depth-tab{position:relative;min-height:58px;padding:0 22px;border:0;border-right:1px solid var(--border2);background:#fff;text-align:left;font-family:inherit;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.agent-depth-tab:last-child{border-right:0}
.agent-depth-tab:hover{background:#F8FAFC}
.agent-depth-tab.active{background:#3568b0;border-color:#3568b0}
.agent-depth-tab.active:hover{background:#3568b0}
.agent-depth-tab strong{display:block;font-size:15px;color:var(--text1);line-height:1.35;font-weight:600}
.agent-depth-tab.active strong{color:#fff;font-weight:500}
.agent-depth-pane{border-top:0}
.agent-center-page .business-list-shell{border-top:0;flex:0 0 auto;min-height:420px}
.agent-center-page .business-list-shell .table-content{min-height:260px}
.agent-stat-row{grid-template-columns:repeat(4,minmax(0,1fr));border-bottom:0;margin-bottom:30px}
.agent-stat-row .stat-cell{min-height:96px;justify-content:center}
.agent-stat-row .stat-cell:nth-child(4n){border-right:none}
.agent-stat-row .stat-cell:nth-child(-n+4){border-bottom:1px solid var(--border2)}
.stat-cell-main{display:flex;align-items:center;gap:10px;min-width:0;flex-wrap:wrap}
.stat-cell-value.primary{color:var(--primary)}
.stat-trend{display:inline-flex;align-items:center;gap:3px;font-size:12px;font-weight:700;line-height:1;white-space:nowrap}
.stat-trend svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.stat-trend.up{color:#16A34A}
.stat-trend.down{color:#DC2626}
.agent-ops-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:0}
.agent-panel{background:#fff;border:1px solid var(--border);border-top:0;padding:20px 24px}
.agent-ops-grid .agent-panel + .agent-panel{border-left:0}
.agent-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
.agent-panel-head h2{margin:0;font-size:16px;font-weight:700;color:var(--text1)}
.agent-panel-head p{margin:5px 0 0;font-size:13px;line-height:1.5;color:var(--text2)}
.follow-list{gap:0;list-style:none;display:flex;flex-direction:column}
.follow-item{width:100%;display:flex;align-items:center;gap:10px;padding:10px 0;border:0;border-bottom:1px solid var(--border2);background:#fff;line-height:1;text-align:left;font-family:inherit;cursor:pointer}
.follow-item:last-child{border-bottom:0}
.follow-item:hover{background:#F8FAFC}
.follow-count{font-size:12px;font-weight:600;width:22px;height:22px;border-radius:50%;background:#ffcc00;color:#f77f15;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.follow-count.zero{background:#F1F5F9;color:#94A3B8}
.follow-text{flex:1;font-size:14px;color:var(--text1);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.conversion-chart{height:250px;width:100%;padding-top:2px}
.conversion-summary{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:17px;border:1px solid var(--border2)}
.conversion-summary span{padding:11px 12px;font-size:13px;color:var(--text2)}
.conversion-summary span + span{border-left:1px solid var(--border2)}
.conversion-summary b{color:var(--text1);font-weight:700}
.finance-panel{padding-bottom:22px}
.finance-head{align-items:center}
.finance-entry-actions{display:flex;align-items:center;gap:10px;flex-shrink:0}
.finance-entry-actions .btn-primary,.finance-entry-actions .btn-outline{height:36px;padding:0 16px;font-size:13px}
.finance-metric-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-top:1px solid var(--border2);border-left:1px solid var(--border2)}
.finance-metric{min-height:74px;padding:13px 14px;border-right:1px solid var(--border2);border-bottom:1px solid var(--border2);display:flex;flex-direction:column;justify-content:center;gap:6px}
.finance-metric span{font-size:12px;color:var(--text2)}
.finance-metric strong{font-size:17px;color:var(--text1);font-weight:700;line-height:1.25}
.rank-board{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:18px}
.rank-card{min-width:0;border:1px solid #dce3eb;background:#fff;padding:18px 20px}
.rank-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--border2)}
.rank-card-head h3{margin:0;font-size:16px;color:var(--text1);font-weight:700;line-height:1.35}
.rank-card ol{list-style:none;margin:0;padding:12px 0 0;display:flex;flex-direction:column;gap:6px}
.rank-card li{min-height:60px;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #F0F3F7}
.rank-card li:last-child{border-bottom:0}
.rank-card li.top{background:#F8FAFC;margin:0 -10px;padding-left:10px;padding-right:10px}
.rank-index{width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:#EEF2F7;color:#667085;font-size:13px;font-weight:700}
.rank-card li:nth-child(1) .rank-index{background:#E5484D;color:#fff}
.rank-card li:nth-child(2) .rank-index{background:#F97316;color:#fff}
.rank-card li:nth-child(3) .rank-index{background:#FACC15;color:#7A4A00}
.rank-main{min-width:0;display:flex;flex-direction:column;gap:4px}
.rank-main strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text1);font-size:14px;font-weight:700;line-height:1.3}
.rank-main small{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text3);font-size:12px;line-height:1.3}
.rank-value{flex-shrink:0;color:var(--text1);font-size:14px;font-weight:700;text-align:right;white-space:nowrap}
.rank-card li.top .rank-value{color:var(--primary)}
.rank-empty{display:flex!important;min-height:56px!important;align-items:center!important;justify-content:center!important;color:var(--text3);font-size:12px}
.table-count{font-size:13px;color:var(--text2);font-weight:400}
.customer-title-wrap{display:flex;align-items:center;gap:10px;min-width:0}
.follow-filter-chip{height:26px;max-width:260px;padding:0 9px;border:1px solid var(--border2);background:#F8FAFC;color:var(--text2);font-size:12px;font-weight:500;font-family:inherit;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.follow-filter-chip:hover{border-color:var(--primary);color:var(--primary);background:#F3F7FD}
.action-group{display:flex;align-items:center;gap:16px}
.required{color:var(--error);font-weight:400}
.permission-card{padding:24px;color:var(--error)}
.customer-tools{display:flex;align-items:center;gap:14px}
.customer-search{width:280px;height:36px}
.agent-customer-table{min-width:1080px}
.agent-customer-cell{display:inline-flex;align-items:center;justify-content:center;max-width:100%;text-align:left;vertical-align:middle}
.agent-customer-main{display:block;min-width:0}
.agent-customer-main strong,.agent-customer-main small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.agent-customer-main strong{color:var(--text1);font-size:14px;font-weight:700}
.agent-customer-main small{margin-top:3px;color:var(--text3);font-size:12px;font-weight:400}
.invite-create-btn{border:none}
.agent-invite-table{min-width:1080px}
.td-status{vertical-align:middle;line-height:1}
.invite-status-pill{display:inline-flex;height:24px;align-items:center;justify-content:center;padding:0 9px;background:#EEF1F5;color:#667085;font-size:12px;font-weight:700}
.invite-status-pill.enabled{background:#E8F7EF;color:#087443}
.invite-status-pill.off{background:#EEF1F5;color:#667085}
.invite-status-pill.expired{background:#FDECEC;color:var(--error)}
.invite-status-pill.used-up{background:#FEF3E2;color:var(--warning)}
.invite-remark{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text2)}
.invite-actions{gap:10px}
.invite-switch{position:relative;display:inline-flex;align-items:center;width:66px;min-width:66px;height:28px;flex:0 0 66px;box-sizing:border-box;padding:0;border:none;border-radius:999px;background:#D3DAE0;color:#64748B;font-size:11px;font-weight:700;font-family:inherit;line-height:1;cursor:pointer;transition:background-color .22s ease,color .18s ease;vertical-align:middle}
.invite-switch.active{background:#52BC41;color:#fff}
.invite-switch:disabled{cursor:default}
.invite-switch:focus-visible{outline:2px solid rgba(11,88,191,.22);outline-offset:2px}
.switch-knob{position:absolute;left:3px;top:50%;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.22);transform:translateY(-50%);transition:left .22s cubic-bezier(.25,.8,.25,1),box-shadow .18s ease;will-change:left}
.invite-switch.active .switch-knob{left:calc(100% - 25px)}
.switch-text{position:absolute;top:50%;right:9px;transform:translateY(-50%);letter-spacing:0;pointer-events:none}
.invite-switch.active .switch-text{right:auto;left:10px}
.agent-toast{position:fixed;right:30px;bottom:30px;z-index:100;padding:11px 16px;background:#172033;color:#fff;box-shadow:0 12px 30px rgba(23,32,51,.22);font-size:13px;font-weight:700}

@media (max-width:1280px){
  .finance-metric-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .rank-board{grid-template-columns:repeat(2,minmax(0,1fr))}
}

@media (max-width:1100px){
  .agent-depth-nav{grid-template-columns:repeat(2,minmax(0,1fr))}
  .agent-depth-tab:nth-child(2n){border-right:0}
  .agent-depth-tab:nth-child(n+3){border-top:1px solid var(--border2)}
  .agent-depth-tab.active{background:#3568b0;border-color:#3568b0}
  .agent-stat-row{grid-template-columns:repeat(2,minmax(0,1fr))}
  .agent-stat-row .stat-cell{border-right:1px solid var(--border2);border-bottom:1px solid var(--border2)}
  .agent-stat-row .stat-cell:nth-child(2n){border-right:none}
  .agent-ops-grid{grid-template-columns:1fr}
  .agent-ops-grid .agent-panel + .agent-panel{border-left:1px solid var(--border);border-top:0}
  .rank-board{grid-template-columns:repeat(2,minmax(0,1fr))}
}

@media (max-width:768px){
  .agent-depth-nav{grid-template-columns:1fr}
  .agent-depth-tab{min-height:58px;border-right:0;border-top:1px solid var(--border2)}
  .agent-depth-tab.active{background:#3568b0;border-color:#3568b0}
  .agent-stat-row{grid-template-columns:1fr}
  .agent-stat-row .stat-cell{min-height:82px;border-right:none}
  .agent-panel{padding:16px}
  .agent-panel-head,.finance-head{flex-direction:column;align-items:stretch}
  .follow-item{align-items:flex-start}
  .follow-text{white-space:normal}
  .conversion-chart{height:230px}
  .finance-entry-actions{display:grid;grid-template-columns:1fr;gap:8px}
  .finance-metric-grid,.rank-board{grid-template-columns:1fr}
  .conversion-summary{grid-template-columns:1fr}
  .conversion-summary span + span{border-left:0;border-top:1px solid var(--border2)}
}
</style>
