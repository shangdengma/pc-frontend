import request from '../utils/request'

export function getUserProfile() {
  return request({
    url: '/system/user/profile',
    method: 'get'
  })
}

export function updateUserProfile(data) {
  return request({
    url: '/system/user/profile',
    method: 'put',
    data
  })
}

export function uploadUserAvatar(file) {
  const formData = new FormData()
  formData.append('avatarfile', file)
  return request({
    url: '/system/user/profile/avatar',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  })
}

export function sendPasswordCode() {
  return request({
    url: '/system/sms/sendCodeForCurrent',
    method: 'post'
  })
}

export function updateUserPassword(oldPassword, newPassword, smsCode) {
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    data: { oldPassword, newPassword, smsCode }
  })
}

export function getUserBalance(userId) {
  return request({
    url: '/system/user/balance',
    method: 'get',
    params: { userId }
  })
}
