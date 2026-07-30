<template>
  <main class="main-content">
    <TopSlideNotice
      v-model="noticeVisible"
      :type="noticeType"
      :title="noticeTitle"
      :message="noticeMessage"
    />

    <div class="profile-content">
      <section class="card profile-card">
        <div class="profile-card-head">
          <div class="profile-identity">
            <div class="profile-avatar" :class="{ image: avatarUrl }">
              <img v-if="avatarUrl" :src="avatarUrl" alt="企业标志" />
              <span v-else>{{ userInitial }}</span>
            </div>
            <div class="profile-title">
              <h2>{{ profileTitle }}</h2>
              <div class="profile-subline">
                <span>{{ profile.accountType }}</span>
                <span class="status-badge" :class="profile.certStatus === 'approved' ? 'success' : 'warning'">
                  {{ profile.certStatusText }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="field-stack">
          <article class="profile-field">
            <span class="field-name">账户类型</span>
            <div class="field-main inline-value">
              <strong>{{ profile.accountType }}</strong>
              <span class="field-note">{{ isSubAccount ? '由主账号统一管理' : '企业客户账户' }}</span>
            </div>
          </article>

          <article class="profile-field logo-field">
            <span class="field-name">企业标志</span>
            <div class="field-main logo-main">
              <div class="field-logo" :class="{ image: avatarUrl }">
                <img v-if="avatarUrl" :src="avatarUrl" alt="企业标志" />
                <span v-else>{{ userInitial }}</span>
              </div>
              <p>支持 JPG、PNG 或 WebP，大小不超过 2MB</p>
            </div>
            <label class="field-action upload-action">
              {{ avatarUploading ? '上传中...' : '修改' }}
              <input type="file" accept="image/png,image/jpeg,image/webp" :disabled="avatarUploading" @change="handleAvatarChange" />
            </label>
          </article>

          <article class="profile-field">
            <span class="field-name">企业名称</span>
            <div class="field-main">
              <div class="field-inline">
                <strong>{{ displayEnterpriseName }}</strong>
                <span class="status-badge" :class="profile.certStatus === 'approved' ? 'success' : 'warning'">
                  {{ profile.certStatusText }}
                </span>
              </div>
            </div>
            <router-link class="field-action" to="/enterprise-cert">{{ certActionText }}</router-link>
          </article>

          <article class="profile-field">
            <span class="field-name">登录名</span>
            <div class="field-main inline-value">
              <strong>{{ profile.userName || '-' }}</strong>
              <span class="field-note">登录名设置后不可修改</span>
            </div>
          </article>

          <article class="profile-field">
            <span class="field-name">手机</span>
            <div class="field-main inline-value">
              <strong>{{ profile.phone }}</strong>
              <span class="field-note">{{ profile.hasPhone ? '已绑定' : '未绑定' }}</span>
            </div>
          </article>

          <article class="profile-field">
            <span class="field-name">邮箱</span>
            <div class="field-main">
              <strong>{{ profile.email }}</strong>
            </div>
            <button class="field-action" type="button" @click="openInfoEditor">修改</button>
          </article>
        </div>
      </section>

      <aside class="profile-side-panel">
        <section class="card side-card-block account-info-card">
          <h3 class="card-title">账户信息</h3>
          <div class="side-list">
            <div class="side-row">
              <span>账户 ID</span>
              <strong class="mono">UID · {{ profile.userId }}</strong>
            </div>
            <div class="side-row">
              <span>注册时间</span>
              <strong>{{ profile.regTime }}</strong>
            </div>
            <div class="side-row">
              <span>认证状态</span>
              <strong>
                <span class="status-badge" :class="profile.certStatus === 'approved' ? 'success' : 'warning'">
                  {{ profile.certStatusText }}
                </span>
              </strong>
            </div>
          </div>
          <div class="side-action-row">
            <router-link class="side-full-btn" to="/enterprise-cert">{{ certActionText }}</router-link>
          </div>
        </section>

        <section class="card side-card-block">
          <h3 class="card-title">账户安全</h3>

          <div class="security-stack">
            <article class="security-item">
              <div class="security-copy">
                <span>登录密码</span>
                <strong>{{ passwordStatusText }}</strong>
              </div>
              <button class="field-action" type="button" @click="openPasswordEditor">修改密码</button>
            </article>

            <article class="security-item">
              <div class="security-copy">
                <span>绑定手机</span>
                <strong>{{ profile.phone }}</strong>
                <p>用于验证码登录与身份核验</p>
              </div>
            </article>
          </div>
        </section>
      </aside>
    </div>

    <AppModal
      v-model="showPwd"
      title="修改密码"
      eyebrow="账户安全"
      description="修改成功后需要重新登录"
      size="md"
      @close="pwdMsg = ''"
    >
      <FormAlert :message="pwdMsg" :type="pwdMsgType" />
      <div class="password-form">
        <label class="field">
          <span class="field-label">当前密码</span>
          <div class="password-input-wrap">
            <input v-model="pwd.old" class="field-input" :type="pwdVisible.old ? 'text' : 'password'" autocomplete="current-password" placeholder="请输入当前密码" />
            <button type="button" class="password-eye-btn" :aria-label="pwdVisible.old ? '隐藏当前密码' : '显示当前密码'" @click="pwdVisible.old = !pwdVisible.old">
              <svg v-if="!pwdVisible.old" viewBox="0 0 24 24" fill="none" class="password-eye-icon">
                <path d="M2.5 12S5.8 5.5 12 5.5 21.5 12 21.5 12 18.2 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" stroke-width="1.8"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" class="password-eye-icon">
                <path d="M3 3L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M10.6 5.7c.45-.13.91-.2 1.4-.2 6.2 0 9.5 6.5 9.5 6.5a17.7 17.7 0 0 1-2.75 3.55M6.42 6.98C3.83 8.72 2.5 12 2.5 12s3.3 6.5 9.5 6.5c1.64 0 3.08-.45 4.31-1.12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.85 9.85a3.2 3.2 0 0 0 4.3 4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </label>
        <label class="field">
          <span class="field-label">新密码</span>
          <div class="password-input-wrap">
            <input v-model="pwd.newPwd" class="field-input" :type="pwdVisible.newPwd ? 'text' : 'password'" autocomplete="new-password" maxlength="64" placeholder="8-64 位字母+数字" />
            <button type="button" class="password-eye-btn" :aria-label="pwdVisible.newPwd ? '隐藏新密码' : '显示新密码'" @click="pwdVisible.newPwd = !pwdVisible.newPwd">
              <svg v-if="!pwdVisible.newPwd" viewBox="0 0 24 24" fill="none" class="password-eye-icon">
                <path d="M2.5 12S5.8 5.5 12 5.5 21.5 12 21.5 12 18.2 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" stroke-width="1.8"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" class="password-eye-icon">
                <path d="M3 3L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M10.6 5.7c.45-.13.91-.2 1.4-.2 6.2 0 9.5 6.5 9.5 6.5a17.7 17.7 0 0 1-2.75 3.55M6.42 6.98C3.83 8.72 2.5 12 2.5 12s3.3 6.5 9.5 6.5c1.64 0 3.08-.45 4.31-1.12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.85 9.85a3.2 3.2 0 0 0 4.3 4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </label>
        <label class="field">
          <span class="field-label">确认密码</span>
          <div class="password-input-wrap">
            <input v-model="pwd.confirm" class="field-input" :type="pwdVisible.confirm ? 'text' : 'password'" autocomplete="new-password" maxlength="64" placeholder="请再次输入新密码" />
            <button type="button" class="password-eye-btn" :aria-label="pwdVisible.confirm ? '隐藏确认密码' : '显示确认密码'" @click="pwdVisible.confirm = !pwdVisible.confirm">
              <svg v-if="!pwdVisible.confirm" viewBox="0 0 24 24" fill="none" class="password-eye-icon">
                <path d="M2.5 12S5.8 5.5 12 5.5 21.5 12 21.5 12 18.2 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" stroke-width="1.8"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" class="password-eye-icon">
                <path d="M3 3L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M10.6 5.7c.45-.13.91-.2 1.4-.2 6.2 0 9.5 6.5 9.5 6.5a17.7 17.7 0 0 1-2.75 3.55M6.42 6.98C3.83 8.72 2.5 12 2.5 12s3.3 6.5 9.5 6.5c1.64 0 3.08-.45 4.31-1.12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.85 9.85a3.2 3.2 0 0 0 4.3 4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </label>
        <label class="field">
          <span class="field-label">短信验证码</span>
          <div class="code-row">
            <input v-model="pwd.smsCode" class="field-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="请输入验证码" />
              <button type="button" class="code-btn" :disabled="pwdCounting" @click="onSendPwdCode">{{ pwdCounting ? `${pwdCount}s` : '获取验证码' }}</button>
          </div>
          <span class="code-helper">验证码将发送至 {{ profile.phone }}</span>
        </label>
        <p class="password-rule">需同时校验当前密码和手机验证码。新密码为 8-64 位，并同时包含英文字母和数字。</p>
      </div>
      <template #footer>
        <button class="btn-outline" type="button" @click="showPwd = false">取消</button>
        <button class="btn-primary" type="button" @click="onChangePwd">确认修改</button>
      </template>
    </AppModal>

    <AppModal
      v-model="editInfo"
      title="编辑基本信息"
      eyebrow="账户资料"
      description="修改后将同步更新当前账户展示信息"
      size="md"
      @close="editMsg = ''"
    >
      <FormAlert :message="editMsg" type="error" />
      <div class="profile-edit-grid">
        <label class="field">
          <span class="field-label">联系邮箱</span>
          <input v-model.trim="editForm.email" class="field-input" type="email" maxlength="50" placeholder="请输入联系邮箱" />
        </label>
      </div>
      <template #footer>
        <button class="btn-outline" type="button" @click="closeInfoEditor">取消</button>
        <button class="btn-primary" type="button" @click="saveInfoEditor">保存修改</button>
      </template>
    </AppModal>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMyEnterpriseCertList } from '../api/enterpriseCert'
