<template>
  <div class="client-shell" :class="{ 'nav-open': navOpen, 'rail-collapsed': railCollapsed }">
    <!-- 移动端遮罩：点击关闭抽屉 -->
    <div v-if="navOpen" class="nav-scrim" @click="navOpen = false"></div>

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
          <div class="nav-section">日常业务</div>
          <router-link v-for="item in businessMenus" :key="item.path" class="nav-item" :to="item.path" :data-title="item.title" @click="navOpen = false">
            <component :is="item.icon" class="nav-icon" :size="18" :stroke-width="1.8" />
            <span>{{ item.title }}</span>
            <em v-if="item.badge" class="nav-badge" :class="item.badgeTone">{{ item.badge }}</em>
          </router-link>
        </div>

        <div class="nav-group">
          <div class="nav-section">账户资金</div>
          <router-link v-for="item in fundMenus" :key="item.path" class="nav-item" :to="item.path" :data-title="item.title" @click="navOpen = false">
            <component :is="item.icon" class="nav-icon" :size="18" :stroke-width="1.8" />
            <span>{{ item.title }}</span>
            <em v-if="item.badge" class="nav-badge" :class="item.badgeTone">{{ item.badge }}</em>
          </router-link>
        </div>

        <div class="nav-group">
          <div class="nav-section">企业管理</div>
          <router-link v-for="item in orgMenus" :key="item.path" class="nav-item" :to="item.path" :data-title="item.title" @click="navOpen = false">
            <component :is="item.icon" class="nav-icon" :size="18" :stroke-width="1.8" />
            <span>{{ item.title }}</span>
            <em v-if="item.badge" class="nav-badge" :class="item.badgeTone">{{ item.badge }}</em>
          </router-link>
        </div>

        <div class="nav-group">
          <div class="nav-section">服务支持</div>
          <router-link v-for="item in supportMenus" :key="item.path" class="nav-item" :to="item.path" :data-title="item.title" @click="navOpen = false">
            <component :is="item.icon" class="nav-icon" :size="18" :stroke-width="1.8" />
            <span>{{ item.title }}</span>
            <em v-if="item.badge" class="nav-badge" :class="item.badgeTone">{{ item.badge }}</em>
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
        <button class="nav-toggle" type="button" aria-label="打开导航菜单" @click.stop="navOpen = !navOpen">
          <Menu :size="20" :stroke-width="1.9" />
        </button>
        <!-- 顶栏只做定位与全局操作，标题由页面自己承担，避免上下重复两遍 -->
        <button class="rail-toggle" type="button" :aria-label="railCollapsed ? '展开侧栏' : '收起侧栏'" @click="toggleRail">
          <PanelLeft :size="18" :stroke-width="1.9" />
        </button>
        <div class="topbar-context">
          <span>{{ pageTitle }}</span>
        </div>
        <div class="topbar-actions">
          <!-- 下单是这个系统的核心动作，之前只有工作台和侧栏两个入口，
               用户在看流水/发票时想下单得先绕回去。窄屏不出现：
               顶栏已被汉堡+余额+头像占满，且手机上工作台第一屏就是同一个全宽按钮 -->
          <router-link class="topbar-cta" to="/query/create">
            <Plus :size="16" :stroke-width="2.2" />
            {{ canOnlineTest ? '在线测试' : '发起背调' }}
          </router-link>
          <!-- 余额从工作台的一格卡片提到顶栏：它决定了能不能下单，
               每个页面都该看得见，而不是只在工作台第一屏 -->
          <router-link class="topbar-balance" :class="{ low: balanceLow }" to="/recharge">
            <span class="tb-label">余额</span>
            <strong>&yen;{{ balanceText }}</strong>
          </router-link>
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
                <router-link to="/enterprise-cert" @click="menuOpen = false"><Building2 :size="17" />企业认证</router-link>
                <router-link to="/messages" @click="menuOpen = false"><Bell :size="17" />消息通知</router-link>
              </div>
              <button class="logout-btn" type="button" @click="handleLogout"><LogOut :size="17" />退出登录</button>
            </div>
          </div>
        </div>
      </header>
      <!-- 下拉刷新指示器：只在触摸设备上出现，跟随手指下移 -->
      <div
        v-if="pullOffset > 0 || refreshing"
        class="pull-indicator"
        :class="{ armed: pullArmed, spinning: refreshing }"
        :style="{ transform: `translateX(-50%) translateY(${refreshing ? 34 : pullOffset}px)` }"
      >
        <RefreshCw :size="16" :stroke-width="2" />
      </div>
      <main class="page-content" :class="{ 'page-content-wide': route.name === 'records' }">
        <router-view @balance-updated="loadProfile" @profile-updated="loadProfile" />
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftRight,
  BadgePercent,
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  CircleHelp,
  Headphones,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquareText,
  PanelLeft,
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UsersRound
} from '@lucide/vue'
import { logout } from '../api/auth'
import { getUserBalance, getUserProfile } from '../api/user'
import { getUnreadCount } from '../api/notice'
import { getMyEnterpriseCertList } from '../api/enterpriseCert'
import { getUser, removeToken, setUser } from '../utils/auth'
import { yuanFromFen } from '../utils/format'
import { canRefresh, runRefresh, useRefreshState } from '../composables/pullRefresh'

