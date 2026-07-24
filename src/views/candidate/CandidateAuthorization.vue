<template>
  <main class="candidate-shell">
    <header class="candidate-header">
      <div class="candidate-brand">
        <span class="candidate-brand-mark">钟</span>
        <span>
          <strong>钟馗背调</strong>
          <small>候选人信息授权</small>
        </span>
      </div>
      <button type="button" class="candidate-help-button" title="联系客服">
        <CircleHelp :size="18" />
        <span>客服与帮助</span>
      </button>
    </header>

    <div v-if="!terminalState && currentStep > 0" class="candidate-progress-wrap">
      <button type="button" class="candidate-back-button" @click="back">
        <ChevronLeft :size="19" />
        返回
      </button>
      <ol class="candidate-progress">
        <li v-for="(item, index) in progressSteps" :key="item" :class="{ active: currentStep === index + 1, done: currentStep > index + 1 }">
          <span>{{ currentStep > index + 1 ? '✓' : index + 1 }}</span>
          <em>{{ item }}</em>
        </li>
      </ol>
    </div>

    <div class="candidate-content">
      <section v-if="terminalState" class="candidate-step candidate-complete-step">
        <span class="candidate-complete-icon"><CheckCircle2 :size="38" /></span>
        <h1>{{ terminalTitle }}</h1>
        <p>{{ terminalMessage }}</p>
      </section>

      <section v-else-if="taskLoading" class="candidate-step candidate-complete-step">
        <h1>加载中…</h1>
        <p>正在获取本次授权任务信息，请稍候。</p>
      </section>

      <template v-else>
        <PhoneVerifyStep
          v-if="currentStep === 0"
          v-model:phone="verification.phone"
          v-model:code="verification.code"
          :phone-hint="maskedExpectedPhone"
          :countdown="countdown"
          :sending="sendingCode"
          :loading="verifying"
          :demo-mode="demoMode"
          :error="stepError"
          @send-code="sendCode"
          @continue="verifyPhone"
        />

        <ConsentStep
          v-else-if="currentStep === 1"
          v-model:accepted="consentAccepted"
          :company-name="task.companyName"
          :module-labels="moduleLabels"
          @continue="confirmConsent"
          @show-agreement="showDocument('agreement')"
          @show-privacy="showDocument('privacy')"
        />

        <DynamicFormStep
          v-else-if="currentStep === 2"
          :model="formModel"
          :modules="task.modules"
          :error="stepError"
          @back="back"
          @continue="reviewForm"
        />

        <ReviewStep
          v-else-if="currentStep === 3"
          :model="formModel"
          :modules="task.modules"
          :loading="submitting"
          :error="stepError"
          @back="back"
          @sign="submitAndSign"
        />

        <section v-else class="candidate-step candidate-complete-step">
          <span class="candidate-complete-icon"><CheckCircle2 :size="38" /></span>
          <h1>信息已提交</h1>
          <p>您的信息已确认完成，请点击下方按钮前往 e签宝 完成电子签署。</p>
          <p v-if="stepError" class="candidate-form-error" role="alert">{{ stepError }}</p>
          <button class="candidate-primary-button" type="button" :disabled="submitting" @click="submitAndSign">
            {{ submitting ? '正在获取签署链接…' : '前往电子签署' }}
          </button>
        </section>
      </template>
    </div>

    <footer class="candidate-page-footer">
      <ShieldCheck :size="16" />
      信息加密传输 · 授权过程全程留痕
    </footer>

    <div v-if="documentDialog" class="candidate-document-overlay" @click.self="documentDialog = ''">
      <section class="candidate-document-dialog" role="dialog" aria-modal="true">
        <button type="button" class="candidate-dialog-close" title="关闭" @click="documentDialog = ''">
          <X :size="20" />
        </button>
        <h2>{{ documentDialog === 'privacy' ? '隐私政策' : '背调用户协议' }}</h2>
        <div class="candidate-dialog-copy">
          <p>本页面仅收集完成本次背景调查所必需的信息，并按照最小必要原则用于身份验证、信息核验、报告生成和争议处理。</p>
          <p>未经法律法规授权或本人同意，不会将信息用于与本次服务无关的用途。信息处理活动将保留必要的访问和操作记录。</p>
          <p>如需撤回授权或对信息处理提出疑问，请联系本次调查发起方或平台客服。</p>
        </div>
        <button type="button" class="candidate-primary-button" @click="documentDialog = ''">我已了解</button>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CheckCircle2, ChevronLeft, CircleHelp, ShieldCheck, X } from '@lucide/vue'
import ConsentStep from './components/ConsentStep.vue'
import DynamicFormStep from './components/DynamicFormStep.vue'
import PhoneVerifyStep from './components/PhoneVerifyStep.vue'
import ReviewStep from './components/ReviewStep.vue'
import {
  MODULE_KEYS,
  createEducation,
  createEmployment,
  createReference,
  moduleDefinitions,
  normalizeModules
} from './candidateFormSchema'
import {
  getCandidateTask,
  sendCandidateCode,
  verifyCandidateCode,
  consentCandidate,
  submitCandidateForm
} from '../../api/candidate'
import './candidate-authorization.css'

