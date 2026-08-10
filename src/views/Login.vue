<template>
  <div class="login-page">
    <section class="login-brand-panel" aria-label="钟馗背调品牌信息">
      <div class="login-brand-lockup">
        <div class="login-brand-seal" aria-hidden="true"><span>钟馗</span></div>
        <div>
          <strong>钟馗背调</strong>
          <span>一站式企业风控平台</span>
        </div>
      </div>

      <div class="login-brand-message">
        <p>用工背调与商业尽调</p>
        <h1>让企业每一次决策<br>都有依据</h1>
        <div class="login-brand-principles" aria-label="服务原则">
          <span><b>01</b>合规授权</span>
          <span><b>02</b>多维数据</span>
          <span><b>03</b>清晰交付</span>
        </div>
      </div>

      <div class="login-brand-watermark" aria-hidden="true">ZHONGKUI</div>

      <div class="login-brand-foot">
        <span>河南钟馗科技有限公司</span>
        <span>ZHONGKUI BACKGROUND CHECK</span>
      </div>
    </section>

    <main class="login-main">
      <div class="login-mobile-brand">
        <div class="login-brand-seal" aria-hidden="true"><span>钟馗</span></div>
        <div>
          <strong>钟馗背调</strong>
          <span>一站式企业风控平台</span>
        </div>
      </div>

      <form class="login-card" novalidate @submit.prevent="handleLogin">
        <header class="login-form-head">
          <span>企业工作台</span>
          <h2>欢迎回来</h2>
        </header>

        <div class="login-form-surface">
        <div class="login-mode-tabs" role="tablist" aria-label="登录方式">
          <button
            type="button"
            role="tab"
            :aria-selected="loginMode === 'password'"
            :class="{ active: loginMode === 'password' }"
            @click="switchMode('password')"
          >
            密码登录
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="loginMode === 'sms'"
            :class="{ active: loginMode === 'sms' }"
            @click="switchMode('sms')"
          >
            验证码登录
          </button>
        </div>

        <div :key="loginMode" class="login-fields">
          <template v-if="loginMode === 'password'">
            <label class="login-field">
              <span>账号或手机号</span>
              <input
                v-model.trim="form.username"
                :aria-invalid="!!fieldErrors.username"
                placeholder="请输入账号或手机号"
                autocomplete="username"
                @input="fieldErrors.username = ''"
              >
              <small v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</small>
            </label>

            <label class="login-field">
              <span>密码</span>
              <div class="password-input">
                <input
                  v-model="form.password"
                  :aria-invalid="!!fieldErrors.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                  @input="fieldErrors.password = ''"
                >
                <button
                  type="button"
                  :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                  :title="showPassword ? '隐藏密码' : '显示密码'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="18" aria-hidden="true" />
                  <Eye v-else :size="18" aria-hidden="true" />
                </button>
              </div>
              <small v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</small>
            </label>

            <label v-if="captcha.need" class="login-field">
              <span>图形验证码</span>
              <div class="captcha-row">
                <input
                  v-model.trim="captcha.code"
                  :aria-invalid="!!fieldErrors.captcha"
                  placeholder="请输入图中字符"
                  maxlength="6"
                  autocomplete="off"
                  @input="fieldErrors.captcha = ''"
                >
                <button class="captcha-image-button" type="button" title="刷新验证码" @click="loadCaptcha">
                  <img v-if="captcha.img" class="captcha-image" :src="captcha.img" alt="图形验证码">
                  <RefreshCw v-else :size="18" aria-hidden="true" />
                </button>
              </div>
              <small v-if="fieldErrors.captcha" class="field-error">{{ fieldErrors.captcha }}</small>
            </label>
          </template>

          <template v-else>
            <label class="login-field">
              <span>手机号</span>
              <input
                v-model.trim="smsForm.phone"
                :aria-invalid="!!fieldErrors.phone"
                placeholder="请输入注册手机号"
                autocomplete="tel"
                maxlength="11"
                inputmode="numeric"
                @input="fieldErrors.phone = ''"
              >
              <small v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</small>
            </label>

            <label class="login-field">
              <span>短信验证码</span>
              <div class="captcha-row sms-row">
                <input
                  v-model.trim="smsForm.code"
                  :aria-invalid="!!fieldErrors.smsCode"
                  placeholder="请输入 6 位验证码"
                  maxlength="6"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  @input="fieldErrors.smsCode = ''"
                >
                <button type="button" :disabled="countdown > 0 || sendingCode" @click="sendCode">
                  {{ countdown > 0 ? `${countdown}s 后重试` : (sendingCode ? '发送中' : '获取验证码') }}
                </button>
              </div>
              <small v-if="fieldErrors.smsCode" class="field-error">{{ fieldErrors.smsCode }}</small>
            </label>
          </template>
        </div>

        <div class="login-consent" :class="{ invalid: !!fieldErrors.consent }">
          <input id="login-consent" v-model="agreementAccepted" type="checkbox" @change="fieldErrors.consent = ''">
          <label for="login-consent">我已阅读并同意</label>
          <router-link to="/user-agreement" target="_blank">《用户协议》</router-link>
          <span>和</span>
          <router-link to="/privacy-policy" target="_blank">《隐私政策》</router-link>
        </div>
        <small v-if="fieldErrors.consent" class="field-error consent-error">{{ fieldErrors.consent }}</small>

        <div v-if="legalDocumentsLoading" class="legal-state" aria-live="polite">
          <LoaderCircle :size="15" class="spin" aria-hidden="true" />
          正在加载协议内容
        </div>
        <div v-else-if="legalDocumentError" class="legal-state error" aria-live="polite">
          <span>{{ legalDocumentError }}</span>
          <button type="button" @click="loadLegalDocuments">重新加载</button>
        </div>

        <div class="login-feedback" aria-live="polite">
          <div v-if="error" class="form-error"><CircleAlert :size="16" aria-hidden="true" />{{ error }}</div>
          <div v-else-if="notice" class="form-notice"><CircleCheck :size="16" aria-hidden="true" />{{ notice }}</div>
        </div>

        <button class="primary-btn login-submit" type="submit" :disabled="loading">
          <LoaderCircle v-if="loading" :size="17" class="spin" aria-hidden="true" />
          {{ loading ? '正在登录' : '进入工作台' }}
        </button>
        </div>

        <div class="login-secondary-actions">
          <div class="login-register-entry">
            <span>还没有账号？</span>
            <router-link to="/register">注册企业账号</router-link>
          </div>
          <router-link class="login-help-entry" to="/contact-us">
            <CircleHelp :size="15" aria-hidden="true" />
            遇到问题？联系客服
          </router-link>
        </div>
      </form>

      <footer class="login-foot">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">豫ICP备2025138155号</a>
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
    </main>

    <SmsSliderVerify
      v-model="sliderOpen"
      :phone="smsForm.phone"
      scene="login"
      @verified="sendCodeWithTicket"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Eye,
  EyeOff,
  LoaderCircle,
  RefreshCw
} from '@lucide/vue'
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
const showPassword = ref(false)
const agreementAccepted = ref(false)
const legalDocumentsReady = ref(false)
const legalDocumentsLoading = ref(false)
const legalDocumentError = ref('')
const legalDocumentIds = reactive({ agreementDocId: null, privacyDocId: null })
const fieldErrors = reactive({ username: '', password: '', captcha: '', phone: '', smsCode: '', consent: '' })
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
  legalDocumentsLoading.value = true
  legalDocumentError.value = ''
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
    legalDocumentError.value = err?.msg || '协议内容加载失败'
  } finally {
    legalDocumentsLoading.value = false
  }
}

