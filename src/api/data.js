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

export function preCheckQuery(data) {
  return request({
    url: '/interface/call/preCheckQuery',
    method: 'post',
    data,
    timeout: 0
  })
}


export function createPendingQuery(data) {
  return request({
    url: '/interface/call/createPendingQuery',
    method: 'post',
    data
  })
}

export function uploadAuthorizationFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/interface/authorization/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': undefined }
  })
}

export function launchEsign(data) {
  return request({
    url: '/interface/call/launchEsign',
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
