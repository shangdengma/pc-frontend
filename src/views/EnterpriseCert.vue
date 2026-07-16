<template>
  <section class="enterprise-cert-page">
    <div class="cert-hero">
      <div>
        <p class="eyebrow">账户中心</p>
        <h2>企业认证</h2>
        <p>{{ isSubAccount ? "认证信息继承自主账号。" : "提交企业资料，完成账户认证。" }}</p>
      </div>
      <button class="ghost-light-btn" type="button" :disabled="loading" @click="loadList">刷新状态</button>
    </div>

    <div class="cert-layout">
      <div class="work-card cert-status-card" :class="mainStatusClass">
        <div class="status-header">
          <span class="cert-status-icon" :class="mainStatusClass">
            <component :is="mainStatusIcon" :size="21" :stroke-width="1.8" />
          </span>
          <div>
            <h3>{{ mainCert ? statusText(mainCert.status) : '未认证' }}</h3>
            <p>{{ mainCert ? mainCert.enterpriseName || '企业认证申请' : '当前账号还未提交企业认证申请' }}</p>
          </div>
        </div>
        <div v-if="mainCert?.rejectReason" class="reject-box">
          驳回原因：{{ mainCert.rejectReason }}
        </div>
        <div class="status-actions">
          <button v-if="!mainCert && !isSubAccount" class="primary-action small" type="button" @click="openCreate">去认证</button>
          <button v-else-if="mainCert && mainCert.status === 'draft' && !isSubAccount" class="primary-action small" type="button" @click="openEdit(mainCert)">继续填写</button>
          <button v-else-if="mainCert && mainCert.status === 'rejected' && !isSubAccount" class="primary-action small" type="button" @click="openCreate">重新申请</button>
          <button v-else-if="mainCert" class="primary-action small" type="button" @click="openView(mainCert)">查看认证信息</button>
        </div>
        <div v-if="isSubAccount" class="inherit-tip">子账号使用主账号的企业认证状态，如需提交或修改认证资料，请联系主账号处理。</div>

        <div class="cert-steps">
          <div class="cert-step-title">认证流程</div>
          <ol>
            <li><span class="cs-num">1</span><div><strong>填写企业信息</strong><em>填写企业名称、联系人并上传营业执照</em></div></li>
            <li><span class="cs-num">2</span><div><strong>提交审核</strong><em>资料提交后由平台进行人工核验</em></div></li>
            <li><span class="cs-num">3</span><div><strong>认证完成</strong><em>认证结果同步至企业账户</em></div></li>
          </ol>
        </div>
      </div>

      <div class="work-card cert-history-card">
        <div class="work-card-head compact-head">
          <div>
            <h3>认证记录</h3>
          </div>
        </div>
        <div v-if="loading" class="state-box">正在加载认证记录...</div>
        <div v-else-if="!certList.length" class="state-box muted">暂无认证记录</div>
        <div v-else class="cert-list">
          <button
            v-for="item in certList"
            :key="item.id"
            type="button"
            class="cert-list-item"
            @click="isSubAccount || item.status !== 'draft' ? openView(item) : openEdit(item)"
          >
            <span class="cert-item-ico">
              <Building2 :size="18" :stroke-width="1.8" />
            </span>
            <span class="cert-item-main">
              <strong>{{ item.enterpriseName || '-' }}</strong>
              <em>{{ item.createTime || item.updateTime || '' }}</em>
            </span>
            <b :class="`status-badge ${statusClass(item.status)}`">{{ statusText(item.status) }}</b>
          </button>
        </div>
      </div>
    </div>

    <AppModal
      :open="panelVisible"
      :title="panelTitle"
      eyebrow="企业认证"
      :description="panelDesc"
      size="lg"
      @close="closePanel"
    >
      <div v-if="detailLoading" class="state-box">正在加载详情...</div>
      <template v-else>
          <div class="cert-form-grid">
            <label>
              <span>企业名称</span>
              <input v-model.trim="form.enterpriseName" :disabled="formReadonly" placeholder="请输入企业/个体工商户名称">
            </label>
            <label>
              <span>统一社会信用代码</span>
              <input v-model.trim="form.unifiedSocialCreditCode" :disabled="formReadonly" maxlength="32" placeholder="请输入统一社会信用代码/工商注册号">
            </label>
            <label>
              <span>法定代表人/负责人</span>
              <input v-model.trim="form.legalRepresentativeName" :disabled="formReadonly" placeholder="请输入法定代表人或负责人姓名">
            </label>
            <label>
              <span>联系人</span>
              <input v-model.trim="form.contactPerson" :disabled="formReadonly" placeholder="请输入联系人姓名">
            </label>
            <label>
              <span>联系电话</span>
              <input v-model.trim="form.contactPhone" :disabled="formReadonly" maxlength="11" inputmode="numeric" placeholder="请输入联系电话">
            </label>
          </div>

          <div class="license-section">
            <div class="license-title">
              <span>营业执照照片</span>
              <em v-if="canEdit">支持 JPG/PNG，上传后随认证信息一起提交</em>
            </div>
            <div class="license-list">
              <div v-for="file in fileList.business_license" :key="file.id || file.filePath" class="license-thumb">
                <img :src="fileUrl(file)" alt="营业执照" @click="previewFile(file)">
                <button v-if="canEdit" type="button" @click="removeLocalFile(file)">删除</button>
              </div>
              <label v-if="canEdit && fileList.business_license.length < 1" class="upload-tile">
                <input type="file" accept="image/*" @change="handleFileChange">
                <strong>+</strong>
                <span>{{ uploading ? '上传中...' : '上传营业执照' }}</span>
              </label>
            </div>
          </div>

          <div v-if="form.rejectReason" class="reject-box panel-reject">
            驳回原因：{{ form.rejectReason }}
          </div>

          <p v-if="errorMsg" class="error-line">{{ errorMsg }}</p>
          <p v-if="successMsg" class="form-success">{{ successMsg }}</p>

          <div v-if="canEdit" class="panel-actions">
            <button type="button" class="ghost-btn" :disabled="saving" @click="saveDraft">保存草稿</button>
            <button type="button" class="primary-action small" :disabled="saving" @click="submitAudit">提交审核</button>
          </div>
      </template>
    </AppModal>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { BadgeCheck, Building2, CircleX, Clock3, FilePenLine, ShieldCheck } from '@lucide/vue'
