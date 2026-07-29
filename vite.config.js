import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 本地预览时把 /dev-api 代理到哪个后端：
//   默认走已上线的测试环境，直接用真实账号点全站，无需本地起后端。
//   本地起了后端就用：VITE_PROXY_TARGET=http://127.0.0.1:8080 npm run dev
const proxyTarget = process.env.VITE_PROXY_TARGET || 'https://zk.lvcha666.com'

// 测试环境的后端挂在 /prod-api 下（见 nginx zk.lvcha666.com.conf），
// 本地后端则直接挂在根路径，两种情况的前缀重写规则不同。
const remote = !proxyTarget.includes('127.0.0.1') && !proxyTarget.includes('localhost')

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5188,
    proxy: {
      '/dev-api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/dev-api/, remote ? '/prod-api' : '')
      }
    }
  }
})
