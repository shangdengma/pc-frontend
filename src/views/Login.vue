<template>
  <div class="login-page">
    <!-- 左侧品牌区 -->
    <section class="login-brand">
      <div class="brand-logo">
        <img :src="logo" alt="钟馗背调" />
        <span>钟馗背调</span>
      </div>
      <div class="brand-copy">
        <h1>企业雇前背调平台</h1>
        <p>合规 · 可追溯 · 高效的雇前背景调查服务，让用人决策更有依据。</p>
      </div>
      <div class="brand-foot">
        <div class="brand-company">河南钟馗科技有限公司</div>
        <div class="brand-records">
          <span>© {{ year }} 钟馗背调 All Rights Reserved</span>
          <span>豫ICP备2025138155号</span>
        </div>
        <div class="brand-security">
          <img :src="gaIcon" alt="" />
          <span>豫公网安备 41010502000000号</span>
        </div>
      </div>
    </section>

    <!-- 右侧表单区 -->
    <section class="login-form-wrap">
      <div class="login-card">
        <div class="login-tabs">
          <button class="login-tab" :class="{ active: tab === 'password' }" @click="switchMode('password')">密码登录</button>
          <button class="login-tab" :class="{ active: tab === 'sms' }" @click="switchMode('sms')">短信登录</button>
        </div>

        <div class="login-form-shell">
          <!-- 密码登录 -->
          <form v-if="tab === 'password'" class="login-form" @submit.prevent="onPasswordLogin">
            <label class="field">
              <span class="field-label">账号或手机号</span>
              <input
                v-model.trim="form.username"
                class="field-input"
                :class="{ invalid: errors.username }"
                type="text"
                autocomplete="username"
                placeholder="请输入账号或手机号"
              />
              <span v-if="errors.username" class="field-err">{{ errors.username }}</span>
            </label>
            <label class="field">
              <span class="field-label">密码</span>
              <PasswordInput v-model="form.password" :invalid="!!errors.password" autocomplete="current-password" placeholder="请输入密码" />
              <span v-if="errors.password" class="field-err">{{ errors.password }}</span>
            </label>
            <label class="agreement-row">
              <input v-model="loginAgreed" type="checkbox" />
              <span class="agreement-box"></span>
              <span class="agreement-text">
                我已阅读并同意
                <router-link to="/user-agreement" target="_blank" @click.stop>《用户协议》</router-link>
                和
                <router-link to="/privacy-policy" target="_blank" @click.stop>《隐私政策》</router-link>
              </span>
            </label>
            <span v-if="errors.agreement" class="field-err agreement-error">{{ errors.agreement }}</span>
            <button class="btn-primary login-submit" type="submit" :disabled="loading">
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </form>

          <!-- 短信登录 -->
          <form v-else class="login-form" @submit.prevent="onSmsLogin">
            <label class="field">
              <span class="field-label">手机号</span>
              <input
                v-model.trim="sms.phone"
                class="field-input"
                :class="{ invalid: errors.smsPhone }"
                type="tel"
                maxlength="11"
                placeholder="请输入手机号"
              />
              <span v-if="errors.smsPhone" class="field-err">{{ errors.smsPhone }}</span>
            </label>
            <label class="field code-field">
              <span class="field-label">短信验证码</span>
              <div class="code-row">
                <input
                  v-model="sms.code"
                  class="field-input"
                  :class="{ invalid: errors.smsCode }"
                  type="text"
                  maxlength="6"
                  placeholder="请输入验证码"
                />
                <button type="button" class="btn-mini code-btn" :disabled="counting || sendingCode" @click="sendCode">
                  {{ sendingCode ? '发送中...' : counting ? `${countLeft}s 后重发` : '获取验证码' }}
                </button>
              </div>
              <span v-if="errors.smsCode" class="field-err">{{ errors.smsCode }}</span>
            </label>
            <label class="agreement-row">
              <input v-model="loginAgreed" type="checkbox" />
              <span class="agreement-box"></span>
              <span class="agreement-text">
                我已阅读并同意
                <router-link to="/user-agreement" target="_blank" @click.stop>《用户协议》</router-link>
                和
                <router-link to="/privacy-policy" target="_blank" @click.stop>《隐私政策》</router-link>
              </span>
            </label>
            <span v-if="errors.agreement" class="field-err agreement-error">{{ errors.agreement }}</span>
            <button class="btn-primary login-submit" type="submit" :disabled="loading">
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </form>
        </div>

        <div class="login-extra">
          <router-link to="/register" class="link">没有账号？立即注册</router-link>
          <div class="login-forgot-extra">
            <a v-if="tab === 'password'" class="link-sm">忘记密码？</a>
          </div>
        </div>
      </div>
    </section>
    <SmsSliderVerify v-model="sliderOpen" :phone="sms.phone" scene="login" @verified="sendCodeWithTicket" />
  </div>
</template>

