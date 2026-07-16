<template>
  <div class="account-profile-page">
    <section class="profile-summary">
      <div class="summary-avatar" :class="{ image: avatarUrl }">
        <img v-if="avatarUrl" :src="avatarUrl" alt="企业标志">
        <span v-else>{{ profileInitial }}</span>
      </div>
      <div class="summary-copy">
        <p>账户中心</p>
        <h2>{{ summaryName }}</h2>
        <div class="summary-meta">
          <span>{{ accountTypeLabel }}</span>
          <span v-if="certStatusText" :class="['cert-pill', certStatusClass]">{{ certStatusText }}</span>
        </div>
      </div>
      <button class="primary-btn compact" type="button" @click="openEditor">编辑资料</button>
    </section>

    <section class="profile-detail-card">
      <header class="detail-card-head">
        <div>
          <h3>基本信息</h3>
          <p>企业账户资料</p>
        </div>
      </header>

      <div class="profile-row">
        <span class="row-label">账户类型</span>
        <strong>{{ accountTypeLabel }}</strong>
        <span class="row-note">{{ isSubAccount ? '由主账号统一管理' : '企业客户账户' }}</span>
      </div>

      <div class="profile-row logo-row">
        <span class="row-label">企业标志</span>
        <div class="row-logo" :class="{ image: avatarUrl }">
          <img v-if="avatarUrl" :src="avatarUrl" alt="企业标志">
          <span v-else>{{ profileInitial }}</span>
        </div>
        <label class="row-action upload-action">
          {{ uploading ? '上传中' : '修改' }}
          <input type="file" accept="image/png,image/jpeg,image/webp" :disabled="uploading" @change="handleAvatarChange">
        </label>
      </div>

      <div class="profile-row">
        <span class="row-label">企业名称</span>
        <div class="row-value-with-tag">
          <strong>{{ displayEnterpriseName }}</strong>
          <span :class="['cert-pill', certStatusClass]">{{ certStatusText }}</span>
        </div>
        <router-link class="row-action" to="/enterprise-cert">{{ certActionText }}</router-link>
      </div>

      <div class="profile-row">
        <span class="row-label">登录名</span>
        <strong>{{ profile.userName || '-' }}</strong>
        <span class="row-note">登录名设置后不可修改</span>
      </div>

      <div class="profile-row">
        <span class="row-label">手机</span>
        <strong>{{ maskedPhone }}</strong>
        <span class="row-note">已绑定</span>
      </div>

      <div class="profile-row">
        <span class="row-label">邮箱</span>
        <strong>{{ profile.email || '尚未设置邮箱' }}</strong>
        <button class="row-action" type="button" @click="openEditor('email')">修改</button>
      </div>
    </section>

    <section class="profile-detail-card">
      <header class="detail-card-head">
        <div>
          <h3>账户安全</h3>
          <p>登录凭证与身份验证信息</p>
        </div>
      </header>

      <div class="profile-row">
        <span class="row-label">登录密码</span>
        <strong>{{ passwordStatusText }}</strong>
        <button class="row-action" type="button" @click="openPasswordEditor">修改密码</button>
      </div>

      <div class="profile-row">
        <span class="row-label">绑定手机</span>
        <strong>{{ maskedPhone }}</strong>
        <span class="row-note">用于验证码登录与身份核验</span>
      </div>
    </section>

    <p v-if="message" :class="['profile-message', messageType]">{{ message }}</p>

    <div v-if="editorVisible" class="profile-modal-mask" @click.self="closeEditor">
      <section class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-editor-title">
        <header>
          <div>
            <p>账户资料</p>
            <h3 id="profile-editor-title">编辑基本信息</h3>
          </div>
          <button class="modal-close" type="button" aria-label="关闭" @click="closeEditor">×</button>
        </header>

        <div class="editor-grid">
          <label>
            <span>邮箱</span>
            <input ref="emailInput" v-model.trim="form.email" type="email" maxlength="50" placeholder="请输入工作邮箱">
          </label>
        </div>

        <footer>
          <button class="ghost-btn" type="button" :disabled="saving" @click="closeEditor">取消</button>
          <button class="primary-btn compact" type="button" :disabled="saving" @click="saveProfile">{{ saving ? '保存中' : '保存' }}</button>
        </footer>
      </section>
    </div>

    <div v-if="passwordEditorVisible" class="profile-modal-mask" @click.self="closePasswordEditor">
      <section class="profile-modal password-modal" role="dialog" aria-modal="true" aria-labelledby="password-editor-title">
        <header>
          <div>
            <p>账户安全</p>
            <h3 id="password-editor-title">修改登录密码</h3>
          </div>
          <button class="modal-close" type="button" aria-label="关闭" @click="closePasswordEditor">×</button>
        </header>

        <div class="password-editor">
          <label>
            <span>当前密码</span>
            <input ref="currentPasswordInput" v-model="passwordForm.oldPassword" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="请输入当前密码">
          </label>
          <label>
            <span>新密码</span>
            <input v-model="passwordForm.newPassword" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" maxlength="64" placeholder="请输入新密码">
          </label>
          <label>
            <span>确认新密码</span>
            <input v-model="passwordForm.confirmPassword" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" maxlength="64" placeholder="请再次输入新密码">
          </label>
          <label>
            <span>短信验证码</span>
            <div class="verification-code-row">
              <input v-model.trim="passwordForm.smsCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="请输入 6 位验证码">
              <button type="button" :disabled="smsSending || smsCountdown > 0" @click="sendSmsCode">
                {{ smsCountdown > 0 ? `${smsCountdown}s` : (smsSending ? '发送中' : '获取验证码') }}
              </button>
            </div>
            <small>验证码将发送至 {{ maskedPhone }}</small>
          </label>
          <label class="password-visibility">
            <input v-model="showPassword" type="checkbox">
            <span>显示密码</span>
          </label>
          <p class="password-rule">需同时校验当前密码和手机验证码。新密码为 8-64 位，且包含英文字母和数字；修改成功后需重新登录。</p>
        </div>

        <footer>
          <button class="ghost-btn" type="button" :disabled="passwordChanging" @click="closePasswordEditor">取消</button>
          <button class="primary-btn compact" type="button" :disabled="passwordChanging" @click="changePassword">{{ passwordChanging ? '提交中' : '确认修改' }}</button>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMyEnterpriseCertList } from '../api/enterpriseCert'
