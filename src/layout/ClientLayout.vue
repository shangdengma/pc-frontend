<template>
  <div class="app">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="closeSidebar"></div>

    <!-- ========== Sidebar ========== -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <router-link to="/dashboard" class="sidebar-logo" @click="closeSidebar">
        <img :src="logo" alt="钟馗背调" />
        <div class="sidebar-brand-text">
          <span class="sidebar-brand-name">钟馗背调</span>
          <span class="sidebar-brand-subtitle">企业风险管理平台</span>
        </div>
      </router-link>

      <nav class="sidebar-nav">
        <div v-for="group in navGroups" :key="group.title" class="nav-group">
          <div class="nav-section">{{ group.title }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: isNavActive(item) }"
            @click="closeSidebar"
          >
            <span class="nav-icon" v-html="item.icon"></span>
            <span>{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <router-link to="/account-profile" class="sidebar-bottom" @click="closeSidebar">
        <div class="avatar-sm">{{ userInitial }}</div>
        <div class="user-info-mini">
          <span class="name">{{ userName }}</span>
          <span class="role">{{ userRole }}</span>
        </div>
      </router-link>
    </aside>

    <!-- ========== Main Area ========== -->
    <div class="main-area">
      <header class="topbar">
        <button class="mobile-menu-btn" type="button" aria-label="打开导航" @click="openSidebar">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <!-- 面包屑导航 -->
        <nav class="breadcrumb">
          <router-link
            v-for="(crumb, i) in breadcrumbs"
            :key="crumb.path"
            :to="crumb.path"
            class="crumb-item"
            :class="{ active: i === breadcrumbs.length - 1 }"
          >
            {{ crumb.title }}
          </router-link>
        </nav>

        <form class="search-box" @submit.prevent="handleTopSearch">
          <button class="search-submit" type="submit" aria-label="搜索">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#94A3B8" stroke-width="2"/>
              <path d="M16 16L20 20" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <input v-model="topSearchKeyword" type="search" placeholder="搜索姓名/手机号/身份证号" />
        </form>

        <div class="topbar-right">
          <!-- 消息通知下拉 -->
          <div class="icon-dropdown">
            <button class="topbar-icon-btn" type="button" title="消息通知" @click="goMessages">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#64748B"/>
              </svg>
              <span v-if="unreadCount > 0" class="msg-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </button>
            <div class="dropdown-menu msg-dropdown">
              <div class="dropdown-header">
                <span class="dropdown-title">消息通知</span>
                <span class="dropdown-count">{{ unreadCount }} 条未读</span>
              </div>
              <div class="msg-list">
                <div
                  v-for="msg in recentMessages"
                  :key="msg.id"
                  class="msg-item"
                  :class="{ unread: !msg.read, selected: activeMessage && activeMessage.id === msg.id }"
                  @click="openMessage(msg)"
                >
                  <div class="msg-dot" :class="{ unread: !msg.read }"></div>
                  <div class="msg-content">
                    <div class="msg-title">{{ msg.title }}</div>
                    <div class="msg-preview">{{ msg.content }}</div>
                  </div>
                  <div class="msg-time">{{ msg.time }}</div>
                </div>
                <div v-if="recentMessages.length === 0" class="msg-empty">暂无消息</div>
              </div>
              <router-link to="/messages" class="dropdown-footer">
                查看全部消息
                <svg viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="#014DB2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </router-link>
            </div>
          </div>

          <router-link to="/account-profile" class="topbar-icon-btn" title="基本信息">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.5a2 2 0 0 1-1 1.72l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.72v-.5a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="#64748B" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="#64748B" stroke-width="1.65"/>
            </svg>
          </router-link>

          <!-- 头像下拉 -->
          <div class="avatar-dropdown">
            <div class="avatar-sm" title="基本信息" @click.stop="goProfile">{{ userInitial }}</div>
            <svg class="caret" viewBox="0 0 24 24" fill="none">
              <path d="M6 9L12 15L18 9" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="dropdown-menu user-dropdown">
              <div class="dropdown-header">
                <div class="avatar-sm">{{ userInitial }}</div>
              <div>
                <div class="dropdown-name">{{ userName }}</div>
                <div class="dropdown-type">{{ userRole }}</div>
              </div>
              </div>
              <router-link to="/recharge" class="dropdown-balance">
                <span>账户余额</span>
                <strong>{{ userBalanceText }}</strong>
              </router-link>
              <router-link to="/account-profile" class="dropdown-item">基本信息</router-link>
              <router-link to="/enterprise-cert" class="dropdown-item">企业认证</router-link>
              <router-link to="/messages" class="dropdown-item with-badge">
                <span>消息通知</span>
                <span v-if="unreadCount > 0" class="dropdown-unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
              </router-link>
              <div class="dropdown-item danger" @click="handleLogout">退出登录</div>
            </div>
          </div>
        </div>
      </header>

      <router-view @balance-updated="loadProfile" @profile-updated="loadProfile" />
    </div>

    <!-- 消息详情模态框 -->
    <div v-if="activeMessage" class="modal-mask" @click.self="activeMessage = null">
      <div class="modal-card message-detail-modal">
        <div class="modal-head message-detail-head">
          <div>
            <h3 class="modal-title">{{ activeMessage.title }}</h3>
            <div class="message-detail-meta">
              <span class="message-detail-badge" :class="{ read: activeMessage.read, unread: !activeMessage.read }">{{ activeMessage.read ? '已读' : '未读' }}</span>
              <span>{{ activeMessage.time }}</span>
            </div>
          </div>
          <button class="modal-close" @click="activeMessage = null">
            <svg viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M18 6L6 18" stroke="#64748B" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="modal-body message-detail-body">
          <p>{{ activeMessage.content }}</p>
        </div>
        <div class="modal-foot message-detail-foot">
          <button class="btn-primary message-confirm-btn" type="button" @click="confirmActiveMessage">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserBalance, getUserProfile } from '../api/user'