const route = useRoute()
const router = useRouter()
const pageTitle = computed(() => route.name === 'queryCreate' && canOnlineTest.value ? '在线测试' : (route.meta.title || '工作台'))
const menuOpen = ref(false)
// 移动端抽屉导航开关；路由变化时自动收起，避免跳转后遮罩还挂着
const navOpen = ref(false)
// 侧栏折叠：笔记本屏幕上 240px 常驻过于占地方，折叠后只留图标
const railCollapsed = ref(localStorage.getItem('zk_rail_collapsed') === '1')
function toggleRail() {
  railCollapsed.value = !railCollapsed.value
  localStorage.setItem('zk_rail_collapsed', railCollapsed.value ? '1' : '0')
}
watch(() => route.fullPath, (to, from) => {
  navOpen.value = false
  // 离开消息页时重算未读数，否则读完消息侧栏徽章还挂着
  if (from === '/messages' || to === '/enterprise-cert') loadNavBadges()
})
const unreadCount = ref(0)
// 未认证时在侧栏「企业认证」上打标：企业认证影响能不能正常下单，
// 藏在二级页面里用户不会主动去看
const certPending = ref(false)

async function loadNavBadges() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = Number(res?.data ?? res?.count ?? 0) || 0
  } catch (err) { /* 徽章是锦上添花，失败就不显示，不打扰主流程 */ }

  try {
    const res = await getMyEnterpriseCertList()
    const list = Array.isArray(res?.data) ? res.data : (res?.rows || [])
    certPending.value = !list.some(item => item.status === 'approved')
  } catch (err) { certPending.value = false }
}

const balance = ref(0)
const balanceText = computed(() => yuanFromFen(balance.value))
// 余额为 0 时标红：这是唯一会直接挡住下单的账户状态，值得在每一页都看得见
const balanceLow = computed(() => Number(balance.value) <= 0)
const menuRef = ref(null)
const localUser = getUser()
const profile = ref(localUser || {})
const userName = ref(localUser.nickName || localUser.userName || '当前用户')
const userInitial = computed(() => (userName.value || '钟').slice(0, 1))
const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))
const isAgent = computed(() => profile.value && (profile.value.isAgent === true || profile.value.isAgent === 1 || profile.value.isAgent === '1'))
const canOnlineTest = computed(() => profile.value && (profile.value.onlineTestEnabled === true || profile.value.onlineTestEnabled === 1 || profile.value.onlineTestEnabled === '1'))

