<template>
  <div class="register-page">
    <section class="reg-brand">
      <router-link to="/login" class="reg-brand-logo">
        <img :src="logo" alt="钟馗背调" /><span>钟馗背调</span>
      </router-link>
      <div class="reg-brand-copy">
        <h1>注册企业账号</h1><p>完成注册即可使用全部雇前背调服务</p>
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
    <section class="reg-form-wrap">
      <div class="reg-card">
        <h2 class="reg-form-title">创建账号</h2>
        <div v-if="success" class="success-box">
          <div class="success-icon">✓</div>
          <div class="success-title">注册成功</div>
          <div class="success-desc">{{ successMessage }}</div>
        </div>
        <form v-else @submit.prevent="onSubmit">
          <label class="field">
            <span class="field-label">账号</span>
            <input v-model.trim="form.account" class="field-input" :class="{ invalid: errors.account }" type="text" autocomplete="username" placeholder="请输入账号，6位以上英文加数字" />
            <span v-if="errors.account" class="field-err">{{ errors.account }}</span>
          </label>
          <label class="field">
            <span class="field-label">密码</span>
            <PasswordInput v-model="form.password" :invalid="!!errors.password" autocomplete="new-password" placeholder="8 位以上字母+数字" />
            <span v-if="errors.password" class="field-err">{{ errors.password }}</span>
          </label>
          <label class="field">
            <span class="field-label">企业名称</span>
            <input v-model="form.enterpriseName" class="field-input" :class="{ invalid: errors.enterpriseName }" type="text" placeholder="请输入企业全称" />
            <span v-if="errors.enterpriseName" class="field-err">{{ errors.enterpriseName }}</span>
          </label>
          <label class="field">
            <span class="field-label">手机号</span>
            <input v-model.trim="form.phone" class="field-input" :class="{ invalid: errors.phone }" type="tel" maxlength="11" placeholder="用于接收验证码" />
            <span v-if="errors.phone" class="field-err">{{ errors.phone }}</span>
          </label>
          <label class="field">
            <span class="field-label">短信验证码</span>
            <div class="code-row">
              <input v-model="form.code" class="field-input" :class="{ invalid: errors.code }" type="text" maxlength="6" placeholder="请输入验证码" />
              <button type="button" class="btn-mini code-btn" :disabled="counting || sendingCode" @click="sendCode">
                {{ sendingCode ? '发送中...' : counting ? `${countLeft}s 后重发` : '获取验证码' }}
              </button>
            </div>
            <span v-if="errors.code" class="field-err">{{ errors.code }}</span>
          </label>
          <label class="field">
            <span class="field-label">邀请码 <span class="optional">(选填)</span></span>
            <input v-model="form.inviteCode" class="field-input" type="text" placeholder="若有邀请码请填写" :disabled="!!lockedInvite" />
          </label>
          <label class="agreement-row">
            <input v-model="registerAgreed" type="checkbox" />
            <span class="agreement-box"></span>
            <span class="agreement-text">
              我已阅读并同意
              <router-link to="/user-agreement" target="_blank" @click.stop>《用户协议》</router-link>
              和
              <router-link to="/privacy-policy" target="_blank" @click.stop>《隐私政策》</router-link>
            </span>
          </label>
          <span v-if="errors.agreement" class="field-err agreement-error">{{ errors.agreement }}</span>
          <button class="btn-primary reg-submit" type="submit" :disabled="submitting">
            {{ submitting ? '注册中...' : '注册' }}
          </button>
        </form>
        <div class="reg-extra" v-if="!success">已有账号？<router-link to="/login" class="link">返回登录</router-link></div>
      </div>
    </section>
    <SmsSliderVerify v-model="sliderOpen" :phone="form.phone" scene="register" @verified="sendCodeWithTicket" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sendRegisterCode, register } from '../api/auth'
import PasswordInput from '../components/PasswordInput.vue'
import SmsSliderVerify from '../components/SmsSliderVerify.vue'
import gaIcon from '../assets/ga.png'
import logo from '../assets/brand-logo.png'

const route = useRoute()
const router = useRouter()
const year = new Date().getFullYear()

const form = ref({ account: '', enterpriseName: '', phone: '', password: '', code: '', inviteCode: '' })
const lockedInvite = ref('')
const sliderOpen = ref(false)
const errors = reactive({})
const successMessage = ref('')
const registerAgreed = ref(false)
const submitting = ref(false)
const success = ref(false)
const sendingCode = ref(false)
const counting = ref(false)
const countLeft = ref(60)
let timer = null