import { logout } from '../api/auth'
import { getUserNotices, markNoticeRead } from '../api/notice'
import { getUser, removeToken } from '../utils/auth'
import { yuanFromFen } from '../utils/format'
import logo from '../assets/brand-logo.png'

const route = useRoute()
const router = useRouter()
const profile = ref(getUser() || {})
const topSearchKeyword = ref('')
const sidebarOpen = ref(false)
const accountBalance = ref(null)

const userName = computed(() => profile.value.nickName || profile.value.userName || '当前用户')
const userRole = computed(() => {
  if (profile.value.isAgent === 1 || profile.value.isAgent === '1') return '代理商'
  if (profile.value.parentUserId != null) return '子账号'
  return profile.value.enterpriseName || '企业版账号'
})
const userInitial = computed(() => String(userName.value || '?').charAt(0))
const isAgent = computed(() => profile.value.isAgent === 1 || profile.value.isAgent === '1')
const userBalanceText = computed(() => accountBalance.value == null ? '--' : `¥ ${yuanFromFen(accountBalance.value)}`)

// 面包屑映射表：路径 → 侧边栏板块名
const breadcrumbMap = {
  '/dashboard': [{ path: '/dashboard', title: '工作台' }],
  '/query/create': [{ path: '/query/create', title: '发起背调查询' }],
  '/records': [{ path: '/records', title: '查询记录' }],
  '/account-profile': [{ path: '/account-profile', title: '基本信息' }],
  '/recharge': [{ path: '/recharge', title: '账户充值' }],
  '/recharge/ledger': [{ path: '/recharge', title: '账户充值' }, { path: '/recharge/ledger', title: '资金流水' }],
  '/invoices': [{ path: '/invoices', title: '我的发票' }],
  '/enterprise-cert': [{ path: '/enterprise-cert', title: '企业认证' }],
  '/sub-accounts': [{ path: '/sub-accounts', title: '子账号管理' }],
  '/agent-center': [{ path: '/agent-center', title: '代理中心' }],
  '/messages': [{ path: '/dashboard', title: '工作台' }, { path: '/messages', title: '消息通知' }],
  '/announcements': [{ path: '/dashboard', title: '工作台' }, { path: '/announcements', title: '公告中心' }]
}

const agentSectionTitleMap = {
  overview: '经营概览',
  customers: '客户管理',
  invites: '邀请码管理',
  finance: '资金与分成'
}

