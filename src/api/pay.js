import request from '../utils/request'

export function createEpayOrder(data) {
  return request({
    url: '/remote/pay/create',
    method: 'post',
    data
  })
}

export function queryOrder(outTradeNo) {
  return request({
    url: '/remote/pay/return',
    method: 'post',
    data: { outTradeNo }
  })
}
