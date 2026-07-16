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

export function statusText(status, displayStatusText = '') {
  if (displayStatusText) return String(displayStatusText)
  const s = String(status ?? '')
  if (s === '2' || s === 'success') return '查询成功'
  if (s === '1' || s === 'pending') return '查询中'
  if (s === '5') return '授权中'
  if (s === '3' || s === 'fail') return '查询失败'
  if (s === '4') return '已退款'
  if (s === '6') return '背调中止'
  return s || '未知'
}

export function statusClass(status, displayStatus = '') {
  const display = String(displayStatus ?? '')
  if (display === 'success') return 'success'
  if (['failed', 'refunded', 'expired_released', 'auth_rejected', 'no_result', 'completed_no_data'].includes(display)) return 'danger'
  if (['querying', 'manual_pending'].includes(display)) return 'warning'
  if (['waiting_esign', 'waiting_auth_review'].includes(display)) return 'pending'
  const s = String(status ?? '')
  if (s === '2' || s === 'success') return 'success'
  if (s === '3' || s === 'fail' || s === '4' || s === '6') return 'danger'
  if (s === '1' || s === 'pending') return 'warning'
  return 'pending'
}


function isPlainStatusMessage(value) {
  if (!value) return false
  const text = String(value).trim()
  if (!text) return false
  return !text.startsWith('{') && !text.startsWith('[')
}

function getStatusReason(item) {
  const status = String(item.searchStatus ?? '')
  const codeMsg = item.codeMsg || item.code_msg || ''

  if (status === '4') {
    return item.reasonForRefund || item.reason_for_refund || ''
  }

  if (status === '6') {
    return String(codeMsg).startsWith('授权书审核不通过') ? codeMsg : ''
  }

  if (status === '3') {
    return isPlainStatusMessage(codeMsg) ? codeMsg : ''
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
    status: item.searchStatus,
    displayStatus: item.displayStatus || '',
    displayStatusText: item.displayStatusText || '',
    authorizationStatus: item.authorizationStatus || '',
    queryStatus: item.queryStatus || '',
    billingStatus: item.billingStatus || '',
    pdfFilePath: item.pdfFilePath || item.pdf_file_path,
    statusReason: getStatusReason(item)
  }
}



