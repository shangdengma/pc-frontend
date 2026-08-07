<template>
  <div class="login-page">
    <main class="login-main">
    <!-- 单列居中，不做左右分栏：登录页不承担营销职能，紧凑即专业 -->
    <div class="login-brand">
      <div class="brand-seal" aria-hidden="true"><span>钟馗</span></div>
      <div class="brand-names">
        <span class="brand-title">钟馗背调</span>
        <span class="brand-sub">企业版工作台</span>
      </div>
    </div>

    <form class="login-card" @submit.prevent="handleLogin">
      <h2>登录工作台</h2>
      <p class="login-subtitle">欢迎回来，请登录您的企业账号</p>
      <div class="login-mode-tabs" role="tablist" aria-label="登录方式">
        <button type="button" :class="{ active: loginMode === 'password' }" @click="switchMode('password')">密码登录</button>
        <button type="button" :class="{ active: loginMode === 'sms' }" @click="switchMode('sms')">验证码登录</button>
      </div>

      <template v-if="loginMode === 'password'">
        <label>
          <span>账号或手机号</span>
          <input v-model.trim="form.username" placeholder="请输入账号或手机号" autocomplete="username">
        </label>
        <label>
          <span>密码</span>
          <input v-model="form.password" placeholder="请输入密码" type="password" autocomplete="current-password">
        </label>
        <label v-if="captcha.need">
          <span>图形验证码</span>
          <div class="captcha-row">
            <input v-model.trim="captcha.code" placeholder="请输入图中字符" maxlength="6" autocomplete="off">
            <img
              v-if="captcha.img"
              class="captcha-image"
              :src="captcha.img"
              alt="点击刷新验证码"
              title="点击刷新"
              @click="loadCaptcha"
            />
          </div>
        </label>
      </template>

      <template v-else>
        <label>
          <span>手机号</span>
          <input v-model.trim="smsForm.phone" placeholder="请输入注册手机号" autocomplete="tel" maxlength="11" inputmode="numeric">
        </label>
        <label>
          <span>短信验证码</span>
          <div class="captcha-row sms-row">
            <input v-model.trim="smsForm.code" placeholder="请输入短信验证码" maxlength="6" inputmode="numeric">
            <button type="button" :disabled="countdown > 0 || sendingCode" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : (sendingCode ? '发送中' : '获取验证码') }}
            </button>
          </div>
        </label>
      </template>

      <div class="login-consent">
        <input id="login-consent" v-model="agreementAccepted" type="checkbox">
        <label for="login-consent">我已阅读并同意</label>
        <router-link to="/user-agreement" target="_blank">《用户协议》</router-link>
        <span>和</span>
        <router-link to="/privacy-policy" target="_blank">《隐私政策》</router-link>
      </div>

      <div v-if="error" class="form-error">{{ error }}</div>
      <div v-if="notice" class="form-notice">{{ notice }}</div>
      <button class="primary-btn" type="submit" :disabled="loading || !legalDocumentsReady">{{ loading ? '登录中...' : '进入工作台' }}</button>
      <div class="login-register-entry">
        <span>没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
      <router-link class="login-help-entry" to="/contact-us">
        <CircleHelp :size="15" aria-hidden="true" />
        遇到问题？联系客服处理
        <ChevronRight :size="14" aria-hidden="true" />
      </router-link>
    </form>
    </main>

    <footer class="login-foot">
      <div class="login-foot-primary">
        <span>河南钟馗科技有限公司</span>
        <span aria-hidden="true">·</span>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">豫ICP备2025138155号</a>
      </div>
      <a
        class="login-police-record"
        href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=41019602002676"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/gongan-beian.png" alt="" aria-hidden="true">
        <span>豫公网安备41019602002676号</span>
      </a>
    </footer>

    <SmsSliderVerify
      v-model="sliderOpen"
      :phone="smsForm.phone"
      scene="login"
      @verified="sendCodeWithTicket"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, CircleHelp } from '@lucide/vue'
import SmsSliderVerify from '../components/SmsSliderVerify.vue'
import { getCodeImg, getInfo, login, sendLoginCode, smsLogin } from '../api/auth'
import { getPublicLegalDocument } from '../api/legal'
import { setToken, setUser } from '../utils/auth'

const router = useRouter()
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const error = ref('')
const notice = ref('')
const sliderOpen = ref(false)
const loginMode = ref('password')
const agreementAccepted = ref(false)
const legalDocumentsReady = ref(false)
const legalDocumentIds = reactive({ agreementDocId: null, privacyDocId: null })
const form = reactive({ username: '', password: '' })
const smsForm = reactive({ phone: '', code: '' })
let countdownTimer = null