import { getUserProfile, sendPasswordCode, updateUserPassword, updateUserProfile, uploadUserAvatar } from '../api/user'
import { removeToken, setUser } from '../utils/auth'
import AppModal from '../components/AppModal.vue'
import FormAlert from '../components/FormAlert.vue'
import TopSlideNotice from '../components/TopSlideNotice.vue'

const emit = defineEmits(['profile-updated'])
const router = useRouter()
const profile = ref({
  displayName:'当前用户', accountType:'企业主账号', enterpriseName:'-',
  userName:'-', userId:'-', regTime:'-',
  phone:'-', email:'-', address:'-',
  certStatus:'none', certStatusText:'未认证'
})
const userInitial = computed(() => String(profile.value.displayName || profile.value.enterpriseName || '钟').slice(0, 1))
const showPwd = ref(false)
const editInfo = ref(false)
const editMsg = ref('')
const noticeVisible = ref(false)
const noticeType = ref('success')
const noticeTitle = ref('')
const noticeMessage = ref('')
const editForm = reactive({ email:'' })
const pwd = ref({ old:'', newPwd:'', confirm:'', smsCode:'' })
const pwdMsg = ref('')
const pwdMsgType = computed(() => pwdMsg.value.includes('成功') ? 'success' : 'error')
const pwdCounting = ref(false)
const pwdCount = ref(60)
const avatarUploading = ref(false)
const pwdVisible = reactive({ old: false, newPwd: false, confirm: false })
let pwdTimer = null
let noticeResetTimer = null

