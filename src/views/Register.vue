<template>
  <div class="register-page">
    <section class="register-brand-panel" aria-label="钟馗背调品牌信息">
      <div class="register-brand-lockup">
        <div class="register-brand-seal" aria-hidden="true"><span>钟馗</span></div>
        <div>
          <strong>钟馗背调</strong>
          <span>一站式企业风控平台</span>
        </div>
      </div>

      <div class="register-brand-message">
        <p>企业账号注册</p>
        <h1>让企业每一次决策<br>都有依据</h1>
        <div class="register-brand-principles" aria-label="注册流程">
          <span><b>01</b>企业实名</span>
          <span><b>02</b>手机验证</span>
          <span><b>03</b>安全启用</span>
        </div>
      </div>

      <div class="register-brand-watermark" aria-hidden="true">ZHONGKUI</div>

      <div class="register-brand-foot">
        <span>河南钟馗科技有限公司</span>
        <span>ZHONGKUI BACKGROUND CHECK</span>
      </div>
    </section>

    <main class="register-main">
      <div class="register-mobile-brand">
        <div class="register-brand-seal" aria-hidden="true"><span>钟馗</span></div>
        <div>
          <strong>钟馗背调</strong>
          <span>一站式企业风控平台</span>
        </div>
      </div>

      <form class="register-card" novalidate @submit.prevent="handleRegister">
        <header class="register-form-head">
          <div class="register-head-copy">
            <span>企业工作台</span>
            <h2>创建企业账号</h2>
          </div>
          <router-link class="register-head-back" to="/login">
            <ArrowLeft :size="15" aria-hidden="true" />
            返回登录
          </router-link>
        </header>

        <div class="register-form-grid">
          <label class="register-field register-field-account">
            <span>账号</span>
            <input
              v-model.trim="form.account"
              placeholder="6位以上英文加数字"
              autocomplete="username"
            >
          </label>

          <label class="register-field register-field-password">
            <span>密码</span>
            <div class="register-password-input">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="8位以上，包含字母和数字"
                autocomplete="new-password"
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
          </label>

          <label class="register-field register-field-enterprise">
            <span>企业名称</span>
            <input
              v-model.trim="form.enterpriseName"
              placeholder="请输入营业执照上的完整企业名称"
              maxlength="100"
              autocomplete="organization"
              required
            >
          </label>

          <label class="register-field register-field-phone">
            <span>手机号</span>
            <input
              v-model.trim="form.phone"
              placeholder="请输入手机号"
              maxlength="11"
              inputmode="numeric"
              autocomplete="tel"
            >
          </label>

          <label class="register-field register-field-sms">
            <span>短信验证码</span>
            <div class="register-sms-row">
              <input
                v-model.trim="form.code"
                placeholder="请输入6位验证码"
                maxlength="6"
                inputmode="numeric"
                autocomplete="one-time-code"
              >
              <button type="button" :disabled="countdown > 0 || sendingCode" @click="sendCode">
                {{ codeButtonText }}
              </button>
            </div>
          </label>

          <label class="register-field register-field-invite">
            <span>邀请码 <em>选填</em></span>
            <input
              v-model.trim="form.inviteCode"
              :disabled="inviteCodeLocked"
              :placeholder="inviteCodeLocked ? '已绑定邀请码' : '请输入邀请码'"
            >
          </label>
        </div>

        <div class="register-feedback" aria-live="polite">
          <div v-if="message" class="register-success">
            <CircleCheck :size="16" aria-hidden="true" />{{ message }}
          </div>
          <div v-else-if="error" class="register-error">
            <CircleAlert :size="16" aria-hidden="true" />{{ error }}
          </div>
        </div>

        <button class="register-submit" type="submit" :disabled="loading">
          <LoaderCircle v-if="loading" :size="17" class="spin" aria-hidden="true" />
          {{ loading ? '正在注册' : '创建企业账号' }}
        </button>

        <div class="register-secondary">
          <span>已有企业账号？</span>
          <router-link to="/login">返回登录</router-link>
        </div>
      </form>
    </main>

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
import { ArrowLeft, CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle } from '@lucide/vue'
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

<style scoped>
.register-page {
  --register-ink: #17191e;
  --register-muted: #6f7680;
  --register-line: #d9dde1;
  --register-paper: #ffffff;
  --register-cinnabar: #a6392e;
  display: grid;
  grid-template-columns: minmax(620px, 1.35fr) minmax(520px, .9fr);
  width: 100%;
  min-height: 100dvh;
  color: var(--register-ink);
  background: #eceff1;
}

.register-brand-panel {
  position: relative;
  display: flex;
  min-height: 100dvh;
  padding: 44px 64px 40px;
  overflow: hidden;
  flex-direction: column;
  justify-content: space-between;
}

