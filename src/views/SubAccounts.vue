<template>
  <div class="sub-page">
    <header class="page-head">
      <div class="page-head-main">
        <p class="page-head-eyebrow">企业管理</p>
        <h2>{{ labels.subAccountManage }}</h2>
        <p class="page-head-desc">{{ labels.heroDesc }}</p>
      </div>
      <button v-if="!isSubAccount" class="primary-btn" type="button" @click="openCreate"><Plus :size="17" />{{ labels.addSub }}</button>
    </header>

    <!-- 页面级提示：停用与启用在列表上直接触发，结果需要在列表上方反馈。 -->
    <div v-if="pageMessage" class="form-message" :class="pageMessageType">{{ pageMessage }}</div>

    <section v-if="isSubAccount" class="sub-card no-permission-card">
      <div class="no-permission-icon"><ShieldAlert :size="23" :stroke-width="1.8" /></div>
      <h3>子账号无权管理子账号</h3>
      <p>子账号由主账号统一创建和管理。</p>
      <div class="sub-quota-view">
        <div><span>主账号分配总额度</span><strong>&yen;{{ formatMoney(subTotalQuotaYuan) }}</strong></div>
        <div><span>已消费额度</span><strong>&yen;{{ formatMoney(subUsedQuotaYuan) }}</strong></div>
        <div><span>剩余可用额度</span><strong>&yen;{{ formatMoney(subRemainingQuotaYuan) }}</strong></div>
      </div>
    </section>

    <section v-if="!isSubAccount" class="sub-summary">
      <div><span>{{ labels.mainBalance }}</span><strong>&yen;{{ formatMoney(mainBalance) }}</strong></div>
      <div><span>{{ labels.subCount }}</span><strong>{{ activeAccounts.length }} / {{ accounts.length }}</strong></div>
      <div><span>{{ labels.totalQuota }}</span><strong>&yen;{{ formatMoney(totalQuota) }}</strong></div>
      <div><span>{{ labels.totalUsed }}</span><strong>&yen;{{ formatMoney(totalUsed) }}</strong></div>
    </section>

    <section v-if="!isSubAccount" class="sub-card">
      <div class="card-head">
        <div><h3>{{ labels.subList }}</h3><p>{{ labels.listDesc }}</p></div>
      </div>
      <div v-if="loading" class="empty-state">{{ labels.loading }}</div>
      <div v-else-if="!accounts.length" class="empty-state">{{ labels.empty }}</div>
      <!-- 原先是 div 列表：76px 行高、没有表头，三个额度各自带标签重复出现，
           跟查询记录、资金流水那几页完全不是一套。改成表格后列义由表头承担，
           行内不再重复「已分配/已消费/剩余」，样式跟着全局 .data-table 走。 -->
      <div v-else class="sub-table-wrap">
        <table class="data-table sub-table">
          <thead>
            <tr>
              <th>子账号</th>
              <th>状态</th>
              <th class="numeric">{{ labels.quota }}</th>
              <th class="numeric">{{ labels.used }}</th>
              <th class="numeric">{{ labels.remaining }}</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
        <tr v-for="item in accounts" :key="item.userId" :class="{ disabled: isAccountDisabled(item) }">
          <td data-label="子账号">
            <div class="account-main">
            <div class="account-avatar">{{ initial(item) }}</div>
            <div>
              <h4>{{ item.nickName || item.userName }}</h4>
              <p>{{ item.userName }}<span v-if="item.phonenumber"> · {{ item.phonenumber }}</span></p>
            </div>
          </div>
          </td>
          <td data-label="状态"><span class="account-status" :class="{ disabled: isAccountDisabled(item) }">{{ isAccountDisabled(item) ? labels.disabled : labels.enabled }}</span></td>
          <td :data-label="labels.quota" class="numeric">&yen;{{ formatMoney(item.subAccountQuota) }}</td>
          <td :data-label="labels.used" class="numeric">&yen;{{ formatMoney(item.subAccountUsed) }}</td>
          <td :data-label="labels.remaining" class="numeric remain">&yen;{{ formatMoney(remaining(item)) }}</td>
          <td data-label="操作" class="row-actions">
            <button type="button" @click="openRecords(item)">查询记录</button>
            <button type="button" @click="openLogs(item)">流水</button>
            <button v-if="!isAccountDisabled(item)" class="primary-action-btn" type="button" @click="openQuota(item)">{{ labels.adjust }}</button>
            <button v-if="!isAccountDisabled(item)" type="button" @click="openResetPwd(item)">重置密码</button>
            <button
              v-if="!isAccountDisabled(item)"
              class="danger"
              type="button"
              :disabled="accountActionId === item.userId"
              @click="disable(item)"
            >{{ accountActionId === item.userId ? labels.processing : labels.disable }}</button>
            <button
              v-else
              class="enable"
              type="button"
              :disabled="accountActionId === item.userId"
              @click="enable(item)"
            >{{ accountActionId === item.userId ? labels.processing : labels.enable }}</button>
          </td>
        </tr>
          </tbody>
        </table>
      </div>
    </section>

    <AppModal
      :open="dialogVisible && !isSubAccount"
      :title="editing ? labels.adjustQuota : labels.addSub"
      eyebrow="子账号管理"
      :description="editing ? '调整后立即影响该子账号的可用额度' : '创建后由主账号统一管理权限与额度'"
      size="md"
      @close="closeDialog"
    >
      <div class="form-grid">
          <label v-if="!editing" class="credential-field">
            <span>{{ labels.loginName }}<b>*</b></span>
            <input
              v-model.trim="form.userName"
              :placeholder="labels.loginNamePlaceholder"
              maxlength="20"
              autocomplete="off"
              @blur="validateCredentialField('userName')"
              @input="revalidateCredentialField('userName')"
            />
            <small :class="{ invalid: credentialErrors.userName }">{{ credentialErrors.userName || labels.loginNameRule }}</small>
          </label>
          <label v-if="!editing">{{ labels.nickName }}<input v-model.trim="form.nickName" :placeholder="labels.nickNamePlaceholder" maxlength="30" /></label>
          <label v-if="!editing" class="credential-field">
            <span>{{ labels.phone }}<b>*</b></span>
            <input
              v-model="form.phonenumber"
              :placeholder="labels.phonePlaceholder"
              maxlength="11"
              inputmode="numeric"
              autocomplete="tel"
              @input="normalizePhone"
              @blur="validateCredentialField('phonenumber')"
            />
            <small :class="{ invalid: credentialErrors.phonenumber }">{{ credentialErrors.phonenumber || labels.phoneRule }}</small>
          </label>
          <label v-if="!editing" class="credential-field">
            <span>{{ labels.password }}<b>*</b></span>
            <input
              v-model="form.password"
              type="password"
              :placeholder="labels.passwordPlaceholder"
              maxlength="20"
              autocomplete="new-password"
              @blur="validateCredentialField('password')"
              @input="revalidateCredentialField('password')"
            />
            <small :class="{ invalid: credentialErrors.password }">{{ credentialErrors.password || labels.passwordRule }}</small>
          </label>
          <label class="quota-field">
            {{ labels.quotaYuan }}
            <input v-model.trim="form.subAccountQuota" type="number" min="0" :max="maxQuotaForForm" step="0.01" placeholder="500" />
            <small>本次最高可设置 &yen;{{ formatMoney(maxQuotaForForm) }}</small>
          </label>
      </div>
      <p v-if="message" class="form-message">{{ message }}</p>
      <template #footer>
        <button type="button" class="ghost-btn" @click="closeDialog">{{ labels.cancel }}</button>
        <button type="button" class="primary-btn" :disabled="saving" @click="submit">{{ saving ? labels.saving : labels.confirm }}</button>
      </template>
    </AppModal>

    <AppModal
      :open="resetPwdVisible"
      title="重置子账号密码"
      eyebrow="子账号管理"
      :description="resetPwdTarget ? `为「${resetPwdTarget.nickName || resetPwdTarget.userName}」设置新的登录密码` : ''"
      size="md"
      @close="closeResetPwd"
    >
      <div class="form-grid">
        <label class="credential-field">
          <span>新密码<b>*</b></span>
          <input
            v-model.trim="resetPwdForm.password"
            type="password"
            placeholder="8-20位，需同时包含英文和数字"
            maxlength="20"
            autocomplete="new-password"
          />
        </label>
        <label class="credential-field">
          <span>确认新密码<b>*</b></span>
          <input
            v-model.trim="resetPwdForm.confirm"
            type="password"
            placeholder="再次输入新密码"
            maxlength="20"
            autocomplete="new-password"
          />
        </label>
      </div>
      <p class="reset-pwd-hint">重置后该子账号的登录状态会立即失效，需用新密码重新登录。请通过可靠方式告知本人。</p>
      <p v-if="resetPwdMessage" class="form-message">{{ resetPwdMessage }}</p>
      <template #footer>
        <button type="button" class="ghost-btn" @click="closeResetPwd">{{ labels.cancel }}</button>
        <button type="button" class="primary-btn" :disabled="resetPwdSaving" @click="submitResetPwd">
          {{ resetPwdSaving ? labels.saving : '确认重置' }}
        </button>
      </template>
    </AppModal>

    <AppModal
      :open="detailVisible && !isSubAccount"
      :title="`${detailAccount?.nickName || detailAccount?.userName || '子账号'} 的${detailType === 'records' ? '查询记录' : '账户流水'}`"
      eyebrow="子账号详情"
      :description="detailAccount?.userName || ''"
      size="xl"
      flush
      @close="closeDetail"
    >
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
                <td data-label="姓名"><strong>{{ row.name || '-' }}</strong></td>
                <td data-label="查询类型">{{ getQueryTypeName(row.searchType) }}</td>
                <td data-label="手机号">{{ maskPhone(row.phoneNumber) }}</td>
                <td data-label="提交时间">{{ formatDateTime(row.createTime) }}</td>
                <td data-label="状态"><span class="status-pill" :class="statusClass(row.displayStatus)">{{ statusText(row.displayStatus, row.displayStatusText) }}</span></td>
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
                <td data-label="订单号">{{ formatDateTime(row.createdAt) }}</td>
                <td data-label="时间">{{ row.outTradeNo || '-' }}</td>
                <td data-label="订单/流水号" :class="['amount', String(row.changeStyle) === '7' ? 'frozen' : Number(row.changeCent) >= 0 ? 'plus' : 'minus']">{{ formatSignedFen(row.changeCent, row.changeStyle) }}</td>
                <td data-label="金额">{{ logTypeText(row.changeStyle) }}</td>
                <td data-label="类型">&yen;{{ yuanFromFen(row.beforeMoney) }}</td>
                <td data-label="变动前">&yen;{{ yuanFromFen(row.afterMoney) }}</td>
                <td data-label="变动后">{{ row.reason || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      <template #footer>
        <div class="pager">
          <span>共 {{ detailTotal }} 条</span>
          <button class="ghost-btn" :disabled="detailPage.pageNum <= 1 || detailLoading" @click="changeDetailPage(-1)">上一页</button>
          <span>第 {{ detailPage.pageNum }} 页</span>
          <button class="ghost-btn" :disabled="detailRows.length < detailPage.pageSize || detailLoading" @click="changeDetailPage(1)">下一页</button>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { useRefresh } from '../composables/pullRefresh'
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, ShieldAlert } from '@lucide/vue'
import AppModal from '../components/AppModal.vue'
import { createSubAccount, disableSubAccount, enableSubAccount, listSubAccountLogs, listSubAccountRecords, listSubAccounts, resetSubAccountPassword, updateSubAccountQuota } from '../api/subAccount'
import { getUserProfile } from '../api/user'
import { getUser, setUser } from '../utils/auth'
import { listQueryTypeConfig } from '../api/queryType'
import { formatDateTime, statusClass, statusText, yuanFromFen } from '../utils/format'

const labels = {
  accountCenter: '\u8d26\u6237\u4e2d\u5fc3',
  subAccountManage: '\u5b50\u8d26\u53f7\u7ba1\u7406',
  heroDesc: '\u7edf\u4e00\u7ba1\u7406\u5b50\u8d26\u53f7\u53ca\u53ef\u7528\u989d\u5ea6\u3002',
  addSub: '\u6dfb\u52a0\u5b50\u8d26\u53f7',
  mainBalance: '\u4e3b\u8d26\u53f7\u53ef\u652f\u914d\u4f59\u989d',
  subCount: '\u542f\u7528 / \u5168\u90e8',
  totalQuota: '\u5df2\u5206\u914d\u989d\u5ea6',
  totalUsed: '\u5df2\u6d88\u8d39\u989d\u5ea6',
  subList: '\u5b50\u8d26\u53f7\u5217\u8868',
  listDesc: '\u67e5\u770b\u5b50\u8d26\u53f7\u989d\u5ea6\u3001\u67e5\u8be2\u8bb0\u5f55\u548c\u8d26\u6237\u6d41\u6c34\u3002',
  loading: '\u6b63\u5728\u52a0\u8f7d\u5b50\u8d26\u53f7...',
  empty: '\u6682\u65e0\u5b50\u8d26\u53f7',
  quota: '\u5206\u914d\u603b\u989d\u5ea6',
  used: '\u5df2\u6d88\u8d39',
  remaining: '\u5269\u4f59\u989d\u5ea6',
  adjust: '\u8c03\u989d\u5ea6',
  disable: '\u505c\u7528',
  enable: '\u91cd\u65b0\u542f\u7528',
  enabled: '\u6b63\u5e38',
  disabled: '\u5df2\u505c\u7528',
  processing: '\u5904\u7406\u4e2d...',
  adjustQuota: '\u8c03\u6574\u5b50\u8d26\u53f7\u989d\u5ea6',
  loginName: '\u767b\u5f55\u8d26\u53f7',
  loginNamePlaceholder: '\u8bf7\u8f93\u51656-20\u4f4d\u767b\u5f55\u8d26\u53f7',
  loginNameRule: '6-20\u4f4d\uff0c\u4ec5\u652f\u6301\u82f1\u6587\u548c\u6570\u5b57\uff0c\u4e14\u5fc5\u987b\u540c\u65f6\u5305\u542b',
  nickName: '\u6635\u79f0',
  nickNamePlaceholder: '\u8bf7\u8f93\u5165\u6635\u79f0',
  phone: '\u624b\u673a\u53f7',
  phonePlaceholder: '\u8bf7\u8f93\u516511\u4f4d\u624b\u673a\u53f7',
  phoneRule: '\u624b\u673a\u53f7\u7528\u4e8e\u767b\u5f55\u4e0e\u8d26\u53f7\u5b89\u5168\u9a8c\u8bc1\uff0c\u521b\u5efa\u540e\u4e0d\u53ef\u4e0e\u5176\u4ed6\u8d26\u53f7\u91cd\u590d',
  password: '\u521d\u59cb\u5bc6\u7801',
  passwordPlaceholder: '\u8bf7\u8f93\u51658-20\u4f4d\u521d\u59cb\u5bc6\u7801',
  passwordRule: '8-20\u4f4d\uff0c\u5fc5\u987b\u540c\u65f6\u5305\u542b\u82f1\u6587\u548c\u6570\u5b57\uff0c\u4e0d\u5141\u8bb8\u7a7a\u683c',
  quotaYuan: '\u53ef\u4f7f\u7528\u989d\u5ea6\uff08\u5143\uff09',
  cancel: '\u53d6\u6d88',
  confirm: '\u786e\u8ba4',
  saving: '\u63d0\u4ea4\u4e2d...',
  inputLogin: '\u8bf7\u8f93\u5165\u767b\u5f55\u8d26\u53f7',
  inputPassword: '\u8bf7\u8f93\u5165\u521d\u59cb\u5bc6\u7801',
  inputQuota: '\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u989d\u5ea6',
  submitFail: '\u63d0\u4ea4\u5931\u8d25',
  defaultInitial: '\u5b50'
}

const profile = ref(getUser() || {})
const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))
const accounts = ref([])
const mainBalance = ref(0)
const loading = ref(false)
const saving = ref(false)
const accountActionId = ref(null)
const dialogVisible = ref(false)
const editing = ref(null)
const message = ref('')
const pageMessage = ref('')
const pageMessageType = ref('info')
let pageMessageTimer = null

