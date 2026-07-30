import request from '../utils/request'

// 密码登录
export function login(username, password, code = '', uuid = '', clientType = 'web') {
  const data = { username, password, code, uuid, clientType }
  return request({ url: '/login', method: 'post', data, headers: { isToken: false } })
}

// 短信登录
export function smsLogin(phone, code = '', clientType = 'web') {
  return request({ url: '/smsLogin', method: 'post', data: { phone, code, clientType }, headers: { isToken: false } })
}

// 发送登录短信码
export function sendLoginCode(phone, sliderTicket) {
  return request({ url: '/system/sms/sendLoginCode', method: 'post', data: { phone, sliderTicket }, headers: { isToken: false } })
}

// 滑块验证 - 获取挑战
export function createSmsSliderChallenge(phone, scene) {
  return request({ url: '/system/sms/slider/challenge', method: 'post', data: { phone, scene }, headers: { isToken: false } })
}

// 滑块验证 - 校验
export function verifySmsSliderChallenge(data) {
  return request({ url: '/system/sms/slider/verify', method: 'post', data, headers: { isToken: false } })
}

// 注册
export function register(data) {
  return request({ url: '/system/register', method: 'post', data, headers: { isToken: false } })
}

// 发送注册短信码
export function sendRegisterCode(phone, sliderTicket) {
  return request({ url: '/system/sms/sendCodeToPhoneWithTemplate', method: 'post', data: { phone, sliderTicket }, headers: { isToken: false } })
}

// 图形验证码
export function getCodeImg() {
  return request({ url: '/captchaImage', method: 'get', headers: { isToken: false } })
}

// 获取当前用户信息
export function getInfo() {
  return request({ url: '/getInfo', method: 'get' })
}

// 登出
export function logout() {
  return request({ url: '/logout', method: 'post' })
}
