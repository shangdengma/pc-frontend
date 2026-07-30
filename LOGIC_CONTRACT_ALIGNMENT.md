# 新旧前端逻辑与接口对齐说明

## 1. 改造边界

- 旧项目 `zk-front-old/pc-frontend` 是业务逻辑、接口路径、请求参数和响应字段的唯一基准。
- 新项目只负责模板结构、布局、样式、交互提示和少量新增数据显示。
- 不为适配新版页面修改旧接口含义，不用 Mock 自定义字段替代旧字段。
- 新增显示没有后端数据时必须显示空状态或隐藏，不得在生产页面伪造业务数据。

## 2. 请求环境

| 环境 | 配置 | 行为 |
|---|---|---|
| 开发 Mock | `VITE_USE_MOCK_API=true` | `src/mock/api.js` 模拟旧后端响应 |
| 开发联调 | `VITE_USE_MOCK_API=false` | Axios 请求 `/dev-api`，由 Vite 代理到真实后端 |
| 生产 | `VITE_USE_MOCK_API=false` | Axios 请求 `/prod-api`，不启用 Mock |

Vite 的旧 Mock 中间件已停用，避免关闭 Mock 后请求仍被本地中间件截获。

## 3. 已恢复的旧项目核心契约

| 模块 | 对齐内容 |
|---|---|
| 登录/注册 | 恢复短信滑块 challenge、verify、sliderTicket 和真实短信发送流程 |
| 发起查询 | 保留旧校验、缺项状态、重复查询预检、在线测试/电子签分支和成功文案 |
| 查询记录 | 使用 `idCard`、`searchStatus`、`params[beginTime]`、`params[endTime]`；读取 `searchType`、`searchStatus`、`phoneNumber` |
| 报告详情 | 使用旧项目完整报告解析、字典、条件板块和 PDF 导出逻辑 |
| 充值 | 使用旧套餐解析、`userId/packageId/payType` 下单、订单轮询和真实成功状态 |
| 资金流水 | 使用 `changeStyle`、`outTradeNo` 和时间参数；读取 `createdAt/changeCent/beforeMoney/reason` |
| 发票 | 恢复子账号限制、`processing` 状态、旧表单字段和 `/invoice` 提交载荷；移除无旧接口支撑的下载操作 |
| 基本信息 | 更新时仅提交旧字段 `nickName/name/sex/email/phonenumber`；企业认证名称不通过资料接口修改 |
| 企业认证 | 沿用旧认证列表、详情、草稿、上传、删除附件和提交审核接口 |
| 子账号 | 沿用旧增删、额度、查询记录和流水接口；额度更新只提交 `subAccountQuota` |
| 代理中心 | 恢复 `availableBalanceAmount`、`invitedUserId`、`inviteCode` 等字段、0=启用状态、分页搜索和余额分配幂等 `requestId` |
| 消息/公告 | 沿用旧通知、未读数、标记已读和公共公告接口 |

## 4. 新版新增显示接口或可选字段

这些内容不改变旧流程。真实后端未实现时，页面会隐藏对应区域或显示 `--`。

### 4.1 充值概览

不再新增 `/client/recharge/summary`。页面顶部“本月已用、本月充值、累计充值”从旧资金流水接口 `GET /system/log/mine` 派生：

- `changeStyle=1` 统计充值金额和笔数。
- `changeStyle=2` 统计本月背调消费金额和笔数。
- `createdAt` 用于判断本月和最早流水日期。
- `changeCent` 为金额字段，单位为分。

如果旧流水接口请求失败，概览显示 `--`，不影响充值主流程。

### 4.2 近期登录记录

`GET /system/user/profile/login-history?pageNum=1&pageSize=10`

```json
{
  "rows": [
    {
      "id": 1,
      "loginTime": "2026-07-27 09:30:00",
      "device": "Chrome · Windows",
      "ipaddr": "127.0.0.1",
      "loginLocation": "河南·郑州",
      "current": true,
      "status": "current"
    }
  ],
  "total": 1
}
```

接口不存在或请求失败时不生成假记录。

### 4.3 工作台可开票余额

旧项目没有可开票余额字段来源，新页面不再主动请求新增字段。真实后端没有明确字段前，工作台该展示显示 `--`；开票申请仍沿用旧项目 `/invoice/list` 和 `/invoice` 逻辑。

### 4.4 套餐卡扩展显示

沿用 `GET /system/callQueryConfig/list`，每条套餐可选返回：

```json
{
  "eta": "4-8 小时",
  "features": ["身份信息核验", "学历验证"],
  "recommended": true
}
```

字段缺失时不显示预计时间、功能列表或推荐标签。

### 4.5 报告完成通知

发起查询原载荷新增可选字段：

```json
{
  "reportNotice": 1,
  "reportNoticeMethods": ["site", "sms", "email"],
  "reportNoticeType": "site,sms,email",
  "noticeInApp": 1,
  "noticeSms": 1,
  "noticeEmail": 1
}
```

`reportNotice` 继续作为总开关，`1` 表示开启，`0` 表示关闭；其他字段用于预留具体通知方式，后端未实现时可忽略，不影响原查询流程。

### 4.6 充值套餐权益

沿用 `GET /system/user/packageList`，每条套餐可选返回 `benefits: string[]`。字段缺失时套餐卡不显示权益列表，不使用前端固定促销内容；实际到账仍以原有 `arriveAmount/giftAmount` 为准。

### 4.7 资料页可选显示字段

`GET /system/user/profile` 可选返回 `address`、`twoFactorSupported`、`twoFactorEnabled`。两步验证区域仅在 `twoFactorSupported=true` 时显示，目前没有新增启停操作接口。

## 5. Mock 约束

- Mock 响应使用旧后端字段结构，不作为生产接口定义。
- Mock 查询记录返回 `searchStatus/searchType/phoneNumber`。
- Mock 流水返回 `createdAt/changeCent/beforeMoney/afterMoney/reason`。
- Mock 代理商分页数据位于 `data.rows`，邀请码状态 `0` 为启用。
- Mock 仅在开发环境且显式开启时生效。

## 6. 验证结论

- `npm run build` 已通过。
- 生产构建不启用 Mock。
- 无头浏览器已完成 Mock 登录和 14 个关键路由的逐页渲染检查，未发现页面脚本或控制台错误。
- 已实际检查顶部搜索跳转及结果、重复查询自定义确认框、充值下单/二维码/状态刷新/成功弹窗、登录记录和发票无伪下载入口。
- 完整报告页因包含旧项目全量解析和 PDF 依赖，懒加载分包约 1.2 MB；当前是性能提示，不影响构建和功能。
- 项目暂无自动化测试脚本，真实后端联调仍需覆盖登录、短信、提交查询、电子签、支付回调和报告数据五条关键链路。