function notify(text, type = 'info') {
  pageMessage.value = text
  pageMessageType.value = type
  clearTimeout(pageMessageTimer)
  pageMessageTimer = setTimeout(() => { pageMessage.value = '' }, 3000)
}
const form = reactive({ userName: '', nickName: '', phonenumber: '', password: '', subAccountQuota: '' })
const credentialErrors = reactive({ userName: '', phonenumber: '', password: '' })
const ACCOUNT_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/
const PHONE_PATTERN = /^1[3-9]\d{9}$/
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[!-~]{8,20}$/
const queryTypeMap = ref({})
const detailVisible = ref(false)
const detailType = ref('records')
const detailAccount = ref(null)
const detailRows = ref([])
const detailTotal = ref(0)
const detailLoading = ref(false)
const detailPage = reactive({ pageNum: 1, pageSize: 8 })
const subTotalQuotaYuan = computed(() => Number(profile.value?.subAccountQuota || 0) / 100)
const subUsedQuotaYuan = computed(() => Number(profile.value?.subAccountUsed || 0) / 100)
const subRemainingQuotaYuan = computed(() => Math.max(0, (Number(profile.value?.subAccountQuota || 0) - Number(profile.value?.subAccountUsed || 0)) / 100))
const activeAccounts = computed(() => accounts.value.filter(item => !isAccountDisabled(item)))
const totalQuota = computed(() => activeAccounts.value.reduce((sum, item) => sum + Number(item.subAccountQuota || 0), 0))
const totalUsed = computed(() => activeAccounts.value.reduce((sum, item) => sum + Number(item.subAccountUsed || 0), 0))
const totalRemaining = computed(() => activeAccounts.value.reduce((sum, item) => sum + remaining(item), 0))
const maxQuotaForForm = computed(() => {
  const available = Number(mainBalance.value || 0)
  if (!editing.value) return Math.max(0, available - totalRemaining.value)
  const currentUsed = Number(editing.value.subAccountUsed || 0)
  const currentOccupied = currentUsed
  const otherRemaining = Math.max(0, totalRemaining.value - remaining(editing.value))
  return Math.max(currentOccupied, currentOccupied + available - otherRemaining)
})

