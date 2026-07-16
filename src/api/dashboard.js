import request from '../utils/request'

export function getDashboardStats() {
  return request({
    url: '/client/dashboard/stats',
    method: 'get'
  })
}

export function getRecentRecords(params) {
  return request({
    url: '/client/report/recent',
    method: 'get',
    params
  })
}

export function getAnnouncements(params) {
  return request({
    url: '/client/notice/list',
    method: 'get',
    params
  })
}
