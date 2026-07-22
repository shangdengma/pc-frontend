<template>
  <div class="login-page">
    <section class="login-hero">
      <div class="brand-row">
        <div class="brand-mark">钟</div>
        <div>
          <div class="brand-title">钟馗背调</div>
          <div class="brand-sub">企业版客户工作台</div>
        </div>
      </div>
      <h1>背调查询、授权进度、报告交付集中管理。</h1>
      <p>面向企业 HR 与风控团队的一站式雇前背景调查平台，合规、高效、可追溯。</p>
      <ul class="hero-points">
        <li><Check :size="16" :stroke-width="2.5" />候选人电子签授权，全程合规留痕</li>
        <li><Check :size="16" :stroke-width="2.5" />多维度数据核验，报告分钟级交付</li>
        <li><Check :size="16" :stroke-width="2.5" />子账号协作与额度管理，团队共用一个工作台</li>
      </ul>
    </section>

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

      <div v-if="error" class="form-error">{{ error }}</div>
      <div v-if="notice" class="form-notice">{{ notice }}</div>
      <button class="primary-btn" type="submit" :disabled="loading">{{ loading ? '登录中...' : '进入工作台' }}</button>
      <div class="login-register-entry">
        <span>没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
    </form>

    <SmsSliderVerify
      v-model="sliderOpen"
      :phone="smsForm.phone"
      scene="login"
      @verified="sendCodeWithTicket"
    />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check } from '@lucide/vue'
import SmsSliderVerify from '../components/SmsSliderVerify.vue'
import { getInfo, login, sendLoginCode, smsLogin } from '../api/auth'
import { setToken, setUser } from '../utils/auth'

const router = useRouter()
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const error = ref('')
const notice = ref('')
const sliderOpen = ref(false)
const loginMode = ref('password')
const form = reactive({ username: '', password: '' })
const smsForm = reactive({ phone: '', code: '' })
let countdownTimer = null

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

async function handlePasswordLogin() {
  if (!form.username) return (error.value = '请输入账号或手机号')
  if (!form.password) return (error.value = '请输入密码')
  const res = await login(form.username, form.password, '', '', 'pc-web')
  await finishLogin(res, form.username)
}

async function handleSmsLogin() {
  if (!smsForm.phone) return (error.value = '请输入手机号')
  if (!/^1[3-9]\d{9}$/.test(smsForm.phone)) return (error.value = '请输入正确的手机号')
  const res = await smsLogin(smsForm.phone, smsForm.code, 'web')
  await finishLogin(res, smsForm.phone)
}

async function handleLogin() {
  error.value = ''
  notice.value = ''
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
</script>
