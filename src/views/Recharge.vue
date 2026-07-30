<template>
  <main class="main-content">
    <!-- 余额概览 -->
    <div class="stat-row">
      <div class="stat-cell">
        <span class="stat-cell-label">当前余额</span>
        <span class="stat-cell-value primary">¥ {{ balance }}</span>
        <span class="stat-cell-sub">
          <router-link to="/recharge/ledger" class="ledger-btn">
            查看流水
          </router-link>
        </span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">本月已用</span>
        <span class="stat-cell-value">{{ summaryMoney(rechargeSummary.monthUsedFen) }}</span>
        <span class="stat-cell-sub">{{ summaryCount(rechargeSummary.monthUsedCount, '背调消费') }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">本月充值</span>
        <span class="stat-cell-value">{{ summaryMoney(rechargeSummary.monthRechargeFen) }}</span>
        <span class="stat-cell-sub">{{ summaryCount(rechargeSummary.monthRechargeCount) }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell-label">累计充值</span>
        <span class="stat-cell-value">{{ summaryMoney(rechargeSummary.totalRechargeFen) }}</span>
        <span class="stat-cell-sub">{{ rechargeSummary.sinceDate ? `自 ${rechargeSummary.sinceDate} 起` : '--' }}</span>
      </div>
    </div>

    <div class="recharge-layout">
      <div class="recharge-main">
        <div class="card">
          <h3 class="card-title">选择充值套餐</h3>
          <div class="package-grid">
            <div v-for="p in packages" :key="p.id" class="package-card" :class="{ selected: form.packageId === p.id }" @click="selectPackage(p.id)">
              <div class="pkg-name">{{ p.name }}</div>
              <div class="pkg-price">¥{{ p.amount.toLocaleString() }}</div>
              <div class="pkg-arrive">到账 ¥{{ p.arrive.toLocaleString() }}</div>
              <div v-if="p.benefits.length" class="pkg-divider"></div>
              <ul v-if="p.benefits.length" class="pkg-benefits">
                <li v-for="(b, i) in p.benefits" :key="i">{{ b }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">选择支付方式</h3>
          <div class="pay-methods">
            <label v-for="m in payMethods" :key="m.key" class="pay-method" :class="{ active: form.payMethod === m.key }">
              <input type="radio" :value="m.key" v-model="form.payMethod" class="pay-radio" />
              <span class="pay-icon">
                <img v-if="m.iconType === 'img'" :src="m.icon" :alt="m.label" class="pay-img" />
                <span v-else v-html="m.icon"></span>
              </span>
              <span class="pay-label">{{ m.label }}</span>
              <span class="pay-desc">{{ m.desc }}</span>
            </label>
          </div>
        </div>

        <div class="card summary-card">
          <h3 class="card-title">充值确认</h3>
          <div class="confirm-rows">
            <div class="confirm-row">
              <span class="confirm-label">充值金额</span>
              <span class="confirm-value">¥{{ selectedAmount.toLocaleString() }}</span>
            </div>
            <div class="confirm-row" v-if="selectedBonus > 0">
              <span class="confirm-label">赠送金额</span>
              <span class="confirm-value bonus">+ ¥{{ selectedBonus.toLocaleString() }}</span>
            </div>
            <div class="confirm-row total">
              <span class="confirm-label">到账总额</span>
              <span class="confirm-value total">¥{{ (selectedAmount + selectedBonus).toLocaleString() }}</span>
            </div>
          </div>
          <button class="btn-primary pay-btn" :disabled="!canPay" @click="onPay">
            {{ paying ? '正在下单...' : `确认充值 ¥${selectedAmount.toLocaleString()}` }}
          </button>
          <FormAlert :message="errorMsg" type="error" />
        </div>
      </div>

      <div class="recharge-side">
        <div class="card">
          <h3 class="card-title">充值说明</h3>
          <ul class="info-list">
            <li>充值金额实时到账，可用于发起背调查询</li>
            <li>充值后可在"资金流水"中查看明细</li>
            <li>对公转账充值需人工审核，到账时间约为 1-3 个工作日</li>
            <li>充值金额支持开具发票</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 支付弹窗 -->
    <div
      v-if="showPayModal"
      class="modal-mask"
      @pointerdown="rechargeBackdropGuard.pointerDown"
      @click.self="rechargeBackdropGuard.click(closePayDialog)"
    >
      <div class="modal-card">
        <h3 class="modal-title">{{ selectedPayLabel }} 支付</h3>
        <div class="pay-info">
          <div class="pay-amount-label">充值金额</div>
          <div class="pay-amount-value">¥{{ selectedAmount.toLocaleString() }}</div>
        </div>
        <div v-if="form.payMethod === 'bank'" class="bank-info">
          <div class="bank-item"><span>收款账户</span><strong>河南钟馗科技有限公司</strong></div>
          <div class="bank-item"><span>开户银行</span><strong>中国建设银行股份有限公司郑州自贸区分行</strong></div>
          <div class="bank-item"><span>银行账号</span><strong class="mono">4105 0180 3608 0000 3467</strong></div>
          <div class="bank-item"><span>附言</span><strong>企业账户充值 (¥{{ selectedAmount.toLocaleString() }})</strong></div>
          <p class="bank-note">转账完成后请联系客服确认到账，或系统将在 1-3 个工作日内自动匹配到账。</p>
        </div>
        <div v-else class="qr-box">
          <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="支付二维码" class="pay-qr-image" />
          <div v-else class="qr-placeholder">正在生成二维码...</div>
          <p class="qr-tip">请使用{{ selectedPayLabel }}扫描二维码完成支付</p>
        </div>
        <p v-if="form.payMethod !== 'bank'" class="polling-text">{{ pollingText }}</p>
        <div class="modal-actions">
          <button class="btn-outline" @click="closePayDialog">关闭</button>
          <a v-if="payInfo && form.payMethod !== 'bank'" class="btn-outline pay-link" :href="payInfo" target="_blank" rel="noreferrer">打开支付链接</a>
          <button v-if="form.payMethod !== 'bank'" class="btn-primary" @click="queryPayStatus">我已支付，刷新状态</button>
        </div>
      </div>
    </div>

    <ResultModal
      v-model="resultModalVisible"
      :type="resultModalType"
      :title="resultModalTitle"
      :description="resultModalDescription"
      :details="resultModalDetails"
      :primary-text="resultModalType === 'error' ? '重新支付' : '继续充值'"
      secondary-text="查看流水"
      @primary="handleResultPrimary"
      @secondary="goLedger"
      @close="closeResultModal"
    />
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import FormAlert from '../components/FormAlert.vue'
import ResultModal from '../components/ResultModal.vue'
import { listMyAccountLedger } from '../api/accountLedger'
import { getUserPackageList } from '../api/comboMeal'
import { createEpayOrder, queryOrder } from '../api/pay'
import { getUserBalance, getUserProfile } from '../api/user'
import { createBackdropGuard } from '../utils/backdropGuard'
import alipayIcon from '../assets/alipay.png'
import weixinIcon from '../assets/weixin.png'
import companyTransferIcon from '../assets/company-transfer.png'

const emit = defineEmits(['balance-updated'])
const router = useRouter()

const balance = ref('0.00')
const userId = ref('')
const packages = ref([])
const payMethods = [
  { key: 'alipay', label: '支付宝', desc: '推荐使用', iconType: 'img', icon: alipayIcon },
  { key: 'wechat', label: '微信支付', desc: '扫码支付', iconType: 'img', icon: weixinIcon },
  { key: 'bank', label: '对公转账', desc: '1-3 个工作日', iconType: 'img', icon: companyTransferIcon }
]
const form = reactive({ packageId: null, payMethod: '' })
const showPayModal = ref(false)
const resultModalVisible = ref(false)
const resultModalType = ref('success')
const resultModalTitle = ref('')
const resultModalDescription = ref('')
const resultModalDetails = ref([])
const outTradeNo = ref('')
const paying = ref(false)
const errorMsg = ref('')
const qrCodeUrl = ref('')
const payInfo = ref('')
const pollingText = ref('等待扫码支付...')
const rechargeSummary = ref({
  monthUsedFen: null,
  monthUsedCount: null,
  monthRechargeFen: null,
  monthRechargeCount: null,
  totalRechargeFen: null,
  sinceDate: ''
})
let pollingTimer = null
let pollCount = 0
const rechargeBackdropGuard = createBackdropGuard()

function selectPackage(id) { form.packageId = id }

const selectedPackage = computed(() => packages.value.find(p => p.id === form.packageId))
const selectedAmount = computed(() => selectedPackage.value?.amount || 0)
const selectedBonus = computed(() => Math.max(0, Number(selectedPackage.value?.arrive || 0) - selectedAmount.value))
const canPay = computed(() => selectedAmount.value > 0 && form.payMethod && !paying.value)
const selectedPayLabel = computed(() => payMethods.find(m => m.key === form.payMethod)?.label || '')

function formatYuan(value) {
  return `¥${Number(value || 0).toLocaleString()}`
}

function buildRechargeDetails(reason = '') {
  const details = [
    { label: '支付金额', value: formatYuan(selectedAmount.value), tone: resultModalType.value === 'error' ? 'error' : 'primary' },
    { label: '到账总额', value: formatYuan(selectedAmount.value + selectedBonus.value), tone: resultModalType.value === 'error' ? 'error' : 'primary' },
    { label: '支付方式', value: selectedPayLabel.value || '-' }
  ]
  if (outTradeNo.value) details.push({ label: '订单号', value: outTradeNo.value })
  if (reason) details.push({ label: '失败原因', value: reason, tone: 'error' })
  return details
}

function openRechargeResult(type, description, reason = '') {
  resultModalType.value = type
  resultModalTitle.value = type === 'error' ? '充值失败' : '充值成功'
  resultModalDescription.value = description
  resultModalDetails.value = buildRechargeDetails(reason)
  resultModalVisible.value = true
}

function closeResultModal() {
  resultModalVisible.value = false
}

function handleResultPrimary() {
  resultModalVisible.value = false
  if (resultModalType.value === 'error') onPay()
}

function goLedger() {
  resultModalVisible.value = false
  router.push('/recharge/ledger')
}

function yuanFromFen(value) {
  return (Number(value || 0) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function normalizePackage(item) {
  const payAmount = item.payAmount ?? item.price ?? item.amount ?? 0
  const arrive = item.arriveAmount ?? item.arrive ?? item.rechargeAmount ?? payAmount
  return {
    ...item,
    id: item.id ?? item.packageId ?? item.comboId,
    name: item.packageName || item.name || item.comboName || item.title || '充值套餐',
    amount: Number(payAmount || 0),
    arrive: Number(arrive || payAmount || 0),
    benefits: Array.isArray(item.benefits) ? item.benefits : []
  }
}

function findPackageList(value, depth = 0) {
  if (depth > 5 || value == null) return null
  if (Array.isArray(value)) return value
  if (typeof value !== 'object') return null
  for (const key of ['rows', 'list', 'records', 'packages', 'packageList']) {
    if (Array.isArray(value[key])) return value[key]
  }
  for (const key of ['data', 'result', 'payload']) {
    const found = findPackageList(value[key], depth + 1)
    if (found) return found
  }
  return null
}

function summaryMoney(value) {
  return value == null ? '--' : `¥ ${yuanFromFen(value)}`
}

function summaryCount(value, prefix = '') {
  if (value == null) return '--'
  return `${prefix ? `${prefix} ` : '共 '}${value} 笔`
}

function parseLedgerDate(value) {
  const parsed = new Date(String(value || '').replace(/-/g, '/'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isCurrentMonth(value) {
  const date = parseLedgerDate(value)
  const now = new Date()
  return Boolean(date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth())
}

function amountFen(row) {
  return Math.abs(Number(row.changeCent ?? row.changeAmount ?? row.amount ?? 0))
}

function buildSummaryFromLedger(rows) {
  const summary = {
    monthUsedFen: 0,
    monthUsedCount: 0,
    monthRechargeFen: 0,
    monthRechargeCount: 0,
    totalRechargeFen: 0,
    sinceDate: ''
  }
  rows.forEach(row => {
    const style = String(row.changeStyle ?? '')
    const value = amountFen(row)
    if (style === '1') {
      summary.totalRechargeFen += value
      if (isCurrentMonth(row.createdAt)) {
        summary.monthRechargeFen += value
        summary.monthRechargeCount += 1
      }
    }
    if (style === '2' && isCurrentMonth(row.createdAt)) {
      summary.monthUsedFen += value
      summary.monthUsedCount += 1
    }
  })
  const datedRows = rows
    .map(row => parseLedgerDate(row.createdAt))
    .filter(Boolean)
    .sort((a, b) => a - b)
  if (datedRows.length) {
    const first = datedRows[0]
    summary.sinceDate = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(first.getDate()).padStart(2, '0')}`
  }
  return summary
}

function extractLedgerRows(response) {
  const rows = response.rows || response.data?.rows || response.data || []
  return Array.isArray(rows) ? rows : []
}

async function fetchAllLedgerRows() {
  const rows = []
  const pageLimit = 200
  const fullPageSize = 500
  let pageNum = 1
  let totalCount = null

  while (pageNum <= pageLimit) {
    const response = await listMyAccountLedger({ pageNum, pageSize: fullPageSize })
    const pageRows = extractLedgerRows(response)
    const responseTotal = Number(response.total ?? response.data?.total ?? 0)
    if (responseTotal > 0) totalCount = responseTotal
    rows.push(...pageRows)
    if (!pageRows.length) break
    if (totalCount !== null && rows.length >= totalCount) break
    if (totalCount === null && pageRows.length < fullPageSize) break
    pageNum += 1
  }

  return rows
}

async function loadRechargeSummaryFromLedger() {
  try {
    const rows = await fetchAllLedgerRows()
    rechargeSummary.value = buildSummaryFromLedger(rows)
  } catch (error) {
    rechargeSummary.value = {
      monthUsedFen: null,
      monthUsedCount: null,
      monthRechargeFen: null,
      monthRechargeCount: null,
      totalRechargeFen: null,
      sinceDate: ''
    }
  }
}

async function loadPage() {
  const profileRes = await getUserProfile()
  const user = profileRes.data || profileRes.user || {}
  userId.value = user.userId || user.id
  const [balanceRes, packageRes] = await Promise.all([
    getUserBalance(userId.value),
    getUserPackageList(userId.value)
  ])
  balance.value = yuanFromFen(balanceRes.data || balanceRes.balance || 0)
  packages.value = (findPackageList(packageRes) || []).map(normalizePackage)
  if (!form.packageId && packages.value.length) form.packageId = packages.value[0].id
  await loadRechargeSummaryFromLedger()
}

async function onPay() {
  if (!canPay.value) return
  errorMsg.value = ''
  if (form.payMethod === 'bank') {
    showPayModal.value = true
    return
  }
  paying.value = true
  try {
    const backendPayType = form.payMethod === 'wechat' ? 'wxpay' : form.payMethod
    const res = await createEpayOrder({
      userId: userId.value,
      packageId: form.packageId,
      payType: backendPayType
    })
    const data = res.data || {}
    if (!data.payInfo) throw new Error(res.msg || '未获取到支付链接')
    payInfo.value = data.payInfo
    outTradeNo.value = data.outTradeNo || ''
    qrCodeUrl.value = await QRCode.toDataURL(data.payInfo, { width: 260, margin: 1, errorCorrectionLevel: 'M' })
    pollingText.value = '等待扫码支付...'
    showPayModal.value = true
    startPolling()
  } catch (error) {
    errorMsg.value = error?.msg || error?.message || '支付下单失败，请稍后重试'
    openRechargeResult('error', '支付下单未完成，请检查充值信息后重新发起。', errorMsg.value)
  } finally {
    paying.value = false
  }
}

function startPolling() {
  stopPolling()
  if (!outTradeNo.value) {
    pollingText.value = '未返回订单号，请支付后手动刷新状态。'
    return
  }
  pollCount = 0
  pollingTimer = window.setInterval(queryPayStatus, 5000)
}

async function queryPayStatus() {
  if (!outTradeNo.value) return
  try {
    pollCount += 1
    pollingText.value = `正在确认支付结果...（第 ${pollCount} 次）`
    const res = await queryOrder(outTradeNo.value)
    const data = res.data || {}
    if (data.status === true || data.status === 'true') {
      stopPolling()
      showPayModal.value = false
      openRechargeResult('success', '充值金额已入账，可继续发起背调查询或前往资金流水查看明细。')
      emit('balance-updated')
      await loadPage()
    } else if (isPayFailedStatus(data)) {
      const reason = data.msg || data.message || data.tradeStatus || '订单支付失败或已关闭'
      stopPolling()
      showPayModal.value = false
      pollingText.value = reason
      openRechargeResult('error', '支付未完成或订单状态异常，请重新发起支付。', reason)
    } else if (pollCount >= 100) {
      stopPolling()
      pollingText.value = '长时间未确认支付结果，请稍后刷新余额或联系服务人员。'
      showPayModal.value = false
      openRechargeResult('error', '支付状态长时间未确认，请稍后重试或联系服务人员。', pollingText.value)
    }
  } catch (error) {
    pollingText.value = error?.msg || error?.message || '查询支付状态失败，可稍后手动刷新。'
    stopPolling()
    showPayModal.value = false
    openRechargeResult('error', '支付状态确认失败，请稍后重试或联系服务人员。', pollingText.value)
  }
}

function isPayFailedStatus(data) {
  const status = String(data?.status ?? data?.tradeStatus ?? data?.payStatus ?? '').toLowerCase()
  return ['fail', 'failed', 'closed', 'cancel', 'canceled', 'cancelled', 'expired', 'timeout', 'trade_closed'].includes(status)
}

function stopPolling() {
  if (pollingTimer) {
    window.clearInterval(pollingTimer)
    pollingTimer = null
  }
}

function closePayDialog() {
  showPayModal.value = false
  stopPolling()
}

onMounted(loadPage)
onBeforeUnmount(stopPolling)
</script>

<style scoped>
.stat-cell-value.primary{color:var(--primary)}

.ledger-btn{height:30px;width:88px;background:var(--primary);color:#fff;border:none;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;text-decoration:none}
.ledger-btn:hover{opacity:.9}

.recharge-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:20px;align-items:start}
.recharge-main{display:flex;flex-direction:column;gap:20px;min-width:0}
.recharge-side{display:flex;flex-direction:column;gap:20px}

.package-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.package-card{border:1px solid var(--border);padding:24px 20px;cursor:pointer;transition:all .15s;background:#fff;display:flex;flex-direction:column;gap:8px;text-align:center}
.package-card:hover{border-color:var(--primary)}
.package-card.selected{border-color:var(--primary);background:var(--primary-light)}
.pkg-name{font-size:15px;font-weight:600;color:var(--text1)}
.pkg-price{font-size:26px;font-weight:700;color:var(--primary);line-height:1.2}
.pkg-arrive{font-size:13px;color:var(--text2)}
.pkg-divider{height:1px;background:var(--border2);margin:8px 0}
.pkg-benefits{list-style:none;display:flex;flex-direction:column;gap:6px;text-align:left}
.pkg-benefits li{font-size:12px;color:var(--text2);line-height:1.5;padding-left:12px;position:relative}
.pkg-benefits li::before{content:'';position:absolute;left:0;top:6px;width:4px;height:4px;background:var(--text3)}

.pay-methods{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.pay-method{border:1px solid var(--border);padding:20px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;background:#fff;transition:all .15s;text-align:center}
.pay-method:hover{border-color:var(--primary)}
.pay-method.active{border-color:var(--primary);background:var(--primary-light)}
.pay-radio{display:none}
.pay-icon svg{width:32px;height:32px}
.pay-img{width:32px;height:32px;object-fit:contain;border-radius:6px}
.pay-label{font-size:14px;font-weight:600;color:var(--text1)}
.pay-desc{font-size:12px;color:var(--text3)}

.summary-card .card-title{margin-bottom:14px}
.confirm-rows{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.confirm-row{display:flex;justify-content:space-between;align-items:center;font-size:14px}
.confirm-label{color:var(--text2)}
.confirm-value{font-weight:600;color:var(--text1)}
.confirm-value.bonus{color:var(--success)}
.confirm-row.total{padding-top:10px;border-top:1px solid var(--border);margin-top:4px}
.confirm-value.total{font-size:22px;color:var(--primary)}
.pay-btn{width:100%;height:46px;justify-content:center;font-size:15px}

.info-list{list-style:none;display:flex;flex-direction:column;gap:10px}
.info-list li{font-size:13px;color:var(--text2);line-height:1.5;padding-left:14px;position:relative}
.info-list li::before{content:'';position:absolute;left:0;top:7px;width:5px;height:5px;background:var(--text3)}

.promo-list{display:flex;flex-direction:column;gap:0}
.promo-item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border2)}
.promo-item:last-child{border-bottom:none}
.promo-tag{font-size:12px;font-weight:600;padding:3px 10px;background:var(--primary-light);color:var(--primary)}
.promo-value{font-size:13px;color:var(--text2);font-weight:500}

.pay-info{text-align:center;margin-bottom:24px}
.pay-amount-label{font-size:13px;color:var(--text2)}
.pay-amount-value{font-size:28px;font-weight:700;color:var(--primary);margin-top:6px}
.qr-box{width:200px;height:200px;border:1px solid var(--border);margin:0 auto 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg)}
.qr-placeholder{font-size:28px;font-weight:700;color:var(--primary)}
.pay-qr-image{width:168px;height:168px;object-fit:contain}
.qr-tip{font-size:13px;color:var(--text2);text-align:center}
.polling-text{text-align:center;font-size:13px;color:var(--text2);margin:0 0 14px}
.pay-link{text-decoration:none;display:inline-flex;align-items:center}
.bank-info{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.bank-item{display:flex;justify-content:space-between;font-size:14px}
.bank-item span{color:var(--text2)}
.bank-item strong{font-weight:600;color:var(--text1)}
.bank-item strong.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.bank-note{font-size:12px;color:var(--text3);margin-top:4px;line-height:1.5}

@media (max-width:1200px){
  .package-grid{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:980px){
  .recharge-layout{grid-template-columns:1fr}
  .package-grid{grid-template-columns:1fr}
  .pay-methods{grid-template-columns:1fr}
}
</style>