<script setup>
import { reactive, ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { login, smsLogin, sendLoginCode, getInfo } from '../api/auth'
import { setToken, setUser } from '../utils/auth'
import PasswordInput from '../components/PasswordInput.vue'
import SmsSliderVerify from '../components/SmsSliderVerify.vue'
import gaIcon from '../assets/ga.png'
import logo from '../assets/brand-logo.png'

const router = useRouter()
const year = new Date().getFullYear()

const tab = ref('password')
const loading = ref(false)
const errors = reactive({})

const form = ref({ username: '', password: '' })

const sms = ref({ phone: '', code: '' })
const loginAgreed = ref(false)
const sliderOpen = ref(false)
const sendingCode = ref(false)
const counting = ref(false)
const countLeft = ref(60)
let timer = null

function switchMode(mode) {
  if (mode === 'sms' && isValidPhone(form.value.username)) {
    sms.value.phone = form.value.username
  }
  if (mode === 'password' && isValidPhone(sms.value.phone) && !form.value.username) {
    form.value.username = sms.value.phone
  }
  tab.value = mode
  clearErrors()
}

function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

function clearErrors() {
  Object.keys(errors).forEach(key => delete errors[key])
}

function setFieldError(field, message) {
  errors[field] = message
  return message
}

function startCount() {
  if (timer) clearInterval(timer)
  counting.value = true
  countLeft.value = 60
  timer = setInterval(() => {
    countLeft.value -= 1
    if (countLeft.value <= 0) {
      counting.value = false
      clearInterval(timer)
    }
  }, 1000)
}

function sendCode() {
  clearErrors()
  if (!sms.value.phone) {
    setFieldError('smsPhone', '请输入手机号')
    return
  }
  if (!isValidPhone(sms.value.phone)) {
    setFieldError('smsPhone', '请输入正确的手机号')
    return
  }
  sliderOpen.value = true
}

async function sendCodeWithTicket(sliderTicket) {
  sendingCode.value = true
  try {
    const res = await sendLoginCode(sms.value.phone, sliderTicket)
    if (import.meta.env.DEV && res?.data && !sms.value.code) {
      sms.value.code = String(res.data)
    }
    startCount()
  } catch (e) {
    setFieldError('smsCode', e?.msg || '验证码发送失败')
  } finally {
    sendingCode.value = false
  }
}

async function finishLogin(res, fallbackName) {
  setToken(res.token)
  try {
    const info = await getInfo()
    setUser(info.user || {})
  } catch (e) {
    setUser({ userName: fallbackName })
  }
  router.replace('/dashboard')
}

async function onPasswordLogin() {
  clearErrors()
  if (!form.value.username) {
    setFieldError('username', '请输入账号或手机号')
    return
  }
  if (!form.value.password) {
    setFieldError('password', '请输入密码')
    return
  }
  if (!loginAgreed.value) {
    setFieldError('agreement', '请先阅读并同意用户协议和隐私政策!')
    return
  }
  loading.value = true
  try {
    const res = await login(form.value.username, form.value.password, '', '', 'pc-web')
    await finishLogin(res, form.value.username)
  } catch (e) {
    setFieldError('password', e?.msg || '登录失败，请检查登录信息')
  } finally {
    loading.value = false
  }
}

async function onSmsLogin() {
  clearErrors()
  if (!sms.value.phone) {
    setFieldError('smsPhone', '请输入手机号')
    return
  }
  if (!isValidPhone(sms.value.phone)) {
    setFieldError('smsPhone', '请输入正确的手机号')
    return
  }
  if (!sms.value.code) {
    setFieldError('smsCode', '请输入短信验证码')
    return
  }
  if (!loginAgreed.value) {
    setFieldError('agreement', '请先阅读并同意用户协议和隐私政策!')
    return
  }
  loading.value = true
  try {
    const res = await smsLogin(sms.value.phone, sms.value.code, 'web')
    await finishLogin(res, sms.value.phone)
  } catch (e) {
    setFieldError('smsCode', e?.msg || '登录失败，请检查登录信息')
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.login-page{display:flex;height:100vh;background:var(--bg)}
.login-brand{flex:0 0 46%;background:linear-gradient(180deg,rgba(40,46,54,.68),rgba(18,25,36,.84)),url('../assets/bg1.png') center/cover no-repeat;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:48px 56px;position:relative}
.brand-logo{display:flex;align-items:center;gap:12px}
.brand-logo img{width:34px;height:34px;object-fit:contain;filter:brightness(0) invert(1)}
.brand-logo span{font-size:22px;font-weight:700;letter-spacing:2px}
.brand-copy h1{font-size:30px;font-weight:700;letter-spacing:1px;margin-bottom:16px}
.brand-copy p{font-size:15px;line-height:1.7;color:rgba(255,255,255,.76);max-width:340px}
.brand-foot{display:flex;flex-direction:column;gap:8px;font-size:12px;color:rgba(255,255,255,.58);line-height:1.35}
.brand-company{font-size:13px;color:rgba(255,255,255,.78);font-weight:600}
.brand-records{display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px}
.brand-records span + span{position:relative}
.brand-records span + span::before{content:"";position:absolute;left:-7px;top:50%;width:1px;height:10px;background:rgba(255,255,255,.24);transform:translateY(-50%)}
.brand-security{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.48)}
.brand-security img{width:14px;height:14px;object-fit:contain;opacity:.72}
.login-form-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:24px;background:#fff}
.login-card{width:100%;max-width:380px;min-height:360px;background:transparent;border:0;padding:0;display:flex;flex-direction:column}
.login-tabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:28px}
.login-tab{flex:1;padding:12px 0;font-size:15px;font-weight:600;color:var(--text2);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;font-family:inherit}
.login-tab.active{color:var(--primary);border-bottom-color:var(--primary)}
.login-form-shell{min-height:252px}
.field{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
.field-label{font-size:13px;font-weight:600;color:var(--text1)}
.field-input{height:44px;border:1px solid var(--border);background:#fff;padding:0 14px;font-size:14px;color:var(--text1);outline:none;font-family:inherit}
.field-input:focus{border-color:var(--primary)}
.field-input.invalid{border-color:var(--error)}
.field-err{font-size:12px;color:var(--error);line-height:1.4}
.code-row{display:flex;gap:10px}
.code-row .field-input{flex:1}
.code-btn{height:44px;width:120px}
.agreement-row{display:flex;align-items:flex-start;gap:9px;margin:2px 0 16px;color:var(--text2);font-size:12px;line-height:1.55;cursor:pointer;user-select:none}
.agreement-row input{position:absolute;opacity:0;pointer-events:none}
.agreement-box{width:15px;height:15px;flex:0 0 15px;margin-top:2px;border:1px solid #C9D7EE;background:#fff;display:flex;align-items:center;justify-content:center}
.agreement-row input:checked + .agreement-box{border-color:var(--primary);background:var(--primary)}
.agreement-row input:checked + .agreement-box::after{content:"";width:7px;height:4px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg) translate(1px,-1px)}
.agreement-text{flex:1;min-width:0}
.agreement-text a{color:var(--primary);font-weight:600;text-decoration:none}
.agreement-text a:hover{text-decoration:underline;text-underline-offset:3px}
.agreement-error{display:block;margin:-10px 0 14px 24px}
.login-submit{width:100%;height:46px;justify-content:center;margin-top:4px}
.link-sm{font-size:13px;color:var(--primary);cursor:pointer;text-decoration:none}.link-sm:hover{opacity:.8}
.login-extra{margin-top:20px;text-align:center}
.login-forgot-extra{height:22px;margin-top:8px;line-height:22px}
.link{font-size:13px;color:var(--primary);text-decoration:none;font-weight:500}
.link:hover{opacity:.8}
.dev-hint{font-size:12px;color:var(--warning);margin-top:6px}
@media (max-width:880px){
  .login-page{display:block;height:100dvh;min-height:0;overflow-y:auto;background:#fff;-webkit-overflow-scrolling:touch}
  .login-brand{flex:none;min-height:214px;padding:24px 22px 20px;gap:22px;justify-content:flex-start}
  .brand-logo img{width:32px;height:32px}
  .brand-logo span{font-size:20px}
  .brand-copy h1{font-size:25px;margin-bottom:10px}
  .brand-copy p{max-width:none;font-size:13px;line-height:1.65}
  .brand-foot{gap:6px;font-size:11px}
  .brand-company{font-size:12px}
  .login-form-wrap{display:block;padding:30px 22px 36px;background:#fff}
  .login-card{max-width:420px;min-height:0;margin:0 auto}
  .login-tabs{margin-bottom:24px}
  .login-form-shell{min-height:0}
  .field-input{font-size:16px}
}
@media (max-width:520px){
  .login-brand{min-height:198px;padding:22px 18px 18px;gap:18px}
  .brand-logo{gap:10px}
  .brand-logo img{width:30px;height:30px}
  .brand-logo span{font-size:19px}
  .brand-copy h1{font-size:23px}
  .brand-copy p{font-size:12.5px}
  .brand-records{gap:6px 12px}
  .brand-security img{width:13px;height:13px}
  .login-form-wrap{padding:26px 18px 32px}
  .login-tab{font-size:14px}
  .field{margin-bottom:18px}
  .code-row{gap:8px}
  .code-btn{width:108px;font-size:12px}
  .agreement-row{font-size:11.5px;line-height:1.6}
  .agreement-error{margin-left:24px}
}
@media (max-width:380px){
  .login-brand{min-height:184px}
  .code-row{display:grid;grid-template-columns:1fr;gap:8px}
  .code-btn{width:100%}
}
@media (max-width:880px) and (max-height:680px){
  .login-brand{min-height:auto;padding:18px 22px;gap:14px}
  .brand-copy p{display:none}
  .brand-foot{display:none}
}
</style>
