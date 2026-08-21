import { reactive } from 'vue'

export const confirmState = reactive({
  open: false,
  title: '请确认操作',
  content: '',
  confirmText: '确认',
  cancelText: '取消',
  danger: false
})

let activeResolver = null

export function confirmAction(options = {}) {
  if (activeResolver) activeResolver(false)

  confirmState.title = options.title || '请确认操作'
  confirmState.content = options.content || ''
  confirmState.confirmText = options.confirmText || '确认'
  confirmState.cancelText = options.cancelText || '取消'
  confirmState.danger = options.danger === true
  confirmState.open = true

  return new Promise(resolve => {
    activeResolver = resolve
  })
}

export function resolveConfirm(value) {
  confirmState.open = false
  if (!activeResolver) return
  const resolve = activeResolver
  activeResolver = null
  resolve(Boolean(value))
}
