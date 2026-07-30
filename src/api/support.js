import request from '../utils/request'

export function getFaqList() {
  return request({
    url: '/system/question/list',
    method: 'get',
    params: {
      status: 1,
      pageNum: 1,
      pageSize: 200
    }
  })
}

export function submitFeedback(data) {
  return request({
    url: '/interface/feedback',
    method: 'post',
    data
  })
}

export function getMyFeedbackList() {
  return request({
    url: '/interface/feedback/my',
    method: 'get'
  })
}
