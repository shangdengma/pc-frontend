<template>
  <section class="recharge-page workspace-page workspace-page--standard">
    <header class="page-head">
      <div class="page-head-main">
        <h2>账户充值</h2>
      </div>
    </header>

    <section v-if="pendingOrders.length" class="pending-payment-notice workspace-surface" role="status">
      <strong>{{ pendingOrders.length === 1 ? '有一笔充值正在确认' : `有 ${pendingOrders.length} 笔充值正在确认` }}</strong>
      <div class="pending-payment-list">
        <div v-for="order in pendingOrders" :key="order.outTradeNo" class="pending-payment-item">
          <span>{{ order.packageName || '充值订单' }} · ¥{{ formatYuan(order.amount) }}</span>
          <div class="pending-payment-actions">
            <button type="button" class="ghost-btn" @click="openPendingOrder(order)">查看状态</button>
            <button type="button" class="text-btn" @click="abandonPendingOrder(order)">不再提醒</button>
          </div>
        </div>
      </div>
    </section>

    <div class="recharge-grid">
      <div class="work-card package-card workspace-surface">
        <div class="work-card-head compact-head workspace-section-head">
          <div>
            <h3>选择充值套餐</h3>
          </div>
        </div>

        <UiState v-if="loading" type="loading" title="正在加载充值套餐" />
        <UiState
          v-else-if="errorMsg && !packages.length"
          type="error"
          title="充值信息加载失败"
          :description="errorMsg"
          action-label="重新加载"
          @action="loadPage"
        />
        <UiState
          v-else-if="!packages.length"
          title="暂无可用充值套餐"
          description="请稍后重试或联系服务人员。"
        />
        <div v-else class="package-list">
          <button
            v-for="item in packages"
            :key="item.id || item.packageId || item.packageName"
            type="button"
            class="pc-package-item"
            :class="{ active: selectedPackage && selectedPackage.id === item.id }"
            @click="selectedPackage = item"
          >
            <span class="pkg-name">{{ item.packageName || item.name || '充值套餐' }}</span>
            <span class="pkg-price">¥{{ formatYuan(item.payAmount) }}</span>
            <span class="pkg-meta">
              到账 ¥{{ formatYuan(item.arriveAmount || item.payAmount) }}
              <template v-if="Number(item.giftAmount || 0) > 0">，赠送 ¥{{ formatYuan(item.giftAmount) }}</template>
            </span>
            <span v-if="item.remark" class="pkg-remark">{{ item.remark }}</span>
          </button>
        </div>
      </div>

      <div class="work-card pay-card workspace-surface">
        <div class="work-card-head compact-head workspace-section-head">
          <div>
            <h3>支付方式</h3>
          </div>
        </div>

        <div class="pay-methods">
          <button
            v-for="method in payMethods"
            :key="method.id"
            type="button"
            class="pay-method"
            :class="{ active: payType === method.id }"
            @click="payType = method.id"
          >
            <span class="pay-dot" :class="method.id"></span>
            <span>{{ method.name }}</span>
            <em v-if="method.tag">{{ method.tag }}</em>
          </button>
        </div>

        <div v-if="payType === 'bank'" class="bank-box">
          <div><span>收款账户</span><strong>河南钟馗科技有限公司</strong></div>
          <div><span>对公账号</span><strong>4105 0180 3608 0000 3467</strong></div>
          <div><span>开户银行</span><strong>中国建设银行股份有限公司郑州自贸区分行</strong></div>
          <p>转账成功后，请凭转账截图或回执单联系服务人员人工入账。</p>
        </div>

        <div v-else class="order-summary">
          <div>
            <span>应付金额</span>
            <strong>¥{{ selectedPackage ? formatYuan(selectedPackage.payAmount) : '0.00' }}</strong>
          </div>
          <div>
            <span>充值套餐</span>
            <strong>{{ selectedPackage ? selectedPackage.packageName || selectedPackage.name : '未选择' }}</strong>
          </div>
        </div>

        <p v-if="errorMsg" class="error-line">{{ errorMsg }}</p>

        <button class="primary-action" :disabled="paying || !selectedPackage" @click="handleSubmit">
          {{ submitText }}
        </button>
      </div>
    </div>

    <AppModal
      :open="payDialogVisible"
      :title="payDialogTitle"
      :description="payDialogTip"
      size="sm"
      @close="closePayDialog"
    >
      <div class="qr-wrap">
        <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="支付二维码" />
        <div v-else class="state-box">正在确认本次支付结果</div>
      </div>
      <p class="polling-text">{{ pollingText }}</p>
      <p class="polling-hint">可放心关闭此窗口，到账后会及时通知您。</p>
      <template #footer>
        <a v-if="payInfo" class="ghost-btn" :href="payInfo" target="_blank" rel="noreferrer">打开支付链接</a>
        <button class="primary-action small" type="button" @click="queryPayStatus">我已支付，刷新状态</button>
      </template>
    </AppModal>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import QRCode from 'qrcode'
