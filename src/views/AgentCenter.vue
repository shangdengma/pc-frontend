<template>
  <div class="agent-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">渠道运营</p>
        <h2>代理中心</h2>
        <p class="page-description">管理邀请渠道、下级客户及账户额度。</p>
      </div>
      <div class="page-actions">
        <button class="secondary-btn" type="button" :disabled="loading" @click="loadAll">
          <RefreshCw :size="17" :stroke-width="1.9" />
          刷新
        </button>
        <button class="primary-btn" type="button" :disabled="!isAgent" @click="openCreate">
          <Plus :size="17" :stroke-width="2" />
          新建邀请码
        </button>
      </div>
    </header>

    <section v-if="!isAgent && !loading" class="no-permission">
      <span class="empty-icon"><ShieldAlert :size="25" :stroke-width="1.8" /></span>
      <h3>当前账号未开通代理权限</h3>
      <p>请联系平台管理员完成代理身份配置。</p>
    </section>

    <template v-else>
      <section class="overview-band" aria-label="代理经营概览">
        <div class="balance-overview">
          <span class="metric-icon"><WalletCards :size="21" :stroke-width="1.8" /></span>
          <div>
            <span>可分配余额</span>
            <strong>&yen;{{ money(agentAvailableBalance) }}</strong>
            <small>当前分成比例 {{ rateText(commissionRate) }}%</small>
          </div>
        </div>
        <dl class="overview-metrics">
          <div><dt>下级客户</dt><dd>{{ customerPage.total }}<span>人</span></dd></div>
          <div><dt>客户累计充值</dt><dd>&yen;{{ money(totalRecharge) }}</dd></div>
          <div><dt>已分成金额</dt><dd>&yen;{{ money(settledCommission) }}</dd></div>
          <div><dt>未分成金额</dt><dd>&yen;{{ money(unsettledCommission) }}</dd></div>
        </dl>
      </section>

      <section class="workspace-shell">
        <nav class="workspace-tabs" aria-label="代理中心功能">
          <button type="button" :class="{ active: workspaceTab === 'customers' }" @click="workspaceTab = 'customers'">
            <UsersRound :size="17" :stroke-width="1.9" />
            客户管理
            <span>{{ customerPage.total }}</span>
          </button>
          <button type="button" :class="{ active: workspaceTab === 'codes' }" @click="workspaceTab = 'codes'">
            <TicketCheck :size="17" :stroke-width="1.9" />
            邀请码管理
            <span>{{ inviteCodes.length }}</span>
          </button>
        </nav>

        <div v-if="workspaceTab === 'customers'" class="workspace-content">
          <div class="section-toolbar">
            <div>
              <h3>下级客户</h3>
              <p>查看客户账户余额、充值及消费情况。</p>
            </div>
            <label class="search-box">
              <Search :size="17" :stroke-width="1.8" />
              <input v-model.trim="customerKeyword" placeholder="搜索客户名称、账号或手机号" />
            </label>
          </div>

          <div v-if="loading || customerLoading" class="loading-table" aria-label="正在加载">
            <span v-for="item in 5" :key="item"></span>
          </div>
          <div v-else-if="!filteredCustomers.length" class="empty-state">
            <UsersRound :size="31" :stroke-width="1.5" />
            <strong>{{ customerKeyword ? '未找到匹配客户' : '暂无下级客户' }}</strong>
            <span>{{ customerKeyword ? '请调整搜索关键词。' : '客户使用代理邀请码注册后将显示在这里。' }}</span>
          </div>
          <template v-else>
            <div class="data-table-wrap">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>客户</th>
                    <th>企业名称</th>
                    <th>注册时间</th>
                    <th class="numeric">当前余额</th>
                    <th class="numeric">累计充值</th>
                    <th class="numeric">累计消费</th>
                    <th class="actions-column">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in filteredCustomers"
                    :key="item.invitedUserId"
                  >
                    <td>
                      <div class="customer-cell">
                        <span class="customer-avatar">{{ avatarText(item) }}</span>
                        <div><strong>{{ item.nickName || item.userName || '-' }}</strong><small>{{ item.phonenumber || item.userName || '-' }}</small></div>
                      </div>
                    </td>
                    <td>{{ item.enterpriseName || '-' }}</td>
                    <td>{{ formatTime(item.invitedAt) }}</td>
                    <td class="numeric money-value">&yen;{{ money(item.balanceAmount) }}</td>
                    <td class="numeric">&yen;{{ money(item.rechargeAmount) }}</td>
                    <td class="numeric">&yen;{{ money(item.consumeAmount) }}</td>
                    <td class="row-actions">
                      <button type="button" @click="openCustomerFinance(item)">资金明细</button>
                      <button class="primary-link" type="button" @click="openCustomerAllocation(item)">分配余额</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination-bar">
              <span>共 {{ customerPage.total }} 位客户，每页 {{ customerPage.pageSize }} 位</span>
              <div>
                <button type="button" :disabled="customerPage.pageNum <= 1 || customerLoading" @click="changeCustomerPage(-1)">上一页</button>
                <strong>{{ customerPage.pageNum }} / {{ customerPageCount }}</strong>
                <button type="button" :disabled="customerPage.pageNum >= customerPageCount || customerLoading" @click="changeCustomerPage(1)">下一页</button>
              </div>
            </div>

          </template>
        </div>

        <div v-else class="workspace-content">
          <div class="section-toolbar">
            <div>
              <h3>邀请码管理</h3>
              <p>配置注册赠送额度、使用次数和有效期。</p>
            </div>
            <button class="primary-btn compact" type="button" @click="openCreate">
              <Plus :size="16" :stroke-width="2" />
              新建邀请码
            </button>
          </div>

          <div v-if="loading" class="loading-table" aria-label="正在加载">
            <span v-for="item in 4" :key="item"></span>
          </div>
          <div v-else-if="!inviteCodes.length" class="empty-state">
            <TicketCheck :size="31" :stroke-width="1.5" />
            <strong>暂无邀请码</strong>
            <span>创建邀请码后即可用于客户注册。</span>
            <button class="primary-btn compact" type="button" @click="openCreate">新建邀请码</button>
          </div>
          <div v-else class="data-table-wrap">
            <table class="data-table code-table">
              <thead>
                <tr><th>邀请码</th><th>状态</th><th class="numeric">注册赠送</th><th>使用情况</th><th>有效期</th><th>备注</th><th class="actions-column">操作</th></tr>
              </thead>
              <tbody>
                <tr v-for="item in inviteCodes" :key="item.id" :class="{ muted: item.status !== 0 }">
                  <td><strong class="invite-code">{{ item.inviteCode }}</strong></td>
                  <td><span :class="['status-pill', item.status === 0 ? 'ok' : 'off']">{{ item.status === 0 ? '启用' : '停用' }}</span></td>
                  <td class="numeric money-value">&yen;{{ money(item.giftAmount) }}</td>
                  <td>{{ usageText(item) }}</td>
                  <td>{{ item.expireTime ? formatTime(item.expireTime) : '长期有效' }}</td>
                  <td class="remark-cell">{{ item.remark || '-' }}</td>
                  <td class="icon-actions">
                    <button type="button" title="复制邀请码" aria-label="复制邀请码" @click="copyCode(item.inviteCode)"><Copy :size="16" /></button>
                    <button type="button" title="编辑邀请码" aria-label="编辑邀请码" @click="openEdit(item)"><Pencil :size="16" /></button>
                    <button type="button" :title="item.status === 0 ? '停用邀请码' : '启用邀请码'" :aria-label="item.status === 0 ? '停用邀请码' : '启用邀请码'" @click="toggleStatus(item)">
                      <Power :size="16" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </template>

    <AppModal
      :open="codeDialog"
      :title="editingCode ? '调整邀请码' : '生成邀请码'"
      eyebrow="代理中心"
      :description="editingCode ? '修改后仅影响后续注册使用' : '创建后可复制给客户注册使用'"
      size="md"
      @close="closeCodeDialog"
    >
      <div class="notice-tip">注册赠送余额将从代理可用余额中扣除。余额不足时，新用户不会获得赠送额度。</div>

        <div class="form-grid">
          <label>赠送余额（元）<input v-model.trim="codeForm.giftAmount" type="number" min="0" step="0.01" placeholder="例如 50" /></label>
          <label>最大使用次数<input v-model.trim="codeForm.maxUses" type="number" min="0" step="1" placeholder="0 表示不限" /></label>
          <label>过期时间<input v-model="codeForm.expireTime" type="datetime-local" /></label>
          <label>备注<input v-model.trim="codeForm.remark" placeholder="例如 7月活动渠道" /></label>
        </div>

      <p v-if="message" class="form-message">{{ message }}</p>
      <template #footer>
        <button class="ghost-btn" type="button" @click="closeCodeDialog">取消</button>
        <button class="primary-btn" type="button" :disabled="saving" @click="saveCode">{{ saving ? '提交中...' : '确认保存' }}</button>
      </template>
    </AppModal>

    <AppModal
      :open="allocationDialog"
      title="分配余额"
      eyebrow="代理中心"
      :description="selectedCustomer ? `向 ${selectedCustomer.nickName || selectedCustomer.userName} 划拨账户余额` : ''"
      size="sm"
      @close="closeAllocation"
    >
      <div class="allocation-summary">
        <div><span>代理可用余额</span><strong>&yen;{{ money(agentAvailableBalance) }}</strong></div>
        <ArrowRightLeft :size="18" :stroke-width="1.8" />
        <div><span>客户当前余额</span><strong>&yen;{{ money(selectedCustomer?.balanceAmount) }}</strong></div>
      </div>
      <div class="form-grid single-column">
        <label>分配金额（元）<span class="money-input"><b>&yen;</b><input v-model.trim="allocationForm.amount" type="number" min="0.01" step="0.01" placeholder="0.00" /></span></label>
        <label>分配说明（选填）<input v-model.trim="allocationForm.remark" maxlength="100" placeholder="例如：业务测试额度" /></label>
      </div>
      <p class="allocation-hint">提交后将实时从代理可用余额转入该客户账户，资金流水同步记录。</p>
      <p v-if="allocationMessage" class="form-message">{{ allocationMessage }}</p>
      <template #footer>
        <button class="ghost-btn" type="button" @click="closeAllocation">取消</button>
        <button class="primary-btn" type="button" :disabled="allocationSaving" @click="saveAllocation">
          {{ allocationSaving ? '处理中...' : '确认分配' }}
        </button>
      </template>
    </AppModal>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRightLeft,
  Copy,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldAlert,
  TicketCheck,
  UsersRound,
  WalletCards
} from '@lucide/vue'
import AppModal from '../components/AppModal.vue'
import { allocateAgentCustomerBalance, createAgentInviteCode, getAgentOverview, listAgentCustomers, listAgentInviteCodes, updateAgentInviteCode } from '../api/agent'

