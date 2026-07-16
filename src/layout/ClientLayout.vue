<template>
  <div class="client-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">钟</div>
        <div>
          <div class="brand-title">钟馗背调</div>
          <div class="brand-sub">企业风险管理平台</div>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="主导航">
        <div class="nav-group">
          <div class="nav-section">业务中心</div>
          <router-link v-for="item in businessMenus" :key="item.path" class="nav-item" :to="item.path">
            <component :is="item.icon" class="nav-icon" :size="18" :stroke-width="1.8" />
            <span>{{ item.title }}</span>
          </router-link>
        </div>

        <div class="nav-group">
          <div class="nav-section">账户与组织</div>
          <router-link v-for="item in accountMenus" :key="item.path" class="nav-item" :to="item.path">
            <component :is="item.icon" class="nav-icon" :size="18" :stroke-width="1.8" />
            <span>{{ item.title }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="security-note">
          <LockKeyhole :size="17" :stroke-width="1.8" />
          <div>
            <strong>数据安全保护中</strong>
            <span>访问行为全程留痕</span>
          </div>
        </div>
      </div>
    </aside>

    <section class="main-area">
      <header class="topbar">
        <div class="topbar-context">
          <span>企业工作台</span>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="topbar-actions">
          <div ref="menuRef" class="user-menu">
            <button class="user-menu-btn" type="button" @click.stop="toggleMenu">
              <span class="avatar-btn">{{ userInitial }}</span>
              <span class="user-menu-copy">
                <strong class="user-menu-name">{{ userName }}</strong>
                <small>{{ isSubAccount ? '企业子账号' : isAgent ? '代理商账号' : '企业主账号' }}</small>
              </span>
              <ChevronDown class="menu-chevron" :class="{ open: menuOpen }" :size="16" />
            </button>
            <div v-if="menuOpen" class="user-dropdown" @click.stop>
              <div class="user-dropdown-head">
                <span class="avatar-btn large">{{ userInitial }}</span>
                <div>
                  <strong>{{ userName }}</strong>
                  <p>{{ isSubAccount ? '企业子账号' : '企业版账号' }}</p>
                </div>
              </div>
              <div class="dropdown-links">
                <router-link to="/account-profile" @click="menuOpen = false"><UserRound :size="17" />基本信息</router-link>
                <router-link to="/enterprise-cert" @click="menuOpen = false"><Building2 :size="17" />企业认证</router-link>
                <router-link to="/announcements" @click="menuOpen = false"><Bell :size="17" />消息通知</router-link>
              </div>
              <button class="logout-btn" type="button" @click="handleLogout"><LogOut :size="17" />退出登录</button>
            </div>
          </div>
        </div>
      </header>
      <main class="page-content" :class="{ 'page-content-wide': route.name === 'records' }">
        <router-view @balance-updated="loadProfile" @profile-updated="loadProfile" />
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BadgePercent,
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  ReceiptText,
  ShieldCheck,
  UserRound,
  UsersRound
} from '@lucide/vue'
import { logout } from '../api/auth'
import { getUserProfile } from '../api/user'
import { getUser, removeToken } from '../utils/auth'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.meta.title || '工作台')
const menuOpen = ref(false)
const menuRef = ref(null)
const localUser = getUser()
const profile = ref(localUser || {})
const userName = ref(localUser.nickName || localUser.userName || '当前用户')
const userInitial = computed(() => (userName.value || '钟').slice(0, 1))
const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))
const isAgent = computed(() => profile.value && (profile.value.isAgent === true || profile.value.isAgent === 1 || profile.value.isAgent === '1'))

const businessMenus = [
  { title: '工作台', path: '/dashboard', icon: LayoutDashboard },
  { title: '发起背调查询', path: '/query/create', icon: ShieldCheck },
  { title: '查询记录', path: '/records', icon: ClipboardList }
]

const rawAccountMenus = [
  { title: '基本信息', path: '/account-profile', icon: UserRound },
  { title: '账户充值', path: '/recharge', icon: CreditCard },
  { title: '我的发票', path: '/invoices', icon: ReceiptText },
  { title: '企业认证', path: '/enterprise-cert', icon: Building2 },
  { title: '子账号管理', path: '/sub-accounts', icon: UsersRound, mainOnly: true },
  { title: '代理中心', path: '/agent-center', icon: BadgePercent, agentOnly: true },
  { title: '消息通知', path: '/announcements', icon: Bell }
]

const accountMenus = computed(() => rawAccountMenus.filter(item => !item.agentOnly || isAgent.value))

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleDocumentClick(event) {
  if (!menuOpen.value) return
  if (menuRef.value && menuRef.value.contains(event.target)) return
  menuOpen.value = false
}

async function loadProfile() {
  try {
    const response = await getUserProfile()
    const user = response.data || response.user || {}
    profile.value = { ...user, isAgent: response.isAgent ?? user.isAgent }
    userName.value = user.nickName || user.userName || userName.value
  } catch (err) {}
}

async function handleLogout() {
  menuOpen.value = false
  try { await logout() } catch (err) {}
  removeToken()
  router.replace('/login')
}

onMounted(() => {
  loadProfile()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.nav-item:hover .nav-icon,
.nav-item.router-link-active .nav-icon {
  color: currentColor;
}
</style>