onMounted(() => {
  const code = route.query.invitecode || route.query.inviteCode
  if (code) { form.value.inviteCode = code; lockedInvite.value = code }
})

function clearErrors() {
  Object.keys(errors).forEach(k => delete errors[k])
}

function setFieldError(field, message) {
  errors[field] = message
  return message
}

function validateAccount() {
  if (!form.value.account) return setFieldError('account', '请输入账号')
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(form.value.account)) {
    return setFieldError('account', '账号需6位以上，且同时包含英文和数字')
  }
  return ''
}

function validatePhone() {
  if (!form.value.phone) return setFieldError('phone', '请输入手机号')
  if (!/^1[3-9]\d{9}$/.test(form.value.phone)) return setFieldError('phone', '手机号格式不正确')
  return ''
}

function validateForm() {
  clearErrors()
  const accountError = validateAccount()
  if (accountError) return accountError
  if (!form.value.password) return setFieldError('password', '请设置密码')
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(form.value.password)) {
    return setFieldError('password', '密码需8位以上，且同时包含数字和字母')
  }
  if (!form.value.enterpriseName) return setFieldError('enterpriseName', '请输入企业名称')
  if (form.value.enterpriseName.length > 200) return setFieldError('enterpriseName', '企业名称长度不能超过200个字符')
  const phoneError = validatePhone()
  if (phoneError) return phoneError
  if (!form.value.code) return setFieldError('code', '请输入短信验证码')
  if (!registerAgreed.value) return setFieldError('agreement', '请先阅读并同意用户协议和隐私政策')
  return ''
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
  if (counting.value || sendingCode.value) return
  const phoneError = validatePhone()
  if (phoneError) return
  sliderOpen.value = true
}

async function sendCodeWithTicket(sliderTicket) {
  sendingCode.value = true
  try {
    await sendRegisterCode(form.value.phone, sliderTicket)
    startCount()
  } catch (e) {
    setFieldError('code', e?.msg || e?.message || '验证码发送失败，请稍后重试')
  } finally {
    sendingCode.value = false
  }
}

