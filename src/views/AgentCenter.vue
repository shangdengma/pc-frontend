<template>
  <div class="agent-page">
    <section class="agent-hero">
      <div class="hero-copy">
        <p>代理中心</p>
        <h2>邀请码与客户运营</h2>
        <span>统一管理邀请码及邀请客户数据。</span>
      </div>
      <div class="hero-actions">
        <button class="soft-btn" type="button" @click="loadAll">刷新数据</button>
        <button class="primary-btn" type="button" :disabled="!isAgent" @click="openCreate">生成邀请码</button>
      </div>
    </section>

    <section v-if="!isAgent && !loading" class="agent-card no-permission">
      <div class="empty-icon">代</div>
      <h3>当前账号不是代理账号</h3>
      <p>代理功能仅向已授权账号开放，请联系平台管理员。</p>
    </section>

    <template v-else>
      <section class="agent-summary">
        <article class="summary-card">
          <span>邀请码</span>
          <strong>{{ inviteCodes.length }}</strong>
          <em>{{ enabledCodes }} 个启用中</em>
        </article>
        <article class="summary-card">
          <span>邀请客户</span>
          <strong>{{ customers.length }}</strong>
          <em>通过有效邀请码注册</em>
        </article>
        <article class="summary-card">
          <span>客户累计充值</span>
          <strong>&yen;{{ money(totalRecharge) }}</strong>
          <em>在线充值和后台充值合计</em>
        </article>
        <article class="summary-card">
          <span>客户累计消费</span>
          <strong>&yen;{{ money(totalConsume) }}</strong>
          <em>被邀请客户背调消费</em>
        </article>
      </section>

      <section class="agent-workspace">
        <aside class="agent-card invite-panel">
          <div class="card-head compact-head">
            <div>
              <h3>邀请码</h3>
            </div>
            <button class="text-btn" type="button" @click="openCreate">新增</button>
          </div>

          <div v-if="loading" class="empty-state">正在加载...</div>
          <div v-else-if="!inviteCodes.length" class="empty-state">
            <strong>暂无邀请码</strong>
            <span>点击右上角“新增”创建第一个邀请码。</span>
          </div>
          <div v-else class="invite-list">
            <article v-for="item in inviteCodes" :key="item.id" class="invite-row" :class="{ disabled: item.status !== 0 }">
              <div class="invite-main">
                <div class="invite-code-line">
                  <strong>{{ item.inviteCode }}</strong>
                  <span :class="['status-pill', item.status === 0 ? 'ok' : 'off']">{{ item.status === 0 ? '启用' : '停用' }}</span>
                </div>
                <p>注册送 &yen;{{ money(item.giftAmount) }}，{{ usageText(item) }}</p>
                <small>{{ item.expireTime ? formatTime(item.expireTime) + ' 过期' : '长期有效' }}</small>
              </div>
              <div class="invite-actions">
                <button type="button" @click="copyCode(item.inviteCode)">复制</button>
                <button type="button" @click="openEdit(item)">编辑</button>
                <button type="button" :class="item.status === 0 ? 'danger-link' : ''" @click="toggleStatus(item)">{{ item.status === 0 ? '停用' : '启用' }}</button>
              </div>
            </article>
          </div>
        </aside>

        <section class="agent-card customer-panel">
          <div class="card-head customer-head">
            <div>
              <h3>邀请客户</h3>
            </div>
            <label class="search-box">
              <Search :size="17" :stroke-width="1.8" />
              <input v-model.trim="customerKeyword" placeholder="搜索客户、手机号、账号" />
            </label>
          </div>

          <div v-if="loading" class="empty-state large">正在加载...</div>
          <div v-else-if="!filteredCustomers.length" class="empty-state large">
            <strong>暂无匹配客户</strong>
            <span>{{ customers.length ? '换个关键词再试试。' : '有客户通过邀请码注册后会出现在这里。' }}</span>
          </div>
          <div v-else class="customer-layout">
            <div class="customer-list">
              <button
                v-for="item in filteredCustomers"
                :key="item.invitedUserId"
                type="button"
                class="customer-row"
                :class="{ active: selectedCustomer?.invitedUserId === item.invitedUserId }"
                @click="selectCustomer(item)"
              >
                <span class="customer-avatar">{{ avatarText(item) }}</span>
                <span class="customer-info">
                  <strong>{{ item.nickName || item.userName || '-' }}</strong>
                  <em>{{ item.phonenumber || item.userName || '-' }}</em>
                </span>
                <span class="customer-money">
                  <strong>&yen;{{ money(item.rechargeAmount) }}</strong>
                  <em>充值</em>
                </span>
              </button>
            </div>

            <div class="customer-detail">
              <template v-if="selectedCustomer">
                <div class="detail-top">
                  <div>
                    <h4>{{ selectedCustomer.nickName || selectedCustomer.userName || '-' }}</h4>
                    <p>{{ selectedCustomer.enterpriseName || selectedCustomer.userName || '未填写企业名称' }}</p>
                  </div>
                  <span>{{ formatTime(selectedCustomer.invitedAt) }}</span>
                </div>

                <div class="detail-stats">
                  <div><span>累计充值</span><strong>&yen;{{ money(selectedCustomer.rechargeAmount) }}</strong></div>
                  <div><span>累计消费</span><strong>&yen;{{ money(selectedCustomer.consumeAmount) }}</strong></div>
                </div>

                <div class="detail-tabs">
                  <button type="button" :class="{ active: detailType === 'recharge' }" @click="changeDetailType('recharge')">充值流水</button>
                  <button type="button" :class="{ active: detailType === 'consume' }" @click="changeDetailType('consume')">消费流水</button>
                </div>

                <div class="ledger-box">
                  <div v-if="detailLoading" class="mini-empty">正在加载流水...</div>
                  <div v-else-if="!detailRows.length" class="mini-empty">暂无{{ detailType === 'recharge' ? '充值' : '消费' }}流水</div>
                  <table v-else class="ledger-table">
                    <thead>
                      <tr><th>时间</th><th>金额</th><th>原因</th><th>流水号</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in detailRows" :key="row.id">
                        <td>{{ formatTime(row.createdAt) }}</td>
                        <td>&yen;{{ money(row.changeAmount) }}</td>
                        <td>{{ row.reason || '-' }}</td>
                        <td>{{ row.outTradeNo || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <div v-else class="empty-state large">请选择一个客户</div>
            </div>
          </div>
        </section>
      </section>
    </template>

    <div v-if="codeDialog" class="modal-mask" @click.self="closeCodeDialog">
      <div class="modal-card agent-modal">
        <div class="modal-head">
          <div>
            <h3>{{ editingCode ? '调整邀请码' : '生成邀请码' }}</h3>
            <p>{{ editingCode ? '修改后仅影响后续注册使用。' : '创建后可复制给客户注册使用。' }}</p>
          </div>
          <button type="button" aria-label="关闭" @click="closeCodeDialog">x</button>
        </div>

        <div class="notice-tip">
          注册赠送余额会优先从代理账户扣除；如果代理余额不足，新用户将不会获得赠送余额。
        </div>

        <div class="form-grid">
          <label>赠送余额（元）<input v-model.trim="codeForm.giftAmount" type="number" min="0" step="0.01" placeholder="例如 50" /></label>
          <label>最大使用次数<input v-model.trim="codeForm.maxUses" type="number" min="0" step="1" placeholder="0 表示不限" /></label>
          <label>过期时间<input v-model="codeForm.expireTime" type="datetime-local" /></label>
          <label>备注<input v-model.trim="codeForm.remark" placeholder="例如 7月活动渠道" /></label>
        </div>

        <p v-if="message" class="form-message">{{ message }}</p>
        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="closeCodeDialog">取消</button>
          <button class="primary-btn" type="button" :disabled="saving" @click="saveCode">{{ saving ? '提交中...' : '确认保存' }}</button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Search } from '@lucide/vue'
import { createAgentInviteCode, getAgentOverview, listAgentCustomerConsumptions, listAgentCustomerRecharges, listAgentCustomers, listAgentInviteCodes, updateAgentInviteCode } from '../api/agent'

const isAgent = ref(true)
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const toast = ref('')
const inviteCodes = ref([])
const customers = ref([])
const customerKeyword = ref('')
const codeDialog = ref(false)
const editingCode = ref(null)
const detailLoading = ref(false)
const detailType = ref('recharge')
const selectedCustomer = ref(null)
const detailRows = ref([])
const codeForm = reactive({ giftAmount: '', maxUses: 0, expireTime: '', remark: '' })

const enabledCodes = computed(() => inviteCodes.value.filter(item => item.status === 0).length)
const totalRecharge = computed(() => customers.value.reduce((sum, item) => sum + Number(item.rechargeAmount || 0), 0))
const totalConsume = computed(() => customers.value.reduce((sum, item) => sum + Number(item.consumeAmount || 0), 0))
const filteredCustomers = computed(() => {
  const keyword = customerKeyword.value.toLowerCase()
  if (!keyword) return customers.value
  return customers.value.filter(item => [item.nickName, item.userName, item.phonenumber, item.enterpriseName]
    .filter(Boolean)
    .some(text => String(text).toLowerCase().includes(keyword)))
})

watch(filteredCustomers, list => {
  if (!list.length) {
    selectedCustomer.value = null
    detailRows.value = []
    return
  }
  if (!selectedCustomer.value || !list.some(item => item.invitedUserId === selectedCustomer.value.invitedUserId)) {
    selectCustomer(list[0], false)
  }
})

function money(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    await getAgentOverview()
    const [codeRes, customerRes] = await Promise.all([listAgentInviteCodes(), listAgentCustomers()])
    inviteCodes.value = codeRes.data || []
    customers.value = customerRes.data || []
    isAgent.value = true
    if (filteredCustomers.value.length) selectCustomer(filteredCustomers.value[0], false)
  } catch (err) {
    if (err && err.code && err.code !== 200) isAgent.value = false
  } finally {
    loading.value = false
  }
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
async function selectCustomer(item, showLoading = true) {
  selectedCustomer.value = item
  await loadCustomerLedger(detailType.value, showLoading)
}
async function changeDetailType(type) {
  detailType.value = type
  await loadCustomerLedger(type, true)
}
async function loadCustomerLedger(type, showLoading = true) {
  if (!selectedCustomer.value) return
  if (showLoading) detailLoading.value = true
  detailRows.value = []
  try {
    const res = type === 'recharge'
      ? await listAgentCustomerRecharges(selectedCustomer.value.invitedUserId)
      : await listAgentCustomerConsumptions(selectedCustomer.value.invitedUserId)
    detailRows.value = res.data || []
  } finally {
    detailLoading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.agent-page { max-width: 1480px; margin: 0 auto; color: #0f172a; }
.agent-hero { min-height: 104px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 22px 24px; color: #101828; background: #fff; border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow-panel); }
.hero-copy p { margin: 0 0 6px; color: #2f6fe4; font-size: 13px; font-weight: 700; }
.hero-copy h2 { margin: 0 0 8px; font-size: 24px; line-height: 1.2; }
.hero-copy span { color: var(--muted); font-size: 14px; }
.hero-actions { display: flex; gap: 12px; flex-shrink: 0; }
.primary-btn, .soft-btn, .ghost-btn, .text-btn { height: 40px; padding: 0 16px; border-radius: 7px; font-weight: 700; border: 0; cursor: pointer; }
.primary-btn { color: #fff; background: #2f6fe4; box-shadow: none; }
.primary-btn:disabled { opacity: .55; cursor: not-allowed; }
.soft-btn { color: #344054; background: #fff; border: 1px solid #dbe3ee; }
.ghost-btn { color: #2563d8; background: #fff; border: 1px solid #dbe6f4; box-shadow: none; }
.text-btn { height: 36px; color: #2563d8; background: #eef5ff; }
.agent-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin: 16px 0; }
.summary-card, .agent-card { background: #fff; border: 1px solid #e6edf6; border-radius: 8px; box-shadow: none; }
.summary-card { padding: 18px 20px; }
.summary-card span { display: block; color: #64748b; margin-bottom: 10px; font-weight: 700; }
.summary-card strong { display: block; font-size: 24px; line-height: 1.2; }
.summary-card em { display: block; margin-top: 8px; color: #64748b; font-style: normal; font-size: 13px; }
.agent-workspace { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 16px; align-items: start; }
.agent-card { padding: 20px; }
.card-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 18px; }
.card-head h3 { margin: 0 0 6px; font-size: 18px; }
.card-head p { margin: 0; color: #64748b; line-height: 1.55; }
.compact-head p { max-width: 310px; }
.empty-state { min-height: 176px; display: grid; place-items: center; align-content: center; gap: 8px; color: #64748b; border: 1px dashed #d7e3f2; border-radius: 8px; background: #fbfdff; text-align: center; }
.empty-state strong { color: #334155; }
.empty-state.large { min-height: 360px; }
.invite-list { display: grid; gap: 12px; }
.invite-row { display: grid; gap: 12px; padding: 14px; border: 1px solid #e7eef8; border-radius: 8px; background: #fff; }
.invite-row.disabled { opacity: .72; }
.invite-code-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.invite-code-line strong { font-size: 18px; letter-spacing: .04em; }
.invite-main p { margin: 8px 0 5px; color: #334155; }
.invite-main small { color: #64748b; }
.status-pill { flex-shrink: 0; padding: 4px 10px; border-radius: 999px; font-weight: 800; font-size: 13px; }
.status-pill.ok { color: #087443; background: #e9f9f2; }
.status-pill.off { color: #64748b; background: #eef2f6; }
.invite-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.invite-actions button { height: 34px; border: 1px solid #d9e5f4; color: #2563d8; background: #fff; border-radius: 6px; font-weight: 700; cursor: pointer; }
.invite-actions .danger-link { color: #dc2626; }
.customer-head { align-items: center; }
.search-box { width: min(360px, 42%); height: 40px; display: flex; align-items: center; gap: 10px; padding: 0 12px; border: 1px solid #d9e5f4; border-radius: 7px; background: #fff; color: #94a3b8; }
.search-box svg { width: 18px; height: 18px; flex-shrink: 0; }
.search-box input { width: 100%; border: 0; outline: 0; background: transparent; color: #0f172a; font-weight: 700; }
.customer-layout { display: grid; grid-template-columns: minmax(300px, .72fr) minmax(0, 1.28fr); gap: 14px; }
.customer-list { display: grid; gap: 10px; max-height: 610px; overflow: auto; padding-right: 4px; }
.customer-row { width: 100%; display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e7eef8; border-radius: 8px; background: #fff; text-align: left; cursor: pointer; }
.customer-row.active { border-color: #7aa7ff; background: #f4f8ff; box-shadow: inset 3px 0 0 #2f6fe4; }
.customer-avatar { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 8px; color: #1d4ed8; background: #eaf2ff; font-weight: 800; }
.customer-info, .customer-money { display: grid; gap: 4px; }
.customer-info strong, .customer-money strong { color: #0f172a; }
.customer-info em, .customer-money em { color: #64748b; font-style: normal; font-size: 13px; }
.customer-money { text-align: right; }
.customer-detail { min-height: 610px; border: 1px solid #e7eef8; border-radius: 8px; background: #fbfdff; padding: 16px; }
.detail-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #e7eef8; }
.detail-top h4 { margin: 0 0 6px; font-size: 20px; }
.detail-top p { margin: 0; color: #64748b; }
.detail-top span { color: #64748b; white-space: nowrap; }
.detail-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 16px 0; }
.detail-stats div { padding: 14px; border-radius: 8px; background: #fff; border: 1px solid #e7eef8; }
.detail-stats span { display: block; color: #64748b; margin-bottom: 8px; }
.detail-stats strong { font-size: 22px; }
.detail-tabs { display: flex; padding: 3px; border-radius: 8px; background: #eef4fb; margin-bottom: 12px; }
.detail-tabs button { flex: 1; height: 36px; border: 0; border-radius: 6px; background: transparent; color: #64748b; font-weight: 700; cursor: pointer; }
.detail-tabs button.active { color: #1d4ed8; background: #fff; box-shadow: 0 6px 16px rgba(33, 54, 91, .08); }
.ledger-box { overflow: auto; border: 1px solid #e7eef8; border-radius: 8px; background: #fff; }
.ledger-table { width: 100%; border-collapse: collapse; min-width: 620px; }
.ledger-table th { padding: 13px 12px; background: #f5f8fc; color: #5b6b83; text-align: left; font-size: 13px; }
.ledger-table td { padding: 13px 12px; border-top: 1px solid #edf2f8; color: #334155; }
.mini-empty { min-height: 188px; display: grid; place-items: center; color: #64748b; }
.no-permission { margin-top: 24px; padding: 42px; text-align: center; }
.empty-icon { width: 52px; height: 52px; display: grid; place-items: center; margin: 0 auto 16px; border-radius: 8px; background: #eaf2ff; color: #2563d8; font-size: 22px; font-weight: 800; }
.no-permission h3 { margin: 0 0 8px; }
.no-permission p { margin: 0; color: #64748b; }
.modal-mask { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; background: rgba(15, 23, 42, .48); }
.modal-card { width: min(720px, calc(100vw - 48px)); padding: 24px; background: #fff; border-radius: 8px; box-shadow: 0 28px 80px rgba(15, 23, 42, .26); }
.modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid #e6edf6; }
.modal-head h3 { margin: 0 0 6px; font-size: 20px; }
.modal-head p { margin: 0; color: #64748b; }
.modal-head button { width: 34px; height: 34px; border: 0; background: #f2f5fa; border-radius: 6px; font-size: 20px; cursor: pointer; }
.notice-tip { margin-bottom: 18px; padding: 12px 14px; border-left: 3px solid #2f6fe4; background: #f4f8ff; color: #1e40af; line-height: 1.55; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 20px; }
.form-grid label { display: grid; gap: 8px; color: #344054; font-weight: 800; }
.form-grid input { height: 44px; padding: 0 13px; border: 1px solid #d7e1ee; border-radius: 7px; outline: none; font-weight: 600; }
.form-grid input:focus { border-color: #78a6ff; box-shadow: 0 0 0 3px rgba(47, 111, 228, .12); }
.form-message { padding: 12px 14px; color: #d92d20; background: #fff2f1; border: 1px solid #ffd5d2; border-radius: 10px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.toast { position: fixed; right: 34px; bottom: 34px; z-index: 100; padding: 12px 18px; color: #fff; background: #0f172a; border-radius: 8px; box-shadow: 0 12px 32px rgba(15, 23, 42, .24); font-weight: 700; }
@media (max-width: 1280px) {
  .agent-workspace { grid-template-columns: 1fr; }
  .customer-layout { grid-template-columns: 1fr; }
  .customer-detail { min-height: auto; }
}
@media (max-width: 980px) {
  .agent-hero, .card-head, .customer-head { flex-direction: column; align-items: stretch; }
  .hero-actions { width: 100%; }
  .hero-actions button { flex: 1; }
  .agent-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .search-box { width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
