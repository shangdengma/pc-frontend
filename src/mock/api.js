import brandLogo from '../assets/brand-logo.png'

const MOCK_DELAY = 180

const now = new Date(2026, 6, 27, 10, 30)

function clone(value) {
  if (value === undefined || value === null) return value
  return JSON.parse(JSON.stringify(value))
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDateTime(date) {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function dayOffset(days, hour = 10, minute = 0) {
  const date = new Date(now)
  date.setDate(now.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return formatDateTime(date)
}

function ok(payload = {}) {
  return { code: 200, msg: '操作成功', ...(clone(payload) || {}) }
}

function pageRows(rows, params = {}) {
  const pageNum = Math.max(1, Number(params.pageNum || 1))
  const pageSize = Math.max(1, Number(params.pageSize || 10))
  const start = (pageNum - 1) * pageSize
  const paged = rows.slice(start, start + pageSize)
  return { rows: clone(paged), total: rows.length, pageNum, pageSize }
}

function moneyFenToYuan(value) {
  return (Number(value || 0) / 100).toFixed(2)
}

function contains(value, keyword) {
  return String(value || '').toLowerCase().includes(String(keyword || '').toLowerCase())
}

function normalizeUrl(url) {
  return String(url || '').replace(/^https?:\/\/[^/]+/i, '')
}

function createMockLicenseBlob() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="520" height="360" viewBox="0 0 520 360">
      <rect width="520" height="360" fill="#f8fafc"/>
      <rect x="34" y="34" width="452" height="292" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
      <text x="260" y="118" text-anchor="middle" font-size="30" font-weight="700" fill="#0f172a">营业执照</text>
      <text x="82" y="176" font-size="18" fill="#475569">企业名称：钟馗背调测试企业</text>
      <text x="82" y="214" font-size="18" fill="#475569">统一社会信用代码：91310000MA1K000000</text>
      <text x="82" y="252" font-size="18" fill="#475569">法定代表人：张三</text>
      <rect x="366" y="214" width="78" height="78" rx="39" fill="none" stroke="#ef4444" stroke-width="8"/>
    </svg>
  `
  return new Blob([svg], { type: 'image/svg+xml' })
}

const queryTypes = [
  {
    id: 1,
    callType: 1,
    callTypeName: '基础背调',
    queryTypeName: '基础背调',
    name: '基础背调',
    priceNumber: 2900,
    price: 29,
    eta: '2-4 小时',
    features: ['身份信息核验', '手机号实名验证', '不良人员核查']
  },
  {
    id: 2,
    callType: 2,
    callTypeName: '标准背调',
    queryTypeName: '标准背调',
    name: '标准背调',
    priceNumber: 7900,
    price: 79,
    eta: '4-8 小时',
    recommended: true,
    features: ['基础套餐全部内容', '高等教育学历验证', '过往工作履历核实', '机动车与 ETC 信息']
  },
  {
    id: 3,
    callType: 3,
    callTypeName: '深度背调',
    queryTypeName: '深度背调',
    name: '深度背调',
    priceNumber: 19900,
    price: 199,
    eta: '1-2 个工作日',
    features: ['标准套餐全部内容', '司法涉诉与失信记录', '信贷与逾期状况', '企业关联与任职']
  }
]

const reportDetails = {
  base: {
    reportNo: 'ZK-20260722-0001',
    queryTime: dayOffset(5, 14, 30).slice(0, 16),
    overallRisk: 'low',
    identity: {
      name: '张明',
      gender: '男',
      age: '34',
      marital: '已婚',
      phone: '138****8001',
      idCard: '310101********2345',
      phoneLocation: '广东·深圳',
      idLocation: '湖南·长沙',
      networkAge: '8年6个月'
    },
    education: {
      school: '中南大学',
      level: '本科',
      major: '计算机科学与技术',
      startDate: '2010-09',
      endDate: '2014-06'
    },
    risk: {
      riskLevel: 'low',
      summary: '经核查，近五年无重大职业履职风险记录',
      details: '未发现劳动争议、竞业限制纠纷、重大失职等记录'
    },
    vehicle: { plate: '粤B·XXXXX', model: '大众·途观L 2018款', regDate: '2018-06-15' },
    judicial: [{ type: '民事诉讼', court: '深圳市南山区人民法院', date: '2024-03', result: '买卖合同纠纷（原告），已调解结案' }],
    enterprises: [
      { name: '深圳市某某科技有限公司', role: '监事', period: '2018-06 至今' },
      { name: '湖南某某信息咨询有限公司', role: '股东', period: '2015-01 至 2018-05' }
    ],
    workHistory: [
      { company: '腾讯科技（深圳）有限公司', position: '高级工程师', period: '2018-06 至今' },
      { company: '华为技术有限公司', position: '软件工程师', period: '2014-07 至 2018-05' }
    ]
  }
}

function reportField(filedName, value, label = '') {
  return {
    filed_name: filedName,
    point_index: '0',
    name: label || filedName,
    label: label || filedName,
    value,
    pointed_object: { value }
  }
}

function reportListBlock(filedName, rows, label = '', pointIndex = '0') {
  return {
    filed_name: filedName,
    point_index: pointIndex,
    name: label || filedName,
    label: label || filedName,
    list_result: rows,
    pointed_object: { list_result: rows }
  }
}

function reportRow(values) {
  return Object.entries(values).map(([fieldName, value]) => reportField(fieldName, value))
}

function ageFromIdCard(idCard) {
  const birth = String(idCard || '').slice(6, 14)
  if (!/^\d{8}$/.test(birth)) return '34'
  const year = Number(birth.slice(0, 4))
  const month = Number(birth.slice(4, 6)) - 1
  const day = Number(birth.slice(6, 8))
  const birthday = new Date(year, month, day)
  const today = new Date(now)
  let age = today.getFullYear() - birthday.getFullYear()
  const beforeBirthday = today.getMonth() < month || (today.getMonth() === month && today.getDate() < day)
  if (beforeBirthday) age -= 1
  return String(Number.isFinite(age) && age > 0 ? age : 34)
}

function genderFromIdCard(idCard) {
  const flagText = String(idCard || '').charAt(16)
  if (!/^\d$/.test(flagText)) return '男'
  const flag = Number(flagText)
  return flag % 2 === 0 ? '女' : '男'
}

function buildMockReportData(row) {
  const gender = genderFromIdCard(row.idCard)
  const age = ageFromIdCard(row.idCard)
  const educationRows = [
    {
      abilityName: '中南大学',
      abilityField: '计算机科学与技术',
      abilityCompetitive: '本科',
      abilityCompetitiveDegree: '本科',
      abilityStartDate: '201009',
      abilityEndDate: '201406',
      abilityType: '全日制',
      certificateNumber: 'MOCK20140601001'
    },
    {
      abilityName: '华南理工大学',
      abilityField: '软件工程',
      abilityCompetitive: '硕士研究生',
      abilityCompetitiveDegree: '硕士研究生',
      abilityStartDate: '201409',
      abilityEndDate: '201706',
      abilityType: '全日制',
      certificateNumber: 'MOCK20170601002'
    }
  ]
  const careerRiskFields = {
    ty_dishonesty: '1',
    ty_high_consumption: '1',
    ty_notice_letter: '1',
    ty_labor_contract_5y: '1',
    ty_collective_contract_5y: '1',
    ty_compensation_5y: '1',
    ty_dispatch_contract_5y: '1',
    ty_labor_disputes_5y: '1',
    ty_labor_relation_5y: '1',
    ty_non_compete_5y: '1',
    ty_wage_claim_5y: '1',
    ty_dismissal_dispute_5y: '1',
    ty_employment_contract_5y: '1',
    ty_personnel_dispute: '1',
    ty_personnel_dispute_5y: '1',
    ty_resignation_dispute_5y: '1',
    ty_injury_insurance_5y: '1',
    ty_maternity_insurance_5y: '1',
    ty_medical_insurance: '1',
    ty_medical_insurance_5y: '1',
    ty_pension_5y: '1',
    ty_commercial_insurance: '1',
    ty_commercial_insurance_5y: '1'
  }
  const loanFields = {
    tanzhen_currently_overdue: '0',
    zc_overdueAmt: '0',
    zc_isBank: '0',
    zc_isNetloan: '1',
    zc_isSloan: '0',
    zc_isConsume: '0',
    zc_isFinlea: '0',
    zc_isAutofin: '0',
    zc_isOther: '0',
    zc_seriousOverdue: '0',
    zc_generalOverdue: '0',
    zc_slightlOverdue: '1',
    zc_suspectFraud: '0',
    sq_pho_num_tot_diffday_min: '2',
    sq_per_num_tot_diffday_min: '3',
    als_m12_id_bank_allnum: '4',
    als_m12_id_bank_orgnum: '2',
    als_m12_id_pdl_allnum: '1',
    als_m12_id_pdl_orgnum: '1',
    als_m12_id_coon_allnum: '2',
    als_m12_id_coon_orgnum: '1',
    als_m12_id_caon_allnum: '0',
    als_m12_id_caon_orgnum: '0',
    als_m12_id_rel_allnum: '1',
    als_m12_id_rel_orgnum: '1',
    als_m12_id_caoff_allnum: '0',
    als_m12_id_caoff_orgnum: '0',
    als_m12_id_cooff_allnum: '0',
    als_m12_id_cooff_orgnum: '0',
    als_m12_id_af_allnum: '1',
    als_m12_id_af_orgnum: '1',
    als_m12_id_oth_allnum: '0',
    als_m12_id_oth_orgnum: '0',
    als_m12_cell_bank_allnum: '3',
    als_m12_cell_bank_orgnum: '2',
    als_m12_cell_pdl_allnum: '1',
    als_m12_cell_pdl_orgnum: '1',
    als_m12_cell_coon_allnum: '1',
    als_m12_cell_coon_orgnum: '1',
    als_m12_cell_caon_allnum: '0',
    als_m12_cell_caon_orgnum: '0',
    als_m12_cell_rel_allnum: '1',
    als_m12_cell_rel_orgnum: '1',
    als_m12_cell_caoff_allnum: '0',
    als_m12_cell_caoff_orgnum: '0',
    als_m12_cell_cooff_allnum: '0',
    als_m12_cell_cooff_orgnum: '0',
    als_m12_cell_af_allnum: '1',
    als_m12_cell_af_orgnum: '1',
    als_m12_cell_oth_allnum: '0',
    als_m12_cell_oth_orgnum: '0',
    als_d7_id_bank_week_orgnum: '1',
    als_d7_id_bank_week_allnum: '1',
    als_m12_id_bank_week_orgnum: '2',
    als_m12_id_bank_week_allnum: '3',
    als_d7_id_bank_night_orgnum: '0',
    als_d7_id_bank_night_allnum: '0',
    als_m12_id_bank_night_orgnum: '1',
    als_m12_id_bank_night_allnum: '1',
    als_d7_id_nbank_week_orgnum: '1',
    als_d7_id_nbank_week_allnum: '1',
    als_m12_id_nbank_week_orgnum: '2',
    als_m12_id_nbank_week_allnum: '3',
    als_d7_id_nbank_night_orgnum: '0',
    als_d7_id_nbank_night_allnum: '0',
    als_m12_id_nbank_night_orgnum: '1',
    als_m12_id_nbank_night_allnum: '1',
    als_d7_id_bank_orgnum: '1',
    als_d7_id_bank_allnum: '1',
    als_d7_id_pdl_orgnum: '0',
    als_d7_id_pdl_allnum: '0',
    als_d7_id_coon_orgnum: '1',
    als_d7_id_coon_allnum: '1',
    als_d7_id_caon_orgnum: '0',
    als_d7_id_caon_allnum: '0',
    als_d7_id_rel_orgnum: '0',
    als_d7_id_rel_allnum: '0',
    als_d7_id_caoff_orgnum: '0',
    als_d7_id_caoff_allnum: '0',
    als_d7_id_cooff_orgnum: '0',
    als_d7_id_cooff_allnum: '0',
    als_d7_id_af_orgnum: '0',
    als_d7_id_af_allnum: '0',
    als_d7_id_oth_orgnum: '0',
    als_d7_id_oth_allnum: '0'
  }
  const consumptionFields = {
    tap080: '1千-5千',
    tap081: '0-1千',
    tap082: '5千-1万',
    tap083: '0-1千',
    tap084: '1千-5千',
    tap085: '0-1千'
  }

  return [
    {
      point_index: '21',
      abilityInfo: educationRows,
      list_result: educationRows.map(item => reportRow(item))
    },
    reportField('gender', gender, '性别'),
    reportField('age', age, '年龄'),
    reportField('address', '湖南省长沙市', '身份证归属地'),
    reportField('final_auth_result', '一致', '身份核验结果'),
    reportField('state', '已婚', '婚姻情况'),
    reportField('shouji_province', '广东', '手机号省份'),
    reportField('shouji_city', '深圳', '手机号城市'),
    reportField('zaiwang_msg', '正常', '手机号状态'),
    reportField('zaiwangf_msg', '24个月以上', '手机号使用时长'),
    reportField('codetianyuansanyaosu', '一致', '三要素核验'),
    reportField('police_bad_level', '0', '公安重点人员核验'),
    reportField('level_buliang', '无犯罪记录', '诉讼当事人'),
    reportField('fandufanzha_code', '0', '涉赌涉诈核验'),
    reportField('riskScore', '0', '风险分'),
    reportField('moneyLaundering', '0', '疑似跑分风险'),
    reportField('deceiver', '0', '疑似欺诈风险'),
    reportField('gamblerPlayer', '0', '疑似赌博玩家风险'),
    reportField('gamblerBanker', '0', '疑似赌博庄家风险'),
    reportField('sjbq_zlbz', '0', '资料包装中介'),
    reportField('sjbq_ychy', '0', '异常行业'),
    reportField('sjbq_xjzl', '0', '虚假资料'),
    reportField('sjbq_ymd', '0', '羊毛党'),
    reportField('sjbq_sfcy', '0', '身份信息存疑'),
    reportField('sjbq_ycxw', '0', '严重异常行为'),
    ...Object.entries(careerRiskFields).map(([fieldName, value]) => reportField(fieldName, value)),
    reportListBlock('careerRiskInfo', [reportRow(careerRiskFields)], '职业履职风险'),
    reportListBlock('vehiclesNumInfo', [reportRow({ carNum: '1' })], '名下车辆数量'),
    reportListBlock('carListAll', [
      reportRow({ plateNum: '粤B12345', plateColor: '蓝色', vehicleType: '小型汽车' })
    ], 'ETC关联车辆'),
    reportField('house_ownership_bool', '否', '是否有房'),
    ...Object.entries(loanFields).map(([fieldName, value]) => reportField(fieldName, value)),
    ...Object.entries(consumptionFields).map(([fieldName, value]) => reportField(fieldName, value))
  ]
}

function buildMockHistoryWork(row) {
  const baseMonth = row.callTypeId === 3 ? '202406' : '202405'
  return [
    { orgname: '腾讯科技（深圳）有限公司', time: baseMonth, num: '18000' },
    { orgname: '华为技术有限公司', time: '201805', num: '14500' },
    { orgname: '深圳市前海某某科技有限公司', time: '201407', num: '9800' }
  ]
}

const state = {
  token: 'mock-token-zk-front',
  balanceFen: 1280000,
  user: {
    userId: 10086,
    id: 10086,
    userName: 'admin',
    nickName: '李薇',
    name: '李薇',
    enterpriseName: '钟馗背调测试企业',
    phonenumber: '13800138000',
    phone: '13800138000',
    email: 'admin@test.com',
    address: '广东省深圳市南山区科技园',
    sex: '2',
    parentUserId: null,
    accountType: 'main',
    isAgent: 1,
    onlineTestEnabled: 1,
    deductionStandardList: [
      { callType: 1, price: '29.00' },
      { callType: 2, price: '79.00' },
      { callType: 3, price: '199.00' }
    ],
    subAccountQuota: 0,
    pwdUpdateDate: '2026-06-18',
    createTime: '2025-03-12 09:20:00'
  },
  loginHistory: [
    { id: 1, loginTime: dayOffset(2, 9, 38), device: 'Chrome · Windows', ipaddr: '14.215.178.45', loginLocation: '广东·深圳', current: true, status: 'current' },
    { id: 2, loginTime: dayOffset(3, 18, 12), device: 'Chrome · macOS', ipaddr: '14.215.178.45', loginLocation: '广东·深圳', status: 'success' },
    { id: 3, loginTime: dayOffset(4, 9, 1), device: 'Safari · iPhone', ipaddr: '36.21.10.22', loginLocation: '广东·广州', status: 'success' }
  ],
  records: [
    { id: 1, name: '张明', idCard: '310101199001012345', mobile: '13800138001', phone: '13800138001', callTypeId: 2, type: '标准背调', status: '2', time: dayOffset(5, 14, 30), createTime: dayOffset(5, 14, 30), updateTime: dayOffset(5, 16, 5), pdfFilePath: '', reportNo: 'ZK-20260722-0001' },
    { id: 2, name: '王芳', idCard: '110102198805052233', mobile: '13900139002', phone: '13900139002', callTypeId: 3, type: '深度背调', status: '1', time: dayOffset(6, 10, 15), createTime: dayOffset(6, 10, 15), updateTime: dayOffset(6, 10, 20), pdfFilePath: '', reportNo: 'ZK-20260721-0002' },
    { id: 3, name: '刘强', idCard: '440301199205053344', mobile: '13700137003', phone: '13700137003', callTypeId: 1, type: '基础背调', status: '5', time: dayOffset(7, 16, 0), createTime: dayOffset(7, 16, 0), updateTime: dayOffset(7, 16, 0), pdfFilePath: '', reportNo: 'ZK-20260720-0003' },
    { id: 4, name: '陈静', idCard: '320501199308082244', mobile: '13600136004', phone: '13600136004', callTypeId: 2, type: '标准背调', status: '3', time: dayOffset(8, 9, 45), createTime: dayOffset(8, 9, 45), updateTime: dayOffset(8, 11, 15), failureReason: '候选人身份证号与手机号实名信息不一致', pdfFilePath: '', reportNo: 'ZK-20260719-0004' },
    { id: 5, name: '赵磊', idCard: '500101199511112255', mobile: '13500135005', phone: '13500135005', callTypeId: 3, type: '深度背调', status: '2', time: dayOffset(9, 11, 20), createTime: dayOffset(9, 11, 20), updateTime: dayOffset(9, 18, 5), pdfFilePath: '', reportNo: 'ZK-20260718-0005' },
    { id: 6, name: '孙婷', idCard: '210201199001016677', mobile: '15800158006', phone: '15800158006', callTypeId: 1, type: '基础背调', status: '4', time: dayOffset(10, 15, 30), createTime: dayOffset(10, 15, 30), updateTime: dayOffset(10, 16, 2), pdfFilePath: '', reportNo: 'ZK-20260717-0006' },
    { id: 7, name: '周凯', idCard: '610101199412123344', mobile: '17700177007', phone: '17700177007', callTypeId: 2, type: '标准背调', status: '1', time: dayOffset(11, 8, 55), createTime: dayOffset(11, 8, 55), updateTime: dayOffset(11, 8, 58), pdfFilePath: '', reportNo: 'ZK-20260716-0007' },
    { id: 8, name: '吴敏', idCard: '330101199203045566', mobile: '18800188008', phone: '18800188008', callTypeId: 3, type: '深度背调', status: '2', time: dayOffset(12, 13, 20), createTime: dayOffset(12, 13, 20), updateTime: dayOffset(12, 20, 18), pdfFilePath: '', reportNo: 'ZK-20260715-0008' },
    { id: 9, name: '郑浩', idCard: '420101199108127788', mobile: '16600166009', phone: '16600166009', callTypeId: 2, type: '标准背调', status: '6', time: dayOffset(13, 9, 10), createTime: dayOffset(13, 9, 10), updateTime: dayOffset(13, 10, 45), pdfFilePath: '', reportNo: 'ZK-20260714-0009' },
    { id: 10, name: '冯雪', idCard: '350101199506231199', mobile: '15500155010', phone: '15500155010', callTypeId: 1, type: '基础背调', status: '3', time: dayOffset(14, 16, 45), createTime: dayOffset(14, 16, 45), updateTime: dayOffset(14, 17, 18), failureReason: '学历核验渠道返回异常，请确认后重新发起', pdfFilePath: '', reportNo: 'ZK-20260713-0010' },
    { id: 11, name: '褚亮', idCard: '230101199012092233', mobile: '19900199011', phone: '19900199011', callTypeId: 3, type: '深度背调', status: '2', time: dayOffset(23, 11, 30), createTime: dayOffset(23, 11, 30), updateTime: dayOffset(23, 19, 15), pdfFilePath: '', reportNo: 'ZK-20260704-0011' },
    { id: 12, name: '卫琳', idCard: '530101199311054466', mobile: '17700177012', phone: '17700177012', callTypeId: 2, type: '标准背调', status: '1', time: dayOffset(25, 14, 15), createTime: dayOffset(25, 14, 15), updateTime: dayOffset(25, 14, 20), pdfFilePath: '', reportNo: 'ZK-20260702-0012' },
    { id: 13, name: '林泽', idCard: '440101199402148811', mobile: '18600186013', phone: '18600186013', callTypeId: 2, type: '标准背调', status: '5', time: dayOffset(2, 9, 20), createTime: dayOffset(2, 9, 20), updateTime: dayOffset(2, 9, 20), pdfFilePath: '', reportNo: 'ZK-20260727-0013' },
    { id: 14, name: '唐悦', idCard: '510101199612099922', mobile: '18500185014', phone: '18500185014', callTypeId: 3, type: '深度背调', status: '5', time: dayOffset(3, 15, 45), createTime: dayOffset(3, 15, 45), updateTime: dayOffset(3, 15, 45), pdfFilePath: '', reportNo: 'ZK-20260726-0014' },
    { id: 15, name: '何晨', idCard: '120101199305174433', mobile: '18400184015', phone: '18400184015', callTypeId: 1, type: '基础背调', status: '5', time: dayOffset(4, 11, 5), createTime: dayOffset(4, 11, 5), updateTime: dayOffset(4, 11, 5), pdfFilePath: '', reportNo: 'ZK-20260725-0015' },
    { id: 16, name: '许诺', idCard: '370101199809235566', mobile: '18300183016', phone: '18300183016', callTypeId: 2, type: '标准背调', status: '5', time: dayOffset(5, 17, 30), createTime: dayOffset(5, 17, 30), updateTime: dayOffset(5, 17, 30), pdfFilePath: '', reportNo: 'ZK-20260724-0016' }
  ],
  ledgers: [
    { id: 1, createTime: dayOffset(3, 14, 30), changeStyle: '2', changeCent: -7900, beforeCent: 1287900, remark: '标准背调 - 张明', outTradeNo: 'ZK202607240001' },
    { id: 2, createTime: dayOffset(7, 10, 15), changeStyle: '1', changeCent: 500000, beforeCent: 787900, remark: '支付宝充值', outTradeNo: 'PAY202607200015' },
    { id: 3, createTime: dayOffset(8, 16, 0), changeStyle: '2', changeCent: -19900, beforeCent: 807800, remark: '深度背调 - 陈静', outTradeNo: 'ZK202607190003' },
    { id: 4, createTime: dayOffset(9, 9, 22), changeStyle: '2', changeCent: -2900, beforeCent: 810700, remark: '基础背调 - 赵磊', outTradeNo: 'ZK202607180002' },
    { id: 5, createTime: dayOffset(12, 11, 8), changeStyle: '4', changeCent: 7900, beforeCent: 802800, remark: '背调失败退款 - 孙婷', outTradeNo: 'REF202607150001' },
    { id: 6, createTime: dayOffset(17, 15, 45), changeStyle: '2', changeCent: -7900, beforeCent: 810700, remark: '标准背调 - 周凯', outTradeNo: 'ZK202607100005' },
    { id: 7, createTime: dayOffset(19, 10, 30), changeStyle: '1', changeCent: 300000, beforeCent: 510700, remark: '微信支付充值', outTradeNo: 'PAY202607080012' },
    { id: 8, createTime: dayOffset(22, 14, 20), changeStyle: '2', changeCent: -19900, beforeCent: 530600, remark: '深度背调 - 吴敏', outTradeNo: 'ZK202607050001' },
    { id: 9, createTime: dayOffset(24, 9, 15), changeStyle: '3', changeCent: 50000, beforeCent: 480600, remark: '充值满赠活动', outTradeNo: 'GFT202607030001' },
    { id: 10, createTime: dayOffset(26, 16, 40), changeStyle: '2', changeCent: -2900, beforeCent: 483500, remark: '基础背调 - 冯雪', outTradeNo: 'ZK202607010003' }
  ],
  rechargePackages: [
    { id: 1, packageName: '标准体验版', payAmount: 4980, arriveAmount: 4980, giftAmount: 0, benefits: ['体验套餐', '开通基础通用背调', '无特殊权益'] },
    { id: 2, packageName: '企业标准版', payAmount: 9980, arriveAmount: 9980, giftAmount: 0, benefits: ['支持定制背调报告', '客服专群服务'] },
    { id: 3, packageName: '企业旗舰版', payAmount: 19980, arriveAmount: 19980, giftAmount: 0, benefits: ['基础通用背调优惠', '支持定制背调', '开通商业尽调', '客服 VIP 专群服务'] }
  ],
  orders: [],
  invoices: [
    { id: 1, title: '钟馗背调测试企业', invoiceTitle: '钟馗背调测试企业', types: 'normal', type: 'general', invoiceType: 'general', amount: 5000, taxno: '91440101MA5XXXXX', remark: '', createdate: '2026-07-20 10:00:00', status: 'issued', createTime: '2026-07-20 10:00:00', rejectReason: '' },
    { id: 2, title: '钟馗背调测试企业', invoiceTitle: '钟馗背调测试企业', types: 'special', type: 'special', invoiceType: 'special', amount: 3000, taxno: '91440101MA5XXXXX', registeraddress: '广东省深圳市南山区科技园', bankname: '招商银行深圳科技园支行', bankaccount: '7559000000000000000', remark: '', createdate: '2026-07-15 14:20:00', status: 'issued', createTime: '2026-07-15 14:20:00', rejectReason: '' },
    { id: 3, title: '钟馗背调测试企业', invoiceTitle: '钟馗背调测试企业', types: 'normal', type: 'general', invoiceType: 'general', amount: 1000, taxno: '91440101MA5XXXXX', remark: '补开发票', createdate: '2026-07-10 09:18:00', status: 'rejected', createTime: '2026-07-10 09:18:00', rejectReason: '开票信息有误，请核对后重新提交' },
    { id: 4, title: '钟馗背调测试企业', invoiceTitle: '钟馗背调测试企业', types: 'special', type: 'special', invoiceType: 'special', amount: 8000, taxno: '91440101MA5XXXXX', registeraddress: '广东省深圳市南山区科技园', bankname: '招商银行深圳科技园支行', bankaccount: '7559000000000000000', remark: '', createdate: '2026-07-24 16:40:00', status: 'pending', createTime: '2026-07-24 16:40:00', rejectReason: '' }
  ],
  certs: [
    {
      id: 1,
      enterpriseName: '钟馗背调测试企业',
      unifiedSocialCreditCode: '91440101MA5XXXXX',
      creditCode: '91440101MA5XXXXX',
      legalRepresentativeName: '张三',
      legalPerson: '张三',
      contactPerson: '李薇',
      contactPhone: '13800138000',
      status: 'approved',
      createTime: '2026-06-10 10:00:00',
      updateTime: '2026-06-10 10:00:00',
      certTime: '2026-06-10',
      expireTime: '2027-06-09',
      rejectReason: '',
      fileList: [
        { id: 101, fileType: 'business_license', filePath: '/mock-license.png', fileName: '营业执照.png', sortOrder: 0 }
      ]
    }
  ],
  subAccounts: [
    { id: 1, userId: 201, userName: 'subadmin01', nickName: '张伟', phonenumber: '13900135678', subAccountQuota: 5000, subAccountUsed: 1800, createTime: '2026-06-01 10:00:00' },
    { id: 2, userId: 202, userName: 'subadmin02', nickName: '王芳', phonenumber: '13800131234', subAccountQuota: 8000, subAccountUsed: 3500, createTime: '2026-06-08 11:30:00' },
    { id: 3, userId: 203, userName: 'subadmin03', nickName: '刘强', phonenumber: '13700139012', subAccountQuota: 3000, subAccountUsed: 2600, createTime: '2026-07-02 09:12:00' }
  ],
  notifications: [
    { id: 1, title: '背调报告已完成', content: '张明的标准背调报告已生成，请前往报告中心查看完整内容。报告包含身份核验、学历验证、工作履历等全部核查项目。', createTime: dayOffset(3, 14, 30), status: 0, badge: '报告动态,站内信', link: '/records' },
    { id: 2, title: '候选人授权提醒', content: '刘强的背调任务已创建超过48小时，候选人尚未完成电子授权。建议发送催办提醒，或联系候选人确认是否收到授权短信。', createTime: dayOffset(5, 9, 15), status: 0, badge: '任务提醒,站内信', link: '/records' },
    { id: 3, title: '账户余额不足提醒', content: '您的账户余额为 ¥12,800.00，本月已消耗 ¥3,200.00。建议及时充值以确保业务连续性，避免影响背调任务提交。', createTime: dayOffset(7, 10, 0), status: 1, badge: '账户财务,站内信', link: '/recharge' },
    { id: 4, title: '企业认证审核通过', content: '恭喜！您的企业认证已审核通过。现在可以正常使用全部背调功能，包括深度背调和批量查询。', createTime: dayOffset(9, 16, 45), status: 1, badge: '企业认证,站内信', link: '/enterprise-cert' },
    { id: 5, title: '系统维护通知', content: '系统将于 2026年7月28日 02:00-04:00 进行版本升级维护，期间服务将暂不可用。请提前安排背调任务，避免影响业务。', createTime: dayOffset(12, 11, 30), status: 1, badge: '系统通知,站内信', link: '/announcements' }
  ],
  announcements: [
    { id: 1, noticeTitle: '系统将于 7月28日 02:00 升级维护', noticeContent: '为提升服务质量，系统计划于 2026年7月28日 02:00-04:00 进行版本升级维护，期间服务将暂不可用，请提前安排背调任务。', createTime: '2026-07-22 09:00:00', noticeType: 'system', topFlag: true },
    { id: 2, noticeTitle: '新增学信网学历认证数据源', noticeContent: '平台已接入学信网学历认证接口，即日起可在标准背调与深度背调套餐中选择“学历认证”项，报告权威性进一步提升。', createTime: '2026-07-20 10:30:00', noticeType: 'notice', topFlag: false },
    { id: 3, noticeTitle: '合规政策更新：候选人授权流程优化', noticeContent: '根据最新个人信息保护法规要求，授权流程新增“知情同意书”环节，候选人在签署电子授权前将看到完整的数据使用说明。本次调整对现有任务不产生影响。', createTime: '2026-07-18 15:00:00', noticeType: 'policy', topFlag: false },
    { id: 4, noticeTitle: '报告中心支持 PDF 一键导出', noticeContent: '报告详情页新增“导出 PDF”按钮，支持将完整背调报告导出为 A4 格式 PDF 文件，便于存档与打印。', createTime: '2026-07-15 11:20:00', noticeType: 'notice', topFlag: false },
    { id: 5, noticeTitle: '2026 年中企业客户回馈活动', noticeContent: '7月1日至7月31日期间，新签约企业客户首单免费，标准背调套餐 8 折优惠。详情请查看活动页或联系客服。', createTime: '2026-07-01 10:00:00', noticeType: 'activity', topFlag: false }
  ],
  agentOverview: {
    availableBalanceAmount: 52000,
    commissionRate: 20,
    settledCommissionAmount: 12800,
    unsettledCommissionAmount: 3600,
    totalRechargeAmount: 86400,
    totalConsumeAmount: 58420,
    monthlyNewCustomerCount: 16,
    monthlyRechargeAmount: 42300,
    monthlyConsumeAmount: 28600,
    allocatedAmount: 312000,
    activeCustomerCount: 18,
    pendingSettlementAmount: 3600,
    customerGrowthRate: 12.6,
    monthlyNewCustomerGrowthRate: 18.4,
    monthlyRechargeGrowthRate: 9.8,
    monthlyConsumeGrowthRate: -6.3,
    unsettledCommissionGrowthRate: 7.2,
    activeCustomerGrowthRate: 15.1
  },
  agentCustomers: [
    { invitedUserId: 301, userName: 'customer_a', nickName: '客户 A', phonenumber: '13800138031', enterpriseName: '企业A', balanceAmount: 420, rechargeAmount: 30000, consumeAmount: 29580, allocatedAmount: 32000, recentConsumeAmount: 2200, previousConsumeAmount: 4500, lastConsumeAt: '2026-07-18 11:20:00', lastActiveAt: '2026-07-25 09:15:00', invitedAt: '2026-05-10 09:15:00' },
    { invitedUserId: 302, userName: 'customer_b', nickName: '客户 B', phonenumber: '13800138032', enterpriseName: '企业B', balanceAmount: 5000, rechargeAmount: 10000, consumeAmount: 5000, allocatedAmount: 12000, recentConsumeAmount: 1800, previousConsumeAmount: 1600, lastConsumeAt: '2026-07-24 10:22:00', lastActiveAt: '2026-07-26 10:22:00', invitedAt: '2026-06-15 10:22:00' },
    { invitedUserId: 303, userName: 'customer_c', nickName: '客户 C', phonenumber: '13800138033', enterpriseName: '企业C', balanceAmount: 0, rechargeAmount: 0, consumeAmount: 0, allocatedAmount: 0, recentConsumeAmount: 0, previousConsumeAmount: 0, lastConsumeAt: '', lastActiveAt: '2026-07-26 14:30:00', invitedAt: '2026-07-26 14:30:00' },
    { invitedUserId: 304, userName: 'qinghe_hr', nickName: '清禾人事', phonenumber: '13800138034', enterpriseName: '上海清禾科技有限公司', balanceAmount: 16800, rechargeAmount: 42000, consumeAmount: 25200, allocatedAmount: 45000, recentConsumeAmount: 5200, previousConsumeAmount: 4800, lastConsumeAt: '2026-07-23 15:40:00', lastActiveAt: '2026-07-27 11:18:00', invitedAt: '2026-07-03 11:18:00' },
    { invitedUserId: 305, userName: 'lanhai_ops', nickName: '蓝海运营', phonenumber: '13800138035', enterpriseName: '杭州蓝海信息技术有限公司', balanceAmount: 6200, rechargeAmount: 18000, consumeAmount: 0, allocatedAmount: 20000, recentConsumeAmount: 0, previousConsumeAmount: 1200, lastConsumeAt: '', lastActiveAt: '2026-06-12 16:42:00', invitedAt: '2026-07-05 16:42:00' },
    { invitedUserId: 306, userName: 'mingce_admin', nickName: '明策管理员', phonenumber: '13800138036', enterpriseName: '北京明策咨询有限公司', balanceAmount: 21500, rechargeAmount: 50000, consumeAmount: 28500, allocatedAmount: 52000, recentConsumeAmount: 4300, previousConsumeAmount: 7000, lastConsumeAt: '2026-07-20 09:06:00', lastActiveAt: '2026-07-23 09:06:00', invitedAt: '2026-07-07 09:06:00' },
    { invitedUserId: 307, userName: 'xincheng_fin', nickName: '新程财务', phonenumber: '13800138037', enterpriseName: '南京新程商务服务有限公司', balanceAmount: 390, rechargeAmount: 12000, consumeAmount: 11610, allocatedAmount: 13000, recentConsumeAmount: 900, previousConsumeAmount: 1300, lastConsumeAt: '2026-07-22 13:27:00', lastActiveAt: '2026-07-24 13:27:00', invitedAt: '2026-07-08 13:27:00' },
    { invitedUserId: 308, userName: 'yunqi_hr', nickName: '云启HR', phonenumber: '13800138038', enterpriseName: '广州云启网络科技有限公司', balanceAmount: 12400, rechargeAmount: 26000, consumeAmount: 13600, allocatedAmount: 28000, recentConsumeAmount: 3200, previousConsumeAmount: 2100, lastConsumeAt: '2026-07-21 10:36:00', lastActiveAt: '2026-07-25 10:36:00', invitedAt: '2026-07-09 10:36:00' },
    { invitedUserId: 309, userName: 'taixin_admin', nickName: '泰信管理', phonenumber: '13800138039', enterpriseName: '深圳泰信企业管理有限公司', balanceAmount: 9700, rechargeAmount: 30000, consumeAmount: 20300, allocatedAmount: 32000, recentConsumeAmount: 2600, previousConsumeAmount: 4200, lastConsumeAt: '2026-07-12 15:20:00', lastActiveAt: '2026-07-18 15:20:00', invitedAt: '2026-07-10 15:20:00' },
    { invitedUserId: 310, userName: 'zhengyuan_hr', nickName: '正远招聘', phonenumber: '13800138040', enterpriseName: '成都正远人力资源有限公司', balanceAmount: 18300, rechargeAmount: 36000, consumeAmount: 17700, allocatedAmount: 38000, recentConsumeAmount: 3100, previousConsumeAmount: 2900, lastConsumeAt: '2026-07-25 08:58:00', lastActiveAt: '2026-07-26 08:58:00', invitedAt: '2026-07-12 08:58:00' },
    { invitedUserId: 311, userName: 'ruixin_ops', nickName: '睿信运营', phonenumber: '13800138041', enterpriseName: '苏州睿信数据服务有限公司', balanceAmount: 7300, rechargeAmount: 22000, consumeAmount: 14700, allocatedAmount: 24000, recentConsumeAmount: 1400, previousConsumeAmount: 2600, lastConsumeAt: '2026-07-06 17:14:00', lastActiveAt: '2026-07-13 17:14:00', invitedAt: '2026-07-13 17:14:00' },
    { invitedUserId: 312, userName: 'jinyuan_admin', nickName: '锦源管理员', phonenumber: '13800138042', enterpriseName: '武汉锦源供应链有限公司', balanceAmount: 14100, rechargeAmount: 28000, consumeAmount: 13900, allocatedAmount: 30000, recentConsumeAmount: 2800, previousConsumeAmount: 2100, lastConsumeAt: '2026-07-24 12:08:00', lastActiveAt: '2026-07-25 12:08:00', invitedAt: '2026-07-14 12:08:00' },
    { invitedUserId: 313, userName: 'huayue_hr', nickName: '华跃HR', phonenumber: '13800138043', enterpriseName: '天津华跃科技发展有限公司', balanceAmount: 5600, rechargeAmount: 16000, consumeAmount: 10400, invitedAt: '2026-07-15 09:45:00' },
    { invitedUserId: 314, userName: 'chengxin_ops', nickName: '诚新运营', phonenumber: '13800138044', enterpriseName: '青岛诚新信息咨询有限公司', balanceAmount: 11800, rechargeAmount: 24000, consumeAmount: 12200, invitedAt: '2026-07-16 14:50:00' },
    { invitedUserId: 315, userName: 'yida_admin', nickName: '益达管理', phonenumber: '13800138045', enterpriseName: '厦门益达软件有限公司', balanceAmount: 20200, rechargeAmount: 45000, consumeAmount: 24800, invitedAt: '2026-07-17 10:12:00' },
    { invitedUserId: 316, userName: 'runze_hr', nickName: '润泽人事', phonenumber: '13800138046', enterpriseName: '郑州润泽企业服务有限公司', balanceAmount: 4800, rechargeAmount: 11000, consumeAmount: 6200, invitedAt: '2026-07-18 16:19:00' },
    { invitedUserId: 317, userName: 'shengda_fin', nickName: '盛达财务', phonenumber: '13800138047', enterpriseName: '合肥盛达科技有限公司', balanceAmount: 15600, rechargeAmount: 33000, consumeAmount: 17400, invitedAt: '2026-07-19 11:26:00' },
    { invitedUserId: 318, userName: 'borui_admin', nickName: '博睿管理员', phonenumber: '13800138048', enterpriseName: '长沙博睿咨询服务有限公司', balanceAmount: 8900, rechargeAmount: 20000, consumeAmount: 11100, invitedAt: '2026-07-20 09:38:00' },
    { invitedUserId: 319, userName: 'hengtong_hr', nickName: '恒通HR', phonenumber: '13800138049', enterpriseName: '宁波恒通数字科技有限公司', balanceAmount: 13400, rechargeAmount: 27000, consumeAmount: 13600, invitedAt: '2026-07-21 13:04:00' },
    { invitedUserId: 320, userName: 'xinyuan_ops', nickName: '信源运营', phonenumber: '13800138050', enterpriseName: '福州信源企业管理有限公司', balanceAmount: 10200, rechargeAmount: 21000, consumeAmount: 10800, invitedAt: '2026-07-22 15:33:00' },
    { invitedUserId: 321, userName: 'kaisheng_admin', nickName: '凯盛管理', phonenumber: '13800138051', enterpriseName: '无锡凯盛人力资源有限公司', balanceAmount: 17600, rechargeAmount: 39000, consumeAmount: 21400, invitedAt: '2026-07-23 10:41:00' },
    { invitedUserId: 322, userName: 'tianhe_hr', nickName: '天和招聘', phonenumber: '13800138052', enterpriseName: '济南天和信息技术有限公司', balanceAmount: 6900, rechargeAmount: 17000, consumeAmount: 10100, invitedAt: '2026-07-24 09:17:00' },
    { invitedUserId: 323, userName: 'hongda_ops', nickName: '宏达运营', phonenumber: '13800138053', enterpriseName: '南昌宏达企业服务有限公司', balanceAmount: 22500, rechargeAmount: 46000, consumeAmount: 23500, invitedAt: '2026-07-25 14:05:00' },
    { invitedUserId: 324, userName: 'zhiyuan_admin', nickName: '智远管理员', phonenumber: '13800138054', enterpriseName: '西安智远数据科技有限公司', balanceAmount: 11400, rechargeAmount: 25000, consumeAmount: 13600, invitedAt: '2026-07-26 10:28:00' },
    { invitedUserId: 325, userName: 'jiacheng_hr', nickName: '嘉诚HR', phonenumber: '13800138055', enterpriseName: '昆明嘉诚咨询有限公司', balanceAmount: 7600, rechargeAmount: 19000, consumeAmount: 11400, invitedAt: '2026-07-27 16:46:00' },
    { invitedUserId: 326, userName: 'dongfang_ops', nickName: '东方运营', phonenumber: '13800138056', enterpriseName: '沈阳东方商务服务有限公司', balanceAmount: 14900, rechargeAmount: 32000, consumeAmount: 17100, invitedAt: '2026-07-28 09:52:00' }
  ],
  inviteCodes: [
    { id: 1, inviteCode: 'ZK-A2026', giftAmount: 100, usedCount: 3, remainingUses: 47, maxUses: 50, expireTime: '2026-12-31', status: 0, remark: '标准客户邀请' },
    { id: 2, inviteCode: 'ZK-B2026', giftAmount: 200, usedCount: 0, remainingUses: 20, maxUses: 20, expireTime: '2026-10-31', status: 1, remark: '活动客户邀请，已手动停用' },
    { id: 3, inviteCode: 'ZK-C2026', giftAmount: 80, usedCount: 12, remainingUses: 8, maxUses: 20, expireTime: '2026-06-30', status: 0, remark: '六月渠道活动，已过期' },
    { id: 4, inviteCode: 'ZK-D2026', giftAmount: 150, usedCount: 10, remainingUses: 0, maxUses: 10, expireTime: '2026-12-31', status: 0, remark: '试用邀请码，次数已用完' },
    { id: 5, inviteCode: 'ZK-E2026', giftAmount: 50, usedCount: 6, remainingUses: 0, maxUses: 0, expireTime: '', status: 0, remark: '长期有效，不限次数' },
    { id: 6, inviteCode: 'ZK-F2026', giftAmount: 300, usedCount: 30, remainingUses: 70, maxUses: 100, expireTime: '2027-03-31', status: 0, remark: '重点客户渠道' }
  ],
  agentRecharges: [
    { id: 1, userId: 301, createdAt: '2026-07-20 14:30:00', businessType: '支付宝充值', changeAmount: 5000, beforeAmount: 7000, afterAmount: 12000, reason: '代理充值', outTradeNo: 'PAY20260720001' },
    { id: 2, userId: 301, createdAt: '2026-06-15 10:22:00', businessType: '对公转账', changeAmount: 10000, beforeAmount: 12000, afterAmount: 22000, reason: '季度充值', outTradeNo: 'PAY20260615002' },
    { id: 3, userId: 301, createdAt: '2026-05-10 09:15:00', businessType: '对公转账', changeAmount: 15000, beforeAmount: 0, afterAmount: 15000, reason: '首次充值', outTradeNo: 'PAY20260510003' }
  ],
  agentConsumptions: [
    { id: 1, userId: 301, createdAt: '2026-07-22 11:08:00', changeAmount: 79, beforeAmount: 12079, afterAmount: 12000, reason: '张明 - 背调消费', outTradeNo: 'ZK20260722001' },
    { id: 2, userId: 301, createdAt: '2026-07-18 16:45:00', changeAmount: 199, beforeAmount: 12278, afterAmount: 12079, reason: '陈静 - 背调消费', outTradeNo: 'ZK20260718002' },
    { id: 3, userId: 301, createdAt: '2026-07-10 14:20:00', changeAmount: 79, beforeAmount: 12357, afterAmount: 12278, reason: '赵磊 - 背调消费', outTradeNo: 'ZK20260710003' }
  ]
}

const baseMockUser = clone(state.user)
const mockAccounts = {
  admin: {
    label: '默认代理商账号',
    balanceFen: 1280000,
    user: baseMockUser
  },
  agent_admin: {
    label: '代理商主账号',
    balanceFen: 5200000,
    user: {
      ...baseMockUser,
      userId: 10086,
      id: 10086,
      userName: 'agent_admin',
      nickName: '李薇',
      name: '李薇',
      enterpriseName: '钟馗背调代理运营中心',
      phonenumber: '13800138000',
      phone: '13800138000',
      email: 'agent_admin@test.com',
      parentUserId: null,
      accountType: 'main',
      isAgent: 1
    }
  },
  enterprise_admin: {
    label: '企业主账号',
    balanceFen: 850000,
    user: {
      ...baseMockUser,
      userId: 10087,
      id: 10087,
      userName: 'enterprise_admin',
      nickName: '周敏',
      name: '周敏',
      enterpriseName: '深圳远航科技有限公司',
      phonenumber: '13900139000',
      phone: '13900139000',
      email: 'enterprise_admin@test.com',
      parentUserId: null,
      accountType: 'main',
      isAgent: 0
    }
  },
  sub_zhangwei: {
    label: '企业子账号',
    balanceFen: 120000,
    user: {
      ...baseMockUser,
      userId: 201,
      id: 201,
      userName: 'sub_zhangwei',
      nickName: '张伟',
      name: '张伟',
      enterpriseName: '深圳远航科技有限公司',
      phonenumber: '13900135678',
      phone: '13900135678',
      email: 'sub_zhangwei@test.com',
      parentUserId: 10087,
      accountType: 'sub',
      isAgent: 0,
      subAccountQuota: 5000
    }
  },
  finance_staff: {
    label: '财务测试账号',
    balanceFen: 360000,
    user: {
      ...baseMockUser,
      userId: 10088,
      id: 10088,
      userName: 'finance_staff',
      nickName: '陈静',
      name: '陈静',
      enterpriseName: '杭州清源人力资源有限公司',
      phonenumber: '13700137000',
      phone: '13700137000',
      email: 'finance_staff@test.com',
      parentUserId: null,
      accountType: 'main',
      isAgent: 0
    }
  }
}

function switchMockAccount(username) {
  const key = String(username || 'admin').trim()
  const account = mockAccounts[key] || mockAccounts.admin
  state.user = clone(account.user)
  state.balanceFen = Number(account.balanceFen || 0)
  state.token = `mock-token-zk-front-${state.user.userName}`
  return account
}

function findQueryType(id) {
  return queryTypes.find(item => String(item.id) === String(id) || String(item.callType) === String(id)) || queryTypes[1]
}

function createLedger(changeStyle, changeFen, beforeFen, remark, prefix) {
  state.ledgers.unshift({
    id: Date.now(),
    createTime: formatDateTime(new Date()),
    changeStyle,
    changeCent: changeFen,
    beforeCent: beforeFen,
    remark,
    outTradeNo: `${prefix}${Date.now()}`
  })
}

function createRecord(data, status = '5') {
  const type = findQueryType(data.callTypeId || data.typeId || data.packageId || 2)
  const before = state.balanceFen
  state.balanceFen = Math.max(0, state.balanceFen - Number(type.priceNumber || 0))
  const id = Math.max(0, ...state.records.map(item => Number(item.id) || 0)) + 1
  const noticeMethods = Array.isArray(data.reportNoticeMethods)
    ? data.reportNoticeMethods
    : String(data.reportNoticeType || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  const record = {
    id,
    name: data.name,
    idCard: data.idCard,
    mobile: data.mobile || data.phone,
    phone: data.mobile || data.phone,
    callTypeId: type.id,
    searchType: type.callType,
    callTypeName: type.callTypeName,
    type: type.name,
    status,
    searchStatus: status,
    phoneNumber: data.mobile || data.phone,
    time: formatDateTime(new Date()),
    createTime: formatDateTime(new Date()),
    updateTime: formatDateTime(new Date()),
    pdfFilePath: '',
    reportNo: `ZK-${formatDate(new Date()).replace(/-/g, '')}-${String(id).padStart(4, '0')}`,
    reportNotice: data.reportNotice ?? (noticeMethods.length ? 1 : 0),
    reportNoticeMethods: noticeMethods,
    reportNoticeType: data.reportNoticeType || noticeMethods.join(','),
    noticeInApp: data.noticeInApp ?? (noticeMethods.includes('site') ? 1 : 0),
    noticeSms: data.noticeSms ?? (noticeMethods.includes('sms') ? 1 : 0),
    noticeEmail: data.noticeEmail ?? (noticeMethods.includes('email') ? 1 : 0)
  }
  state.records.unshift(record)
  createLedger('2', -Number(type.priceNumber || 0), before, `${type.name} - ${data.name}`, 'ZK')
  return record
}

function listData(params = {}) {
  let rows = [...state.records]
  const keyword = params.keyword || params.name || params.searchValue || params.idCard || ''
  if (keyword) {
    rows = rows.filter(item =>
      contains(item.name, keyword) ||
      contains(item.mobile, keyword) ||
      contains(item.phone, keyword) ||
      contains(item.idCard, keyword)
    )
  }
  if (params.searchStatus) {
    const statuses = String(params.searchStatus).split(',').map(item => item.trim()).filter(Boolean)
    rows = rows.filter(item => statuses.includes(String(item.searchStatus ?? item.status)))
  }
  if (params.callTypeId) rows = rows.filter(item => String(item.callTypeId) === String(params.callTypeId))
  const begin = params['params[beginTime]'] || params.beginTime || params.startDate
  const end = params['params[endTime]'] || params.endTime || params.endDate
  if (begin) rows = rows.filter(item => String(item.createTime || item.time) >= String(begin))
  if (end) rows = rows.filter(item => String(item.createTime || item.time) <= `${String(end).slice(0, 10)} 23:59:59`)
  const legacyRows = rows.map(item => ({
    ...item,
    phoneNumber: item.phoneNumber || item.mobile || item.phone,
    searchType: item.searchType || item.callTypeId,
    callTypeName: item.callTypeName || item.type,
    searchStatus: item.searchStatus ?? item.status
  }))
  return ok(pageRows(legacyRows, params))
}

function listLedger(params = {}) {
  let rows = [...state.ledgers]
  if (params.changeStyle) rows = rows.filter(row => String(row.changeStyle) === String(params.changeStyle))
  if (params.outTradeNo) rows = rows.filter(row => contains(row.outTradeNo, params.outTradeNo))
  const begin = params['params[beginTime]'] || params.startDate
  const end = params['params[endTime]'] || params.endDate
  if (begin) rows = rows.filter(row => row.createTime >= begin)
  if (end) rows = rows.filter(row => row.createTime <= `${String(end).slice(0, 10)} 23:59:59`)
  const legacyRows = rows.map(row => ({
    ...row,
    createdAt: row.createdAt || row.createTime,
    beforeMoney: row.beforeMoney ?? row.beforeCent,
    afterMoney: row.afterMoney ?? (Number(row.beforeCent || 0) + Number(row.changeCent || 0)),
    reason: row.reason || row.remark
  }))
  return ok(pageRows(legacyRows, params))
}

function listAnnouncements(params = {}) {
  let rows = [...state.announcements].sort((a, b) => {
    if (Boolean(a.topFlag) !== Boolean(b.topFlag)) return a.topFlag ? -1 : 1
    return String(b.createTime).localeCompare(String(a.createTime))
  })
  if (params.noticeType && params.noticeType !== 'all') rows = rows.filter(row => row.noticeType === params.noticeType)
  return ok(pageRows(rows, params))
}

function listNotifications(params = {}) {
  let rows = [...state.notifications].sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)))
  if (params.status !== undefined && params.status !== '') rows = rows.filter(row => String(row.status) === String(params.status))
  return ok(pageRows(rows, params))
}

function markNotificationRead(id) {
  const item = state.notifications.find(row => String(row.id) === String(id))
  if (item) item.status = 1
  return ok({ data: item || null })
}

function reportSearchType(row) {
  if (row.searchType) return row.searchType
  const callType = Number(row.callTypeId || row.callType || 1)
  if (callType === 3) return 16
  if (callType === 2) return 15
  return 1
}

function getReport(id) {
  const row = state.records.find(item => String(item.id) === String(id)) || state.records[0]
  const base = clone(reportDetails.base)
  base.reportNo = row.reportNo || base.reportNo
  base.queryTime = String(row.createTime || row.time || base.queryTime).slice(0, 16)
  base.identity.name = row.name || base.identity.name
  base.identity.phone = row.mobile ? `${row.mobile.slice(0, 3)}****${row.mobile.slice(-4)}` : base.identity.phone
  base.identity.idCard = row.idCard ? `${row.idCard.slice(0, 6)}********${row.idCard.slice(-4)}` : base.identity.idCard
  return ok({
    data: {
      ...row,
      outTradeNo: row.reportNo || base.reportNo,
      createTime: row.createTime || row.time || base.queryTime,
      searchType: reportSearchType(row),
      phoneNumber: row.phoneNumber || row.mobile || row.phone,
      data: buildMockReportData(row),
      history_work_value_withmoney: buildMockHistoryWork(row),
      report: base,
      extra: '综合补充：候选人基础身份信息与提交信息一致，未发现重大履职风险、严重逾期或公安重点人员命中记录。部分信贷类标签存在历史查询行为，请结合岗位要求审慎评估。'
    }
  })
}

function createInvoice(data = {}) {
  const types = data.types || (data.type === 'special' || data.invoiceType === 'special' ? 'special' : 'normal')
  const invoiceType = types === 'special' ? 'special' : 'general'
  const item = {
    id: Date.now(),
    title: data.title || data.invoiceTitle || state.user.enterpriseName,
    invoiceTitle: data.title || data.invoiceTitle || state.user.enterpriseName,
    types,
    type: invoiceType,
    invoiceType,
    amount: Number(data.amount || 0),
    status: 'pending',
    taxno: data.taxno || '',
    remark: data.remark || '',
    registeraddress: data.registeraddress || data.address || '',
    bankname: data.bankname || data.bank || '',
    bankaccount: data.bankaccount || data.account || '',
    createdate: formatDateTime(new Date()),
    createTime: formatDateTime(new Date()),
    rejectReason: ''
  }
  state.invoices.unshift(item)
  return ok({ data: clone(item) })
}

function createSubAccount(data = {}) {
  const quota = Number(data.quota || data.subAccountQuota || 0)
  const item = {
    id: Date.now(),
    userId: Date.now(),
    userName: data.username || data.userName,
    nickName: data.name || data.nickName,
    phonenumber: data.phone || data.phonenumber,
    subAccountQuota: quota,
    subAccountUsed: 0,
    createTime: formatDateTime(new Date())
  }
  state.subAccounts.unshift(item)
  return ok({ data: clone(item) })
}

function updateSubAccountQuota(userId, data = {}) {
  const item = state.subAccounts.find(row => String(row.userId) === String(userId) || String(row.id) === String(userId))
  if (item) item.subAccountQuota = Number(data.quota || data.subAccountQuota || 0)
  return ok({ data: clone(item) })
}

function createOrder(data = {}) {
  const selected = state.rechargePackages.find(item => String(item.id) === String(data.packageId)) || state.rechargePackages[0]
  const outTradeNo = `PAY${Date.now()}`
  const amount = Number(selected.payAmount || 0)
  const arriveAmount = Number(selected.arriveAmount || (amount + Number(selected.giftAmount || 0)))
  const order = {
    outTradeNo,
    amount,
    arriveAmount,
    packageId: selected.id,
    payType: data.payType || data.payMethod || 'alipay',
    status: 'waiting'
  }
  state.orders.unshift(order)
  return ok({
    data: {
      outTradeNo,
      payInfo: `mock://pay/${outTradeNo}`,
      qrCodeUrl: `mock://pay/${outTradeNo}`,
      amount,
      payType: order.payType
    }
  })
}

