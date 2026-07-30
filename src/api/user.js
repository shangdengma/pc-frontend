import request from '../utils/request'

// 获取用户资料
export function getUserProfile() {
  return request({ url: '/system/user/profile', method: 'get' })
}

// 更新用户资料
export function updateUserProfile(data) {
  return request({ url: '/system/user/profile', method: 'put', data })
}

// 上传头像
export function uploadUserAvatar(file) {
  const formData = new FormData()
  formData.append('avatarfile', file)
  return request({
    url: '/system/user/profile/avatar',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 发送修改密码短信码
export function sendPasswordCode() {
  return request({ url: '/system/sms/sendCodeForCurrent', method: 'post' })
}

// 修改密码
export function updateUserPassword(oldPassword, newPassword, smsCode) {
  return request({ url: '/system/user/profile/updatePwd', method: 'put', data: { oldPassword, newPassword, smsCode } })
}

// 获取账户余额（分）
export function getUserBalance(userId) {
  return request({ url: '/system/user/balance', method: 'get', params: { userId } })
}