import { getUserProfile, sendPasswordCode, updateUserPassword, updateUserProfile, uploadUserAvatar } from '../api/user'
import { removeToken, setUser } from '../utils/auth'

const emit = defineEmits(['profile-updated'])
const router = useRouter()
const profile = ref({})
const cert = ref(null)
const editorVisible = ref(false)
const passwordEditorVisible = ref(false)
const saving = ref(false)
const passwordChanging = ref(false)
const smsSending = ref(false)
const smsCountdown = ref(0)
const uploading = ref(false)
const showPassword = ref(false)
const message = ref('')
const messageType = ref('success')
const emailInput = ref(null)
const currentPasswordInput = ref(null)
const form = reactive({ nickName: '', name: '', sex: '2', email: '' })
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '', smsCode: '' })
let smsTimer = null

const isSubAccount = computed(() => profile.value?.parentUserId != null || profile.value?.accountType === 'sub')
const accountTypeLabel = computed(() => {
  if (isSubAccount.value) return '企业子账号'
  if (profile.value?.isAgent) return '企业代理账号'
  return '企业主账号'
})
const profileInitial = computed(() => String(summaryName.value || '钟').slice(0, 1))
const maskedPhone = computed(() => {
  const phone = String(profile.value?.phonenumber || '')
  if (!phone) return '尚未绑定手机'
  return phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone
})
const passwordStatusText = computed(() => {
  const value = profile.value?.pwdUpdateDate
  if (!value) return '已设置'
  return `最近更新：${String(value).replace('T', ' ').slice(0, 16)}`
})
const displayEnterpriseName = computed(() => cert.value?.enterpriseName || profile.value?.enterpriseName || '尚未设置企业名称')
const summaryName = computed(() => cert.value?.enterpriseName || profile.value?.enterpriseName || profile.value?.userName || '企业账户')
const certStatusText = computed(() => {
  const status = cert.value?.status
  return ({ approved: '已认证', pending: '待审核', reviewing: '审核中', rejected: '未通过', draft: '待提交' })[status] || '未认证'
})
const certStatusClass = computed(() => cert.value?.status || 'empty')
const certActionText = computed(() => {
  if (isSubAccount.value) return cert.value ? '查看认证' : '认证状态'
  if (!cert.value) return '去认证'
  if (cert.value.status === 'draft') return '继续认证'
  if (cert.value.status === 'rejected') return '重新认证'
  return '查看认证'
})
const avatarUrl = computed(() => resourceUrl(profile.value?.avatar))

