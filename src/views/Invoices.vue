<template>
  <section class="invoice-page">
    <div class="invoice-hero">
      <div>
        <p class="eyebrow">账户中心</p>
        <h2>我的发票</h2>
        <p>{{ isSubAccount ? '子账号可查看自己的开票记录，如需开票请联系主账号。' : '查看开票申请记录、处理进度和企业开票信息。' }}</p>
      </div>
      <button class="primary-btn invoice-apply-btn" :disabled="isSubAccount" :title="isSubAccount ? '子账号无权申请发票，请联系主账号开票' : ''" @click="openApplyDialog">
        {{ isSubAccount ? '请联系主账号开票' : '我要开票' }}
      </button>
    </div>

    <div class="invoice-stats">
      <div class="stat-card total">
        <div class="stat-info">
          <span>全部申请</span>
          <strong>{{ invoiceList.length }}</strong>
        </div>
        <span class="stat-icon">
          <FileText :size="19" :stroke-width="1.8" />
        </span>
      </div>
      <div class="stat-card pending">
        <div class="stat-info">
          <span>待处理</span>
          <strong>{{ statusCount.pending + statusCount.processing }}</strong>
        </div>
        <span class="stat-icon">
          <Clock3 :size="19" :stroke-width="1.8" />
        </span>
      </div>
      <div class="stat-card issued">
        <div class="stat-info">
          <span>已开票</span>
          <strong>{{ statusCount.issued }}</strong>
        </div>
        <span class="stat-icon">
          <BadgeCheck :size="19" :stroke-width="1.8" />
        </span>
      </div>
      <div class="stat-card rejected">
        <div class="stat-info">
          <span>已驳回</span>
          <strong>{{ statusCount.rejected }}</strong>
        </div>
        <span class="stat-icon">
          <CircleX :size="19" :stroke-width="1.8" />
        </span>
      </div>
    </div>

    <div class="invoice-panel">
      <div class="invoice-panel-head">
        <div>
          <h3>开票记录</h3>
        </div>
        <button class="ghost-btn" :disabled="loading" @click="fetchInvoices">
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
      </div>

      <div class="invoice-table-wrap">
        <table class="invoice-table">
          <thead>
            <tr>
              <th>申请时间</th>
              <th>发票抬头</th>
              <th>发票金额</th>
              <th>开票状态</th>
              <th>发票详情</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody v-if="invoiceList.length">
            <tr v-for="item in invoiceList" :key="item.id">
              <td>{{ item.createdate || '-' }}</td>
              <td class="title-cell">{{ item.title || '-' }}</td>
              <td class="amount-cell">{{ formatAmount(item.amount) }}</td>
              <td>
                <span class="invoice-status" :class="statusMeta(item.status).className">
                  {{ statusMeta(item.status).label }}
                </span>
              </td>
              <td>
                <div class="detail-lines">
                  <span>{{ typeLabel(item.types) }}</span>
                  <span v-if="item.taxno">税号：{{ item.taxno }}</span>
                  <span v-if="item.remark">备注：{{ item.remark }}</span>
                </div>
              </td>
              <td>
                <button class="text-btn" @click="showDetail(item)">查看详情</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!invoiceList.length" class="invoice-empty">
          <div class="empty-illustration">
            <span></span>
          </div>
          <strong>{{ loading ? '正在加载发票记录' : '暂无开票记录' }}</strong>
          <p>{{ isSubAccount ? '子账号无权申请发票，请联系主账号开票。' : '需要开票时，点击右上角“我要开票”提交申请。' }}</p>
        </div>
      </div>
    </div>

    <div v-if="applyVisible" class="invoice-modal-mask" @click.self="closeApplyDialog">
      <div class="invoice-modal apply-modal">
        <button class="dialog-close" type="button" @click="closeApplyDialog">×</button>
        <div class="modal-head">
          <p class="eyebrow">发票申请</p>
          <h3>填写开票信息</h3>
          <span>带 * 为必填项</span>
        </div>

        <form class="invoice-form" @submit.prevent="submitInvoice">
          <label>
            <span>发票类型 <b>*</b></span>
            <select v-model="form.types">
              <option value="normal">普通发票</option>
              <option value="special">增值税专用发票</option>
            </select>
          </label>
          <label>
            <span>企业名称 <b>*</b></span>
            <input v-model.trim="form.title" placeholder="请输入企业完整名称" />
          </label>
          <label>
            <span>纳税人识别号 <b>*</b></span>
            <input v-model.trim="form.taxno" placeholder="请输入15-20位统一社会信用代码" />
          </label>
          <label>
            <span>开票金额（元） <b>*</b></span>
            <input v-model.trim="form.amount" placeholder="请输入需开票的金额" inputmode="decimal" />
          </label>
          <label v-if="form.types === 'special'" class="span-2">
            <span>注册地址</span>
            <input v-model.trim="form.registeraddress" placeholder="请输入注册地址" />
          </label>
          <label v-if="form.types === 'special'">
            <span>开户行</span>
            <input v-model.trim="form.bankname" placeholder="请输入开户行" />
          </label>
          <label v-if="form.types === 'special'">
            <span>银行账号</span>
            <input v-model.trim="form.bankaccount" placeholder="请输入银行账号" />
          </label>
          <label class="span-2">
            <span>备注说明（选填）</span>
            <textarea v-model.trim="form.remark" placeholder="如有特殊要求请在此备注"></textarea>
          </label>

          <div v-if="message" class="form-message" :class="messageType">{{ message }}</div>
          <div class="form-actions">
            <button class="ghost-btn" type="button" @click="closeApplyDialog">取消</button>
            <button class="primary-btn" type="submit" :disabled="submitting">
              {{ submitting ? '提交中...' : '提交申请' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="detail" class="invoice-modal-mask" @click.self="detail = null">
      <div class="invoice-modal detail-modal">
        <button class="dialog-close" type="button" @click="detail = null">×</button>
        <div class="modal-head">
          <p class="eyebrow">发票详情</p>
          <h3>{{ detail.title || '发票申请' }}</h3>
          <span>{{ detail.createdate || '-' }}</span>
        </div>
        <div class="detail-grid">
          <span>发票类型</span><strong>{{ typeLabel(detail.types) }}</strong>
          <span>处理状态</span><strong>{{ statusMeta(detail.status).label }}</strong>
          <span>发票金额</span><strong>{{ formatAmount(detail.amount) }}</strong>
          <span>纳税人识别号</span><strong>{{ detail.taxno || '-' }}</strong>
          <span v-if="detail.registeraddress">注册地址</span><strong v-if="detail.registeraddress">{{ detail.registeraddress }}</strong>
          <span v-if="detail.bankname">开户行</span><strong v-if="detail.bankname">{{ detail.bankname }}</strong>
          <span v-if="detail.bankaccount">银行账号</span><strong v-if="detail.bankaccount">{{ detail.bankaccount }}</strong>
          <span>备注说明</span><strong>{{ detail.remark || '-' }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { BadgeCheck, CircleX, Clock3, FileText } from '@lucide/vue'
import { addInvoice, listInvoices } from '../api/invoice'
import { getUserProfile } from '../api/user'
import { getUser, setUser } from '../utils/auth'

const loading = ref(false)
const submitting = ref(false)
const applyVisible = ref(false)
const invoiceList = ref([])
const detail = ref(null)
const message = ref('')
const messageType = ref('info')
const profile = ref(getUser() || {})
const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))

const form = reactive({
  types: 'normal',
  title: '',
  taxno: '',
  amount: '',
  remark: '',
  registeraddress: '',
  bankname: '',
  bankaccount: ''
})

const statusCount = computed(() => invoiceList.value.reduce((acc, item) => {
  const key = statusMeta(item.status).className
  acc[key] = (acc[key] || 0) + 1
  return acc
}, { pending: 0, processing: 0, issued: 0, rejected: 0 }))

function resetForm() {
  form.types = 'normal'
  form.title = ''
  form.taxno = ''
  form.amount = ''
  form.remark = ''
  form.registeraddress = ''
  form.bankname = ''
  form.bankaccount = ''
}

function openApplyDialog() {
  if (isSubAccount.value) {
    messageType.value = 'error'
    message.value = '子账号无权申请发票，请联系主账号开票'
    return
  }
  message.value = ''
  messageType.value = 'info'
  applyVisible.value = true
}

function closeApplyDialog() {
  if (submitting.value) return
  applyVisible.value = false
}

function typeLabel(type) {
  return type === 'special' ? '增值税专用发票' : '普通发票'
}

function statusMeta(status) {
  const map = {
    pending: { label: '待处理', className: 'pending' },
    processing: { label: '处理中', className: 'processing' },
    issued: { label: '已开票', className: 'issued' },
    rejected: { label: '已驳回', className: 'rejected' }
  }
  return map[status] || map.pending
}

function formatAmount(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return value ? `¥${value}` : '-'
  return `¥${num.toFixed(2)}`
}

function validateForm() {
  if (!form.title) return '请输入企业名称'
  if (!form.taxno) return '请输入纳税人识别号'
  if (!form.amount) return '请输入开票金额'
  const amount = Number(form.amount)
  if (!Number.isFinite(amount) || amount <= 0) return '开票金额必须大于0'
  return ''
}

async function fetchInvoices() {
  loading.value = true
  try {
    const res = await listInvoices({ pageNum: 1, pageSize: 100 })
    invoiceList.value = res.rows || []
  } catch (err) {
    messageType.value = 'error'
    message.value = err?.msg || '获取发票记录失败'
  } finally {
    loading.value = false
  }
}

async function submitInvoice() {
  if (isSubAccount.value) {
    messageType.value = 'error'
    message.value = '子账号无权申请发票，请联系主账号开票'
    return
  }
  const error = validateForm()
  if (error) {
    messageType.value = 'error'
    message.value = error
    return
  }
  submitting.value = true
  message.value = ''
  try {
    await addInvoice({ ...form })
    resetForm()
    await fetchInvoices()
    applyVisible.value = false
  } catch (err) {
    messageType.value = 'error'
    message.value = err?.msg || '提交发票申请失败'
  } finally {
    submitting.value = false
  }
}

function showDetail(item) {
  detail.value = item
}

async function loadProfile() {
  try {
    const res = await getUserProfile()
    const user = res.data || res.user || {}
    profile.value = user
    setUser(user)
  } catch (error) {}
}

onMounted(async () => {
  await loadProfile()
  await fetchInvoices()
})
</script>

<style scoped>
.invoice-page {
  width: min(1480px, 100%);
  margin: 0 auto;
}

.invoice-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  min-height: 104px;
  margin-bottom: 16px;
  padding: 22px 24px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: #101828;
  background: #ffffff;
  box-shadow: var(--shadow-panel);
}

