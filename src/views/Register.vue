<template>
  <div class="login-page register-page">
    <!-- 与登录页一致：单列居中，品牌收成一行 -->
    <div class="login-brand">
      <div class="brand-seal" aria-hidden="true"><span>钟馗</span></div>
      <div class="brand-names">
        <span class="brand-title">钟馗背调</span>
        <span class="brand-sub">企业版工作台</span>
      </div>
    </div>

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
        <span>企业名称</span>
        <input
          v-model.trim="form.enterpriseName"
          placeholder="请输入营业执照上的完整企业名称"
          maxlength="100"
          autocomplete="organization"
          required
        >
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

    <SmsSliderVerify
      v-model="sliderOpen"
      :phone="form.phone"
      scene="register"
      @verified="sendCodeWithTicket"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SmsSliderVerify from '../components/SmsSliderVerify.vue'
import { register, sendRegisterCode } from '../api/auth'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const sendingCode = ref(false)
const showPassword = ref(false)
const error = ref('')
const message = ref('')
const countdown = ref(0)
const sliderOpen = ref(false)
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

function validateEnterpriseName() {
  const name = form.enterpriseName.trim()
  if (!name) return '请输入企业名称'
  if ([...name].length < 3 || [...name].length > 100) return '企业名称长度应为3至100个字符'
  if (/\s/u.test(name) || !/^[\p{Script=Han}A-Za-z0-9（）()·&＆—－.．-]+$/u.test(name)) {
    return '企业名称包含不支持的字符，请填写营业执照上的完整名称'
  }
  if ((name.match(/\p{Script=Han}/gu) || []).length < 2) return '请输入正确完整的企业名称'

  const placeholders = new Set([
    '企业名称', '公司名称', '请输入企业名称', '暂无', '无', '不知道',
    'test', '测试', '测试公司', '测试企业', '示例公司', '示例企业'
  ])
  if (placeholders.has(name.toLowerCase())
    || /^(?:[某xX*]+|[0-9]+)(?:企业|公司|有限公司|有限责任公司|商行|中心|工作室|店)?$/.test(name)) {
    return '请填写营业执照上的真实完整企业名称'
  }
  const organizationSuffixes = [
    '有限责任公司', '股份有限公司', '股份公司', '有限公司', '集团公司', '总公司',
    '合伙企业（特殊普通合伙）', '合伙企业(特殊普通合伙)',
    '合伙企业（普通合伙）', '合伙企业(普通合伙)',
    '合伙企业（有限合伙）', '合伙企业(有限合伙)',
    '（特殊普通合伙）', '(特殊普通合伙)', '（普通合伙）', '(普通合伙)',
    '（有限合伙）', '(有限合伙)', '个人独资企业', '（个人独资）', '(个人独资)',
    '农民专业合作社联合社', '专业合作社联合社', '农民专业合作社', '专业合作社', '合作社', '联合社',
    '分公司', '分厂', '分店', '分行', '支行', '营业部', '代表处',
    '（个体工商户）', '(个体工商户)',
    '工作室', '事务所', '研究院', '经营部', '服务部', '门市部', '商行',
    '家庭农场', '养殖场', '种植场', '农场', '商场', '超市', '餐厅', '餐馆',
    '饭店', '宾馆', '旅馆', '诊所', '药房', '药店', '网吧', '中心', '总厂',
    '厂', '店', '馆', '部', '行'
  ]
  if (!organizationSuffixes.some(suffix => name.endsWith(suffix) && name.length > suffix.length)) {
    return '企业名称不完整，请填写营业执照上的完整企业名称'
  }
  return ''
}

function validateForm() {
  const accountError = validateAccount()
  if (accountError) return accountError
  if (!form.password) return '请设置密码'
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(form.password)) {
    return '密码需8位以上，且同时包含数字和字母'
  }
  const enterpriseNameError = validateEnterpriseName()
  if (enterpriseNameError) return enterpriseNameError
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

function sendCode() {
  error.value = ''
  message.value = ''
  if (countdown.value > 0 || sendingCode.value) return
  const enterpriseNameError = validateEnterpriseName()
  if (enterpriseNameError) {
    error.value = enterpriseNameError
    return
  }
  const phoneError = validatePhone()
  if (phoneError) {
    error.value = phoneError
    return
  }

  sliderOpen.value = true
}

async function sendCodeWithTicket(sliderTicket) {
  sendingCode.value = true
  try {
    await sendRegisterCode(form.phone, sliderTicket)
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
