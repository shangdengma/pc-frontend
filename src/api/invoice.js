import request from '../utils/request'

export function listInvoices(params) {
  return request({
    url: '/invoice/list',
    method: 'get',
    params
  })
}

export function addInvoice(data) {
  return request({
    url: '/invoice',
    method: 'post',
    data
  })
}
