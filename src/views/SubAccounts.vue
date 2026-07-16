<template>
  <div class="sub-page">
    <section class="sub-hero">
      <div>
        <p>{{ labels.accountCenter }}</p>
        <h2>{{ labels.subAccountManage }}</h2>
        <span>{{ labels.heroDesc }}</span>
      </div>
      <button v-if="!isSubAccount" class="primary-btn" type="button" @click="openCreate"><Plus :size="17" />{{ labels.addSub }}</button>
    </section>

    <section v-if="isSubAccount" class="sub-card no-permission-card">
      <div class="no-permission-icon"><ShieldAlert :size="23" :stroke-width="1.8" /></div>
      <h3>子账号无权管理子账号</h3>
      <p>子账号由主账号统一创建和管理。</p>
      <div class="sub-quota-view">
        <div><span>主账号分配总额度</span><strong>&yen;{{ formatMoney(subTotalQuotaYuan) }}</strong></div>
        <div><span>剩余可用额度</span><strong>&yen;{{ formatMoney(subRemainingQuotaYuan) }}</strong></div>
      </div>
    </section>

    <section v-if="!isSubAccount" class="sub-summary">
      <div><span>{{ labels.mainBalance }}</span><strong>&yen;{{ formatMoney(mainBalance) }}</strong></div>
      <div><span>{{ labels.subCount }}</span><strong>{{ accounts.length }}</strong></div>
      <div><span>{{ labels.totalQuota }}</span><strong>&yen;{{ formatMoney(totalQuota) }}</strong></div>
      <div><span>{{ labels.totalUsed }}</span><strong>&yen;{{ formatMoney(totalUsed) }}</strong></div>
    </section>

    <section v-if="!isSubAccount" class="sub-card">
      <div class="card-head">
        <div><h3>{{ labels.subList }}</h3><p>{{ labels.listDesc }}</p></div>
        <button class="ghost-btn" type="button" @click="loadList">{{ labels.refresh }}</button>
      </div>
      <div v-if="loading" class="empty-state">{{ labels.loading }}</div>
      <div v-else-if="!accounts.length" class="empty-state">{{ labels.empty }}</div>
      <div v-else class="account-list">
        <article v-for="item in accounts" :key="item.userId" class="account-row">
          <div class="account-main">
            <div class="account-avatar">{{ initial(item) }}</div>
            <div><h4>{{ item.nickName || item.userName }}</h4><p>{{ item.userName }}<span v-if="item.phonenumber"> · {{ item.phonenumber }}</span></p></div>
          </div>
          <div class="quota-block"><span>{{ labels.quota }}</span><strong>&yen;{{ formatMoney(item.subAccountQuota) }}</strong></div>
          <div class="quota-block"><span>{{ labels.used }}</span><strong>&yen;{{ formatMoney(item.subAccountUsed) }}</strong></div>
          <div class="quota-block remain"><span>{{ labels.remaining }}</span><strong>&yen;{{ formatMoney(remaining(item)) }}</strong></div>
          <div class="row-actions"><button type="button" @click="openRecords(item)">查询记录</button><button type="button" @click="openLogs(item)">流水</button><button type="button" @click="openQuota(item)">{{ labels.adjust }}</button><button class="danger" type="button" @click="remove(item)">{{ labels.delete }}</button></div>
        </article>
      </div>
    </section>

    <div v-if="dialogVisible && !isSubAccount" class="modal-mask" @click.self="closeDialog">
      <div class="modal-card">
        <div class="modal-head"><h3>{{ editing ? labels.adjustQuota : labels.addSub }}</h3><button type="button" aria-label="关闭" @click="closeDialog">×</button></div>
        <div class="form-grid">
          <label v-if="!editing">{{ labels.loginName }}<input v-model.trim="form.userName" :placeholder="labels.loginNamePlaceholder" /></label>
          <label v-if="!editing">{{ labels.nickName }}<input v-model.trim="form.nickName" :placeholder="labels.nickNamePlaceholder" /></label>
          <label v-if="!editing">{{ labels.phone }}<input v-model.trim="form.phonenumber" :placeholder="labels.optional" /></label>
          <label v-if="!editing">{{ labels.password }}<input v-model.trim="form.password" type="password" :placeholder="labels.passwordPlaceholder" /></label>
          <label>{{ labels.quotaYuan }}<input v-model.trim="form.subAccountQuota" type="number" min="0" step="0.01" placeholder="500" /></label>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
        <div class="modal-actions"><button type="button" class="ghost-btn" @click="closeDialog">{{ labels.cancel }}</button><button type="button" class="primary-btn" :disabled="saving" @click="submit">{{ saving ? labels.saving : labels.confirm }}</button></div>
      </div>
    </div>

    <div v-if="detailVisible && !isSubAccount" class="modal-mask detail-mask" @click.self="closeDetail">
      <div class="detail-card">
        <div class="modal-head detail-head">
          <div>
            <h3>{{ detailAccount?.nickName || detailAccount?.userName }} 的{{ detailType === 'records' ? '查询记录' : '账户流水' }}</h3>
            <p>{{ detailAccount?.userName }}</p>
          </div>
          <button type="button" aria-label="关闭" @click="closeDetail">×</button>
        </div>
        <div class="detail-tabs">
          <button :class="{ active: detailType === 'records' }" @click="switchDetail('records')">查询记录</button>
          <button :class="{ active: detailType === 'logs' }" @click="switchDetail('logs')">账户流水</button>
        </div>
        <div class="detail-body">
          <table v-if="detailType === 'records'" class="detail-table">
            <thead><tr><th>姓名</th><th>查询类型</th><th>手机号</th><th>提交时间</th><th>状态</th><th>订单号</th></tr></thead>
            <tbody>
              <tr v-if="detailLoading"><td colspan="6">正在加载...</td></tr>
              <tr v-else-if="!detailRows.length"><td colspan="6">暂无查询记录</td></tr>
              <tr v-for="row in detailRows" :key="row.id">
                <td><strong>{{ row.name || '-' }}</strong></td>
                <td>{{ getQueryTypeName(row.searchType) }}</td>
                <td>{{ maskPhone(row.phoneNumber) }}</td>
                <td>{{ formatDateTime(row.createTime) }}</td>
                <td><span class="status-pill" :class="statusClass(row.searchStatus, row.displayStatus)">{{ statusText(row.searchStatus, row.displayStatusText) }}</span></td>
                <td>{{ row.outTradeNo || '-' }}</td>
              </tr>
            </tbody>
          </table>
          <table v-else class="detail-table">
            <thead><tr><th>时间</th><th>订单/流水号</th><th>金额</th><th>类型</th><th>变动前</th><th>变动后</th><th>原因</th></tr></thead>
            <tbody>
              <tr v-if="detailLoading"><td colspan="7">正在加载...</td></tr>
              <tr v-else-if="!detailRows.length"><td colspan="7">暂无流水记录</td></tr>
              <tr v-for="row in detailRows" :key="row.id">
                <td>{{ formatDateTime(row.createdAt) }}</td>
                <td>{{ row.outTradeNo || '-' }}</td>
                <td :class="['amount', Number(row.changeCent) >= 0 ? 'plus' : 'minus']">{{ formatSignedFen(row.changeCent) }}</td>
                <td>{{ logTypeText(row.changeStyle) }}</td>
                <td>&yen;{{ yuanFromFen(row.beforeMoney) }}</td>
                <td>&yen;{{ yuanFromFen(row.afterMoney) }}</td>
                <td>{{ row.reason || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span>共 {{ detailTotal }} 条</span>
          <button class="ghost-btn" :disabled="detailPage.pageNum <= 1 || detailLoading" @click="changeDetailPage(-1)">上一页</button>
          <span>第 {{ detailPage.pageNum }} 页</span>
          <button class="ghost-btn" :disabled="detailRows.length < detailPage.pageSize || detailLoading" @click="changeDetailPage(1)">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, ShieldAlert } from '@lucide/vue'
import { createSubAccount, deleteSubAccount, listSubAccountLogs, listSubAccountRecords, listSubAccounts, updateSubAccountQuota } from '../api/subAccount'
import { getUserProfile } from '../api/user'
import { getUser, setUser } from '../utils/auth'
import { listQueryTypeConfig } from '../api/queryType'
import { formatDateTime, statusClass, statusText, yuanFromFen } from '../utils/format'

const labels = {
  accountCenter: '\u8d26\u6237\u4e2d\u5fc3',
  subAccountManage: '\u5b50\u8d26\u53f7\u7ba1\u7406',
  heroDesc: '\u7edf\u4e00\u7ba1\u7406\u5b50\u8d26\u53f7\u53ca\u53ef\u7528\u989d\u5ea6\u3002',
  addSub: '\u6dfb\u52a0\u5b50\u8d26\u53f7',
  mainBalance: '\u4e3b\u8d26\u53f7\u4f59\u989d',
  subCount: '\u5b50\u8d26\u53f7\u6570',
  totalQuota: '\u5df2\u5206\u914d\u989d\u5ea6',
  totalUsed: '\u5df2\u4f7f\u7528\u989d\u5ea6',
  subList: '\u5b50\u8d26\u53f7\u5217\u8868',
  listDesc: '\u67e5\u770b\u5b50\u8d26\u53f7\u989d\u5ea6\u3001\u67e5\u8be2\u8bb0\u5f55\u548c\u8d26\u6237\u6d41\u6c34\u3002',
  refresh: '\u5237\u65b0',
  loading: '\u6b63\u5728\u52a0\u8f7d\u5b50\u8d26\u53f7...',
  empty: '\u6682\u65e0\u5b50\u8d26\u53f7',
  quota: '\u53ef\u7528\u989d\u5ea6',
  used: '\u5df2\u4f7f\u7528',
  remaining: '\u5269\u4f59\u989d\u5ea6',
  adjust: '\u8c03\u989d\u5ea6',
  delete: '\u5220\u9664',
  adjustQuota: '\u8c03\u6574\u5b50\u8d26\u53f7\u989d\u5ea6',
  loginName: '\u767b\u5f55\u8d26\u53f7',
  loginNamePlaceholder: '\u8bf7\u8f93\u5165\u767b\u5f55\u8d26\u53f7',
  nickName: '\u6635\u79f0',
  nickNamePlaceholder: '\u8bf7\u8f93\u5165\u6635\u79f0',
  phone: '\u624b\u673a\u53f7',
  optional: '\u8bf7\u8f93\u5165\u624b\u673a\u53f7',
  password: '\u521d\u59cb\u5bc6\u7801',
  passwordPlaceholder: '\u8bf7\u8f93\u5165\u521d\u59cb\u5bc6\u7801',
  quotaYuan: '\u53ef\u4f7f\u7528\u989d\u5ea6\uff08\u5143\uff09',
  cancel: '\u53d6\u6d88',
  confirm: '\u786e\u8ba4',
  saving: '\u63d0\u4ea4\u4e2d...',
  inputLogin: '\u8bf7\u8f93\u5165\u767b\u5f55\u8d26\u53f7',
  inputPassword: '\u8bf7\u8f93\u5165\u521d\u59cb\u5bc6\u7801',
  inputQuota: '\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u989d\u5ea6',
  submitFail: '\u63d0\u4ea4\u5931\u8d25',
  deleteConfirmPrefix: '\u786e\u5b9a\u5220\u9664\u5b50\u8d26\u53f7\u300c',
  deleteConfirmSuffix: '\u300d\u5417\uff1f',
  defaultInitial: '\u5b50'
}

const profile = ref(getUser() || {})
const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))
const accounts = ref([])
const mainBalance = ref(0)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref(null)
const message = ref('')
const form = reactive({ userName: '', nickName: '', phonenumber: '', password: '', subAccountQuota: '' })
const queryTypeMap = ref({})
const detailVisible = ref(false)
const detailType = ref('records')
const detailAccount = ref(null)
const detailRows = ref([])
const detailTotal = ref(0)
const detailLoading = ref(false)
const detailPage = reactive({ pageNum: 1, pageSize: 8 })
const subTotalQuotaYuan = computed(() => Number(profile.value?.subAccountQuota || 0) / 100)
const subRemainingQuotaYuan = computed(() => Math.max(0, (Number(profile.value?.subAccountQuota || 0) - Number(profile.value?.subAccountUsed || 0)) / 100))
const totalQuota = computed(() => accounts.value.reduce((sum, item) => sum + Number(item.subAccountQuota || 0), 0))
const totalUsed = computed(() => accounts.value.reduce((sum, item) => sum + Number(item.subAccountUsed || 0), 0))