// 面包屑
const breadcrumbs = computed(() => {
  const path = route.path

  if (path === '/agent-center') {
    const section = typeof route.query.section === 'string' ? route.query.section : 'overview'
    return [
      { path: '/agent-center', title: '代理中心' },
      { path: route.fullPath, title: agentSectionTitleMap[section] || agentSectionTitleMap.overview }
    ]
  }

  // 报告详情：查询记录 → 报告详情
  if (path.startsWith('/report/')) {
    return [
      { path: '/records', title: '查询记录' },
      { path: path, title: '报告详情' }
    ]
  }
  // 客户资金明细：代理中心 → 客户资金明细
  if (path.startsWith('/agent-center/customers')) {
    const customerName = typeof route.query.customerName === 'string' ? route.query.customerName : ''
    return [
      { path: '/agent-center', title: '代理中心' },
      { path: path, title: customerName ? `客户资金明细-${customerName}` : '客户资金明细' }
    ]
  }

  // 从映射表查找，默认返回工作台
  return breadcrumbMap[path] || [{ path: '/dashboard', title: '工作台' }]
})

const messages = ref([])

const unreadCount = computed(() => messages.value.filter(m => !m.read).length)
const recentMessages = computed(() => messages.value.slice(0, 4))

const activeMessage = ref(null)
function openMessage(msg) {
  activeMessage.value = msg
}
async function markMessageRead() {
  if (activeMessage.value) {
    await markNoticeRead(activeMessage.value.id)
    activeMessage.value.read = true
    const item = messages.value.find(message => message.id === activeMessage.value.id)
    if (item) item.read = true
  }
}

async function confirmActiveMessage() {
  if (activeMessage.value && !activeMessage.value.read) {
    await markMessageRead()
  }
  activeMessage.value = null
}

function handleTopSearch() {
  const keyword = topSearchKeyword.value.trim()
  if (!keyword) return
  router.push({ path: '/records', query: { keyword } })
}

function goMessages() {
  router.push('/messages')
}

function goProfile() {
  router.push('/account-profile')
}

function openSidebar() {
  sidebarOpen.value = true
}

function closeSidebar() {
  sidebarOpen.value = false
}

