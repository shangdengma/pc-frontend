export function yuanFromFen(value) {
  const n = Number(value || 0) / 100
  if (!Number.isFinite(n)) return '0.00'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDateTime(value) {
  if (!value) return '-'
  const text = String(value)
  if (text.length >= 16) return text.slice(5, 16)
  return text
}

// 订单状态以后端聚合出的 displayStatus 为唯一来源，前端不再依据旧的 search_status 自行判断。
export const DISPLAY_STATUS_OPTIONS = [
  { value: 'waiting_auth', label: '待授权' },
  { value: 'processing', label: '处理中' },
  { value: 'success', label: '已完成' },
  { value: 'no_data', label: '无结果' },
  { value: 'failed', label: '查询失败' },
  { value: 'refunded', label: '已退款' }
]

const DISPLAY_STATUS_TEXT = DISPLAY_STATUS_OPTIONS.reduce((map, item) => {
  map[item.value] = item.label
  return map
}, {})

export function statusText(displayStatus = '', displayStatusText = '') {
  if (displayStatusText) return String(displayStatusText)
  return DISPLAY_STATUS_TEXT[String(displayStatus ?? '')] || '未知'
}

export function statusClass(displayStatus = '') {
  const display = String(displayStatus ?? '')
  if (display === 'success') return 'success'
  if (['failed', 'refunded', 'no_data'].includes(display)) return 'danger'
  if (display === 'processing') return 'warning'
  return 'pending'
}


function isPlainStatusMessage(value) {
  if (!value) return false
  const text = String(value).trim()
  if (!text) return false
  return !text.startsWith('{') && !text.startsWith('[')
}

function getStatusReason(item) {
  const display = String(item.displayStatus ?? '')
  const codeMsg = item.codeMsg || item.code_msg || ''

  // 终止原因（48小时未授权自动退款 / 授权驳回 / 后台手动退款）统一由退款原因承载
  if (display === 'refunded') {
    return item.reasonForRefund || item.reason_for_refund
      || (String(codeMsg).startsWith('授权书审核不通过') ? codeMsg : '')
  }

  if (display === 'failed') {
    return item.reasonForRefund || item.reason_for_refund
      || (isPlainStatusMessage(codeMsg) ? codeMsg : '')
  }

  return ''
}
export function mapRecord(item, queryTypeMap = {}) {
  const typeId = item.searchType || item.searchTypeId || item.callTypeId
  return {
    ...item,
    id: item.id,
    name: item.name || item.userName || '-',
    phone: item.phoneNumber || item.mobile || item.phone || '',
    idCard: item.idCard || item.idcard || '',
    type: queryTypeMap[String(typeId)] || item.callTypeName || item.searchTypeName || '未知类型',
    typeId,
    time: item.createTime || item.queryTime || item.submitTime || '',
    displayStatus: item.displayStatus || '',
    displayStatusText: item.displayStatusText || '',
    authorizationStatus: item.authorizationStatus || '',
    queryStatus: item.queryStatus || '',
    billingStatus: item.billingStatus || '',
    pdfFilePath: item.pdfFilePath || item.pdf_file_path,
    statusReason: getStatusReason(item)
  }
}


