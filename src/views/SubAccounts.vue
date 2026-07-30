<template>
  <main class="main-content">
    <TopSlideNotice
      v-model="noticeVisible"
      :type="noticeType"
      :title="noticeTitle"
      :message="noticeMessage"
    />

    <div v-if="isSubAccount" class="card sub-no-permission">
      <div class="sub-shield">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 3L5 6V11C5 15.4 7.9 19.2 12 20.5C16.1 19.2 19 15.4 19 11V6L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M12 8V12M12 15.5H12.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      <h2>子账号无权管理子账号</h2>
      <p>子账号由主账号统一创建和管理。</p>
      <div class="sub-quota-view">
        <div><span>主账号分配总额度</span><strong>¥{{ formatMoney(subTotalQuota) }}</strong></div>
        <div><span>已消费额度</span><strong>¥{{ formatMoney(subUsedQuota) }}</strong></div>
        <div><span>剩余可用额度</span><strong>¥{{ formatMoney(subRemainingQuota) }}</strong></div>
      </div>
    </div>

    <template v-else>
      <div class="stat-row">
        <div class="stat-cell">
          <span class="stat-cell-label">主账号可支配余额</span>
          <span class="stat-cell-value">¥ {{ formatMoney(mainBalance) }}</span>
          <span class="stat-cell-sub">可用于分配额度</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-label">子账号数</span>
          <span class="stat-cell-value">{{ accounts.length }}</span>
          <span class="stat-cell-sub">已创建</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-label">已分配额度</span>
          <span class="stat-cell-value">¥ {{ formatMoney(totalQuota) }}</span>
          <span class="stat-cell-sub">子账号总额度</span>
        </div>
        <div class="stat-cell">
          <span class="stat-cell-label">已消费额度</span>
          <span class="stat-cell-value">¥ {{ formatMoney(totalUsed) }}</span>
          <span class="stat-cell-sub">子账号合计</span>
        </div>
      </div>

      <div class="table-section business-list-shell">
        <div class="table-header">
          <h2>子账号列表</h2>
          <div class="table-tools">
            <button class="btn-outline refresh-btn" type="button" :disabled="loading" @click="loadList">
              {{ loading ? '刷新中...' : '刷新' }}
            </button>
            <button class="btn-mini sub-account-add-btn" type="button" @click="openCreate">添加子账号</button>
          </div>
        </div>
        <div class="table-content">
          <table class="business-list-table">
            <thead>
              <tr>
                <th style="width:17%">账号</th>
                <th style="width:12%">姓名</th>
                <th style="width:14%">手机号</th>
                <th style="width:13%">分配额度</th>
                <th style="width:13%">已消费</th>
                <th style="width:13%">剩余额度</th>
                <th style="width:18%">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pagedAccounts" :key="item.userId || item.id">
                <td class="td-name">{{ item.userName || '-' }}</td>
                <td>{{ item.nickName || '-' }}</td>
                <td>{{ maskPhone(item.phonenumber) }}</td>
                <td>¥{{ formatMoney(item.subAccountQuota) }}</td>
                <td>¥{{ formatMoney(item.subAccountUsed) }}</td>
                <td class="remain-cell">¥{{ formatMoney(remaining(item)) }}</td>
                <td>
                  <div class="action-group sub-actions">
                    <span class="action-link" @click="openRecords(item)">查询记录</span>
                    <span class="action-link" @click="openLogs(item)">流水</span>
                    <span class="action-link" @click="openQuota(item)">调额度</span>
                    <span class="action-danger" @click="openDeleteConfirm(item)">删除</span>
                  </div>
                </td>
              </tr>
              <tr v-if="loading"><td colspan="7" class="table-empty">正在加载子账号...</td></tr>
              <tr v-else-if="accounts.length === 0"><td colspan="7" class="table-empty">暂无子账号</td></tr>
            </tbody>
          </table>
        </div>
        <BusinessTableFooter
          v-if="accounts.length > 0"
          :total="accounts.length"
          :page="accountPage.pageNum"
          :page-size="accountPage.pageSize"
          :total-pages="accountTotalPages"
          :loading="loading"
          @update:page-size="changeAccountPageSize"
          @page-change="goAccountPage"
        />
      </div>
    </template>

    <AppModal
      v-model="dialogVisible"
      :title="editing ? '调整子账号额度' : '添加子账号'"
      eyebrow="子账号管理"
      :description="editing ? '调整后立即影响该子账号的可用额度' : '创建后由主账号统一管理权限与额度'"
      size="md"
      @close="closeDialog"
    >
      <div class="sub-form-grid">
        <label v-if="!editing" class="field">
          <span class="field-label">登录账号 <span class="required">*</span></span>
          <input v-model.trim="form.userName" class="field-input" placeholder="请输入登录账号" />
        </label>
        <label v-if="!editing" class="field">
          <span class="field-label">昵称</span>
          <input v-model.trim="form.nickName" class="field-input" placeholder="请输入昵称" />
        </label>
        <label v-if="!editing" class="field">
          <span class="field-label">手机号</span>
          <input v-model.trim="form.phonenumber" class="field-input" maxlength="11" placeholder="请输入手机号" />
        </label>
        <label v-if="!editing" class="field">
          <span class="field-label">初始密码 <span class="required">*</span></span>
          <input v-model.trim="form.password" class="field-input" type="password" placeholder="请输入初始密码" />
        </label>
        <label class="field quota-field">
          <span class="field-label">可使用额度（元） <span class="required">*</span></span>
          <input v-model.trim="form.subAccountQuota" class="field-input" type="number" min="0" :max="maxQuotaForForm" step="0.01" placeholder="500" />
          <small>本次最高可设置 ¥{{ formatMoney(maxQuotaForForm) }}</small>
        </label>
      </div>
      <FormAlert :message="message" type="error" />
      <template #footer>
        <button type="button" class="btn-outline" @click="closeDialog">取消</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="submit">
          {{ saving ? '提交中...' : '确认' }}
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model="detailVisible"
      :title="`${detailAccount?.nickName || detailAccount?.userName || '子账号'} 的${detailType === 'records' ? '查询记录' : '账户流水'}`"
      eyebrow="子账号详情"
      :description="detailAccount?.userName || ''"
      size="xl"
      flush
      @close="closeDetail"
    >
      <div class="detail-tabs">
        <button type="button" :class="{ active: detailType === 'records' }" @click="switchDetail('records')">查询记录</button>
        <button type="button" :class="{ active: detailType === 'logs' }" @click="switchDetail('logs')">账户流水</button>
      </div>
      <div class="detail-body">
        <table v-if="detailType === 'records'" class="detail-table business-list-table">
          <thead>
            <tr>
              <th>候选人</th>
              <th>背调类型</th>
              <th>身份证号</th>
              <th>手机号</th>
              <th>提交时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="detailLoading"><td colspan="7" class="table-empty">正在加载...</td></tr>
            <tr v-else-if="detailRows.length === 0"><td colspan="7" class="table-empty">暂无查询记录</td></tr>
            <tr v-for="row in detailRows" :key="row.id">
              <td class="td-name">{{ row.name || '-' }}</td>
              <td>{{ getQueryTypeName(row.searchType || row.callTypeId) }}</td>
              <td class="td-mono">{{ maskIdCard(row.idCard || row.idcard) }}</td>
              <td>{{ maskPhone(row.phoneNumber || row.mobile || row.phone) }}</td>
              <td class="td-date">{{ formatFullTime(row.createTime || row.time) }}</td>
              <td><span class="status-badge" :class="recordStatusTone(row)">{{ recordStatusText(row) }}</span></td>
              <td>
                <div class="action-group record-actions">
                  <router-link v-if="canOperateRecord(row)" :to="`/report/${row.id}`" class="action-link">查看报告</router-link>
                  <span v-else class="action-plain">查看报告</span>
                  <button v-if="canOperateRecord(row)" class="action-link action-btn" type="button" @click="downloadPdf(row)">下载 PDF</button>
                  <span v-else class="action-plain">下载 PDF</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table v-else class="detail-table ledger-table business-list-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>变动金额</th>
              <th>变动前余额</th>
              <th>说明</th>
              <th>流水号</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="detailLoading"><td colspan="6" class="table-empty">正在加载...</td></tr>
            <tr v-else-if="detailRows.length === 0"><td colspan="6" class="table-empty">暂无流水记录</td></tr>
            <tr v-for="row in detailRows" :key="row.id">
              <td class="td-date">{{ String(row.createdAt || row.createTime || '').slice(0, 16) }}</td>
              <td><span class="ledger-type" :class="ledgerChangeType(row)">{{ logTypeText(row.changeStyle) }}</span></td>
              <td :class="['ledger-amount', amountClass(row)]">{{ formatSignedFen(row) }}</td>
              <td>¥{{ formatFenMoney(row.beforeMoney ?? row.beforeCent) }}</td>
              <td>{{ row.reason || row.remark || '-' }}</td>
              <td class="td-mono ledger-serial">{{ row.outTradeNo || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <BusinessTableFooter
          class="detail-business-footer"
          :total="detailTotal"
          :page="detailPage.pageNum"
          :page-size="detailPage.pageSize"
          :total-pages="detailTotalPages"
          :loading="detailLoading"
          @update:page-size="changeDetailPageSize"
          @page-change="goDetailPage"
        />
      </template>
    </AppModal>

    <div
      v-if="deleteTarget"
      class="modal-mask"
      @pointerdown="subBackdropGuard.pointerDown"
      @click.self="subBackdropGuard.click(closeDeleteConfirm)"
    >
      <div class="modal-card delete-confirm-card">
        <div class="delete-confirm-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
          </svg>
        </div>
        <h3 class="delete-confirm-title">删除子账号</h3>
        <p class="delete-confirm-desc">
          确定删除子账号 <strong>{{ deleteTarget.nickName || deleteTarget.userName }}</strong> 吗？删除后该账号将无法继续登录使用。
        </p>
        <div class="delete-confirm-actions">
          <button type="button" class="btn-outline" :disabled="deleting" @click="closeDeleteConfirm">取消</button>
          <button type="button" class="btn-primary danger-btn" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppModal from '../components/AppModal.vue'
import BusinessTableFooter from '../components/BusinessTableFooter.vue'
import FormAlert from '../components/FormAlert.vue'
import TopSlideNotice from '../components/TopSlideNotice.vue'
import {
  createSubAccount,
  deleteSubAccount,
  listSubAccountLogs,
  listSubAccountRecords,
  listSubAccounts,
  updateSubAccountQuota
} from '../api/subAccount'
import { listQueryTypeConfig } from '../api/queryType'
import { getUserBalance, getUserProfile } from '../api/user'
import { setUser } from '../utils/auth'
import { createBackdropGuard } from '../utils/backdropGuard'
import { statusText } from '../utils/format'

const router = useRouter()
const profile = ref({})
const accounts = ref([])
const mainBalance = ref(0)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref(null)
const message = ref('')
const queryTypeMap = ref({})
const detailVisible = ref(false)
const detailType = ref('records')
const detailAccount = ref(null)
const detailRows = ref([])
const detailTotal = ref(0)
const detailLoading = ref(false)
const detailPage = reactive({ pageNum: 1, pageSize: 10 })
const accountPage = reactive({ pageNum: 1, pageSize: 10 })
const deleteTarget = ref(null)
const deleting = ref(false)
const noticeVisible = ref(false)
const noticeType = ref('success')
const noticeTitle = ref('')
const noticeMessage = ref('')
const subBackdropGuard = createBackdropGuard()
const form = reactive({ userName: '', nickName: '', phonenumber: '', password: '', subAccountQuota: '' })

const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))
const subTotalQuota = computed(() => Number(profile.value?.subAccountQuota || 0) / 100)
const subUsedQuota = computed(() => Number(profile.value?.subAccountUsed || 0) / 100)
const subRemainingQuota = computed(() => Math.max(0, subTotalQuota.value - subUsedQuota.value))
const totalQuota = computed(() => accounts.value.reduce((sum, item) => sum + Number(item.subAccountQuota || 0), 0))
const totalUsed = computed(() => accounts.value.reduce((sum, item) => sum + Number(item.subAccountUsed || 0), 0))
const totalRemaining = computed(() => accounts.value.reduce((sum, item) => sum + remaining(item), 0))
const accountTotalPages = computed(() => Math.max(1, Math.ceil(accounts.value.length / accountPage.pageSize)))
const pagedAccounts = computed(() => {
  const start = (accountPage.pageNum - 1) * accountPage.pageSize
  return accounts.value.slice(start, start + accountPage.pageSize)
})
const detailTotalPages = computed(() => Math.max(1, Math.ceil(detailTotal.value / detailPage.pageSize)))
const maxQuotaForForm = computed(() => {
  const available = Number(mainBalance.value || 0)
  if (!editing.value) return Math.max(0, available - totalRemaining.value)
  const currentUsed = Number(editing.value.subAccountUsed || 0)
  const otherRemaining = Math.max(0, totalRemaining.value - remaining(editing.value))
  return Math.max(currentUsed, currentUsed + available - otherRemaining)
})

