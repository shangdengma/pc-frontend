export const MODULE_KEYS = {
  EDUCATION: 'education',
  EMPLOYMENT: 'employment',
  REFERENCE: 'reference'
}

export const moduleDefinitions = {
  [MODULE_KEYS.EDUCATION]: {
    key: MODULE_KEYS.EDUCATION,
    title: '学历信息',
    description: '请填写需要核验的学历证书编号，可添加多段学历。',
    shortName: '学历核验'
  },
  [MODULE_KEYS.EMPLOYMENT]: {
    key: MODULE_KEYS.EMPLOYMENT,
    title: '工作经历',
    description: '请按实际情况填写任职单位、工作时间和薪酬范围。',
    shortName: '工作经历核验'
  },
  [MODULE_KEYS.REFERENCE]: {
    key: MODULE_KEYS.REFERENCE,
    title: '工作经历访谈',
    description: '请填写能够证明该段工作经历的联系人信息。',
    shortName: '证明人访谈'
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

function createLocalId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `candidate-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createEducation() {
  return {
    id: createLocalId(),
    credentialNo: ''
  }
}

export function createEmployment() {
  return {
    id: createLocalId(),
    companyName: '',
    startMonth: '',
    endMonth: '',
    isCurrent: false,
    salaryRange: ''
  }
}

export function createReference() {
  return {
    id: createLocalId(),
    companyName: '',
    startMonth: '',
    endMonth: '',
    isCurrent: false,
    contactName: '',
    contactRole: '',
    contactPhone: ''
  }
}

export function normalizeModules(value) {
  const requested = String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  const valid = requested.filter(key => moduleDefinitions[key])
  return valid.length
    ? [...new Set(valid)]
    : [MODULE_KEYS.EDUCATION, MODULE_KEYS.EMPLOYMENT, MODULE_KEYS.REFERENCE]
}
