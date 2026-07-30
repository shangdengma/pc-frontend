<template>
  <main class="main-content">
    <!-- 统计 -->
    <div class="stat-row">
      <div class="stat-cell">
        <span class="stat-cell-label">全部发票</span>
        <span class="stat-cell-value">{{ stats.total }}</span>
        <span class="stat-cell-sub">累计申请</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">待处理</span>
        <span class="stat-cell-value warning">{{ stats.pending + stats.processing }}</span>
        <span class="stat-cell-sub">等待审核</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">已开票</span>
        <span class="stat-cell-value success">{{ stats.issued }}</span>
        <span class="stat-cell-sub">已完成</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">已驳回</span>
        <span class="stat-cell-value error">{{ stats.rejected }}</span>
        <span class="stat-cell-sub">需重新申请</span>
      </div>
    </div>

    <FormAlert class="invoice-page-alert" :message="pageMsg" type="error" />

    <!-- 表格 -->
    <div class="table-section business-list-shell">
      <div class="table-header">
        <h2>开票记录</h2>
        <button class="btn-mini invoice-apply-btn" :disabled="isSubAccount" @click="openAdd">
          {{ isSubAccount ? '请联系主账号开票' : '我要开票' }}
        </button>
      </div>
      <div class="table-content">
        <table class="business-list-table">
          <thead>
            <tr>
              <th style="width:26%">发票抬头</th>
              <th style="width:14%">发票类型</th>
              <th style="width:12%">金额</th>
              <th style="width:12%">状态</th>
              <th style="width:16%">申请时间</th>
              <th style="width:20%">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in pagedInvoices" :key="inv.id">
              <td class="td-name">{{ inv.title }}</td>
              <td>{{ typeLabel(inv.types) }}</td>
              <td>¥{{ inv.amount.toFixed(2) }}</td>
              <td>
                <span class="status-badge" :class="invStatusClass(inv.status)">{{ inv.statusLabel }}</span>
              </td>
              <td class="td-date">{{ inv.time }}</td>
              <td>
                <div class="action-group">
                  <span class="action-link" @click="openDetail(inv)">详情</span>
                </div>
              </td>
            </tr>
            <tr v-if="list.length===0"><td colspan="6" class="table-empty">暂无开票记录</td></tr>
          </tbody>
        </table>
      </div>
      <BusinessTableFooter
        v-if="list.length > 0"
        :total="list.length"
        :page="invoicePage"
        :page-size="invoicePageSize"
        :total-pages="invoiceTotalPages"
        @update:page-size="changeInvoicePageSize"
        @page-change="goInvoicePage"
      />
    </div>

    <!-- 申请开票弹窗 -->
    <div
      v-if="showAdd"
      class="modal-mask"
      @pointerdown="invoiceBackdropGuard.pointerDown"
      @click.self="invoiceBackdropGuard.click(closeAdd)"
    >
      <div class="modal-card">
        <h3 class="modal-title">填写开票信息</h3>
        <label class="field">
          <span class="field-label">发票类型 <span class="required">*</span></span>
          <select v-model="addForm.types" class="field-input">
            <option value="normal">普通发票</option>
            <option value="special">增值税专用发票</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">企业名称 <span class="required">*</span></span>
          <input v-model.trim="addForm.title" class="field-input" placeholder="请输入企业完整名称" />
        </label>
        <label class="field">
          <span class="field-label">纳税人识别号 <span class="required">*</span></span>
          <input v-model.trim="addForm.taxno" class="field-input" placeholder="请输入15-20位统一社会信用代码" />
        </label>
        <label class="field">
          <span class="field-label">开票金额（元） <span class="required">*</span></span>
          <input v-model.trim="addForm.amount" class="field-input" inputmode="decimal" placeholder="请输入需开票的金额" />
        </label>
        <template v-if="addForm.types === 'special'">
          <label class="field">
            <span class="field-label">注册地址</span>
            <input v-model.trim="addForm.registeraddress" class="field-input" placeholder="请输入注册地址" />
          </label>
          <label class="field">
            <span class="field-label">开户行</span>
            <input v-model.trim="addForm.bankname" class="field-input" placeholder="请输入开户行" />
          </label>
          <label class="field">
            <span class="field-label">银行账号</span>
            <input v-model.trim="addForm.bankaccount" class="field-input" placeholder="请输入银行账号" />
          </label>
        </template>
        <label class="field">
          <span class="field-label">备注说明（选填）</span>
          <textarea v-model.trim="addForm.remark" class="field-input invoice-remark-input" placeholder="如有特殊要求请在此备注"></textarea>
        </label>
        <FormAlert :message="addMsg" type="error" />
        <div class="modal-actions">
          <button class="btn-outline" @click="closeAdd">取消</button>
          <button class="btn-primary" @click="onAdd">提交申请</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <AppModal
      v-model="detailOpen"
      :title="detail?.title || '发票详情'"
      eyebrow="发票详情"
      :description="detail ? `申请编号：INV-${detail.id.toString().padStart(6, '0')}` : ''"
      size="md"
    >
      <template v-if="detail">
        <div class="message-detail-body invoice-detail-body">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">发票抬头</span><span class="detail-value">{{ detail.title }}</span></div>
            <div class="detail-item"><span class="detail-label">发票类型</span><span class="detail-value">{{ typeLabel(detail.types) }}</span></div>
            <div class="detail-item"><span class="detail-label">开票金额</span><span class="detail-value">¥{{ detail.amount.toFixed(2) }}</span></div>
            <div class="detail-item"><span class="detail-label">申请时间</span><span class="detail-value">{{ detail.time }}</span></div>
            <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value"><span class="status-badge" :class="invStatusClass(detail.status)">{{ detail.statusLabel }}</span></span></div>
            <div class="detail-item"><span class="detail-label">纳税人识别号</span><span class="detail-value">{{ detail.taxno || '-' }}</span></div>
            <div class="detail-item" v-if="detail.registeraddress"><span class="detail-label">注册地址</span><span class="detail-value">{{ detail.registeraddress }}</span></div>
            <div class="detail-item" v-if="detail.bankname"><span class="detail-label">开户行</span><span class="detail-value">{{ detail.bankname }}</span></div>
            <div class="detail-item" v-if="detail.bankaccount"><span class="detail-label">银行账号</span><span class="detail-value">{{ detail.bankaccount }}</span></div>
            <div class="detail-item"><span class="detail-label">备注说明</span><span class="detail-value">{{ detail.remark || '-' }}</span></div>
            <div class="detail-item" v-if="detail.status === 'rejected' && detail.rejectReason"><span class="detail-label">驳回原因</span><span class="detail-value error">{{ detail.rejectReason }}</span></div>
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-primary invoice-confirm-btn" type="button" @click="detail = null">确认</button>
      </template>
    </AppModal>

    <ResultModal
      v-model="resultVisible"
      type="success"
      title="开票申请已提交"
      description="开票信息已进入处理流程，可在开票记录中查看状态。"
      :details="resultDetails"
      primary-text="确认"
      @primary="resultVisible = false"
      @close="resultVisible = false"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { addInvoice, listInvoices } from '../api/invoice'
