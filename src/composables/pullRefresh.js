import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 下拉刷新。
 *
 * 每个列表页原本都在卡片头挂一个「刷新」按钮，那是把「数据可能不是最新的」这件事
 * 甩给用户判断，手机上还白占一行。改成：页面进入自动拉一次，用户想重拉就下拉——
 * 这是手机上已有的肌肉记忆，不需要教。
 *
 * 手势与指示器由 ClientLayout 统一持有，页面只用 useRefresh(fn) 注册自己的加载函数，
 * 避免十几个页面各写一遍模板和状态。
 */

// 当前路由页注册的刷新函数。同一时刻只有一个页面在前台，用单值而非栈即可。
const handler = ref(null)
const refreshing = ref(false)

export function useRefresh(fn) {
  onMounted(() => { handler.value = fn })
  onBeforeUnmount(() => {
    if (handler.value === fn) handler.value = null
  })
}

export function canRefresh() {
  return typeof handler.value === 'function'
}

// 指示器最短停留时间。接口很快时若不兜住，松手后指示器一闪而过甚至来不及渲染，
// 用户看不到任何反馈，会以为下拉没生效而反复下拉。
const MIN_VISIBLE_MS = 450

export async function runRefresh() {
  if (!handler.value || refreshing.value) return
  refreshing.value = true
  const startedAt = Date.now()
  try {
    await handler.value()
  } catch (error) {
    // 页面自己的加载函数负责提示错误，这里只保证指示器一定收起来
    console.warn('[pull-refresh] 刷新失败', error)
  } finally {
    const elapsed = Date.now() - startedAt
    if (elapsed < MIN_VISIBLE_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_VISIBLE_MS - elapsed))
    }
    refreshing.value = false
  }
}

export function useRefreshState() {
  return { refreshing }
}