// 菜单按「用户在做什么」分三组，而不是原先把个人资料/钱/组织/消息混在一起。
// 基础信息放在「企业管理」组：它和企业认证、子账号同属账号配置，集中在一处比散落在头像下拉里好找。
const businessMenus = computed(() => [
  { title: '工作台', path: '/dashboard', icon: LayoutDashboard },
  { title: canOnlineTest.value ? '在线测试' : '发起背调', path: '/query/create', icon: ShieldCheck },
  { title: '查询记录', path: '/records', icon: ClipboardList },
  {
    title: '消息通知',
    path: '/messages',
    icon: Bell,
    badge: unreadCount.value > 0 ? (unreadCount.value > 99 ? '99+' : String(unreadCount.value)) : '',
    badgeTone: 'count'
  }
])

const rawFundMenus = [
  { title: '账户充值', path: '/recharge', icon: CreditCard },
  // 原先藏在充值页右上角，是个二级入口；查流水和充值是两件独立的事，提到同级
  { title: '资金流水', path: '/recharge/ledger', icon: ArrowLeftRight },
  { title: '我的发票', path: '/invoices', icon: ReceiptText },
  { title: '代理中心', path: '/agent-center', icon: BadgePercent, agentOnly: true }
]

const rawOrgMenus = computed(() => [
  { title: '基础信息', path: '/account-profile', icon: UserRound },
  {
    title: '企业认证',
    path: '/enterprise-cert',
    icon: Building2,
    badge: certPending.value ? '未认证' : '',
    badgeTone: 'warn'
  },
  { title: '子账号管理', path: '/sub-accounts', icon: UsersRound, mainOnly: true }
])

const fundMenus = computed(() => rawFundMenus.filter(item => !item.agentOnly || isAgent.value))
// 子账号本身不能再管理子账号，隐藏该入口
const orgMenus = computed(() => rawOrgMenus.value.filter(item => !item.mainOnly || !isSubAccount.value))
const supportMenus = [
  { title: '常见问题', path: '/support/faq', icon: CircleHelp },
  { title: '意见反馈', path: '/support/feedback', icon: MessageSquareText },
  { title: '联系我们', path: '/support/contact-us', icon: Headphones }
]

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
    const merged = { ...user, isAgent: response.isAgent ?? user.isAgent }
    profile.value = merged
    // isAgent 是 profile 接口在响应根上单独返回的，登录时存的 user 里没有这个字段。
    // 写回缓存，路由守卫与代理中心才能凭身份判断，而不是靠接口报错反推。
    setUser(merged)
    userName.value = user.nickName || user.userName || userName.value
    // 余额常驻顶栏，所以放在这里拉：任何页面扣费后触发 balance-updated 都会刷新到最新值
    if (user.userId) {
      const result = await getUserBalance(user.userId)
      balance.value = result.data || 0
    } else {
      balance.value = user.money || 0
    }
  } catch (err) {}
}

async function handleLogout() {
  menuOpen.value = false
  try { await logout() } catch (err) {}
  removeToken()
  router.replace('/login')
}

/* ---- 下拉刷新 ----
   页面顶部向下拖动超过阈值即重新拉取当前页数据，替代原先每个卡片头上的「刷新」按钮。
   只在触摸设备上启用：鼠标环境下拖不出这个手势，反而会误触发。 */
const PULL_TRIGGER = 64
const PULL_MAX = 96

const { refreshing } = useRefreshState()
const pullOffset = ref(0)
const pullArmed = computed(() => pullOffset.value >= PULL_TRIGGER)

let touchStartY = 0
let pulling = false

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches

function onTouchStart(event) {
  if (event.touches.length !== 1 || refreshing.value || !canRefresh()) return
  // 只有已经滚到最顶部时才认为用户想刷新，否则这是一次普通滚动
  if (window.scrollY > 0) return
  touchStartY = event.touches[0].clientY
  pulling = true
}

function onTouchMove(event) {
  if (!pulling) return
  const delta = event.touches[0].clientY - touchStartY
  if (delta <= 0) {
    // 反向滑动说明用户其实要往下滚，交还给页面
    pulling = false
    pullOffset.value = 0
    return
  }
  // 阻尼：拖到底也只走 96px，手感上明确「到头了」
  pullOffset.value = Math.min(PULL_MAX, delta * 0.45)
  if (pullOffset.value > 4 && event.cancelable) event.preventDefault()
}