const avatarUrl = computed(() => resourceUrl(profile.value.avatar))
const isSubAccount = computed(() => profile.value.rawParentUserId != null || profile.value.accountType === '企业子账号')
const certActionText = computed(() => {
  if (isSubAccount.value) return profile.value.certStatus === 'none' ? '认证状态' : '查看认证'
  if (profile.value.certStatus === 'none') return '去认证'
  if (profile.value.certStatus === 'draft') return '继续认证'
  if (profile.value.certStatus === 'rejected') return '重新认证'
  return '查看认证'
})
const passwordStatusText = computed(() => {
  const value = profile.value?.pwdUpdateDate
  if (!value) return '已设置'
  return `最近更新：${String(value).replace('T', ' ').slice(0, 16)}`
})
const displayEnterpriseName = computed(() => profile.value.enterpriseName === '-' ? '尚未设置企业名称' : profile.value.enterpriseName)
const profileTitle = computed(() => profile.value.enterpriseName === '-' ? profile.value.displayName : profile.value.enterpriseName)

function openInfoEditor() {
  editForm.email = profile.value.hasEmail ? profile.value.email : ''
  editMsg.value = ''
  editInfo.value = true
}
function closeInfoEditor() {
  editInfo.value = false
  editMsg.value = ''
}
function openPasswordEditor() {
  pwd.value = { old:'', newPwd:'', confirm:'', smsCode:'' }
  pwdMsg.value = ''
  pwdVisible.old = false
  pwdVisible.newPwd = false
  pwdVisible.confirm = false
  showPwd.value = true
}
function showProfileMessage(message, type = 'success') {
  window.clearTimeout(noticeResetTimer)
  noticeVisible.value = false
  noticeType.value = type
  noticeTitle.value = type === 'success' ? '操作成功' : '操作失败'
  noticeMessage.value = message
  noticeResetTimer = window.setTimeout(() => {
    noticeVisible.value = true
  }, 0)
}
async function saveInfoEditor() {
  editMsg.value = ''
  if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) { editMsg.value = '邮箱格式不正确'; return }
  try {
    await updateUserProfile({
      nickName: profile.value.rawNickName || '',
      name: profile.value.rawName || '',
      sex: profile.value.rawSex ?? '2',
      email: editForm.email,
      phonenumber: profile.value.rawPhone || ''
    })
    await loadProfile()
    closeInfoEditor()
    showProfileMessage('基本信息已更新')
    emit('profile-updated')
  } catch (error) {
    editMsg.value = error?.msg || error?.message || '保存失败，请稍后重试'
    showProfileMessage(editMsg.value, 'error')
  }
}
function validatePwdBase({ silent = false } = {}) {
  let message = ''
  if (!pwd.value.old) message = '请输入当前密码'
  else if (!pwd.value.newPwd) message = '请输入新密码'
  else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,64}$/.test(pwd.value.newPwd)) message = '新密码需为 8-64 位，并同时包含英文字母和数字'
  else if (!pwd.value.confirm) message = '请再次输入新密码'
  else if (pwd.value.newPwd !== pwd.value.confirm) message = '两次密码输入不一致'
  if (!silent) pwdMsg.value = message
  return message
}
async function onSendPwdCode() {
  if (pwdCounting.value) return
  pwdMsg.value = ''
  if (!profile.value.hasPhone) { pwdMsg.value = '当前账号未绑定手机号，无法修改密码'; return }
  try {
    const response = await sendPasswordCode()
    if (import.meta.env.DEV && response?.data === '000000') pwd.value.smsCode = '000000'
    pwdCounting.value = true
    pwdCount.value = 60
    pwdTimer = setInterval(() => {
      pwdCount.value--
      if (pwdCount.value <= 0) {
        pwdCounting.value = false
        clearInterval(pwdTimer)
      }
    }, 1000)
  } catch (error) {
    pwdMsg.value = error?.msg || error?.message || '验证码发送失败，请稍后重试'
  }
}
async function onChangePwd() {
  pwdMsg.value = ''
  if (validatePwdBase()) return
  if (!pwd.value.smsCode) { pwdMsg.value = '请输入短信验证码'; return }
  try {
    await updateUserPassword(pwd.value.old, pwd.value.newPwd, pwd.value.smsCode)
    pwdMsg.value = '密码修改成功，请重新登录'
    setTimeout(() => {
      removeToken()
      router.replace('/login')
    }, 900)
  } catch (error) {
    pwdMsg.value = error?.msg || error?.message || '密码修改失败，请稍后重试'
  }
}

