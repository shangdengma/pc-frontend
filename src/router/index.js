import { createRouter, createWebHashHistory } from 'vue-router'
import ClientLayout from '../layout/ClientLayout.vue'
import { getToken } from '../utils/auth'

const Dashboard = () => import('../views/Dashboard.vue')
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const QueryCreate = () => import('../views/QueryCreate.vue')
const Records = () => import('../views/Records.vue')
const ReportFull = () => import('../views/report-full/Index.vue')
const Recharge = () => import('../views/Recharge.vue')
const Invoices = () => import('../views/Invoices.vue')
const Announcements = () => import('../views/Announcements.vue')
const PublicAnnouncements = () => import('../views/PublicAnnouncements.vue')
const EnterpriseCert = () => import('../views/EnterpriseCert.vue')
const SubAccounts = () => import('../views/SubAccounts.vue')
const AgentCenter = () => import('../views/AgentCenter.vue')
const AccountProfile = () => import('../views/AccountProfile.vue')
const NotFound = () => import('../views/NotFound.vue')

const routes = [
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  {
    path: '/',
    component: ClientLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: Dashboard, meta: { title: '工作台' } },
      { path: 'account-profile', name: 'accountProfile', component: AccountProfile, meta: { title: '基本信息' } },
      { path: 'query/create', name: 'queryCreate', component: QueryCreate, meta: { title: '发起背调查询' } },
      { path: 'records', name: 'records', component: Records, meta: { title: '查询记录' } },
      { path: 'report/:id', name: 'reportDetail', component: ReportFull, meta: { title: '报告详情' } },
      { path: 'recharge', name: 'recharge', component: Recharge, meta: { title: '账户充值' } },
      { path: 'invoices', name: 'invoices', component: Invoices, meta: { title: '我的发票' } },
      { path: 'enterprise-cert', name: 'enterpriseCert', component: EnterpriseCert, meta: { title: '企业认证' } },
      { path: 'sub-accounts', name: 'subAccounts', component: SubAccounts, meta: { title: '子账号管理', mainOnly: true } },
      { path: 'agent-center', name: 'agentCenter', component: AgentCenter, meta: { title: '代理中心', agentOnly: true } },
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
  if (to.path === '/login' || to.path === '/register') return next()
  if (!getToken()) return next('/login')


  next()
})

export default router


