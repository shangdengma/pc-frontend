import request from '../utils/request'

export function createEpayOrder(data) {
  return request({
    url: '/remote/pay/create',
    method: 'post',
    data
  })
}

export function queryOrder(data) {
  return request({
    url: '/remote/pay/return',
    method: 'post',
    data
  })
}