import AppModal from '../components/AppModal.vue'
import { getUserProfile } from '../api/user'
import { getUser, setUser } from '../utils/auth'
import {
  addEnterpriseCert,
  deleteEnterpriseCertFile,
  getEnterpriseCertDetail,
  getMyEnterpriseCertList,
  submitEnterpriseCert,
  updateEnterpriseCert,
  uploadEnterpriseCertImage
} from '../api/enterpriseCert'

const STATUS_MAP = {
  draft: { text: '草稿', className: 'draft' },
  pending: { text: '待审核', className: 'pending' },
  reviewing: { text: '审核中', className: 'reviewing' },
  approved: { text: '已认证', className: 'approved' },
  rejected: { text: '认证未通过', className: 'rejected' }
}

const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const panelVisible = ref(false)
const readonly = ref(false)
const currentId = ref('')
const certList = ref([])
const errorMsg = ref('')
const successMsg = ref('')
const profile = ref(getUser() || {})
const form = reactive({
  enterpriseName: '',
  unifiedSocialCreditCode: '',
  legalRepresentativeName: '',
  contactPerson: '',
  contactPhone: '',
  rejectReason: '',
  status: ''
})
const fileList = reactive({ business_license: [] })

const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))
const canEdit = computed(() => !isSubAccount.value && !readonly.value)
const formReadonly = computed(() => readonly.value || isSubAccount.value)
const panelTitle = computed(() => {
  if (isSubAccount.value) return '主账号企业认证信息'
  return readonly.value ? '认证信息' : currentId.value ? '编辑企业认证' : '提交企业认证'
})
const panelDesc = computed(() => isSubAccount.value ? '子账号继承主账号企业认证，仅支持查看资料。' : readonly.value ? '以下为已提交的企业认证资料。' : '请填写企业认证信息并上传营业执照。')