function legalAcceptancePayload() {
  return {
    legalAccepted: agreementAccepted.value,
    agreementDocId: legalDocumentIds.agreementDocId,
    privacyDocId: legalDocumentIds.privacyDocId
  }
}

async function loadLegalDocuments() {
  legalDocumentsReady.value = false
  try {
    const [agreement, privacy] = await Promise.all([
      getPublicLegalDocument('user_agreement'),
      getPublicLegalDocument('privacy_policy')
    ])
    const agreementDocId = Number(agreement?.data?.id)
    const privacyDocId = Number(privacy?.data?.id)
    if (!Number.isSafeInteger(agreementDocId) || !Number.isSafeInteger(privacyDocId)) {
      throw new Error('法律文档未发布')
    }
    legalDocumentIds.agreementDocId = agreementDocId
    legalDocumentIds.privacyDocId = privacyDocId
    legalDocumentsReady.value = true
  } catch (err) {
    legalDocumentIds.agreementDocId = null
    legalDocumentIds.privacyDocId = null
    error.value = err?.msg || '协议内容加载失败，请刷新页面后重试'
  }
}

function switchMode(mode) {
  loginMode.value = mode
  error.value = ''
  notice.value = ''
}

function startCountdown() {
  countdown.value = 60
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

function sendCode() {
  error.value = ''
  notice.value = ''
  if (!smsForm.phone) return (error.value = '请输入手机号')
  if (!/^1[3-9]\d{9}$/.test(smsForm.phone)) return (error.value = '请输入正确的手机号')
  sliderOpen.value = true
}

async function sendCodeWithTicket(sliderTicket) {
  sendingCode.value = true
  try {
    const res = await sendLoginCode(smsForm.phone, sliderTicket)
    notice.value = '验证码已发送'
    if (import.meta.env.DEV && res?.data && !smsForm.code) {
      smsForm.code = String(res.data)
    }
    startCountdown()
  } catch (err) {
    error.value = err?.msg || '验证码发送失败'
  } finally {
    sendingCode.value = false
  }
}

async function finishLogin(res, fallbackName) {
  setToken(res.token)
  try {
    const info = await getInfo()
    setUser(info.user || {})
  } catch (err) {
    setUser({ userName: fallbackName })
  }
  router.replace('/dashboard')
}

// 图形验证码：密码连续输错达阈值后由后端要求，前端据 needCaptcha 展示
const captcha = reactive({ need: false, img: '', uuid: '', code: '' })

async function loadCaptcha() {
  try {
    const res = await getCodeImg()
    const data = res?.data || res || {}
    captcha.img = data.img ? `data:image/gif;base64,${data.img}` : ''
    captcha.uuid = data.uuid || ''
    captcha.code = ''
  } catch (e) {
    captcha.img = ''
    captcha.uuid = ''
  }
}

async function handlePasswordLogin() {
  if (!form.username) return (error.value = '请输入账号或手机号')
  if (!form.password) return (error.value = '请输入密码')
  if (captcha.need && !captcha.code) return (error.value = '请输入图形验证码')
  try {
    const res = await login(
      form.username, form.password,
      captcha.need ? captcha.code : '',
      captcha.need ? captcha.uuid : '',
      'pc-web',
      legalAcceptancePayload()
    )
    await finishLogin(res, form.username)
  } catch (err) {
    // 后端在失败响应中回传 needCaptcha，据此决定是否展示/刷新验证码
    if (err?.needCaptcha) {
      captcha.need = true
      await loadCaptcha()
    } else if (captcha.need) {
      await loadCaptcha()
    }
    throw err
  }
}

async function handleSmsLogin() {
  if (!smsForm.phone) return (error.value = '请输入手机号')
  if (!/^1[3-9]\d{9}$/.test(smsForm.phone)) return (error.value = '请输入正确的手机号')
  const res = await smsLogin(smsForm.phone, smsForm.code, 'pc-web', legalAcceptancePayload())
  await finishLogin(res, smsForm.phone)
}

async function handleLogin() {
  error.value = ''
  notice.value = ''
  if (!agreementAccepted.value) {
    error.value = '请先阅读并同意《用户协议》和《隐私政策》'
    return
  }
  if (!legalDocumentsReady.value) {
    error.value = '协议内容尚未加载，请刷新页面后重试'
    await loadLegalDocuments()
    return
  }
  loading.value = true
  try {
    if (loginMode.value === 'sms') {
      await handleSmsLogin()
    } else {
      await handlePasswordLogin()
    }
  } catch (err) {
    error.value = err?.msg || '登录失败，请检查登录信息'
  } finally {
    loading.value = false
  }
}

onMounted(loadLegalDocuments)
</script>