function formatMoney(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFenMoney(value) {
  return formatMoney(Number(value || 0) / 100)
}

function maskPhone(value) {
  const phone = String(value || '')
  if (phone.length < 7) return phone || '-'
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

function maskIdCard(value) {
  const idCard = String(value || '')
  if (idCard.length < 8) return idCard || '-'
  return `${idCard.slice(0, 3)}***********${idCard.slice(-4)}`
}

function formatFullTime(value) {
  if (!value) return '-'
  const d = new Date(String(value).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return String(value)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}年${m}月${day}日 ${h}:${min}`
}

function remaining(item) {
  return Math.max(0, Number(item.subAccountQuota || 0) - Number(item.subAccountUsed || 0))
}

function normalizeAccount(item) {
  return {
    ...item,
    id: item.id,
    userId: item.userId || item.id,
    userName: item.userName || item.username || '-',
    nickName: item.nickName || item.name || '-',
    phonenumber: item.phonenumber || item.phone || '',
    subAccountQuota: Number(item.subAccountQuota || item.quota || 0),
    subAccountUsed: Number(item.subAccountUsed || item.used || 0)
  }
}

function getQueryTypeName(id) {
  return queryTypeMap.value[String(id)] || id || '-'
}

function recordStatusText(row) {
  return statusText(row.searchStatus ?? row.status, row.displayStatusText, row.billingStatus, row.displayStatus)
}

function recordStatusTone(row) {
  const s = String(row.searchStatus ?? row.status ?? '')
  if (s === '2' || row.displayStatus === 'success') return 'success'
  if (s === '3' || s === '4' || s === '6') return 'error'
  if (s === '1' || s === '5') return 'warning'
  return 'neutral'
}

function canOperateRecord(row) {
  return String(row.searchStatus ?? row.status ?? '') === '2'
}

function downloadPdf(row) {
  if (!canOperateRecord(row)) return
  if (row.pdfFilePath) {
    const path = String(row.pdfFilePath).trim()
    const base = import.meta.env.VITE_APP_BASE_API || ''
    const url = /^(https?:)?\/\//i.test(path) ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`
    window.open(url, '_blank', 'noopener')
    return
  }
  const target = router.resolve({
    name: 'reportDetail',
    params: { id: row.id },
    query: { download: '1' }
  })
  window.open(target.href, '_blank', 'noopener')
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

function changeAmount(row) {
  return Number(row.changeCent ?? row.changeAmount ?? row.amount ?? 0)
}

function afterMoney(row) {
  const before = Number(row.beforeMoney ?? row.beforeCent ?? 0)
  return before + changeAmount(row)
}

function amountClass(row) {
  const n = changeAmount(row)
  if (String(row.changeStyle) === '7') return 'frozen'
  if (n > 0) return 'plus'
  if (n < 0) return 'minus'
  return ''
}

function ledgerChangeType(row) {
  return changeAmount(row) >= 0 ? 'add' : 'sub'
}

function formatSignedFen(row) {
  const n = changeAmount(row)
  const prefix = n > 0 ? '+' : n < 0 ? '-' : ''
  return `${prefix}¥${formatFenMoney(Math.abs(n))}`
}

async function loadQueryTypes() {
  try {
    const res = await listQueryTypeConfig({ pageNum: 1, pageSize: 1000 })
    queryTypeMap.value = Object.fromEntries((res.rows || res.data || []).map(item => [
      String(item.id),
      item.callTypeName || item.queryTypeName || item.name || `类型${item.id}`
    ]))
  } catch (error) {
    queryTypeMap.value = {}
  }
}

async function loadProfile() {
  const res = await getUserProfile()
  const user = res.data || res.user || {}
  profile.value = user
  setUser(user)
  if (!isSubAccount.value) {
    const balanceRes = await getUserBalance(user.userId || user.id)
    mainBalance.value = Number(balanceRes.data || balanceRes.balance || 0) / 100
  }
}

async function loadList() {
  loading.value = true
  try {
    const res = await listSubAccounts()
    accounts.value = (res.rows || res.data || []).map(normalizeAccount)
    if (accountPage.pageNum > accountTotalPages.value) accountPage.pageNum = accountTotalPages.value
  } finally {
    loading.value = false
  }
}

function changeAccountPageSize(size) {
  accountPage.pageSize = size
  accountPage.pageNum = 1
}

function goAccountPage(target) {
  accountPage.pageNum = target
}

function resetForm() {
  form.userName = ''
  form.nickName = ''
  form.phonenumber = ''
  form.password = ''
  form.subAccountQuota = ''
  message.value = ''
}

function openCreate() {
  editing.value = null
  resetForm()
  dialogVisible.value = true
}

function openQuota(item) {
  editing.value = item
  resetForm()
  form.subAccountQuota = item.subAccountQuota
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  editing.value = null
  resetForm()
}

function openSubAccountResult({ isEdit, accountName, loginName, quota }) {
  noticeVisible.value = false
  noticeType.value = 'success'
  noticeTitle.value = isEdit ? '额度调整成功' : '子账号添加成功'
  noticeMessage.value = isEdit
    ? `「${accountName}」的可使用额度已更新为 ¥${formatMoney(quota)}。`
    : `「${accountName}」已创建，登录账号：${loginName || '-'}。`
  window.setTimeout(() => {
    noticeVisible.value = true
  }, 0)
}

async function submit() {
  message.value = ''
  if (!editing.value && !form.userName) return (message.value = '请输入登录账号')
  if (!editing.value && !form.password) return (message.value = '请输入初始密码')
  if (form.subAccountQuota === '' || Number(form.subAccountQuota) < 0) return (message.value = '请输入正确的额度')
  if (Number(form.subAccountQuota) > maxQuotaForForm.value) {
    return (message.value = `额度超出主账号可分配范围，本次最高可设置 ¥${formatMoney(maxQuotaForForm.value)}`)
  }
  saving.value = true
  try {
    const resultInfo = {
      isEdit: Boolean(editing.value),
      accountName: editing.value?.nickName || editing.value?.userName || form.nickName || form.userName || '子账号',
      loginName: editing.value?.userName || form.userName,
      quota: form.subAccountQuota
    }
    if (editing.value) await updateSubAccountQuota(editing.value.userId, { subAccountQuota: form.subAccountQuota })
    else await createSubAccount({ ...form })
    closeDialog()
    await Promise.all([loadProfile(), loadList()])
    openSubAccountResult(resultInfo)
  } catch (error) {
    message.value = error?.msg || error?.message || '提交失败'
    noticeVisible.value = false
    noticeType.value = 'error'
    noticeTitle.value = editing.value ? '额度调整失败' : '子账号添加失败'
    noticeMessage.value = message.value
    window.setTimeout(() => {
      noticeVisible.value = true
    }, 0)
  } finally {
    saving.value = false
  }
}

function openDeleteConfirm(item) {
  deleteTarget.value = item
}

function closeDeleteConfirm() {
  if (!deleting.value) deleteTarget.value = null
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteSubAccount(deleteTarget.value.userId)
    deleteTarget.value = null
    await loadList()
  } finally {
    deleting.value = false
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
    detailRows.value = res.rows || res.data || []
    detailTotal.value = Number(res.total || detailRows.value.length || 0)
  } finally {
    detailLoading.value = false
  }
}

function changeDetailPageSize(size) {
  detailPage.pageSize = size
  detailPage.pageNum = 1
  loadDetail()
}

function goDetailPage(target) {
  detailPage.pageNum = target
  loadDetail()
}

onMounted(async () => {
  await Promise.all([loadQueryTypes(), loadProfile()])
  if (!isSubAccount.value) await loadList()
})
</script>

<style scoped>
.required{color:var(--error);font-weight:400}
.table-tools{display:flex;align-items:center;gap:10px}
.refresh-btn{height:34px;padding:0 14px}
.sub-account-add-btn{width:104px;height:34px;font-weight:600}
.sub-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.remain-cell{color:var(--success);font-weight:600}
.sub-no-permission{text-align:center;padding:52px 40px}
.sub-no-permission h2{font-size:22px;color:var(--text1);margin:12px 0 8px}
.sub-no-permission p{color:var(--text2);line-height:1.7}
.sub-shield{width:52px;height:52px;margin:0 auto;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center}
.sub-shield svg{width:27px;height:27px}
.sub-quota-view{margin:26px auto 0;max-width:760px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;text-align:left}
.sub-quota-view div{padding:18px 20px;border:1px solid var(--border);background:#F8FAFC}
.sub-quota-view span{display:block;color:var(--text2);font-size:13px}
.sub-quota-view strong{display:block;margin-top:8px;color:var(--text1);font-size:22px}
.sub-quota-view div:last-child strong{color:var(--success)}
.sub-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}
.quota-field{grid-column:1 / -1}
.quota-field .field-input::-webkit-outer-spin-button,
.quota-field .field-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.quota-field .field-input{appearance:textfield;-moz-appearance:textfield}
.quota-field small{font-size:12px;color:var(--text3);margin-top:-2px}
.detail-tabs{padding:14px 24px 12px;border-bottom:1px solid var(--border);display:flex;gap:10px;background:#fff}
.detail-tabs button{height:36px;padding:0 16px;border:1px solid var(--border);background:#fff;color:var(--text2);font-weight:600;cursor:pointer;font-family:inherit}
.detail-tabs button.active{color:var(--primary);border-color:var(--primary);background:var(--primary-light)}
.detail-body{overflow:auto;max-height:56vh;padding:0 24px 18px;background:#fff}
.detail-table{width:100%;min-width:900px;border-collapse:collapse;table-layout:auto;border:1px solid var(--border)}
.ledger-table{min-width:1080px}
.detail-table th{position:sticky;top:0;height:44px;background:#F8FAFC;color:var(--text2);text-align:center;padding:0 16px;border-bottom:1px solid var(--border);font-size:12px;font-weight:600;white-space:nowrap}
.detail-table td{height:50px;padding:0 16px;border-bottom:1px solid var(--border2);white-space:nowrap;text-align:center}
.detail-table th:first-child,.detail-table td:first-child{padding-left:16px}
.detail-table th:last-child,.detail-table td:last-child{padding-right:16px}
.ledger-amount{font-weight:700}
.ledger-amount.plus{color:var(--success)}
.ledger-amount.minus{color:var(--error)}
.ledger-amount.frozen{color:var(--warning)}
.ledger-type{font-size:13px;font-weight:600}
.ledger-type.add{color:var(--success)}
.ledger-type.sub{color:var(--error)}
.ledger-serial{font-size:14px}
.record-actions{display:flex;align-items:center;gap:14px}
.action-btn{padding:0;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:500;line-height:inherit}
.action-plain{font-size:13px;color:var(--text3);font-weight:500;white-space:nowrap}
.detail-business-footer{width:100%;border-top:0;padding:0;min-height:32px}
.delete-confirm-card{max-width:420px;padding:30px 32px;text-align:center}
.delete-confirm-icon{width:48px;height:48px;margin:0 auto 16px;background:var(--error-bg);color:var(--error);display:flex;align-items:center;justify-content:center}
.delete-confirm-icon svg{width:26px;height:26px}
.delete-confirm-title{font-size:18px;font-weight:700;color:var(--text1);margin-bottom:10px}
.delete-confirm-desc{font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:24px}
.delete-confirm-desc strong{color:var(--text1);font-weight:700}
.delete-confirm-actions{display:flex;justify-content:center;gap:12px}
.delete-confirm-actions .btn-primary,.delete-confirm-actions .btn-outline{height:40px;min-width:104px;justify-content:center}
.danger-btn{background:var(--error)}
@media (max-width:1100px){
  .sub-form-grid,.sub-quota-view{grid-template-columns:1fr}
}
</style>
