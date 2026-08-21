import { createApp } from 'vue'
import App from './App.vue'
import { toast } from 'vue-sonner'
import router from './router'
import { confirmAction } from './utils/confirm'
import './styles/main.css'
import './styles/workspace.css'

function showToastMessage(type, message) {
  if (!message) return
  // 报告页保持原有反馈方式，避免影响 PDF 捕获区域与既有导出流程。
  if (router.currentRoute.value.name === 'reportDetail') {
    if (type === 'error') window.alert(message)
    else console.log(message)
    return
  }
  if (type === 'error') {
    toast.error(message)
    return
  }
  if (type === 'success') toast.success(message)
  else if (type === 'warning') toast.warning(message)
  else toast.info(message)
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
    async showModal({ title = '提示', content = '', success } = {}) {
      const confirmed = router.currentRoute.value.name === 'reportDetail'
        ? window.confirm(`${title}${content ? `\n${content}` : ''}`)
        : await confirmAction({ title, content })
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
