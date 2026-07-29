import request from '../utils/request'

export function getMyEnterpriseCertList() {
  return request({
    url: '/interface/enterpriseCert/my',
    method: 'get'
  })
}

export function getEnterpriseCertDetail(id) {
  return request({
    url: `/interface/enterpriseCert/${id}`,
    method: 'get'
  })
}

export function addEnterpriseCert(data) {
  return request({
    url: '/interface/enterpriseCert',
    method: 'post',
    data
  })
}

export function updateEnterpriseCert(id, data) {
  return request({
    url: `/interface/enterpriseCert/${id}`,
    method: 'put',
    data
  })
}

export function submitEnterpriseCert(id) {
  return request({
    url: `/interface/enterpriseCert/${id}/submit`,
    method: 'post'
  })
}

export function uploadEnterpriseCertImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/interface/enterpriseCert/uploadImage',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  })
}

export function deleteEnterpriseCertFile(fileId) {
  return request({
    url: `/interface/enterpriseCert/file/${fileId}`,
    method: 'delete'
  })
}

// 读取认证附件内容（营业执照等）。
// 这类文件不再通过 /profile/** 静态路径暴露——那条路径免鉴权，
// 猜到文件名就能下载。改走本接口，由后端校验归属后返回二进制。
export function fetchEnterpriseCertFile(fileId) {
  return request({
    url: `/interface/enterpriseCert/file/${fileId}/content`,
    method: 'get',
    responseType: 'blob'
  })
}
