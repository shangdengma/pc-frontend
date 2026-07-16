import request from '../utils/request'

export function getUserNotices(userId, opts = {}) {
  const { pageNum = 1, pageSize = 10 } = opts
  return request({
    url: '/system/notification/list',
    method: 'get',
    params: { userId, pageNum, pageSize }
  })
}

export function getUnreadCount() {
  return request({
    url: '/system/notification/count/unread',
    method: 'get'
  })
}

export function markNoticeRead(id) {
  return request({
    url: '/system/notification',
    method: 'put',
    data: { id, status: 1 }
  })
}
export function getAnnouncements(opts = {}) {
  const { pageNum = 1, pageSize = 5 } = opts
  return request({
    url: '/system/notice/client/list',
    method: 'get',
    params: { pageNum, pageSize },
    headers: { isToken: false }
  })
}
