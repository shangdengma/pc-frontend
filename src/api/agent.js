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

export function listAgentCustomers() {
  return request({ url: '/app/agent/customers', method: 'get' })
}

export function listAgentCustomerRecharges(userId) {
  return request({ url: `/app/agent/customers/${userId}/recharges`, method: 'get' })
}

export function listAgentCustomerConsumptions(userId) {
  return request({ url: `/app/agent/customers/${userId}/consumptions`, method: 'get' })
}