function resourceUrl(path) {
  if (!path) return ''
  if (/^(https?:\/\/|\/\/|blob:|data:)/i.test(path)) return path
  if (/^\/(assets|src)\//.test(String(path))) return path
  const base = import.meta.env.VITE_APP_BASE_API || ''
  const normalized = String(path).startsWith('/') ? String(path) : `/${path}`
  return `${base}${normalized}`.replace(/([^:]\/)\/+/g, '$1')
}

function maskPhone(value) {
  const phone = String(value || '')
  if (phone.length < 7) return phone || '-'
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

function accountTypeText(user) {
  if (user.parentUserId != null || user.accountType === 'sub') return '企业子账号'
  if (user.isAgent === 1 || user.isAgent === '1') return '企业代理账号'
  return '企业主账号'
}

function certText(status) {
  const map = { approved: '已认证', pending: '待审核', reviewing: '审核中', rejected: '未通过', draft: '待提交', none: '未认证' }
  return map[status] || '未认证'
}

function applyProfile(user) {
  const phone = user.phonenumber || user.phone || ''
  const email = user.email || ''
  profile.value = {
    ...profile.value,
    displayName: user.nickName || user.displayName || user.name || user.userName || '当前用户',
    accountType: accountTypeText(user),
    enterpriseName: user.enterpriseName || '-',
    userName: user.userName || '-',
    userId: String(user.userId || user.id || '-'),
    regTime: String(user.createTime || user.regTime || '-').slice(0, 10),
    phone: phone ? maskPhone(phone) : '尚未绑定手机',
    email: email || '尚未设置邮箱',
    address: user.address || '-',
    avatar: user.avatar || user.imgUrl || profile.value.avatar || '',
    rawParentUserId: user.parentUserId,
    rawAccountType: user.accountType,
    rawNickName: user.nickName || '',
    rawName: user.name || '',
    rawSex: user.sex ?? '2',
    rawPhone: phone,
    hasPhone: Boolean(phone),
    hasEmail: Boolean(email),
    pwdUpdateDate: user.pwdUpdateDate || ''
  }
}

async function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    showProfileMessage('仅支持 JPG、PNG 或 WebP 图片', 'error')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    showProfileMessage('图片大小不能超过 2MB', 'error')
    return
  }
  avatarUploading.value = true
  noticeVisible.value = false
  try {
    await uploadUserAvatar(file)
    await loadProfile()
    showProfileMessage('企业标志已更新')
    emit('profile-updated')
  } catch (error) {
    showProfileMessage(error?.msg || error?.message || '上传失败，请稍后重试', 'error')
  } finally {
    avatarUploading.value = false
  }
}