function resourceUrl(path) {
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path)) return path
  const base = import.meta.env.VITE_APP_BASE_API || ''
  const normalized = String(path).startsWith('/') ? String(path) : `/${path}`
  return `${base}${normalized}`.replace(/([^:]\/)\/+/g, '$1')
}

function fillForm() {
  form.nickName = profile.value?.nickName || ''
  form.name = profile.value?.name || ''
  form.sex = String(profile.value?.sex ?? '2')
  form.email = profile.value?.email || ''
}

async function openEditor(focusField) {
  fillForm()
  editorVisible.value = true
  await nextTick()
  const targets = { email: emailInput }
  targets[focusField]?.value?.focus()
}

function closeEditor() {
  if (!saving.value) editorVisible.value = false
}

async function openPasswordEditor() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordForm.smsCode = ''
  showPassword.value = false
  passwordEditorVisible.value = true
  await nextTick()
  currentPasswordInput.value?.focus()
}

function closePasswordEditor() {
  if (!passwordChanging.value) passwordEditorVisible.value = false
}

function validateForm() {
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return '邮箱格式不正确'
  return ''
}

async function saveProfile() {
  const error = validateForm()
  if (error) return showMessage(error, 'error')
  saving.value = true
  try {
    await updateUserProfile({
      nickName: form.nickName,
      name: form.name,
      sex: form.sex,
      email: form.email,
      phonenumber: profile.value?.phonenumber || ''
    })
    await loadProfile()
    editorVisible.value = false
    showMessage('基本信息已更新')
    emit('profile-updated')
  } catch (error) {
    showMessage(error?.msg || error?.message || '保存失败，请稍后重试', 'error')
  } finally {
    saving.value = false
  }
}

function validatePassword() {
  if (!passwordForm.oldPassword) return '请输入当前密码'
  if (!passwordForm.newPassword) return '请输入新密码'
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,64}$/.test(passwordForm.newPassword)) {
    return '新密码需为 8-64 位，并同时包含英文字母和数字'
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) return '两次输入的新密码不一致'
  if (passwordForm.oldPassword === passwordForm.newPassword) return '新密码不能与当前密码相同'
  if (!/^\d{6}$/.test(passwordForm.smsCode)) return '请输入 6 位短信验证码'
  return ''
}

function startSmsCountdown() {
  window.clearInterval(smsTimer)
  smsCountdown.value = 60
  smsTimer = window.setInterval(() => {
    smsCountdown.value -= 1
    if (smsCountdown.value <= 0) window.clearInterval(smsTimer)
  }, 1000)
}

async function sendSmsCode() {
  if (smsSending.value || smsCountdown.value > 0) return
  if (!profile.value?.phonenumber) return showMessage('当前账号未绑定手机号，无法修改密码', 'error')
  smsSending.value = true
  try {
    const response = await sendPasswordCode()
    if (import.meta.env.DEV && response?.data === '000000') passwordForm.smsCode = '000000'
    startSmsCountdown()
    showMessage('验证码已发送，请注意查收')
  } catch (error) {
    showMessage(error?.msg || error?.message || '验证码发送失败，请稍后重试', 'error')
  } finally {
    smsSending.value = false
  }
}

async function changePassword() {
  const error = validatePassword()
  if (error) return showMessage(error, 'error')
  passwordChanging.value = true
  try {
    await updateUserPassword(passwordForm.oldPassword, passwordForm.newPassword, passwordForm.smsCode)
    passwordEditorVisible.value = false
    showMessage('密码修改成功，即将重新登录')
    window.setTimeout(() => {
      removeToken()
      router.replace('/login')
    }, 900)
  } catch (error) {
    showMessage(error?.msg || error?.message || '密码修改失败，请稍后重试', 'error')
  } finally {
    passwordChanging.value = false
  }
}

async function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return showMessage('仅支持 JPG、PNG 或 WebP 图片', 'error')
  if (file.size > 2 * 1024 * 1024) return showMessage('图片大小不能超过 2MB', 'error')
  uploading.value = true
  try {
    await uploadUserAvatar(file)
    await loadProfile()
    showMessage('企业标志已更新')
    emit('profile-updated')
  } catch (error) {
    showMessage(error?.msg || error?.message || '上传失败，请稍后重试', 'error')
  } finally {
    uploading.value = false
  }
}

