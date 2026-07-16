import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'

function showToastMessage(type, message) {
  if (!message) return
  if (type === 'error') {
    console.error(message)
    window.alert(message)
    return
  }
  console.log(message)
}

function normalizeUniUrl(url = '') {
  if (url.includes('/pages/work/data_form')) {
    const id = new URLSearchParams(url.split('?')[1] || '').get('id')
    return id ? `/report/${id}` : '/records'
  }
  if (url.includes('/pages/work/index')) return '/records'
  if (url.includes('/pages/index')) return '/dashboard'
  return '/dashboard'
}

if (!window.uni) {
  window.uni = {
    showLoading() {},
    hideLoading() {},
    showToast({ title = '' } = {}) {
      showToastMessage('success', title)
    },
    showModal({ title = '提示', content = '', success } = {}) {
      const confirmed = window.confirm(`${title}${content ? `\n${content}` : ''}`)
      if (typeof success === 'function') {
        success({ confirm: confirmed, cancel: !confirmed })
      }
    },
    navigateBack() {
      if (window.history.length > 1) window.history.back()
      else router.push('/records')
    },
    navigateTo({ url = '' } = {}) {
      router.push(normalizeUniUrl(url))
    },
    switchTab({ url = '' } = {}) {
      router.push(normalizeUniUrl(url))
    }
  }
}

const app = createApp(App)

app.config.globalProperties.$set = (target, key, value) => {
  if (target) target[key] = value
}

app.config.globalProperties.$message = {
  success(message) {
    showToastMessage('success', message)
  },
  error(message) {
    showToastMessage('error', message)
  },
  warning(message) {
    showToastMessage('warning', message)
  },
  info(message) {
    showToastMessage('info', message)
  }
}

app.config.globalProperties.$tab = {
  navigateTo(url) {
    router.push(normalizeUniUrl(url))
  }
}

app.use(router).mount('#app')
