const TOKEN_KEY = 'zk_pc_token'
const USER_KEY = 'zk_pc_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || '{}')
  } catch (error) {
    return {}
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}))
}