import { toast } from 'vue-sonner'
import AppModal from '../components/AppModal.vue'
import UiState from '../components/UiState.vue'
import { getUserBalance, getUserProfile } from '../api/user'
import { getUserPackageList } from '../api/comboMeal'
import { createEpayOrder } from '../api/pay'
import { confirmAction } from '../utils/confirm'
import {
  checkPendingPaymentNow,
  clearPendingPayment,
  getPendingPayments,
  savePendingPayment,
  startPendingPaymentMonitor,
  subscribePendingPayment
} from '../utils/pendingPayment'

const emit = defineEmits(['balance-updated'])

const loading = ref(false)
const paying = ref(false)
const userId = ref('')
const balance = ref(0)
const packages = ref([])
const selectedPackage = ref(null)
const payType = ref('alipay')
const errorMsg = ref('')
const payDialogVisible = ref(false)
const qrCodeUrl = ref('')
const payInfo = ref('')
const outTradeNo = ref('')
const currentOrderPayType = ref('')
const pollingText = ref('等待扫码支付...')
const pendingOrders = ref([])
let unsubscribePendingPayment = null

const payMethods = [
  { id: 'alipay', name: '支付宝支付', tag: '推荐' },
  { id: 'wechat', name: '微信支付', tag: '' },
  { id: 'bank', name: '对公银行转账', tag: '人工入账' }
]

const submitText = computed(() => {
  if (payType.value === 'bank') return '查看对公转账说明'
  if (paying.value) return '正在下单...'
  return '立即充值'
})
const payDialogTitle = computed(() => currentOrderPayType.value === 'wxpay' ? '微信扫码支付' : '支付宝扫码支付')
const payDialogTip = computed(() => currentOrderPayType.value === 'wxpay' ? '请使用微信扫一扫完成支付。' : '请使用支付宝扫一扫完成支付。')

