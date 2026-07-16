export const recentRecords = [
  { name: '张三', type: '全维深度背调 V3.0', time: '06-29 10:30', status: '查询成功' },
  { name: '李四', type: '标准背调', time: '06-29 09:15', status: '查询中' },
  { name: '王五', type: '基础背调', time: '06-28 16:45', status: '授权中' },
  { name: '赵六', type: '全维深度背调 V3.0', time: '06-28 14:20', status: '查询成功' },
  { name: '孙七', type: '标准背调', time: '06-27 11:30', status: '查询失败' }
]

export const announcements = [
  { tag: '置顶', type: '系统', title: '系统维护升级通知（6/30 02:00-04:00）', date: '2026-06-29' },
  { tag: '政策', type: '政策', title: '《个人信息保护法》合规采集指引更新', date: '2026-06-25' },
  { tag: '活动', type: '活动', title: '年中充值优惠：充 1 万送 500 余额', date: '2026-06-18' },
  { tag: '通知', type: '通知', title: '新增「全维深度背调 V3.0」套餐', date: '2026-06-12' }
]

export const reminders = [
  { title: '授权待签署', desc: '3 份电子授权等待被查询人确认', count: 3, tone: 'warn' },
  { title: '查询失败可重试', desc: '孙七 · 标准背调，建议重新发起', count: 1, tone: 'danger' },
  { title: '发票待补充信息', desc: '1 张发票缺少纳税识别号', count: 1, tone: 'info' }
]
