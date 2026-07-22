import request from '../utils/request'

export function login(username, password, code = '', uuid = '', clientType = 'web') {
  return request({
    url: '/login',
    method: 'post',
    headers: { isToken: false },
    data: { username, password, code, uuid, clientType }
  })
}


export function smsLogin(phone, code = '', clientType = 'web') {
  return request({
    url: '/smsLogin',
    method: 'post',
    headers: { isToken: false },
    data: { phone, code, clientType }
  })
}

export function sendLoginCode(phone, sliderTicket) {
  return request({
    url: '/system/sms/sendLoginCode',
    method: 'post',
    headers: { isToken: false },
    data: { phone, sliderTicket }
  })
}

export function createSmsSliderChallenge(phone, scene) {
  return request({
    url: '/system/sms/slider/challenge',
    method: 'post',
    headers: { isToken: false },
    data: { phone, scene }
  })
}

export function verifySmsSliderChallenge(data) {
  return request({
    url: '/system/sms/slider/verify',
    method: 'post',
    headers: { isToken: false },
    data
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

export function sendRegisterCode(phone, sliderTicket) {
  return request({
    url: '/system/sms/sendCodeToPhoneWithTemplate',
    method: 'post',
    headers: { isToken: false },
    data: { phone, sliderTicket }
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