function showMessage(text, type = 'success') {
  message.value = text
  messageType.value = type
  window.clearTimeout(showMessage.timer)
  showMessage.timer = window.setTimeout(() => { message.value = '' }, 3200)
}

async function loadProfile() {
  const response = await getUserProfile()
  const user = response.data || response.user || {}
  profile.value = { ...user, isAgent: response.isAgent ?? user.isAgent }
  setUser(profile.value)
}

async function loadCertification() {
  try {
    const response = await getMyEnterpriseCertList()
    const list = response.rows || response.data || []
    cert.value = list.find(item => item?.status === 'approved')
      || list.find(item => item?.status === 'pending' || item?.status === 'reviewing')
      || list.find(item => item?.status === 'draft')
      || list.find(item => item?.status === 'rejected')
      || list.find(Boolean)
      || null
  } catch (error) {
    cert.value = null
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadProfile(), loadCertification()])
  } catch (error) {
    showMessage(error?.msg || error?.message || '基本信息加载失败', 'error')
  }
})

onBeforeUnmount(() => window.clearInterval(smsTimer))
</script>

<style scoped>
.account-profile-page { width: min(1180px, 100%); margin: 0 auto; display: grid; gap: 16px; }
.profile-summary { min-height: 112px; padding: 22px 24px; display: flex; align-items: center; gap: 18px; background: #fff; color: #101828; border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow-panel); }
.summary-avatar, .row-logo { flex: 0 0 auto; display: grid; place-items: center; overflow: hidden; background: #fff; color: #1d5baa; font-weight: 800; }
.summary-avatar { width: 64px; height: 64px; border: 1px solid #dce6f3; border-radius: 8px; font-size: 26px; background: #eef4ff; }
.summary-avatar img, .row-logo img { width: 100%; height: 100%; object-fit: cover; }
.summary-copy { min-width: 0; flex: 1; }
.summary-copy p, .summary-copy h2 { margin: 0; letter-spacing: 0; }
.summary-copy p { margin-bottom: 6px; color: #2f6fe4; font-size: 13px; font-weight: 700; }
.summary-copy h2 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 24px; }
.summary-meta { margin-top: 10px; display: flex; align-items: center; gap: 10px; color: var(--muted); }
.profile-summary .primary-btn { background: #2f6fe4; color: #fff; box-shadow: none; }
.primary-btn.compact { min-width: 112px; height: 42px; padding: 0 20px; }
.profile-detail-card { overflow: hidden; background: #fff; border: 1px solid #e4eaf2; border-radius: 8px; box-shadow: var(--shadow-panel); }
.detail-card-head { min-height: 68px; padding: 14px 24px; display: flex; align-items: center; border-bottom: 1px solid #e7ebf1; }
.detail-card-head h3, .detail-card-head p { margin: 0; letter-spacing: 0; }
.detail-card-head h3 { font-size: 20px; color: #17243a; }
.detail-card-head p { margin-top: 6px; color: #8190a5; font-size: 14px; }
.profile-row { min-height: 68px; padding: 12px 24px; display: grid; grid-template-columns: 140px minmax(0, 1fr) minmax(110px, auto); gap: 24px; align-items: center; border-bottom: 1px solid #edf0f4; }
.profile-row:last-child { border-bottom: 0; }
.row-label { color: #59677a; font-weight: 600; }
.profile-row strong { min-width: 0; color: #18263b; font-weight: 600; overflow-wrap: anywhere; }
.row-note { justify-self: end; color: #98a2b3; font-size: 14px; }
.row-action { justify-self: end; padding: 8px 0; border: 0; background: none; color: #2168d5; font: inherit; text-decoration: none; cursor: pointer; }
.row-value-with-tag { display: flex; align-items: center; gap: 12px; min-width: 0; }
.cert-pill { display: inline-flex; align-items: center; min-height: 26px; padding: 3px 10px; border-radius: 4px; background: #eef2f7; color: #637083; font-size: 13px; font-weight: 700; white-space: nowrap; }
.cert-pill.approved { background: #e8f8ef; color: #087443; }
.cert-pill.pending, .cert-pill.reviewing { background: #fff4df; color: #a15c00; }
.cert-pill.rejected { background: #fff0f0; color: #b42318; }
.cert-pill.draft { background: #eef4ff; color: #245bb5; }
.profile-summary .cert-pill { background: #eef4ff; color: #245bb5; }
.profile-summary .cert-pill.approved { background: #e8f8ef; color: #087443; }
.profile-summary .cert-pill.pending, .profile-summary .cert-pill.reviewing { background: #fff4df; color: #a15c00; }
.profile-summary .cert-pill.rejected { background: #fff0f0; color: #b42318; }
.row-logo { width: 48px; height: 48px; border: 1px solid #dfe6ef; border-radius: 6px; background: #eef4fb; font-size: 18px; }
.upload-action { position: relative; }
.upload-action input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.profile-message { position: fixed; top: 84px; left: 50%; z-index: 70; margin: 0; padding: 11px 18px; transform: translateX(-50%); border: 1px solid #abefc6; border-radius: 6px; background: #ecfdf3; color: #027a48; box-shadow: 0 10px 25px rgba(16, 24, 40, .12); }
.profile-message.error { border-color: #fecdca; background: #fef3f2; color: #b42318; }
.profile-modal-mask { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 24px; background: rgba(12, 25, 45, .48); }
.profile-modal { width: min(650px, 100%); overflow: hidden; border-radius: 8px; background: #fff; box-shadow: 0 24px 80px rgba(9, 30, 66, .24); }
.profile-modal > header { padding: 24px 28px; display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid #e7ebf1; }
.profile-modal header p, .profile-modal header h3 { margin: 0; letter-spacing: 0; }
.profile-modal header p { margin-bottom: 5px; color: #718096; font-size: 13px; }
.profile-modal header h3 { font-size: 22px; color: #142239; }
.modal-close { width: 36px; height: 36px; border: 0; background: transparent; color: #7b8798; font-size: 28px; line-height: 1; cursor: pointer; }
.editor-grid { padding: 26px 28px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.editor-grid label { display: grid; gap: 8px; color: #344054; font-weight: 600; }
.editor-grid input, .editor-grid select { width: 100%; height: 46px; padding: 0 13px; border: 1px solid #d8e0eb; border-radius: 6px; background: #fff; color: #17243a; font: inherit; outline: none; }
.editor-grid input:focus, .editor-grid select:focus { border-color: #2f6fe4; box-shadow: 0 0 0 3px rgba(47,111,228,.1); }
.password-modal { width: min(540px, 100%); }
.password-editor { padding: 26px 28px 8px; display: grid; gap: 18px; }
.password-editor > label:not(.password-visibility) { display: grid; gap: 8px; color: #344054; font-weight: 600; }
.password-editor input[type="password"], .password-editor input[type="text"] { width: 100%; height: 46px; padding: 0 13px; border: 1px solid #d8e0eb; border-radius: 6px; background: #fff; color: #17243a; font: inherit; outline: none; }
.password-editor input[type="password"]:focus, .password-editor input[type="text"]:focus { border-color: #2f6fe4; box-shadow: 0 0 0 3px rgba(47,111,228,.1); }
.verification-code-row { display: grid; grid-template-columns: minmax(0, 1fr) 124px; gap: 10px; }
.verification-code-row button { height: 46px; border: 1px solid #bad0f3; border-radius: 6px; background: #eef4ff; color: #1859b8; font: inherit; font-weight: 600; cursor: pointer; }
.verification-code-row button:disabled { border-color: #e2e7ee; background: #f5f6f8; color: #98a2b3; cursor: not-allowed; }
.password-editor small { color: #8793a5; font-size: 13px; font-weight: 400; }
.password-visibility { width: fit-content; display: inline-flex; align-items: center; gap: 8px; color: #59677a; font-size: 14px; cursor: pointer; }
.password-visibility input { width: 16px; height: 16px; accent-color: #2168d5; }
.password-rule { margin: 0; padding: 12px 14px; border-left: 3px solid #7aa7ee; background: #f5f8fd; color: #66758a; font-size: 13px; line-height: 1.65; }
.profile-modal footer { padding: 18px 28px 24px; display: flex; justify-content: flex-end; gap: 12px; }
.ghost-btn { min-width: 96px; height: 42px; border: 1px solid #d8e0eb; border-radius: 6px; background: #fff; color: #344054; font: inherit; cursor: pointer; }
@media (max-width: 760px) {
  .profile-summary { padding: 24px; flex-wrap: wrap; }
  .profile-summary .primary-btn { width: 100%; }
  .profile-row { padding: 16px 20px; grid-template-columns: 105px minmax(0, 1fr); gap: 10px 18px; }
  .profile-row > :last-child { grid-column: 2; justify-self: start; }
  .editor-grid { grid-template-columns: 1fr; }
}
</style>