const router = useRouter()

const isAgent = ref(true)
const loading = ref(false)
const customerLoading = ref(false)
const saving = ref(false)
const message = ref('')
const toast = ref('')
const inviteCodes = ref([])
const customers = ref([])
const customerKeyword = ref('')
const codeDialog = ref(false)
const editingCode = ref(null)
const selectedCustomer = ref(null)
const agentAvailableBalance = ref(0)
const allocationDialog = ref(false)
const allocationSaving = ref(false)
const allocationMessage = ref('')
const workspaceTab = ref('customers')
const customerPage = reactive({ pageNum: 1, pageSize: 20, total: 0 })
const totalRecharge = ref(0)
const totalConsume = ref(0)
const commissionRate = ref(0)
const settledCommission = ref(0)
const unsettledCommission = ref(0)
const codeForm = reactive({ giftAmount: '', maxUses: 0, expireTime: '', remark: '' })
const allocationForm = reactive({ amount: '', remark: '', requestId: '' })

const filteredCustomers = computed(() => customers.value)
const customerPageCount = computed(() => Math.max(1, Math.ceil(customerPage.total / customerPage.pageSize)))

let customerSearchTimer
watch(customerKeyword, () => {
  window.clearTimeout(customerSearchTimer)
  customerSearchTimer = window.setTimeout(() => {
    customerPage.pageNum = 1
    loadCustomers()
  }, 320)
})