function queryOrder(outTradeNo) {
  const order = state.orders.find(item => item.outTradeNo === outTradeNo)
  if (order && order.status !== 'paid') {
    const before = state.balanceFen
    state.balanceFen += Math.round(order.arriveAmount * 100)
    order.status = 'paid'
    createLedger('1', Math.round(order.arriveAmount * 100), before, `${order.payType === 'wxpay' ? '微信' : '支付宝'}充值`, 'PAY')
  }
  return ok({ data: { status: order?.status === 'paid', tradeStatus: 'SUCCESS', outTradeNo } })
}

function handleAgentPath(method, url, params, data) {
  if (url === '/app/agent/overview' && method === 'get') return ok({ data: state.agentOverview })
  if (url === '/app/agent/invite-codes' && method === 'get') return ok({ data: clone(state.inviteCodes) })
  if (url === '/app/agent/invite-codes' && method === 'post') {
    const item = {
      id: Date.now(),
      inviteCode: `ZK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      giftAmount: Number(data.giftAmount || 0),
      usedCount: 0,
      remainingUses: Number(data.maxUses || 0),
      maxUses: Number(data.maxUses || 0),
      expireTime: data.expireTime || formatDate(new Date(now.getFullYear(), 11, 31)),
      status: 0,
      remark: data.remark || ''
    }
    state.inviteCodes.unshift(item)
    return ok({ data: clone(item) })
  }
  const inviteMatch = /^\/app\/agent\/invite-codes\/([^/]+)$/.exec(url)
  if (inviteMatch && method === 'put') {
    const item = state.inviteCodes.find(row => String(row.id) === String(inviteMatch[1]))
    if (item) Object.assign(item, data)
    return ok({ data: clone(item) })
  }
  if (url === '/app/agent/customers' && method === 'get') {
    const keyword = params.keyword || ''
    const rows = keyword
      ? state.agentCustomers.filter(item =>
        contains(item.nickName, keyword) ||
        contains(item.userName, keyword) ||
        contains(item.phonenumber, keyword) ||
        contains(item.enterpriseName, keyword)
      )
      : state.agentCustomers
    const page = pageRows(rows, params)
    page.totalRecharge = rows.reduce((sum, item) => sum + Number(item.rechargeAmount || 0), 0)
    page.totalConsume = rows.reduce((sum, item) => sum + Number(item.consumeAmount || 0), 0)
    return ok({ data: page })
  }
  const customerMatch = /^\/app\/agent\/customers\/([^/]+)(?:\/(recharges|consumptions|balance-allocations))?$/.exec(url)
  if (customerMatch) {
    const userId = customerMatch[1]
    const action = customerMatch[2]
    const customer = state.agentCustomers.find(item => String(item.invitedUserId) === String(userId)) || state.agentCustomers[0]
    if (!action && method === 'get') return ok({ data: clone(customer) })
    if (action === 'recharges' && method === 'get') {
      return ok({ data: pageRows(state.agentRecharges.filter(item => String(item.userId) === String(customer.invitedUserId)), params) })
    }
    if (action === 'consumptions' && method === 'get') {
      return ok({ data: pageRows(state.agentConsumptions.filter(item => String(item.userId) === String(customer.invitedUserId)), params) })
    }
    if (action === 'balance-allocations' && method === 'post') {
      const amount = Number(data.amount || 0)
      customer.balanceAmount += amount
      state.agentOverview.availableBalanceAmount = Math.max(0, Number(state.agentOverview.availableBalanceAmount || 0) - amount)
      return ok({ data: { agentAvailableBalance: state.agentOverview.availableBalanceAmount, customerBalance: customer.balanceAmount } })
    }
  }
  return null
}

function handleRequest(config) {
  const method = String(config.method || 'get').toLowerCase()
  const url = normalizeUrl(config.url)
  const params = config.params || {}
  const data = config.data || {}

  if (url === '/login' && method === 'post') {
    switchMockAccount(data.username || data.userName)
    return ok({ token: state.token })
  }
  if (url === '/smsLogin' && method === 'post') {
    const account = Object.values(mockAccounts).find(item => item.user.phonenumber === data.phone) || mockAccounts.enterprise_admin
    switchMockAccount(account.user.userName)
    return ok({ token: state.token })
  }
  if (url === '/logout' && method === 'post') return ok()
  if (url === '/getInfo' && method === 'get') return ok({ user: clone(state.user), roles: ['mock'], permissions: ['*:*:*'] })
  if (url === '/system/sms/slider/challenge' && method === 'post') {
    return ok({ data: { challengeId: `mock-challenge-${Date.now()}` } })
  }
  if (url === '/system/sms/slider/verify' && method === 'post') {
    return ok({ data: { sliderTicket: `mock-ticket-${Date.now()}` } })
  }
  if (url.includes('/system/sms/')) return ok({ data: '123456' })
  if (url === '/captchaImage') return ok({ img: '', uuid: 'mock-captcha' })
  if (url === '/system/user/profile' && method === 'get') return ok({ data: clone(state.user), user: clone(state.user) })
  if (url === '/system/user/profile' && method === 'put') {
    Object.assign(state.user, data)
    return ok({ data: clone(state.user) })
  }
  if (url === '/system/user/profile/avatar' && method === 'post') {
    state.user.avatar = brandLogo
    return ok({ imgUrl: brandLogo, data: { imgUrl: brandLogo } })
  }
  if (url === '/system/user/profile/updatePwd' && method === 'put') return ok()
  if (url === '/system/user/profile/login-history' && method === 'get') {
    return ok(pageRows(state.loginHistory, params))
  }
  if (url === '/system/user/balance' && method === 'get') return ok({ data: state.balanceFen, balance: state.balanceFen })

  if (url === '/system/callQueryConfig/list') return ok({ rows: clone(queryTypes), data: clone(queryTypes), total: queryTypes.length })
  if (url === '/system/data/list') return listData(params)
  const dataMatch = /^\/system\/data\/([^/]+)(?:\/read)?$/.exec(url)
  if (dataMatch && method === 'get') return getReport(dataMatch[1])
  if (dataMatch && method === 'put') return ok()
  if (url === '/interface/call/preCheckQuery') {
    const duplicate = state.records.some(item =>
      item.name === data.name &&
      item.idCard === data.idCard &&
      (item.mobile === data.mobile || item.phone === data.mobile)
    )
    return ok({ data: { duplicate } })
  }
  if (url === '/interface/call/getAllData' && method === 'post') {
    const record = createRecord(data, '5')
    return ok({ data: { id: record.id, formDataId: `MOCK-FORM-${record.id}` } })
  }
  if (url === '/interface/call/getAllDataNoEsign' && method === 'post') {
    const record = createRecord(data, '1')
    return ok({ data: { id: record.id } })
  }
  if (url === '/interface/call/launchEsign' && method === 'post') return ok({ data: { launchUrl: 'mock://esign' } })
  if (url.startsWith('/system/dict/data/type/')) return ok({ data: [] })

  if (url === '/system/user/packageList') return ok({ data: clone(state.rechargePackages), rows: clone(state.rechargePackages), total: state.rechargePackages.length })
  if (url === '/remote/pay/create' && method === 'post') return createOrder(data)
  if (url === '/remote/pay/return' && method === 'post') return queryOrder(data.outTradeNo)
  if (url === '/system/log/mine' && method === 'get') return listLedger(params)

  if (url === '/invoice/list' && method === 'get') return ok(pageRows(state.invoices, params))
  if (url === '/invoice' && method === 'post') return createInvoice(data)

  if (url === '/interface/enterpriseCert/my') return ok({ rows: clone(state.certs), data: clone(state.certs), total: state.certs.length })
  if (url === '/interface/enterpriseCert/uploadImage' && method === 'post') {
    const fileName = data?.get?.('file')?.name || '营业执照.png'
    const fileId = Date.now()
    return ok({
      data: { fileId, filePath: `/interface/enterpriseCert/file/${fileId}/content`, fileName },
      fileId,
      filePath: `/interface/enterpriseCert/file/${fileId}/content`,
      fileName
    })
  }
  if (url === '/interface/enterpriseCert' && method === 'post') {
    const code = data.unifiedSocialCreditCode || data.creditCode || data.code || ''
    const legalName = data.legalRepresentativeName || data.legalPerson || ''
    const item = {
      id: Date.now(),
      ...data,
      enterpriseName: data.enterpriseName || data.name || '',
      unifiedSocialCreditCode: code,
      creditCode: code,
      legalRepresentativeName: legalName,
      legalPerson: legalName,
      status: data.status || 'draft',
      createTime: formatDateTime(new Date()),
      updateTime: formatDateTime(new Date()),
      rejectReason: data.rejectReason || '',
      fileList: Array.isArray(data.fileList)
        ? data.fileList.map((file, index) => ({ id: Date.now() + index + 1, ...file }))
        : []
    }
    state.certs.unshift(item)
    return ok({ data: clone(item) })
  }
  const certFileMatch = /^\/interface\/enterpriseCert\/file\/([^/]+)$/.exec(url)
  if (certFileMatch && method === 'delete') {
    state.certs.forEach(cert => {
      cert.fileList = (cert.fileList || []).filter(file => String(file.id) !== String(certFileMatch[1]))
    })
    return ok()
  }
  const certFileContentMatch = /^\/interface\/enterpriseCert\/file\/([^/]+)\/content$/.exec(url)
  if (certFileContentMatch && method === 'get') return createMockLicenseBlob()
  const certMatch = /^\/interface\/enterpriseCert\/([^/]+)(?:\/submit)?$/.exec(url)
  if (certMatch && method === 'get') return ok({ data: clone(state.certs.find(item => String(item.id) === certMatch[1])) })
  if (certMatch && method === 'put') {
    const item = state.certs.find(row => String(row.id) === certMatch[1])
    if (item) {
      const code = data.unifiedSocialCreditCode || data.creditCode || data.code || item.unifiedSocialCreditCode || item.creditCode || ''
      const legalName = data.legalRepresentativeName || data.legalPerson || item.legalRepresentativeName || item.legalPerson || ''
      Object.assign(item, data, {
        unifiedSocialCreditCode: code,
        creditCode: code,
        legalRepresentativeName: legalName,
        legalPerson: legalName,
        updateTime: formatDateTime(new Date())
      })
      if (Array.isArray(data.fileList)) {
        const persistedFiles = (item.fileList || []).filter(file => file.id)
        const newFiles = data.fileList.map((file, index) => ({ id: Date.now() + index + 1, ...file }))
        item.fileList = [...persistedFiles, ...newFiles]
      }
    }
    return ok({ data: clone(item) })
  }
  if (certMatch && method === 'post') {
    const item = state.certs.find(row => String(row.id) === certMatch[1])
    if (item) {
      item.status = 'pending'
      item.updateTime = formatDateTime(new Date())
    }
    return ok({ data: clone(item) })
  }
  if (url === '/system/sub-account/list') return ok({ rows: clone(state.subAccounts), data: clone(state.subAccounts), total: state.subAccounts.length })
  if (url === '/system/sub-account' && method === 'post') return createSubAccount(data)
  const subMatch = /^\/system\/sub-account\/([^/]+)(?:\/(quota|records|logs))?$/.exec(url)
  if (subMatch) {
    const id = subMatch[1]
    const action = subMatch[2]
    if (action === 'quota' && method === 'put') return updateSubAccountQuota(id, data)
    if (action === 'records' && method === 'get') return listData(params)
    if (action === 'logs' && method === 'get') return listLedger(params)
    if (!action && method === 'delete') {
      state.subAccounts = state.subAccounts.filter(row => String(row.userId) !== String(id) && String(row.id) !== String(id))
      return ok()
    }
  }

  if (url === '/system/notification/list') return listNotifications(params)
  if (url === '/system/notification/count/unread') return ok({ data: state.notifications.filter(item => Number(item.status) === 0).length })
  if (url === '/system/notification' && method === 'put') return markNotificationRead(data.id)
  if (url === '/system/notice/client/list' || url === '/client/notice/list') return listAnnouncements(params)
  if (url === '/client/dashboard/stats') return ok({ data: { balanceFen: state.balanceFen, total: state.records.length } })
  if (url === '/client/report/recent') return ok(pageRows(state.records, params))

  const agentResult = handleAgentPath(method, url, params, data)
  if (agentResult) return agentResult

  return ok({ data: null })
}

export function shouldUseMockApi() {
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === 'true'
}

export function mockRequest(config) {
  return new Promise(resolve => {
    window.setTimeout(() => resolve(handleRequest(config || {})), MOCK_DELAY)
  })
}

export const mockFormatters = {
  moneyFenToYuan
}
