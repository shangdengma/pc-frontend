import request from '../utils/request'

export function getUserNotices(userId, opts) {
  return request({ url: '/system/notification/list', method: 'get', params: { userId, ...opts } })
}
export function getUnreadCount() {
  return request({ url: '/system/notification/count/unread', method: 'get' })
}
export function markNoticeRead(id) {
  return request({ url: '/system/notification', method: 'put', data: { id, status: 1 } })
}
export function getAnnouncements(opts) {
  return request({ url: '/system/notice/client/list', method: 'get', params: opts, headers: { isToken: false } })
}