function formatMoney(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function isAccountDisabled(item) { return String(item?.status ?? '') === '1' }
function remaining(item) {
  if (isAccountDisabled(item)) return 0
  return Math.max(0, Number(item.subAccountQuota || 0) - Number(item.subAccountUsed || 0))
}
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
  if (s === '7') return '冻结'
  if (s === '8') return '释放冻结'
  return s || '-'
}
function formatSignedFen(value, changeStyle) {
  const n = Number(value || 0)
  if (String(changeStyle) === '7') return `¥${yuanFromFen(Math.abs(n))}`
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
async function loadProfile() {
  try {
    const response = await getUserProfile()
    const user = response.data || response.user || {}
    profile.value = user
    setUser(user)
  } catch (err) {}
}
function resetForm() {
  form.userName = ''
  form.nickName = ''
  form.phonenumber = ''
  form.password = ''
  form.subAccountQuota = ''
  credentialErrors.userName = ''
  credentialErrors.phonenumber = ''
  credentialErrors.password = ''
  message.value = ''
}
function validateCredentialField(field) {
  let error = ''
  if (field === 'userName') {
    if (!form.userName) error = '\u8bf7\u8f93\u5165\u767b\u5f55\u8d26\u53f7'
    else if (!ACCOUNT_PATTERN.test(form.userName)) error = '\u8d26\u53f7\u5fc5\u987b\u4e3a6-20\u4f4d\u82f1\u6587\u548c\u6570\u5b57\u7ec4\u5408'
  } else if (field === 'phonenumber') {
    if (!form.phonenumber) error = '\u8bf7\u8f93\u5165\u624b\u673a\u53f7'
    else if (!PHONE_PATTERN.test(form.phonenumber)) error = '\u8bf7\u8f93\u5165\u6b63\u786e\u768411\u4f4d\u624b\u673a\u53f7'
  } else if (field === 'password') {
    if (!form.password) error = '\u8bf7\u8f93\u5165\u521d\u59cb\u5bc6\u7801'
    else if (!PASSWORD_PATTERN.test(form.password)) error = '\u5bc6\u7801\u5fc5\u987b\u4e3a8-20\u4f4d\uff0c\u5305\u542b\u82f1\u6587\u548c\u6570\u5b57\uff0c\u4e14\u4e0d\u80fd\u6709\u7a7a\u683c'
  }
  credentialErrors[field] = error
  return !error
}
function revalidateCredentialField(field) {
  if (credentialErrors[field]) validateCredentialField(field)
}
function normalizePhone(event) {
  form.phonenumber = String(event?.target?.value || '').replace(/\D/g, '').slice(0, 11)
  revalidateCredentialField('phonenumber')
}
function openCreate() { if (isSubAccount.value) return; editing.value = null; resetForm(); dialogVisible.value = true }
function openQuota(item) {
  if (isSubAccount.value || isAccountDisabled(item)) return
  editing.value = item
  resetForm()
  form.subAccountQuota = item.subAccountQuota || 0
  dialogVisible.value = true
}
function closeDialog() { dialogVisible.value = false; editing.value = null; resetForm() }
async function submit() {
  message.value = ''
  if (!editing.value) {
    const credentialsValid = ['userName', 'phonenumber', 'password']
      .map(validateCredentialField)
      .every(Boolean)
    if (!credentialsValid) return (message.value = '\u8bf7\u6309\u8981\u6c42\u5b8c\u5584\u5b50\u8d26\u53f7\u767b\u5f55\u4fe1\u606f')
  }
  if (form.subAccountQuota === '' || Number(form.subAccountQuota) < 0) return (message.value = labels.inputQuota)
  if (Number(form.subAccountQuota) > maxQuotaForForm.value) {
    return (message.value = `额度超出主账号可分配范围，本次最高可设置 ¥${formatMoney(maxQuotaForForm.value)}`)
  }
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
async function disable(item) {
  const name = item.nickName || item.userName
  if (!window.confirm(`确定停用子账号「${name}」吗？\n\n停用后该账号将无法登录，未消费额度会释放；查询记录、资金流水和历史报告仍会保留。存在未完成订单时系统会拒绝停用。`)) return
  accountActionId.value = item.userId
  try {
    await disableSubAccount(item.userId)
    notify(`已停用子账号「${name}」`)
    await loadList()
  } catch (err) {
    notify(err?.msg || err?.message || '停用失败，请稍后重试', 'error')
  } finally {
    accountActionId.value = null
  }
}

const resetPwdVisible = ref(false)
const resetPwdTarget = ref(null)
const resetPwdSaving = ref(false)
const resetPwdMessage = ref('')
const resetPwdForm = reactive({ password: '', confirm: '' })

function openResetPwd(item) {
  resetPwdTarget.value = item
  resetPwdForm.password = ''
  resetPwdForm.confirm = ''
  resetPwdMessage.value = ''
  resetPwdVisible.value = true
}

function closeResetPwd() {
  resetPwdVisible.value = false
  resetPwdTarget.value = null
}

async function submitResetPwd() {
  resetPwdMessage.value = ''
  if (!PASSWORD_PATTERN.test(resetPwdForm.password)) {
    return (resetPwdMessage.value = '密码必须为8-20位，包含英文和数字，且不能有空格')
  }
  if (resetPwdForm.password !== resetPwdForm.confirm) {
    return (resetPwdMessage.value = '两次输入的密码不一致')
  }
  resetPwdSaving.value = true
  try {
    const name = resetPwdTarget.value?.nickName || resetPwdTarget.value?.userName || '子账号'
    await resetSubAccountPassword(resetPwdTarget.value.userId, { password: resetPwdForm.password })
    closeResetPwd()
    notify(`已重置「${name}」的登录密码`)
  } catch (err) {
    resetPwdMessage.value = err?.msg || err?.message || '重置失败，请稍后重试'
  } finally {
    resetPwdSaving.value = false
  }
}

async function enable(item) {
  const name = item.nickName || item.userName
  if (!window.confirm(`确定重新启用子账号「${name}」吗？\n\n系统会恢复该账号原额度；若主账号当前可分配余额不足，将无法启用。`)) return
  accountActionId.value = item.userId
  try {
    await enableSubAccount(item.userId)
    notify(`已重新启用子账号「${name}」`)
    await loadList()
  } catch (err) {
    notify(err?.msg || err?.message || '启用失败，请稍后重试', 'error')
  } finally {
    accountActionId.value = null
  }
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
  await Promise.all([loadQueryTypes(), loadProfile()])
  if (!isSubAccount.value) await loadList()
})
// 移动端下拉刷新复用同一个加载函数
useRefresh(loadList)
</script>

<style scoped>
.sub-page { width: min(1360px, 100%); margin: 0 auto; display: grid; gap: 16px; }
.no-permission-card { padding: 52px 40px; text-align: center; color: var(--text-secondary); }
.no-permission-card h3 { margin: 14px 0 8px; color: var(--text); font-size: var(--fs-2xl); }
.no-permission-card p { margin: 0 auto; max-width: 560px; line-height: 1.8; }
.no-permission-icon { width: 52px; height: 52px; margin: 0 auto; border-radius: var(--radius); display: grid; place-items: center; color: var(--blue); background: var(--line-soft); font-size: var(--fs-2xl); font-weight: 900; }
.sub-quota-view { margin: 26px auto 0; max-width: 760px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; text-align: left; }
.sub-quota-view div { padding: 18px 20px; border: 1px solid #e4ebf5; border-radius: var(--radius); background: #f8fbff; }
.sub-quota-view span { display: block; color: var(--muted); font-size: var(--fs-base); }
.sub-quota-view strong { display: block; margin-top: 8px; color: var(--text); font-size: var(--fs-2xl); }
.sub-quota-view div:last-child strong { color: var(--green); }
.primary-btn, .ghost-btn { border: 0; border-radius: var(--radius); font-weight: 700; cursor: pointer; }
.primary-btn { min-height: 42px; background: var(--blue); color: #fff; padding: 0 18px; box-shadow: none; }
.primary-btn:disabled { opacity: .55; cursor: not-allowed; }
.ghost-btn { background: #f4f7fb; color: var(--blue); padding: 10px 16px; border: 1px solid #dce6f5; }
.sub-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; overflow: hidden; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); }
.sub-summary > div, .sub-card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: 0 1px 2px rgba(15, 23, 42, .04); }
.sub-summary > div { min-height: 100px; padding: 18px 20px; border: 0; border-right: 1px solid #edf1f6; border-radius: 0; box-shadow: none; }
.sub-summary > div:last-child { border-right: 0; }
.sub-summary span { color: var(--muted); font-size: var(--fs-base); }
.sub-summary strong { display: block; margin-top: 8px; font-size: var(--fs-2xl); color: var(--text); }
.sub-card { overflow: hidden; }
.card-head { min-height: 68px; padding: 14px 20px; border-bottom: 1px solid var(--line-soft); display: flex; align-items: center; justify-content: space-between; }
.card-head h3 { margin: 0; font-size: var(--fs-lg); }
.card-head p { margin: 8px 0 0; color: var(--muted); }
.empty-state { padding: 70px 20px; text-align: center; color: #7b8aa0; }
/* 行高、内边距、边框、hover 全部继承全局 .data-table，
   这里只留本页的列宽与停用态。 */
.sub-table-wrap { overflow-x: auto; }
.sub-table { min-width: 940px; table-layout: fixed; }
.sub-table th:nth-child(1) { width: 26%; }
.sub-table th:nth-child(2) { width: 86px; }
.sub-table th:nth-child(3),
.sub-table th:nth-child(4),
.sub-table th:nth-child(5) { width: 116px; }
.sub-table tbody tr.disabled { background: var(--line-soft); }
.sub-table tbody tr.disabled .account-avatar { color: var(--muted); background: var(--line); }
.account-main { display: flex; align-items: center; gap: 14px; }
/* 头像缩小、去掉高饱和底色：它只是定位锚点，不该是行内最抢眼的元素 */
.account-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius);
  background: var(--line-soft);
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  font-weight: 600;
}
/* 人名原本 18px、额度数字 20px——比人名还大，视觉重心是反的。
   现在人名 14px/600 为行内主体，额度降到同级但用常规字重。 */
.account-main h4 {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-wrap: wrap;
  margin: 0 0 2px;
  font-size: var(--fs-base);
  font-weight: 600;
}
.account-main p { margin: 0; color: var(--muted); font-size: var(--fs-xs); }
.account-status {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 var(--sp-2);
  border-radius: 999px;
  background: var(--green-soft);
  color: var(--green);
  font-size: var(--fs-xs);
  font-weight: 500;
}
.account-status.disabled { background: var(--line); color: var(--muted); }
.sub-table td.numeric { font-variant-numeric: tabular-nums; text-align: right; }
.sub-table td.remain { color: var(--green); font-weight: 600; }
.sub-table th.numeric { text-align: right; }
/* 六个按钮原先同等权重一字排开，整行看过去全是边框。
   现在只有「调额度」保持按钮形态，其余降为文字操作，
   停用/启用因为不可逆才保留描边。 */
.row-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  justify-content: flex-end;
  flex-wrap: wrap;
}
.row-actions button {
  min-height: 30px;
  padding: 0 var(--sp-2);
  border: 0;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--fs-xs);
  font-weight: 500;
  cursor: pointer;
  transition: background .14s ease, color .14s ease;
}