import { getUserProfile } from '../api/user'
import AppModal from '../components/AppModal.vue'
import BusinessTableFooter from '../components/BusinessTableFooter.vue'
import FormAlert from '../components/FormAlert.vue'
import ResultModal from '../components/ResultModal.vue'
import { createBackdropGuard } from '../utils/backdropGuard'

const list = ref([])
const profile = ref({})
const invoicePage = ref(1)
const invoicePageSize = ref(10)
const showAdd = ref(false)
const detail = ref(null)

const stats = computed(() => ({
  total: list.value.length,
  pending: list.value.filter(i => i.status === 'pending').length,
  processing: list.value.filter(i => i.status === 'processing').length,
  issued: list.value.filter(i => i.status === 'issued').length,
  rejected: list.value.filter(i => i.status === 'rejected').length
}))
const isSubAccount = computed(() => profile.value.parentUserId != null || profile.value.accountType === 'sub')
const invoiceTotalPages = computed(() => Math.max(1, Math.ceil(list.value.length / invoicePageSize.value)))
const pagedInvoices = computed(() => {
  const start = (invoicePage.value - 1) * invoicePageSize.value
  return list.value.slice(start, start + invoicePageSize.value)
})
const detailOpen = computed({
  get: () => !!detail.value,
  set: value => {
    if (!value) detail.value = null
  }
})

const pageMsg = ref('')
const addMsg = ref('')
const resultVisible = ref(false)
const resultDetails = ref([])
const invoiceBackdropGuard = createBackdropGuard()
const addForm = ref({ types:'normal', title:'', taxno:'', amount:'', remark:'', registeraddress:'', bankname:'', bankaccount:'' })

function invStatusClass(s) {
  const m = { pending: 'warning', processing: 'primary', issued: 'success', rejected: 'error' }
  return m[s] || 'neutral'
}