async function loadProfile() {
  const [profileRes, certRes] = await Promise.all([
    getUserProfile(),
    getMyEnterpriseCertList().catch(() => ({ rows: [] }))
  ])
  const user = profileRes.data || profileRes.user || {}
  applyProfile(user)
  setUser(user)
  const certList = certRes.rows || certRes.data || []
  const latestCert = certList.find(item => item?.status === 'approved')
    || certList.find(item => item?.status === 'pending' || item?.status === 'reviewing')
    || certList.find(item => item?.status === 'draft')
    || certList.find(item => item?.status === 'rejected')
    || certList.find(Boolean)
  const status = latestCert?.status || 'none'
  profile.value.certStatus = status
  profile.value.certStatusText = certText(status)
}

onBeforeUnmount(() => {
  clearInterval(pwdTimer)
  window.clearTimeout(noticeResetTimer)
})
onMounted(loadProfile)
</script>

<style scoped>
.profile-content{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;align-items:start}
.profile-card{padding:0;overflow:hidden}
.profile-card-head{min-height:118px;padding:24px 30px;display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid var(--border)}
.profile-identity{display:flex;align-items:center;gap:18px;min-width:0}
.profile-avatar{width:64px;height:64px;border:1px solid var(--border);background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;flex-shrink:0;overflow:hidden}
.profile-avatar.image{background:#fff}
.profile-avatar img{width:100%;height:100%;object-fit:cover}
.profile-title{min-width:0}
.profile-title h2{margin:0;color:var(--text1);font-size:20px;font-weight:700;line-height:1.35;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.profile-subline{margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:var(--text2);font-size:13px}
.field-stack{display:flex;flex-direction:column}
.profile-field{min-height:78px;padding:16px 30px;display:grid;grid-template-columns:150px minmax(0,1fr) 112px;gap:24px;align-items:center;border-bottom:1px solid var(--border2)}
.profile-field:last-child{border-bottom:none}
.profile-field:hover{background:#FAFBFC}
.field-name{color:var(--text2);font-size:14px;font-weight:600}
.field-main{min-width:0}
.field-main strong{display:block;color:var(--text1);font-size:15px;font-weight:700;line-height:1.5;overflow-wrap:anywhere}
.field-main p{margin:4px 0 0;color:var(--text3);font-size:13px;line-height:1.5}
.field-main.inline-value{grid-column:2 / 4;display:grid;grid-template-columns:minmax(0,260px) minmax(120px,1fr);align-items:center;gap:24px}
.inline-value strong{min-width:0}
.field-note{justify-self:end;color:var(--text3);font-size:14px;line-height:1.5;text-align:right;white-space:nowrap}
.field-inline{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.logo-main{display:flex;align-items:center;gap:14px}
.logo-main p{margin:0}
.field-logo{width:48px;height:48px;border:1px solid var(--border);background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;overflow:hidden;flex-shrink:0}
.field-logo.image{background:#fff}
.field-logo img{width:100%;height:100%;object-fit:cover}
.field-action{height:30px;width:88px;padding:0;display:inline-flex;align-items:center;justify-content:center;justify-self:end;border:none;background:var(--primary);color:#fff;font:inherit;font-size:13px;font-weight:500;text-decoration:none;cursor:pointer;white-space:nowrap}
.field-action:hover{opacity:.9}
.upload-action{position:relative}
.upload-action input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}

.profile-side-panel{display:flex;flex-direction:column;gap:20px}
.side-card-block{padding:24px}
.account-info-card{display:flex;flex-direction:column}
.side-card-block .card-title{margin-bottom:18px}
.side-list{display:flex;flex-direction:column;border-top:1px solid var(--border2)}
.side-row{min-height:54px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--border2);font-size:13px}
.side-row span{color:var(--text2);white-space:nowrap}
.side-row strong{min-width:0;color:var(--text1);font-size:13px;font-weight:600;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.side-action-row{display:flex;justify-content:flex-end;padding-top:16px}
.side-full-btn{min-width:104px;height:36px;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;background:var(--primary);border:none;color:#fff;font-size:14px;font-weight:500;line-height:1;text-decoration:none;white-space:nowrap}
.side-full-btn:hover{opacity:.9;background:var(--primary)}
.security-stack{display:flex;flex-direction:column;border-top:1px solid var(--border2)}
.security-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;min-height:72px;padding:16px 0;border-bottom:1px solid var(--border2)}
.security-item:last-child{border-bottom:none}
.security-copy{min-width:0}
.security-copy span{display:block;color:var(--text2);font-size:13px;font-weight:600}
.security-copy strong{display:block;margin-top:6px;color:var(--text1);font-size:15px;font-weight:700;line-height:1.45;overflow-wrap:anywhere}
.security-copy p{margin:6px 0 0;color:var(--text3);font-size:13px;line-height:1.5}

.password-form{display:grid;gap:8px}
.password-form .field{margin-bottom:0;gap:5px}
.password-form .field-label{font-size:13px;line-height:1.3}
.password-form .field-input{height:40px}
.password-input-wrap{position:relative}
.password-input-wrap .field-input{width:100%;padding-right:42px}
.password-input-wrap .field-input::-ms-reveal,
.password-input-wrap .field-input::-ms-clear{display:none;width:0;height:0}
.password-eye-btn{position:absolute;top:1px;right:1px;width:38px;height:38px;border:none;background:transparent;color:var(--text3);display:flex;align-items:center;justify-content:center;cursor:pointer}
.password-eye-btn:hover{background:#F8FAFC;color:var(--primary)}
.password-eye-icon{width:18px;height:18px;display:block}
.code-row{display:flex;gap:10px}
.code-row .field-input{flex:1}
.code-btn{height:40px;width:112px;border:1px solid #BAD0F3;background:#F8FBFF;color:var(--primary);font-size:13px;font-weight:600;font-family:inherit;cursor:pointer}
.code-btn:hover{background:#EEF4FF}
.code-btn:disabled{border-color:#E2E8F0;background:#F8FAFC;color:var(--text3);cursor:default}
.code-helper{font-size:12px;color:var(--text3);line-height:1.3}
.password-rule{margin:2px 0 0;padding:8px 10px;background:#F8FAFC;border:1px solid var(--border2);color:var(--text2);font-size:12px;line-height:1.5}
.profile-edit-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}
.profile-edit-grid .field{margin-bottom:0}

@media (max-width:1180px){
  .profile-content{grid-template-columns:1fr}
}

@media (max-width:760px){
  .profile-card-head{padding:20px;align-items:flex-start;flex-direction:column}
  .profile-title h2{white-space:normal;font-size:18px}
  .profile-field{grid-template-columns:1fr;gap:8px;padding:16px 20px}
  .field-main.inline-value{grid-column:auto;grid-template-columns:1fr;gap:4px}
  .field-note{justify-self:start;text-align:left;white-space:normal}
  .field-action{justify-self:start}
  .logo-main{align-items:flex-start;flex-direction:column}
  .side-card-block{padding:20px}
  .security-item{grid-template-columns:1fr}
  .security-item .field-action{justify-self:start}
  .code-row{flex-direction:column}
  .code-btn{width:100%}
}
</style>