function formatYuan(value) {
  if (value == null || value === '') return '0.00'
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function normalizePackageItem(item) {
  return {
    ...item,
    id: item.id ?? item.packageId ?? item.comboId,
    packageName: item.packageName ?? item.name ?? item.comboName ?? item.title,
    payAmount: item.payAmount ?? item.price ?? item.amount,
    arriveAmount: item.arriveAmount ?? item.arrivalAmount ?? item.payAmount ?? item.price ?? item.amount,
    giftAmount: item.giftAmount ?? item.gift ?? 0
  }
}

function looksLikePackageList(list) {
  return Array.isArray(list) && list.some(item => {
    if (!item || typeof item !== 'object') return false
    return item.packageName != null || item.payAmount != null || item.arriveAmount != null || item.giftAmount != null || item.price != null
  })
}

function findPackageList(value, depth = 0) {
  if (depth > 4 || value == null) return []
  if (looksLikePackageList(value)) return value
  if (Array.isArray(value)) return []
  if (typeof value !== 'object') return []

  const preferredKeys = ['data', 'rows', 'list', 'records', 'items', 'packageList', 'packages']
  for (const key of preferredKeys) {
    const found = findPackageList(value[key], depth + 1)
    if (found.length) return found
  }

  for (const key of Object.keys(value)) {
    if (preferredKeys.includes(key)) continue
    const found = findPackageList(value[key], depth + 1)
    if (found.length) return found
  }
  return []
}

function extractPackages(response) {
  return findPackageList(response).map(normalizePackageItem)
}

async function refreshBalance() {
  if (!userId.value) return
  try {
    const res = await getUserBalance(userId.value)
    balance.value = res.data || 0
    emit('balance-updated')
  } catch (error) {
    console.warn('[recharge] refresh balance failed', error)
  }
}

async function loadPage() {
  loading.value = true
  errorMsg.value = ''
  try {
    const profileRes = await getUserProfile()
    const user = profileRes.data || {}
    userId.value = user.userId || user.id || ''
    balance.value = user.money || 0

    if (!userId.value) throw new Error('未获取到用户信息，请重新登录')

    await refreshBalance()
    pendingOrders.value = getPendingPayments(userId.value)
    if (pendingOrders.value.length) startPendingPaymentMonitor(userId.value)
    const pkgRes = await getUserPackageList(userId.value)
    packages.value = extractPackages(pkgRes)
    selectedPackage.value = packages.value[0] || null
  } catch (error) {
    errorMsg.value = error.msg || error.message || '充值信息加载失败'
    packages.value = []
    selectedPackage.value = null
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (payType.value === 'bank') {
    toast.info('请按页面展示的对公账户信息转账，并联系服务人员人工入账。')
    return
  }
  if (!selectedPackage.value || !selectedPackage.value.payAmount) {
    errorMsg.value = '请选择有效的充值套餐'
    return
  }
  if (!userId.value) {
    errorMsg.value = '未获取到用户信息，请重新登录'
    return
  }
  paying.value = true
  errorMsg.value = ''
  try {
    const backendPayType = payType.value === 'wechat' ? 'wxpay' : 'alipay'
    const res = await createEpayOrder({
      userId: userId.value,
      packageId: selectedPackage.value.id,
      payType: backendPayType
    })

    const data = res.data || {}
    if (!data.payInfo) throw new Error(res.msg || '未获取到支付链接')

    payInfo.value = data.payInfo
    outTradeNo.value = data.outTradeNo || ''
    currentOrderPayType.value = data.payType || backendPayType
    qrCodeUrl.value = await QRCode.toDataURL(data.payInfo, { width: 260, margin: 1, errorCorrectionLevel: 'M' })
    payDialogVisible.value = true
    if (outTradeNo.value) {
      savePendingPayment({
        userId: userId.value,
        outTradeNo: outTradeNo.value,
        payType: currentOrderPayType.value,
        packageName: selectedPackage.value.packageName || selectedPackage.value.name,
        amount: selectedPackage.value.payAmount
      })
      pendingOrders.value = getPendingPayments(userId.value)
      pollingText.value = '等待扫码支付...'
      startPendingPaymentMonitor(userId.value)
    } else {
      pollingText.value = '本次支付暂不支持到账提醒。支付完成后，请在资金流水中查看。'
    }
  } catch (error) {
    errorMsg.value = error.msg || error.message || '支付下单失败，请稍后重试'
  } finally {
    paying.value = false
  }
}

async function queryPayStatus() {
  if (!userId.value || !outTradeNo.value) return
  await checkPendingPaymentNow(userId.value, outTradeNo.value)
}

function closePayDialog() {
  payDialogVisible.value = false
}

function openPendingOrder(order) {
  if (!order) return
  outTradeNo.value = order.outTradeNo
  currentOrderPayType.value = order.payType || 'alipay'
  qrCodeUrl.value = ''
  payInfo.value = ''
  pollingText.value = '正在确认本次支付结果，请稍候...'
  payDialogVisible.value = true
  startPendingPaymentMonitor(userId.value)
}

async function abandonPendingOrder(order) {
  if (!order) return
  const confirmed = await confirmAction({
    title: '不再提醒本次充值',
    content: '关闭提醒后，将不再显示本次支付进度。已完成的支付不会受到影响，您仍可在资金流水中查看到账记录。',
    confirmText: '不再提醒',
    danger: true
  })
  if (!confirmed) return
  clearPendingPayment(userId.value, order.outTradeNo)
  pendingOrders.value = getPendingPayments(userId.value)
  if (outTradeNo.value === order.outTradeNo) payDialogVisible.value = false
  pollingText.value = '等待扫码支付...'
}

async function handlePendingPaymentEvent(event) {
  if (!event?.payment || String(event.payment.userId) !== String(userId.value)) return
  pendingOrders.value = getPendingPayments(userId.value)
  const isCurrentOrder = event.payment.outTradeNo === outTradeNo.value
  if (!isCurrentOrder) {
    if (event.type === 'paid') await refreshBalance()
    return
  }
  if (event.type === 'checking') {
    pollingText.value = '正在确认支付结果，请稍候...'
  } else if (event.type === 'pending') {
    pollingText.value = '支付结果确认中，请稍候。'
  } else if (event.type === 'error') {
    pollingText.value = '支付结果确认稍有延迟，请稍后刷新，或前往资金流水查看。'
  } else if (event.type === 'paid') {
    pollingText.value = '充值成功，余额已更新。'
    await refreshBalance()
    window.setTimeout(() => {
      payDialogVisible.value = false
    }, 1200)
  }
}

onMounted(() => {
  unsubscribePendingPayment = subscribePendingPayment(handlePendingPaymentEvent)
  loadPage()
})
onBeforeUnmount(() => unsubscribePendingPayment?.())
</script>

<style scoped>

.pending-payment-notice {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
  padding: 15px 18px;
  border: 1px solid #f1d39a;
  border-radius: var(--radius);
  background: #fffaf0;
}

.pending-payment-notice strong { color: var(--text); }
.pending-payment-notice span { color: var(--muted); font-size: var(--fs-sm); }
.pending-payment-list { display: grid; }
.pending-payment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 46px;
  border-top: 1px solid #f3dfb8;
}
.pending-payment-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.polling-hint { margin: 8px 0 0; color: var(--muted); font-size: var(--fs-xs); text-align: center; }

@media (max-width: 760px) {
  .pending-payment-item { align-items: stretch; flex-direction: column; gap: 8px; padding: 12px 0; }
  .pending-payment-actions > * { flex: 1; justify-content: center; }
}

@media (max-width: 900px) {
  .recharge-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