function statusLabel(status) {
  const map = { pending: '待处理', processing: '处理中', issued: '已开票', rejected: '已驳回' }
  return map[status] || '未知'
}

function normalizeType(item) {
  const value = item.types || item.type || item.invoiceType || 'normal'
  return value === 'general' ? 'normal' : value
}

function typeLabel(type) {
  return type === 'special' ? '增值税专用发票' : '普通发票'
}

function mapInvoice(item) {
  const types = normalizeType(item)
  return {
    id: item.id,
    title: item.title || item.invoiceTitle,
    types,
    type: types === 'normal' ? 'general' : 'special',
    amount: Number(item.amount || 0),
    status: item.status || 'pending',
    statusLabel: statusLabel(item.status || 'pending'),
    time: String(item.createdate || item.createTime || item.time || '').slice(0, 10),
    rejectReason: item.rejectReason || '',
    taxno: item.taxno || item.taxNo || '',
    remark: item.remark || '',
    registeraddress: item.registeraddress || item.address || '',
    bankname: item.bankname || item.bank || '',
    bankaccount: item.bankaccount || item.account || ''
  }
}

async function fetchInvoices() {
  pageMsg.value = ''
  try {
    const res = await listInvoices({ pageNum: 1, pageSize: 100 })
    list.value = (res.rows || []).map(mapInvoice)
    if (invoicePage.value > invoiceTotalPages.value) invoicePage.value = invoiceTotalPages.value
  } catch (error) {
    list.value = []
    pageMsg.value = error?.msg || error?.message || '获取发票记录失败'
  }
}

async function loadProfile() {
  const res = await getUserProfile()
  profile.value = res.data || res.user || {}
}

function openAdd() {
  addMsg.value = ''
  if (isSubAccount.value) {
    addMsg.value = '子账号无权申请发票，请联系主账号开票'
    return
  }
  showAdd.value = true
}

function closeAdd() {
  showAdd.value = false
  addMsg.value = ''
}

async function onAdd() {
  addMsg.value = ''
  if (isSubAccount.value) return (addMsg.value = '子账号无权申请发票，请联系主账号开票')
  if (!addForm.value.title) return (addMsg.value = '请输入企业名称')
  if (!addForm.value.taxno) return (addMsg.value = '请输入纳税人识别号')
  if (!addForm.value.amount) return (addMsg.value = '请输入开票金额')
  const amount = Number(addForm.value.amount)
  if (!Number.isFinite(amount) || amount <= 0) return (addMsg.value = '开票金额必须大于0')
  try {
    const resultInfo = {
      title: addForm.value.title,
      type: typeLabel(addForm.value.types),
      amount
    }
    await addInvoice({ ...addForm.value, amount })
    await fetchInvoices()
    closeAdd()
    addForm.value = { types:'normal', title:'', taxno:'', amount:'', remark:'', registeraddress:'', bankname:'', bankaccount:'' }
    resultDetails.value = [
      { label: '发票抬头', value: resultInfo.title },
      { label: '发票类型', value: resultInfo.type },
      { label: '开票金额', value: `¥${resultInfo.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, tone: 'primary' }
    ]
    resultVisible.value = true
  } catch (error) {
    addMsg.value = error?.msg || error?.message || '提交发票申请失败'
  }
}
function openDetail(item) { detail.value = item }
function changeInvoicePageSize(size) {
  invoicePageSize.value = size
  invoicePage.value = 1
}
function goInvoicePage(target) {
  invoicePage.value = target
}

onMounted(async () => {
  await loadProfile()
  await fetchInvoices()
})
</script>

<style scoped>
.stat-cell-value.warning{color:var(--warning)}
.stat-cell-value.success{color:var(--success)}
.stat-cell-value.error{color:var(--error)}
.invoice-page-alert{margin-top:0}

.required{color:var(--error);font-weight:400}
.action-group{display:flex;align-items:center;gap:16px}
.invoice-apply-btn{width:96px;height:34px;font-weight:600}
.invoice-remark-input{height:88px;resize:none;padding-top:11px;line-height:1.5}

.invoice-detail-body{padding:0;background:#fff}
.detail-grid{display:flex;flex-direction:column;gap:14px}
.detail-item{display:flex;justify-content:space-between;align-items:center;gap:18px;font-size:14px;line-height:1.6}
.detail-label{color:var(--text2)}
.detail-value{font-weight:500;color:var(--text1);text-align:right;overflow-wrap:anywhere}
.detail-value.error{color:var(--error)}
.invoice-confirm-btn{height:34px;min-width:82px;padding:0 18px;justify-content:center;margin-left:auto}
</style>
