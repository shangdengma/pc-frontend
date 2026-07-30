import { createWebHashHistory, createRouter } from 'vue-router'
import { getToken } from '../utils/auth'

// 路由组织与旧项目一致：login/register/404 独立；ClientLayout 为外壳 + 子路由。
// 哈希路由（createWebHashHistory）。所有页面均为真实设计视图，无"建设中"占位。
const routes = [
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'register', component: () => import('../views/Register.vue') },
  { path: '/user-agreement', name: 'userAgreement', component: () => import('../views/LegalDocument.vue'), props: { type: 'agreement' }, meta: { public: true, title: '用户协议' } },
  { path: '/privacy-policy', name: 'privacyPolicy', component: () => import('../views/LegalDocument.vue'), props: { type: 'privacy' }, meta: { public: true, title: '隐私政策' } },
  {
    path: '/',
    component: () => import('../layout/ClientLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '工作台' } },
      { path: 'account-profile', name: 'accountProfile', component: () => import('../views/AccountProfile.vue'), meta: { title: '基本信息' } },
      { path: 'query/create', name: 'queryCreate', component: () => import('../views/QueryCreate.vue'), meta: { title: '发起背调查询' } },
      { path: 'records', name: 'records', component: () => import('../views/Records.vue'), meta: { title: '查询记录' } },
      { path: 'report/:id', name: 'reportDetail', component: () => import('../views/report-full/Index.vue'), meta: { title: '报告详情' } },
      { path: 'recharge', name: 'recharge', component: () => import('../views/Recharge.vue'), meta: { title: '账户充值' } },
      { path: 'recharge/ledger', name: 'accountLedger', component: () => import('../views/AccountLedger.vue'), meta: { title: '资金流水' } },
      { path: 'invoices', name: 'invoices', component: () => import('../views/Invoices.vue'), meta: { title: '我的发票' } },
      { path: 'enterprise-cert', name: 'enterpriseCert', component: () => import('../views/EnterpriseCert.vue'), meta: { title: '企业认证' } },
      { path: 'sub-accounts', name: 'subAccounts', component: () => import('../views/SubAccounts.vue'), meta: { title: '子账号管理', mainOnly: true } },
      { path: 'agent-center', name: 'agentCenter', component: () => import('../views/AgentCenter.vue'), meta: { title: '代理中心', agentOnly: true } },
      { path: 'agent-center/customers/:userId/finance', name: 'agentCustomerFinance', component: () => import('../views/AgentCustomerFinance.vue'), meta: { title: '客户资金明细', agentOnly: true } },
      { path: 'announcements', name: 'announcements', component: () => import('../views/PublicAnnouncements.vue'), meta: { title: '公告中心' } },
      { path: 'messages', name: 'messages', component: () => import('../views/Announcements.vue'), meta: { title: '消息通知' } }
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'notFound', component: () => import('../views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// 守卫：未登录跳 /login（与旧项目一致）
router.beforeEach((to, from, next) => {
  const white = ['/login', '/register']
  if (white.includes(to.path) || to.meta.public) return next()
  if (!getToken()) return next('/login')
  next()
})

export default router
