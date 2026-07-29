import { createRouter, createWebHashHistory } from 'vue-router'
import ClientLayout from '../layout/ClientLayout.vue'
import { getToken, getUser } from '../utils/auth'

const Dashboard = () => import('../views/Dashboard.vue')
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const LegalDocument = () => import('../views/LegalDocument.vue')
const CandidateAuthorization = () => import('../views/candidate/CandidateAuthorization.vue')
const QueryCreate = () => import('../views/QueryCreate.vue')
const Records = () => import('../views/Records.vue')
const ReportFull = () => import('../views/report-full/Index.vue')
const Recharge = () => import('../views/Recharge.vue')
const AccountLedger = () => import('../views/AccountLedger.vue')
const Invoices = () => import('../views/Invoices.vue')
const Announcements = () => import('../views/Announcements.vue')
const PublicAnnouncements = () => import('../views/PublicAnnouncements.vue')
const EnterpriseCert = () => import('../views/EnterpriseCert.vue')
const SubAccounts = () => import('../views/SubAccounts.vue')
const AgentCenter = () => import('../views/AgentCenter.vue')
const AgentCustomerFinance = () => import('../views/AgentCustomerFinance.vue')
const AccountProfile = () => import('../views/AccountProfile.vue')
const NotFound = () => import('../views/NotFound.vue')

const routes = [
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  {
    path: '/user-agreement',
    name: 'userAgreement',
    component: LegalDocument,
    props: { type: 'agreement' },
    meta: { public: true, title: '用户协议' }
  },
  {
    path: '/privacy-policy',
    name: 'privacyPolicy',
    component: LegalDocument,
    props: { type: 'privacy' },
    meta: { public: true, title: '隐私政策' }
  },
  {
    path: '/candidate/authorization/:token?',
    name: 'candidateAuthorization',
    component: CandidateAuthorization,
    meta: { public: true, title: '候选人信息授权' }
  },
  {
    path: '/',
    component: ClientLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: Dashboard, meta: { title: '工作台' } },
      { path: 'account-profile', name: 'accountProfile', component: AccountProfile, meta: { title: '基础信息' } },
      { path: 'query/create', name: 'queryCreate', component: QueryCreate, meta: { title: '发起背调' } },
      { path: 'records', name: 'records', component: Records, meta: { title: '查询记录' } },
      { path: 'report/:id', name: 'reportDetail', component: ReportFull, meta: { title: '报告详情' } },
      { path: 'recharge', name: 'recharge', component: Recharge, meta: { title: '账户充值' } },
      { path: 'recharge/ledger', name: 'accountLedger', component: AccountLedger, meta: { title: '资金流水' } },
      { path: 'invoices', name: 'invoices', component: Invoices, meta: { title: '我的发票' } },
      { path: 'enterprise-cert', name: 'enterpriseCert', component: EnterpriseCert, meta: { title: '企业认证' } },
      { path: 'sub-accounts', name: 'subAccounts', component: SubAccounts, meta: { title: '子账号管理', mainOnly: true } },
      { path: 'agent-center', name: 'agentCenter', component: AgentCenter, meta: { title: '代理中心', agentOnly: true } },
      { path: 'agent-center/customers/:userId/finance', name: 'agentCustomerFinance', component: AgentCustomerFinance, meta: { title: '客户资金明细', agentOnly: true } },
      { path: 'announcements', name: 'announcements', component: PublicAnnouncements, meta: { title: '公告中心' } },
      { path: 'messages', name: 'messages', component: Announcements, meta: { title: '消息通知' } }
    ]
  },
  { path: '/:pathMatch(.*)*', component: NotFound }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.path === '/login' || to.path === '/register' || to.meta.public) return next()
  if (!getToken()) return next('/login')

  // 路由上标了 mainOnly / agentOnly 却一直没人读，导致侧栏虽然隐藏了入口，
  // 手输 #/sub-accounts、#/agent-center 仍能进到一个必然报错的空页面。
  // 后端对这两类接口都有校验，这里只是不让用户白跑一趟。
  const user = getUser() || {}
  const isSubAccount = user.parentUserId != null || user.accountType === 'sub'
  // isAgent 要等 ClientLayout 拉过一次 profile 才会进缓存。
  // 字段还没有时一律放行，交给页面自己判断——错拦一个真代理商，
  // 比让一个非代理多看一眼空页面严重得多。
  const knowsAgent = 'isAgent' in user
  const isAgent = user.isAgent === true || user.isAgent === 1 || user.isAgent === '1'

  if (to.meta.mainOnly && isSubAccount) return next('/dashboard')
  if (to.meta.agentOnly && knowsAgent && !isAgent) return next('/dashboard')

  next()
})

export default router
