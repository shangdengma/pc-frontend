# 钟馗背调 · 新前端（AI 快速接手文档）

> **写给下一个 AI**：这是一个完整的 Vue 3 企业级 SaaS 前端项目，目标是把旧前端的样式**彻底重构为新设计语言**，并保持与旧项目一致的组织架构。本文档覆盖你需要的全部信息——读完即可直接开发。

> **业务契约硬约束（2026-07-27）**：旧项目是业务逻辑、接口路径、请求参数和响应字段的唯一基准；新项目只修改模板、布局和样式。新增显示接口及当前对齐结果以 [`LOGIC_CONTRACT_ALIGNMENT.md`](./LOGIC_CONTRACT_ALIGNMENT.md) 为准，本文件中早期的“模拟数据”描述不得作为正式接口依据。

---

## 1. 项目背景

- **产品**：钟馗背调——企业雇前背调 B 端 SaaS 管理后台
- **旧项目**：`zk-front-old/pc-frontend`（Vue 3.5 + Vite 5 + vue-router 4(哈希)），功能完整但 **设计语言过时，需要被替换**
- **新项目**：`zk-front-new/pc-fronted-new`（本目录），目标是把旧项目的所有业务页面**按新设计语言逐页重建**
- **用户意图**：保留旧项目的路由结构/业务逻辑/API 层/工具层（"组织架构一致"），但视觉上彻底换成用户自己设计的新风格

---

## 2. 新设计语言（必读，所有页面必须严格遵循）

设计样板文件：`zk-front-new/dashboard.html`（用户亲手设计的视觉权威）。详细规范文档：`.workbuddy/memory/new-dashboard-design-guide.md`。

### 2.1 总体气质

深色拉侧边栏 + 浅色内容区，扁平 + 1px 描边（极少阴影），**直角主基调**（radius 0），稳重可信的企业级控制台风格。

### 2.2 设计令牌（全局 CSS 变量）

来源：`src/styles/main.css`

| 令牌 | 值 | 用途 |
|---|---|---|
| `--primary` | `#014DB2` | 主色，按钮/链接/选中态/强调 |
| `--sidebar` | `#282E36` | 侧边栏背景 |
| `--bg` | `#eceff2` | 页面底色 |
| `--white` | `#FFF` | 卡片/表格背景 |
| `--text1` | `#0A1628` | 主要文本 |
| `--text2` | `#64748B` | 次要文本 |
| `--text3` | `#94A3B8` | 三级文本/占位符 |
| `--border` | `#E2E8F0` | 边框色 |
| `--border2` | `#F1F5F9` | 浅边框/分割线 |
| `--success` | `#10B981` | 成功/通过 |
| `--warning` | `#F59E0B` | 警告/待处理 |
| `--error` | `#EF4444` | 错误/风险 |
| `--nav-off` | `#d1d6df` | 侧边栏未激活文本 |

### 2.3 已锁定基线（不得擅自修改）

- **圆角 = 0（直角）**：卡片/按钮/输入框/弹窗一律无圆角。仅头像/徽标/图标按钮可为圆形
- **状态徽标单色**：所有 `.status-badge` 颜色为 `--text1`，语义色仅供 notice 标签使用
- **扁平描边**：组件层级靠 1px 描边区分，不使用阴影（弹窗除外）
- **任何"现代化调整"**（圆角、渐变、毛玻璃、彩色状态徽标等）未经用户授权不得引入

### 2.4 组件模式（必须复用，不要各自发明）

| 组件 | CSS 类 | 规范 |
|---|---|---|
| 主按钮 | `.btn-primary` | 高 45px，`#014DB2` 底白字，直边，悬停 opacity .9 |
| 次按钮 | `.btn-outline` | 高 44px，白底 `1px var(--border)` 描边，悬停 `var(--bg)` |
| 小按钮 | `.btn-mini` | 高 30px/44px，`#014DB2` 底白字，宽 88-120px |
| 表单输入 | `.field-input` | 高 **44px**（统一），`1px var(--border)` 描边，聚焦 `var(--primary)` |
| 表单标签 | `.field-label` | `13px` 字号，`600` 字重，`var(--text1)` |
| 页面标题 | `.page-title` | `20px` 字号，`700` 字重 |
| 分区标题 | `.section-title` / `.form-section-title` | `15px` 字号，`600` 字重，底部分割线 `var(--border)` |
| 卡片 | 无特定类名 | `background:#fff;border:1px solid var(--border);padding:24px` |
| 数据表 | `.table-section` > `.table-content` > `table` | 表头 `#F1F5F9` 底，sticky，`13px/600`；行高 52px；悬停 `#F8FAFC`；末行无底线 |
| 弹窗遮罩 | `.modal-mask` | `rgba(15,23,42,.45)`，flex 居中，z-index 1000 |
| 弹窗卡 | `.modal-card` | 白底，`1px var(--border)` 描边，直边，padding 28px 32px |
| 分页 | `.pagination` | flex 居中，gap 16px，按钮 34px 高，禁用 opacity .4 |
| 筛选栏 | `.filter-bar` | flex，gap 10px，输入框 44px 高 |