.register-brand-panel::before {
  content: '';
  position: absolute;
  right: 64px;
  bottom: 66px;
  left: 64px;
  height: 1px;
  background: rgba(23, 25, 30, .11);
}

.register-brand-lockup,
.register-mobile-brand {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 13px;
}

.register-brand-lockup {
  animation: register-reveal .5s ease-out both;
}

.register-brand-seal {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, .32);
  border-radius: 8px;
  background: var(--register-cinnabar);
  box-shadow: inset 0 0 6px rgba(83, 17, 12, .34);
  transform: rotate(-2deg);
}

.register-brand-seal span {
  font-family: "Songti SC", "SimSun", serif;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  writing-mode: vertical-rl;
}

.register-brand-lockup strong,
.register-mobile-brand strong {
  display: block;
  font-size: 18px;
  line-height: 1.35;
}

.register-brand-lockup > div:last-child span,
.register-mobile-brand > div:last-child span {
  display: block;
  margin-top: 2px;
  color: #7b828b;
  font-size: 12px;
}

.register-brand-message {
  position: relative;
  z-index: 2;
  max-width: 620px;
  padding-bottom: 112px;
  animation: register-reveal .58s .08s ease-out both;
}

.register-brand-message > p {
  display: flex;
  margin: 0 0 28px;
  align-items: center;
  gap: 12px;
  color: #656d77;
  font-size: 14px;
  font-weight: 600;
}

.register-brand-message > p::before {
  content: '';
  width: 30px;
  height: 2px;
  background: var(--register-cinnabar);
}

.register-brand-message h1 {
  margin: 0;
  font-family: "Songti SC", "STSong", "SimSun", serif;
  font-size: 52px;
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: 0;
}

.register-brand-principles {
  display: flex;
  margin-top: 34px;
  flex-wrap: wrap;
  gap: 12px 28px;
  color: #636a73;
  font-size: 13px;
}

.register-brand-principles span {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}

.register-brand-principles b {
  color: var(--register-cinnabar);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 10px;
}

.register-brand-watermark {
  position: absolute;
  right: 42px;
  bottom: 82px;
  color: rgba(23, 25, 30, .035);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 92px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  pointer-events: none;
  user-select: none;
}

.register-brand-foot {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  color: #858b92;
  font-size: 11px;
}

.register-brand-foot span:last-child {
  color: #92979e;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 10px;
}

.register-main {
  display: flex;
  min-width: 0;
  min-height: 100dvh;
  padding: 72px 48px 32px;
  align-items: flex-start;
  justify-content: center;
}

.register-mobile-brand {
  display: none;
}

.register-card {
  width: min(500px, 100%);
  max-width: 500px;
  padding: 28px;
  border: 1px solid rgba(23, 25, 30, .08);
  border-radius: 8px;
  background: var(--register-paper);
  box-shadow: 0 20px 48px rgba(31, 36, 43, .09);
  animation: register-reveal .54s .06s ease-out both;
}

.register-form-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.register-head-copy > span {
  display: block;
  margin-bottom: 12px;
  color: var(--register-cinnabar);
  font-size: 13px;
  font-weight: 700;
}

.register-form-head h2 {
  margin: 0;
  font-size: 30px;
  line-height: 1.25;
  letter-spacing: 0;
}

.register-head-back {
  display: inline-flex;
  margin-top: 2px;
  padding: 7px 0;
  align-items: center;
  gap: 5px;
  color: #737a83;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.register-head-back:hover {
  color: var(--register-cinnabar);
}

.register-form-grid {
  display: grid;
  margin-top: 24px;
  padding-top: 24px;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  border-top: 1px solid #eceeef;
}

.register-field {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.register-field > span {
  color: #3f4650;
  font-size: 13px;
  font-weight: 600;
}

.register-field em {
  margin-left: 5px;
  color: #9aa0a7;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
}

.register-field input {
  width: 100%;
  height: 48px;
  min-width: 0;
  padding: 0 14px;
  color: var(--register-ink);
  border: 1px solid var(--register-line);
  border-radius: 8px;
  outline: none;
  background: #fff;
  font: inherit;
  transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
}

.register-field input::placeholder {
  color: #a1a7af;
}

.register-field input:hover:not(:disabled) {
  border-color: #b7bdc5;
}

.register-field input:focus {
  border-color: #6d747d;
  box-shadow: 0 0 0 3px rgba(23, 25, 30, .06);
}

.register-field input:disabled {
  color: #7f858d;
  background: #f3f4f5;
  cursor: not-allowed;
}

.register-password-input {
  position: relative;
}

.register-password-input input {
  padding-right: 48px;
}

.register-password-input button {
  position: absolute;
  top: 50%;
  right: 8px;
  display: grid;
  width: 34px;
  height: 34px;
  padding: 0;
  place-items: center;
  color: #777f89;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transform: translateY(-50%);
}

.register-password-input button:hover {
  color: var(--register-ink);
  background: #f1f2f3;
}

.register-sms-row {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) 108px;
  gap: 8px;
}

