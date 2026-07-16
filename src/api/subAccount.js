import request from '../utils/request'

export function listSubAccounts() {
  return request({ url: '/system/sub-account/list', method: 'get' })
}

export function createSubAccount(data) {
  return request({ url: '/system/sub-account', method: 'post', data })
}

export function updateSubAccountQuota(userId, data) {
  return request({ url: `/system/sub-account/${userId}/quota`, method: 'put', data })
}

export function deleteSubAccount(userId) {
  return request({ url: `/system/sub-account/${userId}`, method: 'delete' })
}

export function listSubAccountRecords(userId, params) {
  return request({ url: `/system/sub-account/${userId}/records`, method: 'get', params })
}

export function listSubAccountLogs(userId, params) {
  return request({ url: `/system/sub-account/${userId}/logs`, method: 'get', params })
}