const mainCert = computed(() => {
  if (!certList.value.length) return null
  const list = certList.value.filter(Boolean)
  return list.find(i => i.status === 'approved')
    || list.find(i => i.status === 'draft')
    || list.find(i => i.status === 'pending' || i.status === 'reviewing')
    || list.find(i => i.status === 'rejected')
    || list[0]
    || null
})
const mainStatusClass = computed(() => mainCert.value ? statusClass(mainCert.value.status) : 'empty')
const mainStatusIcon = computed(() => ({
  approved: BadgeCheck,
  rejected: CircleX,
  pending: Clock3,
  reviewing: Clock3,
  draft: FilePenLine,
  empty: ShieldCheck
}[mainStatusClass.value] || ShieldCheck))

function statusText(status) {
  return STATUS_MAP[status]?.text || status || '-'
}

function statusClass(status) {
  return STATUS_MAP[status]?.className || 'empty'
}

function resetForm() {
  currentId.value = ''
  readonly.value = false
  errorMsg.value = ''
  successMsg.value = ''
  Object.assign(form, {
    enterpriseName: '',
    unifiedSocialCreditCode: '',
    legalRepresentativeName: '',
    contactPerson: '',
    contactPhone: '',
    rejectReason: '',
    status: ''
  })
  fileList.business_license = []
}

async function loadList() {
  loading.value = true
  try {
    const res = await getMyEnterpriseCertList()
    certList.value = (Array.isArray(res.data) ? res.data : []).filter(Boolean)
  } catch (error) {
    certList.value = []
  } finally {
    loading.value = false
  }
}

async function loadDetail(id) {
  detailLoading.value = true
  errorMsg.value = ''
  try {
    const res = await getEnterpriseCertDetail(id)
    const data = res.data || {}
    Object.assign(form, {
      enterpriseName: data.enterpriseName || '',
      unifiedSocialCreditCode: data.unifiedSocialCreditCode || '',
      legalRepresentativeName: data.legalRepresentativeName || '',
      contactPerson: data.contactPerson || '',
      contactPhone: data.contactPhone || '',
      rejectReason: data.rejectReason || '',
      status: data.status || ''
    })
    const files = Array.isArray(data.fileList) ? data.fileList : []
    fileList.business_license = files.filter(file => file.fileType === 'business_license')
  } catch (error) {
    errorMsg.value = error?.msg || error?.message || '加载认证详情失败'
  } finally {
    detailLoading.value = false
  }
}

function openCreate() {
  if (isSubAccount.value) {
    errorMsg.value = '子账号继承主账号企业认证，无权提交或修改企业认证'
    return
  }
  resetForm()
  panelVisible.value = true
}

function openEdit(item) {
  if (!item || !item.id) return
  resetForm()
  currentId.value = item.id
  readonly.value = isSubAccount.value
  panelVisible.value = true
  loadDetail(item.id)
}

function openView(item) {
  if (!item || !item.id) return
  resetForm()
  currentId.value = item.id
  readonly.value = true
  panelVisible.value = true
  loadDetail(item.id)
}

function closePanel() {
  panelVisible.value = false
}

function fileUrl(file) {
  const path = file?.filePath || ''
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path)) return path
  const base = import.meta.env.VITE_APP_BASE_API || ''
  let p = String(path).trim()
  if (base && p.startsWith(base)) return `${base}${encodePath(p.slice(base.length) || '/')}`.replace(/([^:]\/)\/+/g, '$1')
  if (!p.startsWith('/')) p = `/${p}`
  return `${base}${encodePath(p)}`.replace(/([^:]\/)\/+/g, '$1')
}