.register-sms-row button {
  height: 48px;
  padding: 0 12px;
  color: var(--register-ink);
  border: 1px solid var(--register-line);
  border-radius: 8px;
  background: #f7f8f8;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease;
}

.register-sms-row button:hover:not(:disabled) {
  border-color: #999fa7;
  background: #f1f2f3;
}

.register-sms-row button:disabled {
  color: #a3a8af;
  cursor: not-allowed;
}

.register-feedback {
  margin-top: 14px;
}

.register-feedback:empty { display: none; }

.register-success,
.register-error {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 13px;
  line-height: 1.55;
}

.register-success {
  color: #167448;
}

.register-error {
  color: #b53c32;
}

.register-success svg,
.register-error svg {
  margin-top: 2px;
  flex: 0 0 auto;
}

.register-submit {
  display: flex;
  width: 100%;
  height: 48px;
  margin-top: 24px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  border: 0;
  border-radius: 8px;
  background: var(--register-ink);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background .16s ease, transform .16s ease;
}

.register-feedback:not(:empty) + .register-submit {
  margin-top: 14px;
}

.register-submit:hover:not(:disabled) {
  background: #2a2d33;
  transform: translateY(-1px);
}

.register-submit:disabled {
  background: #aeb2b7;
  cursor: not-allowed;
}

.register-secondary {
  display: none;
  margin-top: 18px;
  padding-top: 18px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #818790;
  border-top: 1px solid #eceeef;
  font-size: 13px;
}

.register-secondary a {
  color: var(--register-cinnabar);
  font-weight: 700;
}

.register-password-input button:focus-visible,
.register-sms-row button:focus-visible,
.register-submit:focus-visible,
.register-head-back:focus-visible,
.register-secondary a:focus-visible {
  outline: 2px solid var(--register-cinnabar);
  outline-offset: 2px;
}

.spin {
  animation: register-spin .8s linear infinite;
}

@keyframes register-reveal {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes register-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .register-brand-lockup,
  .register-brand-message,
  .register-card { animation: none; }
  .register-submit { transition: none; }
}

@media (min-width: 921px) and (max-width: 1180px) {
  .register-page {
    grid-template-columns: minmax(500px, 1.15fr) minmax(480px, .95fr);
  }

  .register-brand-panel {
    padding: 42px 42px 38px;
  }

  .register-brand-panel::before {
    right: 42px;
    left: 42px;
  }

  .register-brand-message {
    padding-bottom: 104px;
  }

  .register-brand-message h1 {
    font-size: 43px;
  }

  .register-brand-watermark {
    right: 24px;
    font-size: 74px;
  }

  .register-main {
    padding: 64px 34px 28px;
  }

  .register-card {
    width: min(500px, 100%);
    max-width: 500px;
    padding: 26px;
  }

  .register-form-grid {
    gap: 15px;
  }

  .register-sms-row {
    grid-template-columns: minmax(0, 1fr) 98px;
  }
}

@media (max-width: 920px) {
  .register-page {
    display: block;
    min-height: 100dvh;
    background: #f6f6f4;
  }

  .register-brand-panel {
    display: none;
  }

  .register-main {
    display: block;
    min-height: 100dvh;
    padding: 28px 22px 40px;
  }

  .register-mobile-brand {
    display: flex;
    width: min(560px, 100%);
    margin: 0 auto 30px;
  }

  .register-mobile-brand > div:last-child span {
    color: #81868e;
  }

  .register-card {
    width: min(520px, 100%);
    max-width: 520px;
    margin: 0 auto;
    padding: 26px;
    box-shadow: 0 16px 36px rgba(31, 36, 43, .07);
  }

  .register-head-back {
    display: none;
  }

  .register-secondary {
    display: flex;
  }
}

@media (max-width: 480px) {
  .register-main {
    padding: 22px 18px 28px;
  }

  .register-mobile-brand {
    margin-bottom: 22px;
  }

  .register-card {
    padding: 20px 18px;
  }

  .register-head-copy > span {
    margin-bottom: 8px;
  }

  .register-form-head h2 {
    font-size: 27px;
  }

  .register-form-grid {
    margin-top: 20px;
    gap: 12px;
  }

  .register-field {
    gap: 6px;
  }

  .register-field input,
  .register-sms-row button {
    height: 44px;
  }

  .register-feedback {
    min-height: 20px;
    margin-top: 12px;
  }

  .register-submit {
    height: 46px;
    margin-top: 18px;
  }

  .register-sms-row {
    grid-template-columns: minmax(0, 1fr) 104px;
  }

  .register-secondary {
    margin-top: 14px;
    padding-top: 14px;
    flex-wrap: wrap;
  }
}
</style>