async function onTouchEnd() {
  if (!pulling) return
  pulling = false
  const shouldRefresh = pullOffset.value >= PULL_TRIGGER
  pullOffset.value = 0
  if (shouldRefresh) await runRefresh()
}

onMounted(() => {
  loadProfile()
  loadNavBadges()
  document.addEventListener('click', handleDocumentClick)
  if (isTouchDevice()) {
    // passive:false 是必需的——要靠 preventDefault 压住浏览器自己的下拉刷新
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  window.removeEventListener('touchcancel', onTouchEnd)
})
</script>

<style scoped>
.nav-item:hover .nav-icon,
.nav-item.router-link-active .nav-icon {
  color: currentColor;
}

/* ---- 侧栏徽章 ----
   未读消息数与「未认证」提示：这两件事都在二级页面里，
   不在导航上给信号用户不会主动去看。 */
.nav-item { position: relative; }

.nav-badge {
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-style: normal;
  font-weight: 600;
  line-height: 17px;
}

/* 未读数：朱砂实心，扫一眼就知道有多少条 */
.nav-badge.count {
  min-width: 17px;
  background: var(--cinnabar);
  color: #fff;
  text-align: center;
}

/* 未认证：提示性质，用描边而非实心，避免和未读数抢注意力 */
.nav-badge.warn {
  border: 1px solid var(--orange);
  color: var(--orange);
  background: var(--orange-soft);
}

/* 侧栏收起时只剩图标，徽章缩成一个圆点挂在图标右上角 */
.rail-collapsed .nav-badge {
  position: absolute;
  top: 6px;
  right: 8px;
  min-width: 8px;
  height: 8px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-radius: 50%;
  text-indent: -99px;
}

.rail-collapsed .nav-badge.warn {
  border: 0;
  background: var(--orange);
}

/* ---- 顶栏主操作 ---- */
.topbar-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: var(--radius);
  background: var(--text);
  color: #fff;
  font-size: var(--fs-sm);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity .14s ease;
}

.topbar-cta:hover { opacity: .88; }

@media (max-width: 768px) {
  .topbar-cta { display: none; }
}

/* ---- 顶栏余额 ---- */
.topbar-balance {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
  transition: border-color .14s ease, background .14s ease;
}

.topbar-balance:hover { border-color: #c9cdd4; background: var(--line-soft); }

.topbar-balance .tb-label {
  color: var(--muted);
  font-size: var(--fs-xs);
}

.topbar-balance strong {
  font-size: var(--fs-base);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* 余额见底时明确警示——这是唯一会直接挡住下单的账户状态 */
.topbar-balance.low { border-color: #e7c3bf; background: #fdf5f4; }
.topbar-balance.low strong { color: var(--cinnabar); }

@media (max-width: 768px) {
  /* 窄屏只留金额，「余额」二字由货币符号代替 */
  .topbar-balance { height: 30px; padding: 0 9px; }
  .topbar-balance .tb-label { display: none; }
  .topbar-balance strong { font-size: var(--fs-sm); }
}

/* ---- 下拉刷新指示器 ---- */
.pull-indicator {
  position: fixed;
  top: 46px;
  left: 50%;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(16, 24, 40, .1);
  color: var(--muted);
  pointer-events: none;
}

/* 拖过阈值时变色，告诉用户「松手就会刷新」 */
.pull-indicator.armed { border-color: var(--text); color: var(--text); }

.pull-indicator.spinning {
  color: var(--text);
  animation: pull-spin .7s linear infinite;
  transition: transform .18s ease;
}

@keyframes pull-spin {
  from { transform: translateX(-50%) translateY(34px) rotate(0deg); }
  to { transform: translateX(-50%) translateY(34px) rotate(360deg); }
}
</style>
