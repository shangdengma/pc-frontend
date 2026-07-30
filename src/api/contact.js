import request from '../utils/request'

export function getPublicPcContact() {
  return request({
    url: '/system/us/public/pc-contact',
    method: 'get',
    headers: { isToken: false },
    skipAuthRedirect: true
  })
}