---

## 3. 技术架构

### 3.1 技术栈

| 项 | 选型 |
|---|---|
| 框架 | Vue 3.5（`<script setup>` + Composition API） |
| 构建 | Vite 5（`@vitejs/plugin-vue`） |
| 路由 | vue-router 4（`createWebHashHistory`，哈希路由） |
| HTTP | axios（单例 `utils/request.js`，Bearer 拦截，401→清 token→`#/login`） |
| 图标 | **内联 SVG**（线性，导航 `#8FA8D0`，正文 `#64748B`） |
| 样式 | 全局 `src/styles/main.css`（设计令牌 + 组件类）+ 各视图 scoped 局部样式 |
| 状态 | **无 Pinia/Vuex**，用户信息存在 localStorage（`utils/auth.js`） |

### 3.2 目录结构

```
pc-fronted-new/
├── .env.development          # VITE_APP_BASE_API=/dev-api
├── .env.production           # VITE_APP_BASE_API=/prod-api
├── vite.config.js            # vue 插件 + mock 插件 + /dev-api 代理
├── mock/index.js             # Vite 中间件拦截 /dev-api，返回模拟数据
├── src/
│   ├── main.js               # createApp(App).use(router).mount('#app')
│   ├── App.vue               # <router-view/>
│   ├── styles/main.css       # ★ 全局设计令牌 + 组件类（权威）
│   ├── router/index.js       # 哈希路由 + token 守卫 + 14 子路由
│   ├── layout/ClientLayout.vue  # 侧边栏 + 顶栏外壳
│   ├── utils/
│   │   ├── auth.js           # localStorage 存取 token/user
│   │   ├── request.js        # axios 单例 + Bearer + 401
│   │   └── format.js         # 分转元/日期/状态文案/记录归一化
│   ├── api/                  # 13 个模块，按业务域拆分
│   │   ├── auth.js           # login/smsLogin/sendCode/register/getInfo/logout
│   │   ├── user.js           # getUserProfile/updateProfile/uploadAvatar/updatePassword/getBalance
│   │   ├── data.js           # listData/getData/getAllData/launchEsign/preCheckQuery
│   │   ├── notice.js         # getUserNotices/markRead/getAnnouncements
│   │   ├── queryType.js      # listQueryTypeConfig
│   │   ├── accountLedger.js  # listMyAccountLedger
│   │   ├── agent.js          # 代理中心全套接口
│   │   ├── comboMeal.js      # getUserPackageList
│   │   ├── dict.js           # getDicts
│   │   ├── enterpriseCert.js # 企业认证全套接口
│   │   ├── invoice.js        # listInvoices/addInvoice
│   │   ├── pay.js            # createEpayOrder/queryOrder
│   │   └── subAccount.js     # 子账号全套接口
│   ├── components/
│   │   ├── AppModal.vue      # 统一弹窗（Teleport + Esc + 焦点陷阱）
│   │   └── SmsSliderVerify.vue # 滑块人机验证（短信发送前）
│   └── views/
│       ���── Login.vue
│       ├── Register.vue
│       ├── Dashboard.vue
│       ├── NotFound.vue
│       ├── AccountProfile.vue
│       ├── AccountLedger.vue
│       ├── AgentCenter.vue
│       ├── AgentCustomerFinance.vue
│       ├── Announcements.vue       # 消息通知（/messages）
│       ├── EnterpriseCert.vue
│       ├── Invoices.vue
│       ├── PublicAnnouncements.vue # 公告中心（/announcements）
│       ├── QueryCreate.vue
│       ├── Recharge.vue
│       ├── Records.vue
│       ├── SubAccounts.vue
│       └── report-full/Index.vue   # 报告详情（/report/:id）
```

