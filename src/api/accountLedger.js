import request from '../utils/request'

export function listMyAccountLedger(params) {
  return request({
    url: '/system/log/mine',
    method: 'get',
    params
  })
}