function encodePath(path) {
  return path.split('/').map(segment => {
    if (!segment) return segment
    try {
      return encodeURIComponent(decodeURIComponent(segment))
    } catch (error) {
      return encodeURIComponent(segment)
    }
  }).join('/')
}

function previewFile(file) {
  const url = fileUrl(file)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

async function handleFileChange(event) {
  if (isSubAccount.value) {
    errorMsg.value = '子账号继承主账号企业认证，无权上传认证附件'
    event.target.value = ''
    return
  }
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || uploading.value) return
  uploading.value = true
  errorMsg.value = ''
  try {
    const res = await uploadEnterpriseCertImage(file)
    const uploaded = {
      filePath: res.filePath || res.data?.filePath,
      fileName: res.fileName || res.data?.fileName || file.name,
      fileType: 'business_license'
    }
    if (!uploaded.filePath) throw new Error('上传接口未返回文件路径')
    fileList.business_license = [uploaded]
  } catch (error) {
    errorMsg.value = error?.msg || error?.message || '营业执照上传失败'
  } finally {
    uploading.value = false
  }
}

async function removeLocalFile(file) {
  if (isSubAccount.value) {
    errorMsg.value = '子账号继承主账号企业认证，无权删除认证附件'
    return
  }
  if (file.id) {
    if (!window.confirm('确定删除该附件？')) return
    try { await deleteEnterpriseCertFile(file.id) } catch (error) {
      errorMsg.value = error?.msg || error?.message || '删除附件失败'
      return
    }
  }
  fileList.business_license = fileList.business_license.filter(item => item !== file)
}

function collectBody() {
  const newFiles = currentId.value
    ? fileList.business_license.filter(file => file.filePath && !file.id)
    : fileList.business_license.filter(file => file.filePath)
  const body = {
    enterpriseName: form.enterpriseName,
    unifiedSocialCreditCode: form.unifiedSocialCreditCode || '',
    legalRepresentativeName: form.legalRepresentativeName || '',
    contactPerson: form.contactPerson,
    contactPhone: form.contactPhone
  }
  if (newFiles.length) {
    body.fileList = newFiles.map((file, index) => ({
      fileType: file.fileType || 'business_license',
      filePath: file.filePath,
      fileName: file.fileName || '',
      sortOrder: index
    }))
  }
  return body
}

function validateForSubmit() {
  if (!form.enterpriseName) return '请填写企业名称'
  if (!form.unifiedSocialCreditCode) return '请填写统一社会信用代码'
  if (!form.legalRepresentativeName) return '请填写法定代表人或负责人姓名'
  if (!form.contactPerson) return '请填写联系人姓名'
  if (!/^1[3-9]\d{9}$/.test(form.contactPhone || '')) return '请填写正确的联系电话'
  if (!fileList.business_license.length) return '请上传营业执照照片'
  return ''
}

