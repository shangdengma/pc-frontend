export const MODULE_KEYS = {
  EDUCATION: 'education',
  EMPLOYMENT_ONE: 'employment_one',
  EMPLOYMENT_TWO: 'employment_two',
  WORK_HISTORY: 'work_history'
}

export const MAX_EDUCATION_ITEMS = 3

export const moduleDefinitions = {
  [MODULE_KEYS.EDUCATION]: {
    key: MODULE_KEYS.EDUCATION,
    title: '学历信息',
    description: `请填写需要核验的学历证书编号，最多添加 ${MAX_EDUCATION_ITEMS} 条；证书不在身边可勾选「暂时无法提供」。`,
    shortName: '学历核验'
  },
  [MODULE_KEYS.EMPLOYMENT_ONE]: {
    key: MODULE_KEYS.EMPLOYMENT_ONE,
    title: '一段工作经历核验',
    description: '请填写最近一段工作经历，以及该段经历的 HR 和直属上级证明人。',
    shortName: '一段工作经历核验'
  },
  [MODULE_KEYS.EMPLOYMENT_TWO]: {
    key: MODULE_KEYS.EMPLOYMENT_TWO,
    title: '两段工作经历核验',
    description: '请分别填写最近两段工作经历，每段均需提供 HR 和直属上级证明人。',
    shortName: '两段工作经历核验'
  },
  [MODULE_KEYS.WORK_HISTORY]: {
    key: MODULE_KEYS.WORK_HISTORY,
    title: '工作履历',
    description: '该模块由核验人员处理，无需您额外填写。',
    shortName: '工作履历'
  }
}

export const salaryRanges = [
  '5,000元以下',
  '5,000-10,000元',
  '10,001-20,000元',
  '20,001-30,000元',
  '30,001-50,000元',
  '50,000元以上',
  '不便提供'
]

export const employmentTypes = ['正式员工', '劳务派遣', '业务外包', '实习', '兼职', '其他']

function createLocalId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `candidate-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createEducation() {
  return {
    id: createLocalId(),
    credentialNo: '',
    // 显式声明「没有编号」，而不是让用户对着一个标着「选填」的空框猜。
    // 两者对后端的含义也不同：留空可能是漏填，勾选是候选人的主动声明。
    noCredential: false
  }
}

export function createEmployment() {
  return {
    id: createLocalId(),
    companyName: '',
    startMonth: '',
    endMonth: '',
    isCurrent: false,
    employmentType: '',
    positionName: '',
    salaryRange: '',
    leaveReason: '',
    hrReference: createReference('HR'),
    supervisorReference: createReference('')
  }
}

function createReference(role) {
  return { contactName: '', contactRole: role, contactPhone: '' }
}

export function employmentSegmentCount(modules) {
  if (modules.includes(MODULE_KEYS.EMPLOYMENT_TWO)) return 2
  return modules.includes(MODULE_KEYS.EMPLOYMENT_ONE) ? 1 : 0
}

export function normalizeModules(value) {
  const requested = String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  const valid = requested.filter(key => moduleDefinitions[key])
  return valid.length
    ? [...new Set(valid)]
    : [MODULE_KEYS.EDUCATION, MODULE_KEYS.EMPLOYMENT_ONE, MODULE_KEYS.WORK_HISTORY]
}
