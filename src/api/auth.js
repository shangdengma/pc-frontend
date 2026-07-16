import request from '../utils/request'

export function login(username, password, code = '', uuid = '', clientType = 'web') {
  return request({
    url: '/login',
    method: 'post',
    headers: { isToken: false },
    data: { username, password, code, uuid, clientType }
  })
}


export function smsLogin(phone, code = '', clientType = 'uniapp') {
  return request({
    url: '/smsLogin',
    method: 'post',
    headers: { isToken: false },
    data: { phone, code, clientType }
  })
}

export function sendLoginCode(phone) {
  return request({
    url: '/system/sms/sendLoginCode',
    method: 'post',
    headers: { isToken: false },
    data: { phone }
  })
}
export function register(data) {
  return request({
    url: '/system/register',
    method: 'post',
    headers: { isToken: false },
    data
  })
}

export function sendRegisterCode(phone) {
  return request({
    url: '/system/sms/sendCodeToPhoneWithTemplate',
    method: 'post',
    headers: { isToken: false },
    data: { phone }
  })
}

export function getCodeImg() {
  return request({
    url: '/captchaImage',
    method: 'get',
    headers: { isToken: false },
    timeout: 20000
  })
}

export function getInfo() {
  return request({
    url: '/getInfo',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}
