import axios from 'axios'
import { getToken, removeToken } from './auth'

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 30000
})

service.interceptors.request.use(config => {
  const isToken = config.headers && config.headers.isToken === false
  if (config.headers && Object.prototype.hasOwnProperty.call(config.headers, 'isToken')) {
    delete config.headers.isToken
  }
  const token = getToken()
  if (token && !isToken) config.headers.Authorization = `Bearer ${token}`
  return config
})

service.interceptors.response.use(
  response => {
    const res = response.data
    const code = res && res.code !== undefined ? res.code : 200
    if (code === 401) {
      removeToken()
      window.location.hash = '#/login'
      return Promise.reject(res)
    }
    if (code !== 200 && code !== 0) {
      return Promise.reject(res)
    }
    return res
  },
  error => {
    // axios 的原始错误信息是英文的（"Request failed with status code 500"），
    // 直接抛给页面会原样显示给用户。这里统一翻译成可读中文，
    // 并保留 code/原始对象，供需要判断的页面使用。
    const status = error?.response?.status
    const backendMsg = error?.response?.data?.msg
    let msg
    if (backendMsg) {
      msg = backendMsg
    } else if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')) {
      msg = '请求超时，请检查网络后重试'
    } else if (!error?.response) {
      msg = '网络连接异常，请稍后重试'
    } else if (status === 401) {
      msg = '登录已过期，请重新登录'
    } else if (status === 403) {
      msg = '没有权限执行该操作'
    } else if (status === 404) {
      msg = '请求的资源不存在'
    } else if (status >= 500) {
      msg = '服务暂时不可用，请稍后重试'
    } else {
      msg = '请求失败，请稍后重试'
    }
    return Promise.reject({ code: status, msg, message: msg, raw: error })
  }
)

export default service