---

## 4. 路由表（完整）

路由模式：`createWebHashHistory`。守卫：无 token → 跳 `/login`。

### 独立页（不在 ClientLayout 内）

| path | name | 组件 | 说明 |
|---|---|---|---|
| `/login` | login | `Login.vue` | 左品牌区 + 右表单（密码/短信双 Tab） |
| `/register` | register | `Register.vue` | 企业注册（含滑块验证 + 协议勾选） |
| `/:pathMatch(.*)*` | notFound | `NotFound.vue` | 404 |

### ClientLayout 子路由（`/` → `/dashboard`）

| path | name | 组件 | meta.title |
|---|---|---|---|
| `dashboard` | dashboard | `Dashboard.vue` | 工作台 |
| `account-profile` | accountProfile | `AccountProfile.vue` | 基本信息 |
| `query/create` | queryCreate | `QueryCreate.vue` | 发起背调查询 |
| `records` | records | `Records.vue` | 查询记录 |
| `report/:id` | reportDetail | `report-full/Index.vue` | 报告详情 |
| `recharge` | recharge | `Recharge.vue` | 账户充值 |
| `recharge/ledger` | accountLedger | `AccountLedger.vue` | 资金流水 |
| `invoices` | invoices | `Invoices.vue` | 我的发票 |
| `enterprise-cert` | enterpriseCert | `EnterpriseCert.vue` | 企业认证 |
| `sub-accounts` | subAccounts | `SubAccounts.vue` | 子账号管理 |
| `agent-center` | agentCenter | `AgentCenter.vue` | 代理中心 |
| `agent-center/customers/:userId/finance` | agentCustomerFinance | `AgentCustomerFinance.vue` | 客户资金明细 |
| `announcements` | announcements | `PublicAnnouncements.vue` | 公告中心 |
| `messages` | messages | `Announcements.vue` | 消息通知 |

---

## 5. 页面实现状态（全 17 页，0 占位）

所有页面均为**真实设计视图**，含模拟数据可直接预览。无"建设中"占位。

| # | 页面 | 状态 | 关键功能 |
|---|---|---|---|
| 1 | Dashboard | ✅ | 新样板移植，问候/余额+统计/最近任务表/公告/待办 |
| 2 | Login | ✅ | 左品牌区+右表单，密码/短信双Tab，错误提示，忘记密码 |
| 3 | Register | ✅ | 字段校验，滑块验证，协议勾选，成功跳转 |
| 4 | QueryCreate | ✅ | 3列套餐卡(含功能列表/ETA)，余额提醒，提交→跳Records |
| 5 | Records | ✅ | 筛选+表格(脱敏)+分页，查看报告/下载PDF/催办 |
| 6 | ReportDetail | ✅ | 综合评估卡(6项核验)+8个报告模块节 |
| 7 | AccountProfile | ✅ | 2栏满宽，近期登录记录，修改密码(SMS验证) |
| 8 | Recharge | ✅ | 5列套餐+自定义金额，支付弹窗(QR/银行信息)，优惠卡 |
| 9 | AccountLedger | ✅ | 8种流水类型筛选，金额着色，分页 |
| 10 | Invoices | ✅ | 4统计卡+发票表，普票/专票弹窗，详情 |
| 11 | EnterpriseCert | ✅ | 认证状态+流程步骤条+记录列表+提交弹窗 |
| 12 | SubAccounts | ✅ | 4汇总卡+子账号表，新建/调额度/删除 |
| 13 | AgentCenter | ✅ | 4概览卡，客户管理/邀请码Tab，分配余额 |
| 14 | AgentCustomerFinance | ✅ | 客户摘要+充值/消费Tab表格 |
| 15 | PublicAnnouncements | ✅ | 5分类Tab+公告列表+详情弹窗，置顶排序 |
| 16 | Announcements | ✅ | 未读/已读Tab，蓝点标记，详情+标记已读 |
| 17 | NotFound | ✅ | 大号404标识+返回工作台 |

---

## 6. 开发指南

### 6.1 启动

```bash
cd F:/Vscodefiles/zk-front/zk-front-new/pc-fronted-new
npm install       # vue + vue-router + axios + vite
npm run dev       # http://localhost:5173/
npm run build     # 生产构建
```

开发环境通过 `VITE_USE_MOCK_API` 显式选择 Mock：`true` 使用 `src/mock/api.js`，`false` 通过 `/dev-api` 代理连接真实后端。生产环境固定为 `false`。