function formatMoney(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function remaining(item) { return Math.max(0, Number(item.subAccountQuota || 0) - Number(item.subAccountUsed || 0)) }
function initial(item) { return String(item.nickName || item.userName || labels.defaultInitial).slice(0, 1) }

function maskPhone(value) {
  if (!value) return '-'
  const s = String(value)
  if (s.length !== 11) return s
  return `${s.slice(0, 3)}****${s.slice(-4)}`
}
function getQueryTypeName(id) {
  return queryTypeMap.value[String(id)] || id || '-'
}
function logTypeText(value) {
  const s = String(value ?? '')
  if (s === '1' || s === '5') return '充值'
  if (s === '2') return '扣费'
  if (s === '4') return '退款'
  return s || '-'
}
function formatSignedFen(value) {
  const n = Number(value || 0)
  const prefix = n > 0 ? '+' : n < 0 ? '-' : ''
  return `${prefix}¥${yuanFromFen(Math.abs(n))}`
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
async function loadList() {
  loading.value = true
  try {
    const res = await listSubAccounts()
    accounts.value = res.data || []
    mainBalance.value = res.mainBalance || 0
  } finally { loading.value = false }
}
function resetForm() {
  form.userName = ''
  form.nickName = ''
  form.phonenumber = ''
  form.password = ''
  form.subAccountQuota = ''
  message.value = ''
}
function openCreate() { if (isSubAccount.value) return; editing.value = null; resetForm(); dialogVisible.value = true }
function openQuota(item) { if (isSubAccount.value) return; editing.value = item; resetForm(); form.subAccountQuota = item.subAccountQuota || 0; dialogVisible.value = true }
function closeDialog() { dialogVisible.value = false; editing.value = null; resetForm() }
async function submit() {
  message.value = ''
  if (!editing.value && !form.userName) return (message.value = labels.inputLogin)
  if (!editing.value && !form.password) return (message.value = labels.inputPassword)
  if (form.subAccountQuota === '' || Number(form.subAccountQuota) < 0) return (message.value = labels.inputQuota)
  saving.value = true
  try {
    if (editing.value) await updateSubAccountQuota(editing.value.userId, { subAccountQuota: form.subAccountQuota })
    else await createSubAccount({ ...form })
    closeDialog()
    await loadList()
  } catch (err) {
    message.value = err.msg || err.message || labels.submitFail
  } finally { saving.value = false }
}
async function remove(item) {
  const name = item.nickName || item.userName
  if (!window.confirm(`${labels.deleteConfirmPrefix}${name}${labels.deleteConfirmSuffix}`)) return
  await deleteSubAccount(item.userId)
  await loadList()
}

function openRecords(item) {
  detailAccount.value = item
  detailType.value = 'records'
  detailPage.pageNum = 1
  detailVisible.value = true
  loadDetail()
}
function openLogs(item) {
  detailAccount.value = item
  detailType.value = 'logs'
  detailPage.pageNum = 1
  detailVisible.value = true
  loadDetail()
}
function switchDetail(type) {
  if (detailType.value === type) return
  detailType.value = type
  detailPage.pageNum = 1
  loadDetail()
}
function closeDetail() {
  detailVisible.value = false
  detailAccount.value = null
  detailRows.value = []
  detailTotal.value = 0
}
async function loadDetail() {
  if (!detailAccount.value) return
  detailLoading.value = true
  try {
    const params = { pageNum: detailPage.pageNum, pageSize: detailPage.pageSize }
    const res = detailType.value === 'records'
      ? await listSubAccountRecords(detailAccount.value.userId, params)
      : await listSubAccountLogs(detailAccount.value.userId, params)
    detailRows.value = res.rows || []
    detailTotal.value = res.total || 0
  } finally {
    detailLoading.value = false
  }
}
function changeDetailPage(delta) {
  detailPage.pageNum += delta
  loadDetail()
}
onMounted(async () => {
  await Promise.all([loadQueryTypes(), loadList()])
})
</script>

<style scoped>
.sub-page { width: min(1480px, 100%); margin: 0 auto; display: grid; gap: 16px; }
.no-permission-card { padding: 52px 40px; text-align: center; color: #52627a; }
.no-permission-card h3 { margin: 14px 0 8px; color: #07162d; font-size: 24px; }
.no-permission-card p { margin: 0 auto; max-width: 560px; line-height: 1.8; }
.no-permission-icon { width: 52px; height: 52px; margin: 0 auto; border-radius: 8px; display: grid; place-items: center; color: #2168f3; background: #eaf2ff; font-size: 24px; font-weight: 900; }
.sub-quota-view { margin: 26px auto 0; max-width: 560px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; text-align: left; }
.sub-quota-view div { padding: 18px 20px; border: 1px solid #e4ebf5; border-radius: 8px; background: #f8fbff; }
.sub-quota-view span { display: block; color: #66758c; font-size: 14px; }
.sub-quota-view strong { display: block; margin-top: 8px; color: #07162d; font-size: 24px; }
.sub-quota-view div:last-child strong { color: #0b9f62; }
.sub-hero { min-height: 104px; padding: 22px 24px; border: 1px solid var(--line); border-radius: 8px; color: #101828; background: #fff; box-shadow: var(--shadow-panel); display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.sub-hero p { margin: 0 0 6px; color: #2f6fe4; font-size: 13px; font-weight: 700; }
.sub-hero h2 { margin: 0; font-size: 24px; letter-spacing: 0; }
.sub-hero span { display: block; margin-top: 8px; color: var(--muted); font-size: 14px; }
.primary-btn, .ghost-btn { border: 0; border-radius: 7px; font-weight: 700; cursor: pointer; }
.primary-btn { min-height: 42px; background: #2168f3; color: #fff; padding: 0 18px; box-shadow: none; }
.primary-btn:disabled { opacity: .55; cursor: not-allowed; }
.ghost-btn { background: #f4f7fb; color: #2168f3; padding: 10px 16px; border: 1px solid #dce6f5; }
.sub-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.sub-summary > div, .sub-card { background: #fff; border: 1px solid var(--line); border-radius: 8px; box-shadow: none; }
.sub-summary > div { padding: 18px 20px; }
.sub-summary span, .quota-block span { color: #66758c; font-size: 14px; }
.sub-summary strong { display: block; margin-top: 8px; font-size: 24px; color: #07162d; }
.sub-card { overflow: hidden; }
.card-head { min-height: 68px; padding: 14px 20px; border-bottom: 1px solid #edf1f7; display: flex; align-items: center; justify-content: space-between; }
.card-head h3 { margin: 0; font-size: 18px; }
.card-head p { margin: 8px 0 0; color: #66758c; }
.empty-state { padding: 70px 20px; text-align: center; color: #7b8aa0; }
.account-row { min-height: 88px; padding: 16px 20px; border-bottom: 1px solid #edf1f7; display: grid; grid-template-columns: minmax(220px, 1.35fr) repeat(3, 130px) minmax(280px, auto); gap: 16px; align-items: center; }
.account-row:last-child { border-bottom: 0; }
.account-main { display: flex; align-items: center; gap: 14px; }
.account-avatar { width: 44px; height: 44px; border-radius: 8px; display: grid; place-items: center; background: #eaf2ff; color: #2168f3; font-size: 18px; font-weight: 800; }
.account-main h4 { margin: 0 0 6px; font-size: 18px; }
.account-main p { margin: 0; color: #6c7a91; }
.quota-block strong { display: block; margin-top: 6px; color: #07162d; font-size: 20px; }
.quota-block.remain strong { color: #0b9f62; }
.row-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
.row-actions button { min-height: 34px; border: 1px solid #dbe6f6; background: #fff; color: #2168f3; border-radius: 6px; padding: 0 11px; font-weight: 700; cursor: pointer; }
.row-actions .danger { color: #e24a4a; background: #fff7f7; border-color: #ffdada; }
.modal-mask { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; background: rgba(10, 24, 48, .38); }
.modal-card { width: min(560px, calc(100vw - 40px)); background: #fff; border-radius: 8px; box-shadow: 0 28px 80px rgba(10, 24, 48, .24); }
.modal-head { padding: 22px 26px; border-bottom: 1px solid #edf1f7; display: flex; justify-content: space-between; align-items: center; }
.modal-head h3 { margin: 0; font-size: 22px; }
.modal-head button { border: 0; background: transparent; font-size: 28px; cursor: pointer; color: #77859a; }
.form-grid { padding: 24px 26px 8px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.form-grid label { display: grid; gap: 9px; color: #24344d; font-weight: 800; }
.form-grid input { height: 42px; border: 1px solid #dbe3ef; border-radius: 9px; padding: 0 12px; font-size: 15px; outline: none; }
.form-grid input:focus { border-color: #2168f3; box-shadow: 0 0 0 3px rgba(33,104,243,.12); }
.form-message { margin: 6px 26px 0; color: #e24a4a; }
.modal-actions { padding: 22px 26px 26px; display: flex; justify-content: flex-end; gap: 12px; }

.detail-mask { place-items: end center; padding: 34px; }
.detail-card { width: min(1180px, calc(100vw - 72px)); max-height: calc(100vh - 80px); background: #fff; border-radius: 8px; box-shadow: 0 30px 90px rgba(10,24,48,.26); display: grid; grid-template-rows: auto auto 1fr auto; overflow: hidden; }
.detail-tabs { padding: 14px 22px; border-bottom: 1px solid #edf1f7; display: flex; gap: 10px; }
.detail-tabs button { height: 38px; padding: 0 18px; border-radius: 6px; border: 1px solid #dbe6f6; background: #fff; color: #64748b; font-weight: 700; cursor: pointer; }
.detail-tabs .active { color: #2168f3; border-color: #2168f3; background: #eef5ff; }
.detail-body { overflow: auto; padding: 0 22px; }
.detail-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.detail-table th { position: sticky; top: 0; background: #f6f8fb; color: #52627a; text-align: left; padding: 14px 12px; border-bottom: 1px solid #e5ebf4; white-space: nowrap; }
.detail-table td { padding: 15px 12px; border-bottom: 1px solid #edf1f7; color: #17233c; vertical-align: top; }
.status-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 800; background: #eef4ff; color: #2168f3; white-space: nowrap; }
.status-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.status-pill.success { background: #e8f8ef; color: #0b9f62; }
.status-pill.warning { background: #fff4df; color: #d67a00; }
.status-pill.danger { background: #ffecec; color: #df3f3f; }
.amount { font-weight: 900; }
.amount.plus { color: #0b9f62; }
.amount.minus { color: #df3f3f; }
.pager { padding: 16px 22px; display: flex; justify-content: flex-end; align-items: center; gap: 12px; border-top: 1px solid #edf1f7; color: #64748b; }
@media (max-width: 1180px) { .account-row { grid-template-columns: 1fr 1fr; } .row-actions { justify-content: flex-start; } .sub-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 720px) { .sub-quota-view, .sub-summary, .form-grid { grid-template-columns: 1fr; } .sub-hero { align-items: stretch; flex-direction: column; } .detail-mask { padding: 12px; } .detail-card { width: 100%; max-height: calc(100vh - 24px); } }
</style>




