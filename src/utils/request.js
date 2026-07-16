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
  error => Promise.reject(error)
)

export default service