### 6.2 新增页面的 Checklist

1. 在 `src/views/` 创建 `.vue` 文件（`<script setup>`）
2. 在 `src/router/index.js` 注册路由（懒加载 `() => import(...)`）
3. 按需在 `src/api/` 创建 API 模块（参照已有模块的 `request({url,method,data/params})` 格式）
4. 在 `mock/index.js` 添加对应的 mock 端点
5. 页面样式必须遵循 §2 设计令牌和 §2.4 组件模式
6. 页面使用 `<main class="main-content">` 作为根元素（由 ClientLayout 的 `<router-view>` 渲染）
7. 不设 `max-width`，用 `grid-template-columns` 控制栏宽；窄屏 `@media (max-width:980px)` 单列

### 6.3 约定

- **所有表单输入框**：高 44px，类名 `.field-input`
- **错误提示**：`.form-error`（红底 `#FDECEC`，红字 `var(--error)`）
- **空状态**：`.table-empty` 或 `.empty`（居中文案，色 `var(--text3)`）
- **操作链接**：`.action-link`（`var(--primary)`，13px，500 字重）；危险操作 `.action-danger`（`var(--error)`）
- **弹窗**：自定义内联实现（遮罩 `.modal-mask` + 卡 `.modal-card`），不用 `AppModal` 组件（该组件为可选基础设施）
- **分页**：.pagination + .page-btn + .page-info
- **数据脱敏**：身份证 `slice(0,3) + '***...' + slice(-4)`，手机号同理
- **金额**：后端返回分（cent），格式化用 `utils/format.js` 的 `yuanFromFen()`；页面模拟数据直接用元

---

## 7. ClientLayout（布局外壳）

侧边栏导航项（旧项目业务模块）：

| 导航项 | 路由 | 备注 |
|---|---|---|
| 工作台 | `/dashboard` | 图标 4 方块 grid |
| 发起背调查询 | `/query/create` | 盾牌+勾 shield |
| 查询记录 | `/records` | 列表 clipboard |
| 基本信息 | `/account-profile` | 单用户 user |
| 账户充值 | `/recharge` | 卡片 wallet |
| 我的发票 | `/invoices` | 发票 receipt |
| 企业认证 | `/enterprise-cert` | 建筑 building |
| 子账号管理 | `/sub-accounts` | 多用户 users |
| 代理中心 | `/agent-center` | 百分比 percent，**仅代理可见** |
| 消息通知 | `/messages` | 铃铛 bell |

侧边栏：210px，深底 `#282E36`，图标 `#8FA8D0`，激活项 `#3568b0`。
顶栏：65px，白底，居中搜索框 490px，右侧通知+设置图标+头像下拉（基本信息/企业认证/消息通知/退出登录）。
`onMounted` 调 `getUserProfile` 渲染用户，监听 `balance-updated`/`profile-updated` 事件。

---

## 8. 记忆文件（本机参考）

项目记忆目录：`F:\Vscodefiles\zk-front\.workbuddy\memory\`

| 文件 | 内容 |
|---|---|
| `MEMORY.md` | 项目长期索引（概况/参���文档/约定） |
| `new-dashboard-design-guide.md` | **新设计样式权威规范**（色彩/字体/布局/组件/图标/Checklist） |
| `old-pc-frontend-design-system.md` | 旧前端设计体系（仅参考结构/路由，**不做视觉依据**） |
| `dev-requirements.md` | **开发需求文档**（旧项目功能盘点→新项目需求清单/已落地/待开发批次） |
| `2026-07-25.md` | 今日开发日志（详细改动记录） |

---

## 9. 需要知道的事项

- **已引入 ECharts**：工作台“近 30 天查询趋势”使用 ECharts，并保持旧项目的折线图交互和悬浮提示。
- **未引入 @lucide/vue**：改用内联 SVG，`src/layout/ClientLayout.vue` 的 `<script setup>` 中定义了 10 个图标常量（`gridIcon`、`shieldIcon` 等），可直接复用或扩展
- **保留旧报告兼容层**：`main.js` 中的 `window.uni`、`$message`、`$tab`、`$set` 仅用于兼容旧项目完整报告页。
- **状态徽标颜色已锁定为单色**：§2.3 已说明，不可改
- **sidebar logo 的 `letter-spacing` 为 2px**：在 `src/styles/main.css` 的 `.sidebar-logo span` 中定义
