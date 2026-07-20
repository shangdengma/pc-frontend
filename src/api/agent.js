import request from '../utils/request'

export function getAgentOverview() {
  return request({ url: '/app/agent/overview', method: 'get' })
}

export function listAgentInviteCodes() {
  return request({ url: '/app/agent/invite-codes', method: 'get' })
}

export function createAgentInviteCode(data) {
  return request({ url: '/app/agent/invite-codes', method: 'post', data })
}

export function updateAgentInviteCode(id, data) {
  return request({ url: `/app/agent/invite-codes/${id}`, method: 'put', data })
}

export function listAgentCustomers(params) {
  return request({ url: '/app/agent/customers', method: 'get', params })
}

export function getAgentCustomer(userId) {
  return request({ url: `/app/agent/customers/${userId}`, method: 'get' })
}

export function listAgentCustomerRecharges(userId, params) {
  return request({ url: `/app/agent/customers/${userId}/recharges`, method: 'get', params })
}

export function listAgentCustomerConsumptions(userId, params) {
  return request({ url: `/app/agent/customers/${userId}/consumptions`, method: 'get', params })
}

export function allocateAgentCustomerBalance(userId, data) {
  return request({ url: `/app/agent/customers/${userId}/balance-allocations`, method: 'post', data })
}
