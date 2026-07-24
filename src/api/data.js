import request from '../utils/request'

export function listData(params) {
  return request({
    url: '/system/data/list',
    method: 'get',
    params,
    timeout: 0
  })
}

export function getData(id) {
  return request({
    url: `/system/data/${id}`,
    method: 'get'
  })
}

export function getAllData(data) {
  return request({
    url: '/interface/call/getAllData',
    method: 'post',
    data,
    timeout: 0
  })
}

export function launchOnlineTest(data) {
  return request({
    url: '/interface/call/getAllDataNoEsign',
    method: 'post',
    params: { waitResult: false },
    data,
    timeout: 0
  })
}

export function preCheckQuery(data) {
  return request({
    url: '/interface/call/preCheckQuery',
    method: 'post',
    data,
    timeout: 0
  })
}

export function markDataRead(id) {
  return request({
    url: `/system/data/${id}/read`,
    method: 'put'
  })
}