.row-actions button:hover:not(:disabled) {
  background: var(--line-soft);
  color: var(--text);
}

/* 调额度是这行最常用的动作，给它描边以示主次 */
.row-actions .primary-action-btn {
  border: 1px solid var(--line);
  color: var(--text);
}

.row-actions .primary-action-btn:hover:not(:disabled) { border-color: var(--text); }
.row-actions .danger { border: 1px solid var(--red-soft); color: var(--red); }
.row-actions .danger:hover:not(:disabled) { background: var(--red-soft); color: var(--red); }
.reset-pwd-hint { margin: 12px 0 0; color: var(--muted); font-size: var(--fs-xs); line-height: 1.7; }
.row-actions .enable { border: 1px solid var(--green-soft); color: var(--green); }
.row-actions .enable:hover:not(:disabled) { background: var(--green-soft); color: var(--green); }
.row-actions button:disabled { opacity: .55; cursor: not-allowed; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.form-grid label { display: grid; gap: 9px; color: var(--text-secondary); font-weight: 800; }
.credential-field > span { display: inline-flex; align-items: center; gap: 4px; }
.credential-field > span b { color: var(--red); font-size: var(--fs-base); }
.credential-field small { min-height: 17px; color: var(--muted); font-size: var(--fs-xs); font-weight: 500; line-height: 1.45; }
.credential-field small.invalid { color: var(--red); }
.form-grid input { height: 42px; border: 1px solid var(--line); border-radius: var(--radius); padding: 0 12px; font-size: var(--fs-base); outline: none; }
.form-grid input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(22, 24, 29, .07); }
.quota-field small { color: var(--muted); font-size: var(--fs-xs); font-weight: 500; }
.form-message { margin: 8px 0 0; color: var(--red); }
.detail-tabs { margin: 0; padding: 14px 24px 12px; border-bottom: 1px solid var(--line-soft); display: flex; gap: 10px; background: #fff; }
.detail-tabs button { height: 38px; padding: 0 18px; border-radius: var(--radius); border: 1px solid var(--line); background: #fff; color: var(--muted); font-weight: 700; cursor: pointer; }
.detail-tabs .active { color: var(--blue); border-color: var(--blue); background: var(--blue-soft); }
.detail-body { overflow: auto; max-height: 56vh; padding: 0; }
.detail-table { width: 100%; border-collapse: collapse; font-size: var(--fs-base); }
.detail-table th { position: sticky; top: 0; background: var(--line-soft); color: var(--text-secondary); text-align: left; padding: 14px 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.detail-table td { padding: 15px 12px; border-bottom: 1px solid var(--line-soft); color: var(--text); vertical-align: top; }
.status-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; font-size: var(--fs-xs); font-weight: 800; background: var(--line-soft); color: var(--blue); white-space: nowrap; }
.status-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.status-pill.success { background: var(--green-soft); color: var(--green); }
.status-pill.warning { background: var(--orange-soft); color: var(--orange); }
.status-pill.danger { background: var(--red-soft); color: var(--red); }
.amount { font-weight: 900; }
.amount.plus { color: var(--green); }
.amount.minus { color: var(--red); }
.amount.frozen { color: var(--orange); }
.pager { margin: 0; padding: 0; display: flex; justify-content: flex-end; align-items: center; gap: 12px; border: 0; border-radius: 0; color: var(--muted); }
/* 表格改造后，窄屏的行堆叠由全局 .data-table 的移动端规则接管
   （td 变 flex + data-label 补出字段名），这里不再需要针对
   .account-row 的 grid 覆盖。只保留按钮在窄屏的排布。 */
@media (max-width: 1180px) {
  .sub-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .sub-quota-view, .form-grid { grid-template-columns: 1fr; }

  /* 窄屏下这一格由全局 .data-table 变成 flex 行（左侧是 data-label 补出的
     「操作」二字）。按钮若保留 flex:1 会被拉伸，换行后最后一个独占整行，
     所以改为不拉伸、整体靠右换行——与查询记录的操作列同一套处理。 */
  .sub-table tbody td.row-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-2);
  }
  .sub-table tbody td.row-actions::before { margin-right: auto; }
  .row-actions button {
    flex: 0 0 auto;
    min-width: 0;
    padding: 0 var(--sp-2);
  }
}

/* 移动端：四个额度指标两列排布 —— 原先 720px 断点把它压成单列，
   四条信息竖着占掉整整一屏，纵向浪费严重 */
@media (max-width: 768px) {

  .sub-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 0;
  }
  .sub-summary > div {
    padding: 12px 14px;
    border-radius: 0;
    border-right: 1px solid var(--line-soft);
    border-bottom: 1px solid var(--line-soft);
  }
  .sub-summary > div:nth-child(2n) { border-right: 0; }
  .sub-summary > div:nth-last-child(-n+2) { border-bottom: 0; }
  .sub-summary span { font-size: var(--fs-xs); }
  .sub-summary strong { font-size: var(--fs-xl); }

  /* 卡片头里的「刷新」被压成两行 */
  .sub-card .ghost-btn,
  .detail-tabs button,
  .row-actions button { white-space: nowrap; }

  .sub-card { padding: 14px; }
  .sub-quota-view, .form-grid { grid-template-columns: minmax(0, 1fr); }

  /* 明细弹层里的表格横向可滚，不硬挤 */
  .detail-body { max-height: 62vh; }
  .detail-table { min-width: 520px; }
}
</style>