async function saveDraft() {
  if (isSubAccount.value) {
    errorMsg.value = '子账号继承主账号企业认证，无权提交或修改企业认证'
    return
  }
  errorMsg.value = ''
  successMsg.value = ''
  if (!form.enterpriseName) {
    errorMsg.value = '请至少填写企业名称'
    return
  }
  saving.value = true
  try {
    const body = collectBody()
    if (currentId.value) {
      await updateEnterpriseCert(currentId.value, body)
    } else {
      const res = await addEnterpriseCert(body)
      currentId.value = res.data?.id || res.data || ''
    }
    successMsg.value = '草稿保存成功'
    await loadList()
    if (currentId.value) await loadDetail(currentId.value)
  } catch (error) {
    errorMsg.value = error?.msg || error?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function submitAudit() {
  if (isSubAccount.value) {
    errorMsg.value = '子账号继承主账号企业认证，无权提交或修改企业认证'
    return
  }
  errorMsg.value = ''
  successMsg.value = ''
  const validationError = validateForSubmit()
  if (validationError) {
    errorMsg.value = validationError
    return
  }
  if (!window.confirm('提交后将无法修改，确认提交审核？')) return

  saving.value = true
  try {
    const body = collectBody()
    if (currentId.value) {
      await updateEnterpriseCert(currentId.value, body)
    } else {
      const res = await addEnterpriseCert(body)
      currentId.value = res.data?.id || res.data || ''
    }
    if (!currentId.value) throw new Error('未获取到认证申请ID')
    await submitEnterpriseCert(currentId.value)
    successMsg.value = '提交成功，请等待审核'
    await loadList()
    window.setTimeout(closePanel, 1000)
  } catch (error) {
    errorMsg.value = error?.msg || error?.message || '提交失败'
  } finally {
    saving.value = false
  }
}

async function loadProfile() {
  try {
    const res = await getUserProfile()
    const user = res.data || res.user || {}
    profile.value = user
    setUser(user)
  } catch (error) {}
}

onMounted(async () => {
  await loadProfile()
  await loadList()
})
</script>

<style scoped>
/* 整体布局：状态卡片与认证记录更均衡的两栏 */
.cert-layout {
  grid-template-columns: minmax(360px, .82fr) minmax(0, 1.18fr);
  align-items: stretch;
}

.cert-status-card,
.cert-history-card {
  display: flex;
  flex-direction: column;
}

/* 认证状态图标徽章，替换原小圆点 */
.cert-status-icon {
  width: 48px;
  height: 48px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #667085;
  background: #f2f4f7;
}

.cert-status-icon svg {
  width: 24px;
  height: 24px;
}

.cert-status-icon.approved { color: #12b76a; background: #ecfdf3; }
.cert-status-icon.draft { color: var(--blue); background: #eaf1ff; }
.cert-status-icon.pending,
.cert-status-icon.reviewing { color: #f79009; background: #fff7ed; }
.cert-status-icon.rejected { color: #f04438; background: #fef3f2; }

.inherit-tip {
  margin-top: 18px;
  padding: 12px 14px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  color: #2354a4;
  background: #eff6ff;
  font-size: 14px;
  line-height: 1.6;
}

/* 认证流程步骤 */
.cert-steps {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.cert-step-title {
  margin-bottom: 16px;
  color: #101828;
  font-size: 15px;
  font-weight: 800;
}

.cert-steps ol {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cert-steps li {
  position: relative;
  display: flex;
  gap: 14px;
  padding-bottom: 20px;
}

.cert-steps li:last-child {
  padding-bottom: 0;
}

/* 连接竖线 */
.cert-steps li:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 13px;
  top: 30px;
  bottom: 2px;
  width: 2px;
  background: #e6edf5;
}

.cs-num {
  position: relative;
  z-index: 1;
  width: 28px;
  height: 28px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--blue);
  background: #eaf1ff;
  font-size: 13px;
  font-weight: 800;
}

.cert-steps strong {
  display: block;
  color: #101828;
  font-size: 14px;
}

.cert-steps em {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
  font-style: normal;
  line-height: 1.6;
}

/* 认证记录项：左图标 + 信息 + 状态徽章 */
.cert-list-item {
  display: flex;
  align-items: center;
  gap: 14px;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.cert-list-item:hover {
  border-color: #cfd9e7;
  background: #f8fafc;
}

.cert-item-ico {
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--blue);
  background: #eaf1ff;
}

.cert-item-ico svg {
  width: 20px;
  height: 20px;
}

.cert-item-main {
  flex: 1;
  min-width: 0;
}

.cert-item-main strong {
  display: block;
  font-size: 15px;
}

.cert-item-main em {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 13px;
  font-style: normal;
}

.status-badge {
  flex: none;
}

/* 上传区域的虚线框悬浮高亮 */
.upload-tile {
  transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
}

.upload-tile:hover {
  color: var(--blue);
  border-color: var(--blue);
  background: #f4f8ff;
}

@media (max-width: 1280px) {
  .cert-layout {
    grid-template-columns: 1fr;
  }
}
</style>

