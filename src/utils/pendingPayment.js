import { queryOrder } from '../api/pay'

const STORAGE_PREFIX = 'zk_pending_payment_'
const MAX_AGE_MS = 30 * 60 * 1000
const MAX_PENDING_ORDERS = 20
const listeners = new Set()
const memoryPayments = new Map()
const checkPromises = new Map()
const checkCounts = new Map()

let monitorTimer = null
let monitorUserId = ''

function storageKey(userId) {
  return `${STORAGE_PREFIX}${String(userId || '')}`
}

function emitPaymentEvent(event) {
  listeners.forEach(listener => {
    try { listener(event) } catch (error) {}
  })
}

function isPaidStatus(status) {
  return status === true
    || status === 1
    || ['true', '1', 'paid', 'success', 'succeeded'].includes(String(status || '').toLowerCase())
}

function normalizePayment(payment, userId) {
  if (!payment?.outTradeNo || String(payment.userId) !== String(userId)) return null
  const createdAt = Number(payment.createdAt) || Date.now()
  if (Date.now() - createdAt > MAX_AGE_MS) return null
  return {
    userId: String(userId),
    outTradeNo: String(payment.outTradeNo),
    payType: payment.payType || '',
    packageName: payment.packageName || '',
    amount: payment.amount || '',
    createdAt
  }
}

function writePendingPayments(userId, payments) {
  const key = String(userId || '')
  if (!key) return []
  const normalized = payments
    .map(payment => normalizePayment(payment, key))
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((payment, index, list) => list.findIndex(item => item.outTradeNo === payment.outTradeNo) === index)
    .slice(0, MAX_PENDING_ORDERS)

  memoryPayments.set(key, normalized)
  try {
    if (normalized.length) localStorage.setItem(storageKey(key), JSON.stringify(normalized))
    else localStorage.removeItem(storageKey(key))
  } catch (error) {}
  return normalized
}

export function getPendingPayments(userId) {
  const key = String(userId || '')
  if (!key) return []
  try {
    let value
    if (memoryPayments.has(key)) {
      value = memoryPayments.get(key)
    } else {
      const raw = localStorage.getItem(storageKey(key))
      if (!raw) return []
      const parsed = JSON.parse(raw)
      // 兼容旧版本保存的单笔订单对象。
      value = Array.isArray(parsed) ? parsed : [parsed]
    }
    return writePendingPayments(key, Array.isArray(value) ? value : [])
  } catch (error) {
    memoryPayments.delete(key)
    try { localStorage.removeItem(storageKey(key)) } catch (removeError) {}
    return []
  }
}

export function getPendingPayment(userId, outTradeNo = '') {
  const payments = getPendingPayments(userId)
  if (!outTradeNo) return payments[0] || null
  return payments.find(payment => payment.outTradeNo === String(outTradeNo)) || null
}

export function savePendingPayment(payment) {
  if (!payment?.userId || !payment?.outTradeNo) return null
  const value = normalizePayment({ ...payment, createdAt: Number(payment.createdAt) || Date.now() }, payment.userId)
  if (!value) return null
  const payments = getPendingPayments(value.userId).filter(item => item.outTradeNo !== value.outTradeNo)
  writePendingPayments(value.userId, [value, ...payments])
  emitPaymentEvent({ type: 'created', payment: value })
  return value
}

export function clearPendingPayment(userId, outTradeNo = '') {
  const key = String(userId || '')
  if (!key) return
  if (outTradeNo) {
    writePendingPayments(key, getPendingPayments(key).filter(payment => payment.outTradeNo !== String(outTradeNo)))
    checkPromises.delete(String(outTradeNo))
    checkCounts.delete(String(outTradeNo))
  } else {
    writePendingPayments(key, [])
    checkPromises.clear()
    checkCounts.clear()
  }
  if (key === monitorUserId && !getPendingPayments(key).length) stopPendingPaymentMonitor()
}

export function subscribePendingPayment(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function checkOnePayment(payment) {
  const orderNo = payment.outTradeNo
  if (checkPromises.has(orderNo)) return checkPromises.get(orderNo)

  const count = (checkCounts.get(orderNo) || 0) + 1
  checkCounts.set(orderNo, count)
  emitPaymentEvent({ type: 'checking', payment, count })

  const promise = queryOrder(orderNo)
    .then(response => {
      // 用户关闭该笔提醒后，即使在途请求返回，也不再触发到账提示。
      if (!getPendingPayment(payment.userId, orderNo)) {
        return { ignored: true, paid: false, payment, response }
      }
      const data = response?.data || {}
      if (isPaidStatus(data.status)) {
        clearPendingPayment(payment.userId, orderNo)
        emitPaymentEvent({ type: 'paid', payment, response })
        return { paid: true, payment, response }
      }
      emitPaymentEvent({ type: 'pending', payment, count })
      return { paid: false, payment, response }
    })
    .catch(error => {
      if (!getPendingPayment(payment.userId, orderNo)) {
        return { ignored: true, paid: false, payment, error }
      }
      emitPaymentEvent({ type: 'error', payment, error })
      return { paid: false, payment, error }
    })
    .finally(() => {
      checkPromises.delete(orderNo)
    })

  checkPromises.set(orderNo, promise)
  return promise
}

export async function checkPendingPaymentNow(userId, outTradeNo = '') {
  const payments = getPendingPayments(userId)
  const targets = outTradeNo
    ? payments.filter(payment => payment.outTradeNo === String(outTradeNo))
    : payments
  if (!targets.length) return outTradeNo ? null : []
  const results = await Promise.all(targets.map(checkOnePayment))
  return outTradeNo ? results[0] : results
}

export function startPendingPaymentMonitor(userId) {
  stopPendingPaymentMonitor()
  monitorUserId = String(userId || '')
  const payments = getPendingPayments(monitorUserId)
  if (!payments.length) return false
  checkPendingPaymentNow(monitorUserId)
  monitorTimer = window.setInterval(() => checkPendingPaymentNow(monitorUserId), 5000)
  return true
}

export function stopPendingPaymentMonitor() {
  if (monitorTimer) window.clearInterval(monitorTimer)
  monitorTimer = null
  monitorUserId = ''
}