const route = useRoute()
const progressSteps = ['阅读授权', '填写信息', '确认签署']
const currentStep = ref(0)
const countdown = ref(0)
const sendingCode = ref(false)
const verifying = ref(false)
const submitting = ref(false)
const consentAccepted = ref(false)
const stepError = ref('')
const documentDialog = ref('')
const taskLoading = ref(false)
const terminalState = ref('')
const ticket = ref('')
let countdownTimer = null

const task = reactive({
  token: String(route.params.token || route.query.token || 'demo'),
  companyName: String(route.query.company || '河南钟馗科技有限公司'),
  expectedPhone: String(route.query.phone || '15936323268'),
  maskedPhone: '',
  signUrl: String(route.query.signUrl || ''),
  modules: normalizeModules(route.query.modules)
})

const demoMode = computed(() => task.token === 'demo' || route.query.demo === '1')
const maskedExpectedPhone = computed(() => demoMode.value
  ? task.expectedPhone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
  : task.maskedPhone)
const moduleLabels = computed(() => task.modules.map(key => moduleDefinitions[key]?.shortName).filter(Boolean))

const terminalCopy = {
  SIGNED: {
    title: '授权已完成',
    message: '您已完成信息填写与电子签署，无需重复操作。感谢您的配合！'
  },
  EXPIRED: {
    title: '链接已过期',
    message: '本次授权任务已超时失效。如仍需完成背景调查授权，请联系发起方重新发起。'
  },
  CANCELLED: {
    title: '任务已关闭',
    message: '本次授权任务已被取消或关闭。如有疑问，请联系发起方或平台客服。'
  },
  INVALID: {
    title: '任务不存在或已失效',
    message: '链接无效或任务已失效。请确认短信中的链接是否完整，或联系发起方重新发起。'
  }
}
const terminalTitle = computed(() => terminalCopy[terminalState.value]?.title || '任务已结束')
const terminalMessage = computed(() => terminalCopy[terminalState.value]?.message || '')

const verification = reactive({
  phone: '',
  code: ''
})

const formModel = reactive({
  candidate: {
    name: demoMode.value ? String(route.query.name || '丁文博') : '',
    idCard: demoMode.value ? String(route.query.idCard || '41100220031027301X') : '',
    phone: demoMode.value ? task.expectedPhone : '',
    email: ''
  },
  educations: [createEducation()],
  employments: [createEmployment()],
  references: [createReference()]
})

const stepForStatus = {
  WAIT_SMS: 0,
  WAIT_CONSENT: 1,
  WAIT_FORM: 2,
  WAIT_SIGN: 4
}

onMounted(async () => {
  if (demoMode.value) return
  taskLoading.value = true
  try {
    const res = await getCandidateTask(task.token)
    const data = res.data || {}
    applyTaskView(data)
    if (['SIGNED', 'EXPIRED', 'CANCELLED'].includes(data.status)) {
      terminalState.value = data.status
    }
  } catch (e) {
    terminalState.value = 'INVALID'
  } finally {
    taskLoading.value = false
  }
})

function applyTaskView(data) {
  if (data.companyName) task.companyName = String(data.companyName)
  if (data.maskedPhone) task.maskedPhone = String(data.maskedPhone)
  task.modules = Array.isArray(data.modules) && data.modules.length
    ? data.modules.filter(key => moduleDefinitions[key])
    : []
}