function clearFieldErrors() {
  Object.keys(fieldErrors).forEach(key => { fieldErrors[key] = '' })
}

function switchMode(mode) {
  loginMode.value = mode
  error.value = ''
  notice.value = ''
  clearFieldErrors()
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

function validatePhone() {
  if (!smsForm.phone) fieldErrors.phone = '请输入手机号'
  else if (!/^1[3-9]\d{9}$/.test(smsForm.phone)) fieldErrors.phone = '请输入正确的手机号'
  return !fieldErrors.phone
}

function sendCode() {
  error.value = ''
  notice.value = ''
  fieldErrors.phone = ''
  if (!validatePhone()) return
  sliderOpen.value = true
}

async function sendCodeWithTicket(sliderTicket) {
  sendingCode.value = true
  try {
    const res = await sendLoginCode(smsForm.phone, sliderTicket)
    notice.value = '验证码已发送，请注意查收'
    if (import.meta.env.DEV && res?.data && !smsForm.code) smsForm.code = String(res.data)
    startCountdown()
  } catch (err) {
    error.value = err?.msg || '验证码发送失败，请稍后重试'
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

const captcha = reactive({ need: false, img: '', uuid: '', code: '' })

async function loadCaptcha() {
  try {
    const res = await getCodeImg()
    const data = res?.data || res || {}
    captcha.img = data.img ? `data:image/gif;base64,${data.img}` : ''
    captcha.uuid = data.uuid || ''
    captcha.code = ''
  } catch (err) {
    captcha.img = ''
    captcha.uuid = ''
  }
}

function validatePasswordFields() {
  fieldErrors.username = form.username ? '' : '请输入账号或手机号'
  fieldErrors.password = form.password ? '' : '请输入密码'
  fieldErrors.captcha = captcha.need && !captcha.code ? '请输入图形验证码' : ''
  return !fieldErrors.username && !fieldErrors.password && !fieldErrors.captcha
}

async function handlePasswordLogin() {
  if (!validatePasswordFields()) return false
  try {
    const res = await login(
      form.username,
      form.password,
      captcha.need ? captcha.code : '',
      captcha.need ? captcha.uuid : '',
      'pc-web',
      legalAcceptancePayload()
    )
    await finishLogin(res, form.username)
    return true
  } catch (err) {
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
  fieldErrors.phone = ''
  fieldErrors.smsCode = ''
  if (!validatePhone()) return false
  if (!/^\d{6}$/.test(smsForm.code)) {
    fieldErrors.smsCode = '请输入 6 位短信验证码'
    return false
  }
  const res = await smsLogin(smsForm.phone, smsForm.code, 'pc-web', legalAcceptancePayload())
  await finishLogin(res, smsForm.phone)
  return true
}

async function handleLogin() {
  error.value = ''
  notice.value = ''
  fieldErrors.consent = ''
  if (!agreementAccepted.value) {
    fieldErrors.consent = '请先阅读并同意用户协议和隐私政策'
    return
  }
  if (!legalDocumentsReady.value) {
    await loadLegalDocuments()
    if (!legalDocumentsReady.value) return
  }
  loading.value = true
  try {
    if (loginMode.value === 'sms') await handleSmsLogin()
    else await handlePasswordLogin()
  } catch (err) {
    error.value = err?.msg || '登录失败，请检查登录信息'
  } finally {
    loading.value = false
  }
}

onMounted(loadLegalDocuments)

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.login-page {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(620px, 1.35fr) minmax(520px, .9fr);
  align-items: stretch;
  gap: 0;
  padding: 0;
  color: #17191e;
  background: #eceff1;
}

.login-page::before { content: none; }

.login-brand-panel {
  position: relative;
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  padding: 52px 64px 46px;
  overflow: hidden;
  color: #17191e;
  background: transparent;
}

.login-brand-panel::before {
  content: '';
  position: absolute;
  left: 64px;
  right: 64px;
  bottom: 94px;
  height: 1px;
  background: rgba(23, 25, 30, .11);
}

.login-brand-watermark {
  position: absolute;
  right: 42px;
  bottom: 78px;
  color: rgba(23, 25, 30, .035);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 104px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  pointer-events: none;
}

.login-brand-lockup,
.login-mobile-brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.login-brand-lockup { animation: login-reveal .5s ease-out both; }

.login-brand-seal {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: #fff;
  background: #a6392e;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .24), inset 0 0 7px rgba(89, 18, 12, .42);
  transform: rotate(-2deg);
}

.login-brand-seal span {
  font-family: "Songti SC", "SimSun", serif;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.05;
  writing-mode: vertical-rl;
}

.login-brand-lockup strong,
.login-mobile-brand strong {
  display: block;
  font-size: 18px;
  line-height: 1.35;
}

.login-brand-lockup > div:last-child span,
.login-mobile-brand > div:last-child span {
  display: block;
  margin-top: 2px;
  color: #777d86;
  font-size: 12px;
}

.login-brand-message {
  position: relative;
  z-index: 1;
  max-width: 560px;
  margin: auto 0;
  padding: 80px 0 116px;
  animation: login-reveal .58s .08s ease-out both;
}

.login-brand-message p {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 28px;
  color: #676d76;
  font-size: 13px;
  font-weight: 600;
}

.login-brand-message p::before {
  content: '';
  width: 30px;
  height: 2px;
  background: #a6392e;
}

.login-brand-message h1 {
  margin: 0;
  font-family: "Songti SC", "STSong", "SimSun", serif;
  font-size: 58px;
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: 0;
}

.login-brand-principles {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
  margin-top: 34px;
  color: #555b64;
  font-size: 13px;
}

.login-brand-principles span {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}

.login-brand-principles b {
  color: #a6392e;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 10px;
  font-weight: 700;
}

.login-brand-foot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  color: #707680;
  font-size: 11px;
}

.login-brand-foot span:last-child {
  color: #92979e;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 10px;
}

.login-main {
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 72px 48px 32px;
}

.login-mobile-brand {
  display: none;
}

.login-card {
  width: min(500px, 100%);
  max-width: 500px;
  margin: 0;
  padding: 30px;
  border: 1px solid rgba(23, 25, 30, .1);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 64px rgba(23, 25, 30, .09);
  animation: login-reveal .52s .06s ease-out both;
}

.login-form-surface {
  margin-top: 22px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.login-form-head > span {
  color: #a6392e;
  font-size: 12px;
  font-weight: 700;
}

.login-form-head h2 {
  margin: 10px 0 0;
  color: #17191e;
  font-size: 30px;
  line-height: 1.25;
}

.login-mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-top: 0;
  padding: 4px;
  border: 1px solid #dedfdf;
  border-radius: 8px;
  background: #efefed;
}

.login-mode-tabs button {
  height: 38px;
  border: 0;
  border-radius: 5px;
  color: #747983;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color .16s ease, background-color .16s ease, box-shadow .16s ease;
}

.login-mode-tabs button:hover:not(.active) {
  color: #3f444c;
  background: rgba(255, 255, 255, .48);
}

.login-mode-tabs button.active {
  color: #17191e;
  background: #fff;
  box-shadow: 0 1px 3px rgba(23, 25, 30, .08);
}

.login-mode-tabs button.active::after { content: none; }

.login-fields {
  display: grid;
  gap: 18px;
  margin-top: 24px;
  animation: login-fields-in .2s ease-out both;
}

.login-field {
  display: grid;
  gap: 8px;
  color: #373b43;
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

.login-field input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #d5d7da;
  border-radius: 7px;
  outline: 0;
  color: #17191e;
  background: #fff;
  font-size: 14px;
  font-weight: 400;
  transition: border-color .16s ease, box-shadow .16s ease, background-color .16s ease;
}

.login-field input::placeholder { color: #a0a4ab; }
.login-field input:hover { border-color: #b9bdc3; }
.login-field input:focus { border-color: #9f3a31; box-shadow: 0 0 0 3px rgba(166, 57, 46, .09); }
.login-field input[aria-invalid="true"] { border-color: #c94d42; }

.password-input,
.captcha-row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
}

.password-input input { padding-right: 48px; }

.password-input button {
  position: absolute;
  top: 0;
  right: 0;
  width: 46px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 0;
  color: #737983;
  background: transparent;
  cursor: pointer;
}

.password-input button:hover { color: #30343a; }

.sms-row { gap: 10px; }

.sms-row > button,
.captcha-image-button {
  min-width: 118px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #d5d7da;
  border-radius: 7px;
  color: #272a31;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.sms-row > button:hover:not(:disabled),
.captcha-image-button:hover { border-color: #8f949c; background: #f7f7f5; }
.sms-row > button:disabled { color: #a1a5ac; background: #f0f0ee; cursor: not-allowed; }

.captcha-image-button {
  width: 118px;
  overflow: hidden;
}

.captcha-image {
  display: block;
  width: 100%;
  height: 46px;
  object-fit: contain;
}

.field-error {
  color: #b83b31;
  font-size: 12px;
  font-weight: 500;
}

.login-consent {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  margin-top: 20px;
  color: #777c84;
  font-size: 12px;
}

.login-consent input {
  width: 15px;
  height: 15px;
  margin: 0 5px 0 0;
  accent-color: #a6392e;
}

.login-consent a { color: #8f3027; }
.login-consent a:hover { text-decoration: underline; }
.consent-error { display: block; margin-top: 6px; }

.legal-state {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 22px;
  margin-top: 10px;
  color: #737983;
  font-size: 12px;
}

.legal-state.error { color: #a43b32; }
.legal-state button { padding: 0; border: 0; color: #8f3027; background: transparent; text-decoration: underline; }

.login-feedback {
  margin-top: 12px;
}

.login-feedback:empty { display: none; }

.form-error,
.form-notice {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-left: 3px solid #bd453a;
  color: #94342c;
  background: #fbf0ef;
  font-size: 12px;
}

.form-notice {
  border-left-color: #168455;
  color: #176944;
  background: #edf8f2;
}

.login-submit {
  width: 100%;
  height: 48px;
  margin-top: 18px;
  border-radius: 7px;
  color: #fff;
  background: #17191e;
  box-shadow: none;
  font-size: 14px;
  transition: background-color .16s ease, transform .16s ease;
}

.login-feedback:not(:empty) + .login-submit { margin-top: 4px; }

.login-submit:hover:not(:disabled) { background: #2b2e35; transform: translateY(-1px); }
.login-submit:active:not(:disabled) { transform: translateY(0); }
.login-submit:disabled { background: #a7a9ad; cursor: not-allowed; }

.login-secondary-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #ececeb;
  color: #767b84;
  font-size: 12px;
}

.login-register-entry,
.login-help-entry {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: auto;
  margin: 0;
  justify-content: flex-start;
}

.login-register-entry a,
.login-help-entry { color: #8f3027; font-weight: 600; }

.login-foot {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  gap: 8px 18px;
  width: 100%;
  margin-top: auto;
  padding: 28px 0 0;
  color: #92969d;
  font-size: 11px;
}

.login-foot a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.login-foot a:hover { color: #565b63; }
.login-police-record img { width: 15px; height: 15px; object-fit: contain; }

.login-mode-tabs button:focus-visible,
.password-input button:focus-visible,
.sms-row > button:focus-visible,
.captcha-image-button:focus-visible,
.login-submit:focus-visible,
.login-secondary-actions a:focus-visible,
.login-foot a:focus-visible {
  outline: 2px solid #a6392e;
  outline-offset: 2px;
}

.spin { animation: login-spin .8s linear infinite; }
@keyframes login-spin { to { transform: rotate(360deg); } }
@keyframes login-reveal {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes login-fields-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .login-brand-lockup,
  .login-brand-message,
  .login-card,
  .login-fields { animation: none; }
  .login-submit { transition: none; }
}

@media (max-width: 980px) {
  .login-page {
    grid-template-columns: minmax(0, 1fr);
    background: #f6f6f4;
  }
  .login-brand-panel { display: none; }

  .login-main {
    min-height: 100dvh;
    justify-content: flex-start;
    padding: 28px 22px 40px;
  }

  .login-mobile-brand {
    display: flex;
    width: min(420px, 100%);
    margin: 0 auto 30px;
  }

  .login-mobile-brand > div:last-child span { color: #81868e; }
  .login-card {
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  .login-form-surface {
    padding: 24px;
    border: 1px solid #dedfdf;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 14px 38px rgba(23, 25, 30, .07);
  }
  .login-secondary-actions {
    padding-top: 0;
    border-top: 0;
  }
}

@media (min-width: 981px) and (max-width: 1200px) {
  .login-page { grid-template-columns: minmax(500px, 1.15fr) minmax(480px, .95fr); }
  .login-brand-panel { padding: 42px 46px 38px; }
  .login-brand-panel::before { left: 46px; right: 46px; }
  .login-brand-watermark { right: 28px; font-size: 78px; }
  .login-brand-message { padding-bottom: 106px; }
  .login-brand-message h1 { font-size: 50px; }
  .login-main { padding: 64px 34px 28px; }
}

@media (max-width: 560px) {
  .login-main { padding: 22px 18px 28px; }
  .login-mobile-brand { margin-bottom: 22px; }
  .login-form-head h2 { font-size: 27px; }
  .login-form-surface { margin-top: 18px; padding: 18px; }
  .login-secondary-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    font-size: 11px;
  }
  .login-register-entry { min-width: 0; flex-wrap: wrap; }
  .login-help-entry { justify-content: flex-end; white-space: nowrap; }
  .login-foot { justify-content: center; margin-top: 30px; }
}

@media (max-width: 380px) {
  .sms-row { grid-template-columns: minmax(0, 1fr); }
  .sms-row > button { width: 100%; }
  .login-secondary-actions { grid-template-columns: minmax(0, 1fr); }
  .login-help-entry { justify-content: flex-start; }
}
</style>
