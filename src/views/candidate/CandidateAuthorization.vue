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

    <div v-if="currentStep > 0" class="candidate-progress-wrap">
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
        @continue="goToStep(2)"
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
        <p>您的信息已经确认完成。正式接入后，此处会自动进入 e签宝电子签署页面。</p>
        <button class="candidate-secondary-button" type="button" @click="goToStep(3)">返回信息确认</button>
      </section>
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
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
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
let countdownTimer = null

const task = reactive({
  token: String(route.params.token || route.query.token || 'demo'),
  companyName: String(route.query.company || '河南钟馗科技有限公司'),
  expectedPhone: String(route.query.phone || '15936323268'),
  signUrl: String(route.query.signUrl || ''),
  modules: normalizeModules(route.query.modules)
})

const demoMode = computed(() => task.token === 'demo' || route.query.demo === '1')
const maskedExpectedPhone = computed(() => task.expectedPhone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'))
const moduleLabels = computed(() => task.modules.map(key => moduleDefinitions[key]?.shortName).filter(Boolean))

const verification = reactive({
  phone: '',
  code: ''
})

const formModel = reactive({
  candidate: {
    name: String(route.query.name || '丁文博'),
    idCard: String(route.query.idCard || '41100220031027301X'),
    phone: task.expectedPhone,
    email: ''
  },
  educations: [createEducation()],
  employments: [createEmployment()],
  references: [createReference()]
})

function goToStep(step) {
  stepError.value = ''
  currentStep.value = step
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function back() {
  if (currentStep.value > 0) goToStep(currentStep.value - 1)
}

async function sendCode() {
  stepError.value = ''
  if (!/^1\d{10}$/.test(verification.phone)) {
    stepError.value = '请输入正确的11位手机号码'
    return
  }
  if (verification.phone !== task.expectedPhone) {
    stepError.value = '手机号与本次授权任务预留号码不一致'
    return
  }
  sendingCode.value = true
  await wait(450)
  sendingCode.value = false
  countdown.value = 60
  clearInterval(countdownTimer)
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
}

async function verifyPhone() {
  stepError.value = ''
  if (!/^1\d{10}$/.test(verification.phone)) {
    stepError.value = '请输入正确的11位手机号码'
    return
  }
  if (verification.phone !== task.expectedPhone) {
    stepError.value = '手机号与本次授权任务预留号码不一致'
    return
  }
  if (!/^\d{6}$/.test(verification.code)) {
    stepError.value = '请输入6位短信验证码'
    return
  }
  if (demoMode.value && verification.code !== '123456') {
    stepError.value = '演示验证码为 123456'
    return
  }
  verifying.value = true
  await wait(450)
  verifying.value = false
  goToStep(1)
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
  submitting.value = true
  await wait(650)
  submitting.value = false

  if (task.signUrl) {
    window.location.assign(task.signUrl)
    return
  }
  goToStep(4)
}

function showDocument(type) {
  documentDialog.value = type
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

onBeforeUnmount(() => clearInterval(countdownTimer))
</script>

