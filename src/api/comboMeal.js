import request from '../utils/request'

export function getUserPackageList(userId) {
  return request({
    url: '/system/user/packageList',
    method: 'get',
    params: { userId }
  })
}