function goToStep(step) {
  stepError.value = ''
  currentStep.value = step
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function back() {
  if (currentStep.value > 0) goToStep(currentStep.value - 1)
}

function startCountdown() {
  countdown.value = 60
  clearInterval(countdownTimer)
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
}

async function sendCode() {
  stepError.value = ''
  if (!/^1\d{10}$/.test(verification.phone)) {
    stepError.value = '请输入正确的11位手机号码'
    return
  }
  if (demoMode.value) {
    if (verification.phone !== task.expectedPhone) {
      stepError.value = '手机号与本次授权任务预留号码不一致'
      return
    }
    sendingCode.value = true
    await wait(450)
    sendingCode.value = false
    startCountdown()
    return
  }
  sendingCode.value = true
  try {
    await sendCandidateCode(task.token, verification.phone)
    startCountdown()
  } catch (e) {
    stepError.value = errorMessage(e, '验证码发送失败，请稍后重试')
  } finally {
    sendingCode.value = false
  }
}

async function verifyPhone() {
  stepError.value = ''
  if (!/^1\d{10}$/.test(verification.phone)) {
    stepError.value = '请输入正确的11位手机号码'
    return
  }
  if (!/^\d{6}$/.test(verification.code)) {
    stepError.value = '请输入6位短信验证码'
    return
  }
  if (demoMode.value) {
    if (verification.phone !== task.expectedPhone) {
      stepError.value = '手机号与本次授权任务预留号码不一致'
      return
    }
    if (verification.code !== '123456') {
      stepError.value = '演示验证码为 123456'
      return
    }
    verifying.value = true
    await wait(450)
    verifying.value = false
    goToStep(1)
    return
  }
  verifying.value = true
  try {
    const res = await verifyCandidateCode(task.token, {
      phone: verification.phone,
      code: verification.code
    })
    const data = res.data || {}
    ticket.value = String(data.ticket || '')
    if (data.candidateName) formModel.candidate.name = String(data.candidateName)
    formModel.candidate.phone = verification.phone
    if (Array.isArray(data.modules)) {
      task.modules = data.modules.filter(key => moduleDefinitions[key])
    }
    const resumeStep = stepForStatus[data.status]
    goToStep(resumeStep === undefined ? 1 : resumeStep)
  } catch (e) {
    stepError.value = errorMessage(e, '验证失败，请稍后重试')
  } finally {
    verifying.value = false
  }
}

async function confirmConsent() {
  stepError.value = ''
  if (demoMode.value) {
    goToStep(2)
    return
  }
  try {
    await consentCandidate(task.token, ticket.value)
    // 身份证号始终需候选人在填写步骤录入并核验，无论是否配置了其它模块
    goToStep(2)
  } catch (e) {
    stepError.value = errorMessage(e, '操作失败，请稍后重试')
  }
}

function reviewForm() {
  stepError.value = validateForm()
  if (stepError.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  goToStep(3)
}

function validateForm() {
  if (!formModel.candidate.idCard) return '请填写身份证号'
  formModel.candidate.idCard = formModel.candidate.idCard.replace(/x/g, 'X')
  if (!/^\d{17}[\dX]$/.test(formModel.candidate.idCard)) return '身份证号格式不正确'

  if (task.modules.includes(MODULE_KEYS.EDUCATION)) {
    if (formModel.educations.some(item => !item.credentialNo)) return '请完整填写学历证书编号'
  }

  if (task.modules.includes(MODULE_KEYS.EMPLOYMENT)) {
    const invalid = formModel.employments.some(item =>
      !item.companyName ||
      !item.startMonth ||
      (!item.isCurrent && !item.endMonth) ||
      !item.salaryRange
    )
    if (invalid) return '请完整填写每段工作经历的必填信息'
  }

  if (task.modules.includes(MODULE_KEYS.REFERENCE)) {
    const invalid = formModel.references.some(item =>
      !item.companyName ||
      !item.startMonth ||
      (!item.isCurrent && !item.endMonth) ||
      !item.contactName ||
      !item.contactRole ||
      !item.contactPhone
    )
    if (invalid) return '请完整填写每位证明人的必填信息'
  }
  return ''
}

async function submitAndSign() {
  stepError.value = ''
  if (demoMode.value) {
    submitting.value = true
    await wait(650)
    submitting.value = false
    if (task.signUrl) {
      window.location.assign(task.signUrl)
      return
    }
    goToStep(4)
    return
  }
  submitting.value = true
  try {
    const res = await submitCandidateForm(task.token, {
      ticket: ticket.value,
      form: buildFormPayload()
    })
    const signUrl = res.data && res.data.signUrl
    if (signUrl) {
      window.location.assign(signUrl)
      return
    }
    stepError.value = '未获取到签署链接，请稍后重试'
  } catch (e) {
    stepError.value = errorMessage(e, '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function buildFormPayload() {
  return {
    candidate: {
      idCard: formModel.candidate.idCard,
      email: formModel.candidate.email
    },
    educations: task.modules.includes(MODULE_KEYS.EDUCATION)
      ? formModel.educations.map(item => ({ credentialNo: item.credentialNo }))
      : [],
    employments: task.modules.includes(MODULE_KEYS.EMPLOYMENT)
      ? formModel.employments.map(item => ({
          companyName: item.companyName,
          startMonth: item.startMonth,
          endMonth: item.endMonth,
          isCurrent: !!item.isCurrent,
          salaryRange: item.salaryRange
        }))
      : [],
    references: task.modules.includes(MODULE_KEYS.REFERENCE)
      ? formModel.references.map(item => ({
          companyName: item.companyName,
          startMonth: item.startMonth,
          endMonth: item.endMonth,
          isCurrent: !!item.isCurrent,
          contactName: item.contactName,
          contactRole: item.contactRole,
          contactPhone: item.contactPhone
        }))
      : []
  }
}

function errorMessage(e, fallback) {
  if (e && typeof e.msg === 'string' && e.msg) return e.msg
  if (e && typeof e.message === 'string' && e.message && e.message !== 'Network Error') return e.message
  return fallback
}

function showDocument(type) {
  documentDialog.value = type
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

onBeforeUnmount(() => clearInterval(countdownTimer))
</script>