async function onSubmit() {
  const formError = validateForm()
  if (formError) return
  submitting.value = true
  try {
    const res = await register({
      account: form.value.account,
      enterpriseName: form.value.enterpriseName.trim(),
      phone: form.value.phone,
      password: form.value.password,
      smsCode: form.value.code,
      inviteCode: form.value.inviteCode
    })
    const gift = res?.data?.giftAmount
    successMessage.value = gift && String(gift) !== '0' && String(gift) !== '0.0'
      ? `注册成功，获得 ${gift} 元赠送余额`
      : '注册成功，即将前往登录'
    success.value = true
    setTimeout(() => router.replace('/login'), 1200)
  } catch (e) {
    setFieldError('account', e?.msg || e?.message || '注册失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.register-page{display:flex;height:100vh;background:var(--bg)}
.reg-brand{flex:0 0 46%;background:linear-gradient(180deg,rgba(40,46,54,.68),rgba(18,25,36,.84)),url('../assets/bg1.png') center/cover no-repeat;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:48px 56px}
.reg-brand-logo{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none}
.reg-brand-logo img{width:34px;height:34px;object-fit:contain;filter:brightness(0) invert(1)}
.reg-brand-logo span{font-size:22px;font-weight:700;letter-spacing:2px}
.reg-brand-copy h1{font-size:28px;font-weight:700;margin-bottom:12px}
.reg-brand-copy p{font-size:15px;color:rgba(255,255,255,.76);line-height:1.6}
.brand-foot{display:flex;flex-direction:column;gap:8px;font-size:12px;color:rgba(255,255,255,.58);line-height:1.35}
.brand-company{font-size:13px;color:rgba(255,255,255,.78);font-weight:600}
.brand-records{display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px}
.brand-records span + span{position:relative}
.brand-records span + span::before{content:"";position:absolute;left:-7px;top:50%;width:1px;height:10px;background:rgba(255,255,255,.24);transform:translateY(-50%)}
.brand-security{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.48)}
.brand-security img{width:14px;height:14px;object-fit:contain;opacity:.72}
.reg-form-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;background:#fff}
.reg-card{width:100%;max-width:460px;background:transparent;border:0;padding:0;max-height:none;overflow:visible}
.reg-form-title{font-size:19px;font-weight:700;margin-bottom:24px}
.success-box{text-align:center;padding:32px 0}.success-icon{width:56px;height:56px;border-radius:50%;background:var(--success);color:#fff;font-size:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}.success-title{font-size:18px;font-weight:700;margin-bottom:8px}.success-desc{font-size:14px;color:var(--text2)}
.field{margin-bottom:14px;display:flex;flex-direction:column;gap:6px}.field-label{font-size:13px;font-weight:600;color:var(--text1)}.optional{color:var(--text3);font-weight:400}
.field-input{height:44px;border:1px solid var(--border);padding:0 14px;font-size:14px;color:var(--text1);outline:none;font-family:inherit}.field-input:focus{border-color:var(--primary)}.field-input.invalid{border-color:var(--error)}
.field-err{font-size:12px;color:var(--error);line-height:1.4}
.code-row{display:flex;gap:10px}.code-row .field-input{flex:1}.code-btn{height:44px;width:110px}
.agreement-row{display:flex;align-items:flex-start;gap:9px;margin:2px 0 16px;color:var(--text2);font-size:12px;line-height:1.55;cursor:pointer;user-select:none}
.agreement-row input{position:absolute;opacity:0;pointer-events:none}
.agreement-box{width:15px;height:15px;flex:0 0 15px;margin-top:2px;border:1px solid #C9D7EE;background:#fff;display:flex;align-items:center;justify-content:center}
.agreement-row input:checked + .agreement-box{border-color:var(--primary);background:var(--primary)}
.agreement-row input:checked + .agreement-box::after{content:"";width:7px;height:4px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg) translate(1px,-1px)}
.agreement-text{flex:1;min-width:0}
.agreement-text a{color:var(--primary);font-weight:600;text-decoration:none}
.agreement-text a:hover{text-decoration:underline;text-underline-offset:3px}
.agreement-error{display:block;margin:-10px 0 14px 24px}
.reg-submit{width:100%;height:46px;justify-content:center;margin-top:4px}
.reg-extra{margin-top:20px;text-align:center;font-size:13px;color:var(--text2)}.link{color:var(--primary);font-weight:500;text-decoration:none}
@media (max-width:880px){
  .register-page{display:block;height:100dvh;min-height:0;overflow-y:auto;background:#fff;-webkit-overflow-scrolling:touch}
  .reg-brand{flex:none;min-height:198px;padding:24px 22px 20px;gap:22px;justify-content:flex-start}
  .reg-brand-logo img{width:32px;height:32px}
  .reg-brand-logo span{font-size:20px}
  .reg-brand-copy h1{font-size:25px;margin-bottom:10px}
  .reg-brand-copy p{font-size:13px;line-height:1.65}
  .brand-foot{gap:6px;font-size:11px}
  .brand-company{font-size:12px}
  .reg-form-wrap{display:block;padding:28px 22px 36px;overflow:visible;background:#fff}
  .reg-card{max-width:460px;margin:0 auto}
  .reg-form-title{font-size:18px;margin-bottom:22px}
  .field-input{font-size:16px}
}
@media (max-width:520px){
  .reg-brand{min-height:184px;padding:22px 18px 18px;gap:18px}
  .reg-brand-logo{gap:10px}
  .reg-brand-logo img{width:30px;height:30px}
  .reg-brand-logo span{font-size:19px}
  .reg-brand-copy h1{font-size:23px}
  .reg-brand-copy p{font-size:12.5px}
  .brand-records{gap:6px 12px}
  .brand-security img{width:13px;height:13px}
  .reg-form-wrap{padding:24px 18px 32px}
  .reg-form-title{margin-bottom:20px}
  .field{margin-bottom:13px}
  .code-row{gap:8px}
  .code-btn{width:108px;font-size:12px}
  .agreement-row{font-size:11.5px;line-height:1.6}
  .agreement-error{margin-left:24px}
}
@media (max-width:380px){
  .reg-brand{min-height:172px}
  .code-row{display:grid;grid-template-columns:1fr;gap:8px}
  .code-btn{width:100%}
}
@media (max-width:880px) and (max-height:680px){
  .reg-brand{min-height:auto;padding:18px 22px;gap:14px}
  .reg-brand-copy p{display:none}
  .brand-foot{display:none}
}
</style>
