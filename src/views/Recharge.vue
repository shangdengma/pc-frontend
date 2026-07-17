<template>
  <section class="recharge-page">
    <div class="recharge-hero">
      <div>
        <p class="eyebrow">账户中心</p>
        <h2>账户充值</h2>
      </div>
      <div class="balance-panel">
        <span>当前余额</span>
        <strong>¥{{ balanceText }}</strong>
      </div>
    </div>

    <div class="recharge-grid">
      <div class="work-card package-card">
        <div class="work-card-head compact-head">
          <div>
            <h3>选择充值套餐</h3>
          </div>
          <button class="ghost-btn" :disabled="loading" @click="loadPage">刷新</button>
        </div>

        <div v-if="loading" class="state-box">正在加载充值套餐...</div>
        <div v-else-if="!packages.length" class="state-box muted">暂无可用充值套餐</div>
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

      <div class="work-card pay-card">
        <div class="work-card-head compact-head">
          <div>
            <h3>支付方式</h3>
            <p>请使用手机扫码完成支付。</p>
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
        <div v-else class="state-box">正在生成二维码...</div>
      </div>
      <p class="polling-text">{{ pollingText }}</p>
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
import AppModal from '../components/AppModal.vue'
import { getUserBalance, getUserProfile } from '../api/user'
import { getUserPackageList } from '../api/comboMeal'
import { createEpayOrder, queryOrder } from '../api/pay'
import { yuanFromFen } from '../utils/format'

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
let timer = null
let pollCount = 0

const payMethods = [
  { id: 'alipay', name: '支付宝支付', tag: '推荐' },
  { id: 'wechat', name: '微信支付', tag: '' },
  { id: 'bank', name: '对公银行转账', tag: '人工入账' }
]

const balanceText = computed(() => yuanFromFen(balance.value || 0))
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
    window.alert('请按页面展示的对公账户信息转账，并联系服务人员人工入账。')
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
    pollingText.value = '等待扫码支付...'
    startPolling()
  } catch (error) {
    errorMsg.value = error.msg || error.message || '支付下单失败，请稍后重试'
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
  timer = window.setInterval(queryPayStatus, 5000)
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
      pollingText.value = '支付成功，正在刷新余额...'
      await refreshBalance()
      window.setTimeout(() => {
        payDialogVisible.value = false
      }, 1200)
    } else if (pollCount >= 100) {
      stopPolling()
      pollingText.value = '长时间未确认支付结果，请稍后刷新余额或联系服务人员。'
    }
  } catch (error) {
    pollingText.value = error.msg || error.message || '查询支付状态失败，可稍后手动刷新。'
  }
}

function closePayDialog() {
  payDialogVisible.value = false
  stopPolling()
}

function stopPolling() {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
}

onMounted(loadPage)
onBeforeUnmount(stopPolling)
</script>
