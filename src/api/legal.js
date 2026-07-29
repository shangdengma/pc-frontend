import request from '../utils/request'

export function getPublicLegalDocument(docKey) {
  return request({
    url: `/system/doc/public/${encodeURIComponent(docKey)}`,
    method: 'get',
    headers: { isToken: false }
  })
}
