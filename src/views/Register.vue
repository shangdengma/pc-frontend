<template>
  <div class="login-page register-page">
    <section class="login-hero register-hero">
      <div class="brand-row">
        <div class="brand-mark">钟</div>
        <div>
          <div class="brand-title">钟馗背调</div>
          <div class="brand-sub">企业版客户工作台</div>
        </div>
      </div>
      <h1>开通企业账号，开始集中管理背调查询。</h1>
    </section>

    <form class="login-card register-card" @submit.prevent="handleRegister">
      <h2>注册账号</h2>
      <p class="register-subtitle">请填写账户信息完成注册。</p>

      <label>
        <span>账号</span>
        <input v-model.trim="form.account" placeholder="请输入账号，6位以上英文加数字" autocomplete="username">
      </label>

      <label>
        <span>密码</span>
        <div class="password-row">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="8位以上，包含字母和数字"
            autocomplete="new-password"
          >
          <button type="button" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '显示' }}</button>
        </div>
      </label>

      <label>
        <span>企业名称 <em>选填</em></span>
        <input v-model.trim="form.enterpriseName" placeholder="请输入企业名称">
      </label>

      <label>
        <span>手机号</span>
        <input v-model.trim="form.phone" placeholder="请输入手机号" maxlength="11" inputmode="numeric" autocomplete="tel">
      </label>

      <label>
        <span>短信验证码</span>
        <div class="captcha-row sms-row">
          <input v-model.trim="form.code" placeholder="请输入短信验证码" maxlength="6" inputmode="numeric">
          <button type="button" :disabled="countdown > 0 || sendingCode" @click="sendCode">
            {{ codeButtonText }}
          </button>
        </div>
      </label>

      <label>
        <span>邀请码 <em>选填</em></span>
        <input
          v-model.trim="form.inviteCode"
          :disabled="inviteCodeLocked"
          :placeholder="inviteCodeLocked ? '已绑定邀请码' : '请输入邀请码'"
        >
      </label>

      <div v-if="message" class="form-success">{{ message }}</div>
      <div v-if="error" class="form-error">{{ error }}</div>

      <button class="primary-btn" type="submit" :disabled="loading">
        {{ loading ? '注册中...' : '立即注册' }}
      </button>

      <p class="login-tip">
        已有账号？<router-link to="/login">返回登录</router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { register, sendRegisterCode } from '../api/auth'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const sendingCode = ref(false)
const showPassword = ref(false)
const error = ref('')
const message = ref('')
const countdown = ref(0)
const inviteCodeLocked = ref(false)
let timer = null

const form = reactive({
  account: '',
  enterpriseName: '',
  phone: '',
  password: '',
  code: '',
  inviteCode: ''
})

const codeButtonText = computed(() => {
  if (sendingCode.value) return '发送中...'
  if (countdown.value > 0) return `${countdown.value}s 后重发`
  return '获取验证码'
})


function validateAccount() {
  if (!form.account) return '请输入账号'
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(form.account)) {
    return '账号需6位以上，且同时包含英文和数字'
  }
  return ''
}
function validatePhone() {
  if (!form.phone) return '请输入手机号'
  if (!/^1[3-9]\d{9}$/.test(form.phone)) return '手机号格式不正确'
  return ''
}

function validateForm() {
  const accountError = validateAccount()
  if (accountError) return accountError
  if (!form.password) return '请设置密码'
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(form.password)) {
    return '密码需8位以上，且同时包含数字和字母'
  }
  const phoneError = validatePhone()
  if (phoneError) return phoneError
  return ''
}

function startCountdown() {
  countdown.value = 60
  timer = window.setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1
      return
    }
    clearTimer()
  }, 1000)
}

function clearTimer() {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
}

async function sendCode() {
  error.value = ''
  message.value = ''
  if (countdown.value > 0 || sendingCode.value) return
  const phoneError = validatePhone()
  if (phoneError) {
    error.value = phoneError
    return
  }

  sendingCode.value = true
  try {
    await sendRegisterCode(form.phone)
    message.value = '验证码已发送，请注意查收'
    startCountdown()
  } catch (err) {
    error.value = err?.msg || err?.message || '验证码发送失败，请稍后重试'
  } finally {
    sendingCode.value = false
  }
}

async function handleRegister() {
  error.value = ''
  message.value = ''
  const formError = validateForm()
  if (formError) {
    error.value = formError
    return
  }

  loading.value = true
  try {
    const res = await register({
      account: form.account,
      enterpriseName: form.enterpriseName.trim(),
      phone: form.phone,
      password: form.password,
      smsCode: form.code,
      inviteCode: form.inviteCode
    })

    const gift = res?.data?.giftAmount
    message.value = gift && String(gift) !== '0' && String(gift) !== '0.0'
      ? `注册成功，获得 ${gift} 元赠送余额`
      : '注册成功，即将前往登录'

    window.setTimeout(() => {
      router.replace('/login')
    }, 1200)
  } catch (err) {
    error.value = err?.msg || err?.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const inviteCode = route.query.invitecode || route.query.inviteCode || ''
  if (inviteCode) {
    form.inviteCode = String(inviteCode)
    inviteCodeLocked.value = true
  }
})

onBeforeUnmount(clearTimer)
</script>