.eyebrow {
  margin: 0 0 8px;
  color: #2f6fe4;
  font-size: 13px;
  font-weight: 700;
}

.invoice-hero h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.invoice-hero p:last-child {
  margin: 10px 0 0;
  color: var(--muted);
}

.invoice-apply-btn {
  flex: none;
  min-width: 138px;
  background: #2f6fe4;
  color: #ffffff;
  box-shadow: none;
}

.invoice-apply-btn:disabled {
  color: #64748b;
  background: #e5ecf6;
  box-shadow: none;
  cursor: not-allowed;
}

.invoice-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.stat-card:hover {
  border-color: #cddcf6;
  background: #fbfdff;
}

.stat-card span {
  color: var(--muted);
  font-size: 13px;
}

.stat-card strong {
  display: block;
  margin-top: 10px;
  color: #101828;
  font-size: 28px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-icon {
  width: 42px;
  height: 42px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 8px;
}

.stat-icon svg {
  width: 20px;
  height: 20px;
}

.stat-card.total .stat-icon { color: #2f6fe4; background: #eaf1ff; }
.stat-card.pending .stat-icon { color: #d97706; background: #fff7ed; }
.stat-card.issued .stat-icon { color: #067647; background: #ecfdf3; }
.stat-card.rejected .stat-icon { color: #d92d20; background: #fef3f2; }

.invoice-panel {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: var(--shadow-panel);
}

.invoice-panel-head {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 20px;
  border-bottom: 1px solid var(--line);
}

.invoice-panel-head h3 {
  margin: 0;
  font-size: 18px;
}

.invoice-panel-head p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.invoice-table-wrap {
  position: relative;
  min-height: 430px;
  overflow-x: auto;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 980px;
}

.invoice-table th {
  height: 54px;
  padding: 0 18px;
  color: #52627a;
  background: #f6f9fd;
  border-bottom: 1px solid #e8eef7;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
}

.invoice-table td {
  min-height: 62px;
  padding: 16px 18px;
  color: #344054;
  border-bottom: 1px solid #edf2f7;
  word-break: break-word;
}

.invoice-table tbody tr {
  transition: background 0.15s ease;
}

.invoice-table tbody tr:hover td {
  background: #f8fbff;
}

.title-cell {
  color: #111827;
  font-weight: 700;
}

.amount-cell {
  color: #17376d;
  font-weight: 800;
}

.invoice-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.invoice-status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.invoice-status.pending { color: #b54708; background: #fffaeb; }
.invoice-status.processing { color: #175cd3; background: #eff8ff; }
.invoice-status.issued { color: #067647; background: #ecfdf3; }
.invoice-status.rejected { color: #b42318; background: #fef3f2; }

.detail-lines {
  display: grid;
  gap: 4px;
  color: #667085;
  font-size: 13px;
  text-align: left;
}

.text-btn {
  color: var(--blue);
  background: transparent;
  border: 0;
  font-weight: 700;
}

.invoice-empty {
  min-height: 360px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  color: #98a2b3;
}

.invoice-empty p {
  margin: 0;
  color: #667085;
  font-size: 13px;
}

.empty-illustration {
  position: relative;
  width: 118px;
  height: 128px;
  opacity: 0.65;
}

.empty-illustration::before {
  content: '';
  position: absolute;
  left: 25px;
  top: 24px;
  width: 72px;
  height: 92px;
  border: 5px solid #d5deea;
  border-radius: 8px;
  transform: rotate(-20deg);
}

.empty-illustration::after {
  content: '';
  position: absolute;
  left: 58px;
  top: 62px;
  width: 18px;
  height: 62px;
  border-radius: 999px;
  background: #d5deea;
  transform: rotate(28deg);
}

.empty-illustration span::before,
.empty-illustration span::after {
  content: '';
  position: absolute;
  background: #d5deea;
  border-radius: 999px;
}

.empty-illustration span::before {
  left: 84px;
  top: 18px;
  width: 8px;
  height: 28px;
  transform: rotate(42deg);
}

.empty-illustration span::after {
  left: 64px;
  top: 2px;
  width: 8px;
  height: 26px;
  transform: rotate(-14deg);
}

.invoice-empty strong {
  color: #667085;
  font-size: 16px;
}

.invoice-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 32px;
  background: rgba(15, 23, 42, 0.46);
}

.invoice-modal {
  position: relative;
  width: min(760px, 100%);
  max-height: calc(100vh - 64px);
  overflow: auto;
  padding: 28px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
}

.detail-modal {
  width: min(620px, 100%);
}

.dialog-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  color: #667085;
  background: #f2f4f7;
  font-size: 24px;
  line-height: 1;
}

.modal-head {
  margin-bottom: 22px;
  padding-right: 42px;
}

.modal-head .eyebrow {
  color: #2f6fe4;
}

.modal-head h3 {
  margin: 0;
  color: #101828;
  font-size: 22px;
}

.modal-head span {
  display: block;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
}

.invoice-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.invoice-form label {
  display: grid;
  gap: 8px;
  color: #344054;
  font-size: 13px;
  font-weight: 700;
}

.invoice-form b {
  color: #ef4444;
}

.invoice-form input,
.invoice-form select,
.invoice-form textarea {
  width: 100%;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  color: #101828;
  background: #ffffff;
  outline: none;
}

.invoice-form input,
.invoice-form select {
  height: 44px;
  padding: 0 14px;
}

.invoice-form textarea {
  min-height: 96px;
  padding: 12px 14px;
  resize: vertical;
  font: inherit;
}

.invoice-form input:focus,
.invoice-form select:focus,
.invoice-form textarea:focus {
  border-color: #2f6fe4;
  box-shadow: 0 0 0 3px rgba(47, 111, 228, 0.1);
}

.span-2,
.form-message,
.form-actions {
  grid-column: 1 / -1;
}

.form-message {
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px 16px;
  padding-top: 4px;
}

.detail-grid span {
  color: #667085;
}

.detail-grid strong {
  color: #101828;
  word-break: break-word;
}

@media (max-width: 1100px) {
  .invoice-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .invoice-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .invoice-apply-btn {
    width: 100%;
  }

  .invoice-stats {
    grid-template-columns: 1fr;
  }

  .invoice-form {
    grid-template-columns: 1fr;
  }

  .invoice-modal-mask {
    padding: 16px;
  }
}
</style>