function money(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function rateText(value) {
  return Number(value || 0).toFixed(2)
}
function formatTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).replace('T', ' ')
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function usageText(item) {
  const max = Number(item.maxUses || 0)
  if (max <= 0) return '不限次数'
  return `剩余 ${item.remainingUses || 0}/${max} 次`
}
function avatarText(item) {
  const text = item.nickName || item.userName || '?'
  return String(text).slice(0, 1).toUpperCase()
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
async function loadAll() {
  loading.value = true
  try {
    const overviewRes = await getAgentOverview()
    agentAvailableBalance.value = Number(overviewRes.data?.availableBalanceAmount || 0)
    commissionRate.value = Number(overviewRes.data?.commissionRate || 0)
    settledCommission.value = Number(overviewRes.data?.settledCommissionAmount || 0)
    unsettledCommission.value = Number(overviewRes.data?.unsettledCommissionAmount || 0)
    totalRecharge.value = Number(overviewRes.data?.totalRechargeAmount || 0)
    const [codeRes, customerRes] = await Promise.all([
      listAgentInviteCodes(),
      listAgentCustomers({ pageNum: customerPage.pageNum, pageSize: customerPage.pageSize, keyword: customerKeyword.value || undefined })
    ])
    inviteCodes.value = codeRes.data || []
    applyCustomerPage(customerRes.data)
    isAgent.value = true
  } catch (err) {
    if (err && err.code && err.code !== 200) isAgent.value = false
  } finally {
    loading.value = false
  }
}
function applyCustomerPage(data) {
  const page = data || {}
  customers.value = page.rows || []
  customerPage.total = Number(page.total || 0)
  customerPage.pageNum = Number(page.pageNum || customerPage.pageNum)
  customerPage.pageSize = Number(page.pageSize || customerPage.pageSize)
  totalRecharge.value = Number(page.totalRecharge || 0)
  totalConsume.value = Number(page.totalConsume || 0)
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
  } catch (err) {
    showToast(err?.msg || '客户列表加载失败')
  } finally {
    customerLoading.value = false
  }
}
async function changeCustomerPage(step) {
  const target = customerPage.pageNum + step
  if (target < 1 || target > customerPageCount.value) return
  customerPage.pageNum = target
  await loadCustomers()
}
function resetCodeForm() {
  codeForm.giftAmount = ''
  codeForm.maxUses = 0
  codeForm.expireTime = ''
  codeForm.remark = ''
  message.value = ''
}
function openCreate() {
  editingCode.value = null
  resetCodeForm()
  codeDialog.value = true
}
function openEdit(item) {
  editingCode.value = item
  codeForm.giftAmount = item.giftAmount || ''
  codeForm.maxUses = item.maxUses || 0
  codeForm.expireTime = item.expireTime ? String(item.expireTime).slice(0, 16) : ''
  codeForm.remark = item.remark || ''
  message.value = ''
  codeDialog.value = true
}
function closeCodeDialog() {
  codeDialog.value = false
  editingCode.value = null
  resetCodeForm()
}
async function saveCode() {
  message.value = ''
  if (!codeForm.giftAmount || Number(codeForm.giftAmount) <= 0) return (message.value = '请输入大于 0 的赠送余额')
  if (Number(codeForm.maxUses) < 0) return (message.value = '最大使用次数不能小于 0')
  saving.value = true
  try {
    const data = { giftAmount: codeForm.giftAmount, maxUses: Number(codeForm.maxUses || 0), expireTime: apiDate(codeForm.expireTime), remark: codeForm.remark }
    if (editingCode.value) await updateAgentInviteCode(editingCode.value.id, data)
    else await createAgentInviteCode(data)
    closeCodeDialog()
    await loadAll()
    showToast('邀请码已保存')
  } catch (err) {
    message.value = err?.msg || err?.message || '提交失败'
  } finally {
    saving.value = false
  }
}
async function toggleStatus(item) {
  try {
    await updateAgentInviteCode(item.id, { status: item.status === 0 ? 1 : 0 })
    await loadAll()
    showToast(item.status === 0 ? '邀请码已停用' : '邀请码已启用')
  } catch (err) {
    showToast(err?.msg || '操作失败')
  }
}
async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    showToast('邀请码已复制')
  } catch (err) {
    showToast('复制失败，请手动复制')
  }
}
function openCustomerFinance(item) {
  router.push({
    name: 'agentCustomerFinance',
    params: { userId: item.invitedUserId },
    query: { type: 'recharge' }
  })
}