// 内联线性图标（#8FA8D0，符合新设计）
const ICON = '#8FA8D0'
const gridIcon = `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="${ICON}" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="${ICON}" stroke-width="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="${ICON}" stroke-width="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="${ICON}" stroke-width="1.5"/></svg>`
const shieldIcon = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3L4 6V11C4 15.5 7.2 19.7 12 21C16.8 19.7 20 15.5 20 11V6L12 3Z" stroke="${ICON}" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 12L11 14L15 10" stroke="${ICON}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const listIcon = `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" stroke="${ICON}" stroke-width="1.5"/><path d="M8 8H16M8 12H16M8 16H13" stroke="${ICON}" stroke-width="1.5" stroke-linecap="round"/></svg>`
const userIcon = `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="${ICON}" stroke-width="1.5"/><path d="M5 21C5 16.6 8.1 14 12 14C15.9 14 19 16.6 19 21" stroke="${ICON}" stroke-width="1.5" stroke-linecap="round"/></svg>`
const walletIcon = `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="1" stroke="${ICON}" stroke-width="1.5"/><path d="M3 9H21M16 14H18" stroke="${ICON}" stroke-width="1.5" stroke-linecap="round"/></svg>`
const receiptIcon = `<svg viewBox="0 0 24 24" fill="none"><path d="M5 3V21L7 20L9 21L12 20L15 21L17 20L19 21V3L17 4L15 3L12 4L9 3L7 4L5 3Z" stroke="${ICON}" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 8H16M8 12H16" stroke="${ICON}" stroke-width="1.5" stroke-linecap="round"/></svg>`
const buildingIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12h4"></path><path d="M10 8h4"></path><path d="M14 21v-3a2 2 0 0 0-4 0v3"></path><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path></svg>`
const usersIcon = `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3.2" stroke="${ICON}" stroke-width="1.5"/><path d="M3 20C3 16.6 5.7 14 9 14C12.3 14 15 16.6 15 20" stroke="${ICON}" stroke-width="1.5" stroke-linecap="round"/><path d="M16 4.5C18 5 19.5 6.8 19.5 9C19.5 11.2 18 13 16 13.5M21 20C21 17.5 19.5 15.4 17.5 14.5" stroke="${ICON}" stroke-width="1.5" stroke-linecap="round"/></svg>`
const percentIcon = `<svg viewBox="0 0 1024 1024" fill="none"><path class="nav-fill" d="M512 0h234.666667v234.666667A234.666667 234.666667 0 1 1 512 0zM13.568 970.794667A42.666667 42.666667 0 0 0 54.954667 1024h914.133333a42.666667 42.666667 0 0 0 41.386667-53.205333l-75.050667-294.101334a42.666667 42.666667 0 0 0-20.48-26.666666l-129.450667-72.533334a42.666667 42.666667 0 0 0-59.818666 19.84l-120.576 270.208-42.922667-144.256a42.666667 42.666667 0 0 1 0-24.32l26.624-89.472A42.666667 42.666667 0 0 0 547.84 554.666667H476.16a42.666667 42.666667 0 0 0-40.874667 54.826666l26.581334 89.429334c2.389333 7.978667 2.389333 16.426667 0 24.32l-42.922667 144.298666L298.325333 597.333333a42.666667 42.666667 0 0 0-59.818666-19.84l-129.450667 72.533334a42.666667 42.666667 0 0 0-20.48 26.666666L13.568 970.794667z"></path></svg>`
// 旧项目模块导航（按新样式渲染）；代理项仅代理可见
const rawNavGroups = [
  {
    title: '日常业务',
    items: [
      { to: '/dashboard', label: '工作台', icon: gridIcon, activePaths: ['/announcements'] },
      { to: '/query/create', label: '发起背调查询', icon: shieldIcon },
      { to: '/records', label: '查询记录', icon: listIcon, activePaths: ['/report/'] }
    ]
  },
  {
    title: '账户财务',
    items: [
      { to: '/account-profile', label: '基本信息', icon: userIcon },
      { to: '/recharge', label: '账户充值', icon: walletIcon, activePaths: ['/recharge/ledger'] },
      { to: '/invoices', label: '我的发票', icon: receiptIcon },
      { to: '/agent-center', label: '代理中心', icon: percentIcon, activePaths: ['/agent-center/customers'], agentOnly: true }
    ]
  },
  {
    title: '组织管理',
    items: [
      { to: '/enterprise-cert', label: '企业认证', icon: buildingIcon },
      { to: '/sub-accounts', label: '子账号管理', icon: usersIcon }
    ]
  }
]
const navGroups = computed(() =>
  rawNavGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.agentOnly || isAgent.value)
    }))
    .filter(group => group.items.length > 0)
)

function isNavActive(item) {
  return route.path === item.to || (item.activePaths || []).some(path => route.path.startsWith(path))
}

watch(
  () => route.query.keyword,
  value => {
    if (route.path === '/records') {
      topSearchKeyword.value = typeof value === 'string' ? value : ''
    }
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  }
)

async function loadProfile() {
  try {
    const res = await getUserProfile()
    profile.value = res.data || res.user || profile.value
  } catch (e) {
  } finally {
    await loadAccountBalance()
  }
}

async function loadAccountBalance() {
  const userId = profile.value.userId || profile.value.id
  if (!userId) {
    accountBalance.value = profile.value.money == null ? null : Number(profile.value.money)
    return
  }
  try {
    const res = await getUserBalance(userId)
    accountBalance.value = Number(res?.data ?? res?.balance ?? 0)
  } catch (e) {
    accountBalance.value = profile.value.money == null ? null : Number(profile.value.money)
  }
}

function mapMessage(item) {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    time: String(item.createTime || item.time || '').slice(0, 16),
    read: Number(item.status) === 1 || item.read === true
  }
}

async function loadMessages() {
  try {
    const userId = profile.value.userId || profile.value.id
    const res = await getUserNotices(userId, { pageNum: 1, pageSize: 6 })
    messages.value = (res.rows || []).map(mapMessage)
  } catch (e) {}
}

async function handleLogout() {
  try { await logout() } catch (e) {}
  removeToken()
  router.replace('/login')
}

onMounted(async () => {
  await loadProfile()
  await loadMessages()
})
</script>
