import request from '../utils/request'

export function listQueryTypeConfig(params = {}) {
  return request({
    url: '/system/callQueryConfig/list',
    method: 'get',
    params
  })
}