function newRequestId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID().replaceAll('-', '')
  return `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}
function openAllocation() {
  if (!selectedCustomer.value) return
  allocationForm.amount = ''
  allocationForm.remark = ''
  allocationForm.requestId = newRequestId()
  allocationMessage.value = ''
  allocationDialog.value = true
}
function openCustomerAllocation(item) {
  selectedCustomer.value = item
  openAllocation()
}
function closeAllocation() {
  if (allocationSaving.value) return
  allocationDialog.value = false
  allocationMessage.value = ''
  allocationForm.amount = ''
  allocationForm.remark = ''
  allocationForm.requestId = ''
}
async function saveAllocation() {
  allocationMessage.value = ''
  const amount = Number(allocationForm.amount)
  if (!Number.isFinite(amount) || amount <= 0) return (allocationMessage.value = '请输入大于0的分配金额')
  if (!/^\d+(\.\d{1,2})?$/.test(String(allocationForm.amount))) return (allocationMessage.value = '分配金额最多保留两位小数')
  if (amount > Number(agentAvailableBalance.value || 0)) return (allocationMessage.value = '分配金额不能超过代理可用余额')
  if (!selectedCustomer.value) return (allocationMessage.value = '请选择下级客户')
  allocationSaving.value = true
  const customerId = selectedCustomer.value.invitedUserId
  try {
    const res = await allocateAgentCustomerBalance(customerId, {
      amount: allocationForm.amount,
      remark: allocationForm.remark,
      requestId: allocationForm.requestId
    })
    allocationDialog.value = false
    agentAvailableBalance.value = Number(res.data?.agentAvailableBalance || 0)
    await loadAll()
    const customer = customers.value.find(item => item.invitedUserId === customerId)
    if (customer) selectedCustomer.value = customer
    showToast(`已成功分配 ¥${money(amount)}`)
  } catch (err) {
    allocationMessage.value = err?.msg || err?.message || '余额分配失败'
  } finally {
    allocationSaving.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.agent-page { width: min(1440px, 100%); margin: 0 auto; display: grid; gap: 18px; color: #172033; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 2px 0 18px; border-bottom: 1px solid #dfe6ef; }
.page-eyebrow { margin: 0 0 5px; color: #2f6fe4; font-size: 13px; font-weight: 700; }
.page-header h2 { margin: 0; font-size: 25px; line-height: 1.3; letter-spacing: 0; }
.page-description { margin: 6px 0 0; color: #6b778c; font-size: 14px; }
.page-actions { display: flex; align-items: center; gap: 10px; }
.primary-btn, .secondary-btn, .ghost-btn { min-width: 0; height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 16px; border-radius: 7px; font: inherit; font-weight: 700; cursor: pointer; transition: border-color .16s ease, background .16s ease, transform .16s ease; }
.primary-btn { border: 1px solid #2f6fe4; color: #fff; background: #2f6fe4; box-shadow: 0 7px 16px rgba(47, 111, 228, .16); }
.primary-btn:hover { background: #255fca; }
.secondary-btn, .ghost-btn { border: 1px solid #d6dfeb; color: #344054; background: #fff; }
.secondary-btn:hover, .ghost-btn:hover { border-color: #9fb4cf; background: #f8fafc; }
.primary-btn:active, .secondary-btn:active, .ghost-btn:active { transform: translateY(1px); }
.primary-btn:disabled, .secondary-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
.primary-btn.compact { height: 36px; padding: 0 13px; font-size: 13px; box-shadow: none; }

.overview-band { display: grid; grid-template-columns: minmax(300px, .82fr) minmax(620px, 1.8fr); min-height: 126px; overflow: hidden; border: 1px solid #dfe6ef; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(31, 50, 81, .05); }
.balance-overview { display: flex; align-items: center; gap: 16px; padding: 22px 24px; border-right: 1px solid #e6ebf2; background: #f7faff; }
.metric-icon { width: 44px; height: 44px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 8px; color: #245fc8; background: #e8f0ff; }
.balance-overview div > span, .balance-overview small { display: block; color: #68758a; }
.balance-overview div > span { margin-bottom: 7px; font-size: 13px; font-weight: 700; }
.balance-overview strong { display: block; font-size: 28px; line-height: 1.1; font-variant-numeric: tabular-nums; }
.balance-overview small { margin-top: 7px; font-size: 12px; }
.overview-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; }
.overview-metrics div { display: flex; flex-direction: column; justify-content: center; padding: 20px 22px; border-right: 1px solid #edf1f6; }
.overview-metrics div:last-child { border-right: 0; }
.overview-metrics dt { margin-bottom: 10px; color: #68758a; font-size: 13px; }
.overview-metrics dd { margin: 0; color: #172033; font-size: 21px; font-weight: 750; font-variant-numeric: tabular-nums; }
.overview-metrics dd span { margin-left: 4px; color: #7d899b; font-size: 12px; font-weight: 600; }

.workspace-shell { overflow: hidden; border: 1px solid #dfe6ef; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(31, 50, 81, .05); }
.workspace-tabs { height: 58px; display: flex; align-items: stretch; gap: 28px; padding: 0 24px; border-bottom: 1px solid #e3e9f1; background: #fbfcfe; }
.workspace-tabs button { position: relative; display: inline-flex; align-items: center; gap: 8px; padding: 0 2px; border: 0; color: #667388; background: transparent; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.workspace-tabs button::after { content: ''; position: absolute; right: 0; bottom: -1px; left: 0; height: 2px; background: transparent; }
.workspace-tabs button.active { color: #245fc8; }
.workspace-tabs button.active::after { background: #2f6fe4; }
.workspace-tabs button > span { min-width: 22px; height: 20px; display: inline-grid; place-items: center; padding: 0 6px; border-radius: 10px; color: #64748b; background: #e9eef5; font-size: 12px; }
.workspace-tabs button.active > span { color: #245fc8; background: #e7efff; }
.workspace-content { padding: 24px; }
.section-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.section-toolbar h3 { margin: 0 0 5px; font-size: 18px; }
.section-toolbar p { margin: 0; color: #758196; font-size: 13px; }
.search-box { width: min(380px, 42%); height: 40px; display: flex; align-items: center; gap: 9px; padding: 0 12px; border: 1px solid #d7e0eb; border-radius: 7px; color: #8a96a8; background: #fff; }
.search-box:focus-within { border-color: #7ba6ef; box-shadow: 0 0 0 3px rgba(47, 111, 228, .1); }
.search-box input { min-width: 0; width: 100%; border: 0; outline: 0; color: #172033; background: transparent; font: inherit; font-size: 14px; }

.data-table-wrap { overflow: auto; border: 1px solid #e2e8f0; border-radius: 7px; }
.data-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.data-table { min-width: 1080px; }
.data-table th { padding: 12px 14px; border-bottom: 1px solid #dfe6ee; color: #637087; background: #f6f8fb; text-align: left; font-size: 12px; font-weight: 700; }
.data-table td { padding: 14px; border-bottom: 1px solid #e9edf3; color: #344054; font-size: 13px; vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: 0; }
.data-table tbody tr { transition: background .14s ease; }
.data-table tbody tr:hover { background: #f7faff; }
.data-table tr.muted { opacity: .67; }
.data-table .numeric { text-align: right; font-variant-numeric: tabular-nums; }
.customer-table th:first-child { width: 190px; }
.customer-table th:nth-child(2) { width: 190px; }
.customer-table th:nth-child(3) { width: 150px; }
.customer-table th:nth-child(4), .customer-table th:nth-child(5), .customer-table th:nth-child(6) { width: 125px; }
.customer-table th:last-child { width: 176px; }
.code-table th:first-child { width: 150px; }
.code-table th:nth-child(2) { width: 86px; }
.code-table th:nth-child(3) { width: 120px; }
.code-table th:nth-child(4) { width: 130px; }
.code-table th:nth-child(5) { width: 170px; }
.code-table th:last-child { width: 140px; }
.actions-column { text-align: right !important; }
.customer-cell { display: flex; align-items: center; gap: 11px; }
.customer-avatar { width: 36px; height: 36px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 7px; color: #245fc8; background: #e9f1ff; font-weight: 800; }
.customer-cell div { min-width: 0; }
.customer-cell strong, .customer-cell small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.customer-cell strong { color: #172033; font-size: 14px; }
.customer-cell small { margin-top: 4px; color: #7a8698; font-size: 12px; }
.money-value { color: #172033 !important; font-weight: 700; font-variant-numeric: tabular-nums; }
.row-actions { text-align: right; white-space: nowrap; }
.row-actions button { padding: 5px 7px; border: 0; color: #58677d; background: transparent; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.row-actions button:hover, .row-actions .primary-link { color: #245fc8; }
.invite-code { color: #172033; font-size: 14px; letter-spacing: .04em; }
.status-pill { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
.status-pill.ok { color: #087443; background: #e8f7ef; }
.status-pill.off { color: #667085; background: #eef1f5; }
.remark-cell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.icon-actions { text-align: right; white-space: nowrap; }
.icon-actions button { width: 32px; height: 32px; display: inline-grid; place-items: center; margin-left: 3px; border: 1px solid transparent; border-radius: 6px; color: #66758c; background: transparent; cursor: pointer; }
.icon-actions button:hover { border-color: #cfdbeb; color: #245fc8; background: #f4f8ff; }
.pagination-bar { min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 14px; color: #738096; font-size: 12px; }
.pagination-bar > div { display: flex; align-items: center; gap: 9px; }
.pagination-bar button { height: 32px; padding: 0 12px; border: 1px solid #d5deea; border-radius: 6px; color: #45546a; background: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.pagination-bar button:hover:not(:disabled) { border-color: #8eabe0; color: #245fc8; background: #f7faff; }
.pagination-bar button:disabled { opacity: .45; cursor: not-allowed; }
.pagination-bar strong { min-width: 58px; color: #344054; text-align: center; font-variant-numeric: tabular-nums; }

.empty-state { min-height: 260px; display: grid; place-items: center; align-content: center; gap: 9px; color: #8591a3; text-align: center; }
.empty-state strong { color: #344054; font-size: 15px; }
.empty-state span { font-size: 13px; }
.empty-state .primary-btn { margin-top: 8px; color: #fff; }
.loading-table { display: grid; gap: 1px; overflow: hidden; border: 1px solid #e3e9f1; border-radius: 7px; background: #e7ecf3; }
.loading-table span { height: 58px; background: linear-gradient(90deg, #f8fafc 25%, #eef2f7 40%, #f8fafc 65%); background-size: 400% 100%; animation: loading 1.4s ease infinite; }
@keyframes loading { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
.no-permission { margin-top: 10px; padding: 52px 24px; border: 1px solid #dfe6ef; border-radius: 8px; background: #fff; text-align: center; }
.empty-icon { width: 52px; height: 52px; display: grid; place-items: center; margin: 0 auto 16px; border-radius: 8px; color: #2f6fe4; background: #eaf1ff; }
.no-permission h3 { margin: 0 0 8px; font-size: 18px; }
.no-permission p { margin: 0; color: #758196; }

.notice-tip { margin-bottom: 18px; padding: 12px 14px; border-left: 3px solid #2f6fe4; color: #2f4e7c; background: #f3f7fd; font-size: 13px; line-height: 1.6; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 20px; }
.form-grid.single-column { grid-template-columns: 1fr; }
.form-grid label { display: grid; gap: 8px; color: #344054; font-size: 13px; font-weight: 700; }
.form-grid input { min-width: 0; height: 44px; padding: 0 13px; border: 1px solid #d5deea; border-radius: 7px; outline: none; color: #172033; background: #fff; font: inherit; }
.form-grid input:focus, .money-input:focus-within { border-color: #76a2ea; box-shadow: 0 0 0 3px rgba(47, 111, 228, .1); }
.money-input { height: 44px; display: flex; align-items: center; border: 1px solid #d5deea; border-radius: 7px; background: #fff; }
.money-input b { padding-left: 13px; color: #6b778c; font-size: 15px; }
.money-input input { flex: 1; border: 0; box-shadow: none !important; }
.form-message { margin: 14px 0 0; padding: 11px 13px; border: 1px solid #ffd2cf; border-radius: 7px; color: #c43227; background: #fff4f3; font-size: 13px; }
.allocation-summary { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 12px; margin-bottom: 20px; }
.allocation-summary > svg { color: #8b99ad; }
.allocation-summary div { padding: 14px; border: 1px solid #dde6f1; border-radius: 7px; background: #f8faff; }
.allocation-summary span { display: block; margin-bottom: 7px; color: #6e7b90; font-size: 12px; }
.allocation-summary strong { font-size: 19px; font-variant-numeric: tabular-nums; }
.allocation-hint { margin: 14px 0 0; color: #6f7c90; font-size: 12px; line-height: 1.6; }
.toast { position: fixed; right: 30px; bottom: 30px; z-index: 100; padding: 11px 16px; border-radius: 7px; color: #fff; background: #172033; box-shadow: 0 12px 30px rgba(23, 32, 51, .22); font-size: 13px; font-weight: 700; }

@media (max-width: 1180px) {
  .overview-band { grid-template-columns: 1fr; }
  .balance-overview { border-right: 0; border-bottom: 1px solid #e6ebf2; }
  .search-box { width: min(350px, 46%); }
}
@media (max-width: 820px) {
  .page-header, .section-toolbar { align-items: stretch; flex-direction: column; }
  .page-actions { justify-content: space-between; }
  .page-actions button { flex: 1; }
  .overview-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .overview-metrics div:nth-child(2) { border-right: 0; }
  .overview-metrics div:nth-child(-n+2) { border-bottom: 1px solid #edf1f6; }
  .workspace-tabs, .workspace-content { padding-right: 16px; padding-left: 16px; }
  .search-box { width: 100%; }
  .pagination-bar { align-items: flex-start; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
