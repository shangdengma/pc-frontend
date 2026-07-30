<template>
  <main class="main-content">
    <TopSlideNotice
      v-model="noticeVisible"
      :type="noticeType"
      :title="noticeTitle"
      :message="noticeMessage"
    />

    <div class="cert-layout">
      <div class="cert-left">
        <div class="card cert-status-card" :class="mainStatusClass">
          <div class="cert-status-head">
            <div class="cert-status-icon" :class="mainStatusClass">
              <svg v-if="mainStatusClass === 'approved'" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="mainStatusClass === 'pending' || mainStatusClass === 'reviewing'" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
                <path d="M12 7V12L15.5 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              <svg v-else-if="mainStatusClass === 'draft'" viewBox="0 0 24 24" fill="none">
                <path d="M7 4H14L18 8V20H7V4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M14 4V8H18M10 13H15M10 16H14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="mainStatusClass === 'rejected'" viewBox="0 0 24 24" fill="none">
                <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none">
                <path d="M12 3L5 6V11C5 15.4 7.9 19.2 12 20.5C16.1 19.2 19 15.4 19 11V6L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="cert-status-info">
              <div class="cert-status-title">{{ mainCert ? statusText(mainCert.status) : '未认证' }}</div>
              <div class="cert-status-desc">{{ mainCert ? mainCert.enterpriseName || '企业认证申请' : '当前账号还未提交企业认证申请' }}</div>
            </div>
          </div>

          <div v-if="mainCert?.rejectReason" class="reject-box">
            驳回原因：{{ mainCert.rejectReason }}
          </div>

          <div class="cert-actions">
            <button v-if="!mainCert && !isSubAccount" class="btn-primary cert-btn" type="button" @click="openCreate">去认证</button>
            <button v-else-if="mainCert && mainCert.status === 'draft' && !isSubAccount" class="btn-primary cert-btn" type="button" @click="openEdit(mainCert)">继续填写</button>
            <button v-else-if="mainCert && mainCert.status === 'rejected' && !isSubAccount" class="btn-primary cert-btn" type="button" @click="openCreate">重新认证</button>
            <button v-else-if="mainCert" class="btn-outline cert-btn" type="button" @click="openView(mainCert)">查看认证信息</button>
            <button v-if="mainCert && mainCert.status === 'approved' && !isSubAccount" class="btn-primary cert-btn" type="button" @click="openCreate">重新认证</button>
            <button class="btn-outline cert-btn" type="button" :disabled="loading" @click="loadList">刷新状态</button>
          </div>

          <div v-if="isSubAccount" class="inherit-tip">
            子账号使用主账号的企业认证状态，如需提交或修改认证资料，请联系主账号处理。
          </div>

          <div class="cert-steps">
            <h3>认证流程</h3>
            <ol>
              <li>
                <span class="step-num">1</span>
                <div><strong>填写企业信息</strong><em>填写企业名称、联系人并上传营业执照</em></div>
              </li>
              <li>
                <span class="step-num">2</span>
                <div><strong>提交审核</strong><em>资料提交后由平台进行人工核验</em></div>
              </li>
              <li>
                <span class="step-num">3</span>
                <div><strong>认证完成</strong><em>认证结果同步至企业账户</em></div>
              </li>
            </ol>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">认证权益</h3>
          <ul class="benefit-list">
            <li class="benefit-item"><span class="benefit-icon"></span><span>解锁全部背调套餐（含深度背调）</span></li>
            <li class="benefit-item"><span class="benefit-icon"></span><span>支持批量查询与 API 对接</span></li>
            <li class="benefit-item"><span class="benefit-icon"></span><span>专属客服与优先审核通道</span></li>
            <li class="benefit-item"><span class="benefit-icon"></span><span>企业专属发票与合同管理</span></li>
          </ul>
        </div>
      </div>

      <div class="cert-right">
        <div class="card" v-if="mainCert">
          <h3 class="card-title">当前认证信息</h3>
          <div class="desc-grid cols-2">
            <div class="desc-item">
              <span class="desc-label">企业名称</span>
              <span class="desc-value">{{ mainCert.enterpriseName || '-' }}</span>
            </div>
            <div class="desc-item">
              <span class="desc-label">统一社会信用代码</span>
              <span class="desc-value mono">{{ mainCert.unifiedSocialCreditCode || '-' }}</span>
            </div>
            <div class="desc-item">
              <span class="desc-label">法定代表人/负责人</span>
              <span class="desc-value">{{ mainCert.legalRepresentativeName || '-' }}</span>
            </div>
            <div class="desc-item">
              <span class="desc-label">联系人</span>
              <span class="desc-value">{{ mainCert.contactPerson || '-' }}</span>
            </div>
            <div class="desc-item">
              <span class="desc-label">联系电话</span>
              <span class="desc-value">{{ mainCert.contactPhone || '-' }}</span>
            </div>
            <div class="desc-item">
              <span class="desc-label">认证状态</span>
              <span class="desc-value">
                <span class="status-badge" :class="statusTone(mainCert.status)">{{ statusText(mainCert.status) }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="card cert-records-card">
          <div class="card-header">
            <h3 class="card-title">认证记录</h3>
          </div>
          <div v-if="loading" class="state-box">正在加载认证记录...</div>
          <div v-else-if="certList.length === 0" class="empty">暂无认证记录</div>
          <div v-else class="cert-records">
            <button
              v-for="item in certList"
              :key="item.id"
              type="button"
              class="cert-record"
              @click="openRecord(item)"
            >
              <span class="record-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="3" width="14" height="18" stroke="currentColor" stroke-width="1.7"/>
                  <path d="M9 8H11M13 8H15M9 12H11M13 12H15M9 16H15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="record-main">
                <strong>{{ item.enterpriseName || '-' }}</strong>
                <em>{{ item.createTime || item.updateTime || '-' }}</em>
              </span>
              <span class="status-badge" :class="statusTone(item.status)">{{ statusText(item.status) }}</span>
            </button>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">常见问题</h3>
          <div class="faq-list">
            <div class="faq-item">
              <div class="faq-q">认证需要多长时间？</div>
              <div class="faq-a">资料齐全的情况下，审核通常在 1-3 个工作日内完成。</div>
            </div>
            <div class="faq-item">
              <div class="faq-q">认证失败怎么办？</div>
              <div class="faq-a">请根据驳回原因修正企业资料后重新提交。</div>
            </div>
            <div class="faq-item">
              <div class="faq-q">子账号可以提交认证吗？</div>
              <div class="faq-a">子账号继承主账号企业认证，仅支持查看认证资料。</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppModal
      v-model="panelVisible"
      :title="panelTitle"
      eyebrow="企业认证"
      :description="panelDesc"
      size="lg"
      :footer-visible="canEdit && !detailLoading"
      @close="closePanel"
    >
      <div v-if="detailLoading" class="state-box">正在加载详情...</div>
      <template v-else>
        <div class="cert-form-grid">
          <label class="field">
            <span class="field-label">企业名称 <span class="required">*</span></span>
            <input v-model.trim="form.enterpriseName" class="field-input" :disabled="formReadonly" placeholder="请输入企业/个体工商户名称" />
          </label>
          <label class="field">
            <span class="field-label">统一社会信用代码 <span class="required">*</span></span>
            <input v-model.trim="form.unifiedSocialCreditCode" class="field-input" :disabled="formReadonly" maxlength="32" placeholder="请输入统一社会信用代码/工商注册号" />
          </label>
          <label class="field">
            <span class="field-label">法定代表人/负责人 <span class="required">*</span></span>
            <input v-model.trim="form.legalRepresentativeName" class="field-input" :disabled="formReadonly" placeholder="请输入法定代表人或负责人姓名" />
          </label>
          <label class="field">
            <span class="field-label">联系人 <span class="required">*</span></span>
            <input v-model.trim="form.contactPerson" class="field-input" :disabled="formReadonly" placeholder="请输入联系人姓名" />
          </label>
          <label class="field">
            <span class="field-label">联系电话 <span class="required">*</span></span>
            <input v-model.trim="form.contactPhone" class="field-input" :disabled="formReadonly" maxlength="11" inputmode="numeric" placeholder="请输入联系电话" />
          </label>
        </div>

        <div class="license-section">
          <div class="license-title">
            <span>营业执照照片 <b v-if="canEdit">*</b></span>
            <em v-if="canEdit">支持 JPG/PNG，单张不超过 5MB，上传后随认证信息一起提交</em>
          </div>
          <div class="license-list">
            <div v-for="file in fileList.business_license" :key="file.id || file.fileId || file.filePath || file.previewUrl" class="license-thumb">
              <img :src="fileUrl(file)" alt="营业执照" @click="previewFile(file)" />
              <button v-if="canEdit" type="button" @click="removeLocalFile(file)">删除</button>
            </div>
            <label v-if="canEdit && fileList.business_license.length < 1" class="upload-tile">
              <input type="file" accept="image/jpeg,image/png" @change="handleFileChange" />
              <strong>+</strong>
              <span>{{ uploading ? '上传中...' : '上传营业执照' }}</span>
            </label>
          </div>
        </div>

        <div v-if="form.rejectReason" class="reject-box panel-reject">
          驳回原因：{{ form.rejectReason }}
        </div>

        <FormAlert class="cert-form-alert" :message="errorMsg" type="error" />
      </template>

      <template #footer>
        <button type="button" class="btn-outline" :disabled="saving" @click="saveDraft">保存草稿</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="submitAudit">提交审核</button>
      </template>
    </AppModal>

    <ResultModal
      v-model="auditConfirmVisible"
      type="warning"
      title="确认提交审核"
      description="提交后将进入企业认证审核流程，审核期间认证资料将无法继续修改。"
      primary-text="确认提交"
      secondary-text="取消"
      @primary="confirmSubmitAudit"
      @secondary="auditConfirmVisible = false"
      @close="auditConfirmVisible = false"
    />
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AppModal from '../components/AppModal.vue'
import FormAlert from '../components/FormAlert.vue'
import ResultModal from '../components/ResultModal.vue'
import TopSlideNotice from '../components/TopSlideNotice.vue'
import { getUserProfile } from '../api/user'
import {
  addEnterpriseCert,
  deleteEnterpriseCertFile,
  fetchEnterpriseCertFile,
  getEnterpriseCertDetail,
  getMyEnterpriseCertList,
  submitEnterpriseCert,
  updateEnterpriseCert,
  uploadEnterpriseCertImage
} from '../api/enterpriseCert'
import { setUser } from '../utils/auth'

const STATUS_MAP = {
  draft: { text: '草稿', tone: 'info' },
  pending: { text: '待审核', tone: 'warning' },
  reviewing: { text: '审核中', tone: 'warning' },
  approved: { text: '已认证', tone: 'success' },
  rejected: { text: '认证未通过', tone: 'error' },
  none: { text: '未认证', tone: 'neutral' }
}

const MAX_LICENSE_FILE_SIZE = 5 * 1024 * 1024

const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const panelVisible = ref(false)
const readonly = ref(false)
const currentId = ref('')
const certList = ref([])
const errorMsg = ref('')
const auditConfirmVisible = ref(false)
const profile = ref({})
const createdObjectUrls = []
const persistedBlobUrls = reactive({})
const noticeVisible = ref(false)
const noticeType = ref('success')
const noticeTitle = ref('')
const noticeMessage = ref('')

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

const mainCert = computed(() => {
  const list = certList.value.filter(Boolean)
  return list.find(i => i.status === 'approved')
    || list.find(i => i.status === 'draft')
    || list.find(i => i.status === 'pending' || i.status === 'reviewing')
    || list.find(i => i.status === 'rejected')
    || list[0]
    || null
})
const mainStatusClass = computed(() => mainCert.value ? statusClass(mainCert.value.status) : 'empty')
const panelTitle = computed(() => {
  if (isSubAccount.value) return '主账号企业认证信息'
  if (readonly.value) return '认证信息'
  return currentId.value ? '编辑企业认证' : '提交企业认证'
})
const panelDesc = computed(() => {
  if (isSubAccount.value) return '子账号继承主账号企业认证，仅支持查看资料。'
  if (readonly.value) return '以下为已提交的企业认证资料。'
  return '请填写企业认证信息并上传营业执照。'
})

function statusText(status) {
  return STATUS_MAP[status]?.text || status || '-'
}

function statusTone(status) {
  return STATUS_MAP[status]?.tone || 'neutral'
}

function statusClass(status) {
  return STATUS_MAP[status] ? status : 'empty'
}

function normalizeCert(item = {}) {
  const status = item.status || 'none'
  return {
    ...item,
    id: item.id,
    enterpriseName: item.enterpriseName || item.name || '',
    unifiedSocialCreditCode: item.unifiedSocialCreditCode || item.creditCode || item.code || '',
    legalRepresentativeName: item.legalRepresentativeName || item.legalPerson || '',
    contactPerson: item.contactPerson || '',
    contactPhone: item.contactPhone || '',
    rejectReason: item.rejectReason || '',
    status,
    createTime: item.createTime || '',
    updateTime: item.updateTime || '',
    fileList: Array.isArray(item.fileList) ? item.fileList.map(file => normalizeCertFile(file)).filter(file => file.filePath) : []
  }
}

function firstString(...values) {
  const value = values.find(item => item !== undefined && item !== null && String(item).trim() !== '')
  return value === undefined ? '' : String(value).trim()
}

function persistedFileKey(file) {
  return firstString(file?.id, file?.fileId)
}

function isPathLike(value) {
  return /^(https?:)?\/\//i.test(value) || value.startsWith('/') || value.includes('\\')
}

function normalizeStoragePath(value) {
  let path = firstString(value)
  if (!path) return ''
  const base = import.meta.env.VITE_APP_BASE_API || ''
  if (base && path.startsWith(base)) path = path.slice(base.length) || '/'
  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(path)
      path = `${parsed.pathname}${parsed.search || ''}`
    } catch (error) {}
  }
  return path.replace(/\\/g, '/')
}

function fileBaseName(value, fallback = '') {
  const path = firstString(value)
  if (!path) return fallback
  const clean = path.split('?')[0].split('#')[0].replace(/\\/g, '/')
  const name = clean.split('/').filter(Boolean).pop() || fallback
  try {
    return decodeURIComponent(name)
  } catch (error) {
    return name
  }
}

function normalizeCertFile(file = {}, fallbackName = '') {
  const rawFileName = firstString(file.fileName, file.name)
  const rawPath = firstString(
    file.filePath,
    file.fileUrl,
    file.path,
    file.url,
    file.src,
    isPathLike(rawFileName) ? rawFileName : ''
  )
  const filePath = normalizeStoragePath(rawPath)
  const fileName = firstString(
    file.originalFilename,
    file.originalFileName,
    !isPathLike(rawFileName) ? rawFileName : '',
    file.newFileName,
    fallbackName,
    fileBaseName(filePath)
  )
  return {
    ...file,
    filePath,
    fileName,
    fileType: file.fileType || 'business_license'
  }
}

function revokeFilePreview(file) {
  if (!file?.previewUrl) return
  URL.revokeObjectURL(file.previewUrl)
  const index = createdObjectUrls.indexOf(file.previewUrl)
  if (index >= 0) createdObjectUrls.splice(index, 1)
}

function revokePersistedBlob(file) {
  const key = typeof file === 'string' ? file : persistedFileKey(file)
  if (!key || !persistedBlobUrls[key]) return
  URL.revokeObjectURL(persistedBlobUrls[key])
  delete persistedBlobUrls[key]
}

function releasePersistedBlobs() {
  Object.keys(persistedBlobUrls).forEach(revokePersistedBlob)
}

function resetForm() {
  fileList.business_license.forEach(revokeFilePreview)
  fileList.business_license.forEach(revokePersistedBlob)
  currentId.value = ''
  readonly.value = false
  errorMsg.value = ''
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

function showCertNotice(title, message, type = 'success') {
  noticeVisible.value = false
  noticeType.value = type
  noticeTitle.value = title
  noticeMessage.value = message
  window.setTimeout(() => {
    noticeVisible.value = true
  }, 0)
}

function withUploadTimeout(promise, timeout = 30000) {
  let timer = null
  const timeoutPromise = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error('营业执照上传超时，请稍后重试')), timeout)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timer)
  })
}

async function loadProfile() {
  try {
    const res = await getUserProfile()
    const user = res.data || res.user || {}
    profile.value = user
    setUser(user)
  } catch (error) {}
}

async function loadList() {
  loading.value = true
  try {
    const res = await getMyEnterpriseCertList()
    const rows = Array.isArray(res.data) ? res.data : (res.rows || [])
    certList.value = rows.filter(Boolean).map(normalizeCert)
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
    const data = normalizeCert(res.data || {})
    Object.assign(form, {
      enterpriseName: data.enterpriseName,
      unifiedSocialCreditCode: data.unifiedSocialCreditCode,
      legalRepresentativeName: data.legalRepresentativeName,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      rejectReason: data.rejectReason,
      status: data.status
    })
    fileList.business_license = data.fileList
      .map(file => normalizeCertFile(file))
      .filter(file => file.fileType === 'business_license' && file.filePath)
    fileList.business_license.forEach(ensureBlob)
  } catch (error) {
    errorMsg.value = error?.msg || error?.message || '加载认证详情失败'
  } finally {
    detailLoading.value = false
  }
}

function openCreate() {
  if (isSubAccount.value) {
    errorMsg.value = '子账号继承主账号企业认证，无权提交或修改企业认证'
    showCertNotice('操作失败', errorMsg.value, 'error')
    return
  }
  resetForm()
  panelVisible.value = true
}

function openEdit(item) {
  if (!item?.id) return
  resetForm()
  currentId.value = item.id
  readonly.value = isSubAccount.value
  panelVisible.value = true
  loadDetail(item.id)
}

function openView(item) {
  if (!item?.id) return
  resetForm()
  currentId.value = item.id
  readonly.value = true
  panelVisible.value = true
  loadDetail(item.id)
}

function openRecord(item) {
  if (isSubAccount.value || item.status !== 'draft') openView(item)
  else openEdit(item)
}

function closePanel() {
  panelVisible.value = false
}

async function ensureBlob(file) {
  const key = persistedFileKey(file)
  if (!key || file?.isNew || file?.previewUrl || persistedBlobUrls[key]) return
  try {
    const blob = await fetchEnterpriseCertFile(key)
    persistedBlobUrls[key] = URL.createObjectURL(blob)
  } catch (error) {
    // 附件预览失败不阻塞认证表单，保留页面可继续编辑和提交。
  }
}

function fileUrl(file) {
  if (file?.previewUrl) return file.previewUrl
  const key = persistedFileKey(file)
  if (key && !file?.isNew) return persistedBlobUrls[key] || ''
  const path = file?.filePath || file?.url || ''
  if (!path) return ''
  if (/^(blob:|https?:\/\/|\/\/)/i.test(path)) return path
  const base = import.meta.env.VITE_APP_BASE_API || ''
  let normalized = String(path).trim()
  if (base && normalized.startsWith(base)) return `${base}${encodePath(normalized.slice(base.length) || '/')}`.replace(/([^:]\/)\/+/g, '$1')
  if (!normalized.startsWith('/')) normalized = `/${normalized}`
  return `${base}${encodePath(normalized)}`.replace(/([^:]\/)\/+/g, '$1')
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

async function previewFile(file) {
  await ensureBlob(file)
  const url = fileUrl(file)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

async function handleFileChange(event) {
  if (isSubAccount.value) {
    errorMsg.value = '子账号继承主账号企业认证，无权上传认证附件'
    showCertNotice('上传失败', errorMsg.value, 'error')
    event.target.value = ''
    return
  }
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || uploading.value) return
  if (!/^image\/(png|jpeg)$/.test(file.type)) {
    errorMsg.value = '营业执照仅支持 JPG 或 PNG 图片'
    showCertNotice('上传失败', errorMsg.value, 'error')
    return
  }
  if (file.size > MAX_LICENSE_FILE_SIZE) {
    errorMsg.value = `图片 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过 5MB 上限，请压缩后重试`
    showCertNotice('上传失败', errorMsg.value, 'error')
    return
  }
  uploading.value = true
  errorMsg.value = ''
  let previewUrl = ''
  try {
    previewUrl = URL.createObjectURL(file)
    createdObjectUrls.push(previewUrl)
    const res = await withUploadTimeout(uploadEnterpriseCertImage(file))
    const payload = res?.data && typeof res.data === 'object' ? res.data : {}
    const uploaded = normalizeCertFile({
      ...payload,
      id: firstString(res?.id, payload.id),
      fileId: firstString(res?.fileId, payload.fileId),
      filePath: firstString(
        res?.filePath,
        payload.filePath,
        payload.fileUrl,
        payload.path,
        typeof res?.data === 'string' ? res.data : '',
        res?.url,
        payload.url,
        isPathLike(firstString(res?.fileName, payload.fileName)) ? firstString(res?.fileName, payload.fileName) : ''
      ),
      fileName: firstString(res?.fileName, payload.fileName, payload.originalFilename, payload.originalFileName, file.name),
      fileType: 'business_license',
      previewUrl,
      isNew: true
    }, file.name)
    if (!uploaded.filePath) throw new Error('上传接口未返回文件路径')
    fileList.business_license.forEach(revokeFilePreview)
    fileList.business_license = [uploaded]
    showCertNotice('上传成功', '营业执照已上传，可继续保存草稿或提交审核。')
  } catch (error) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      const index = createdObjectUrls.indexOf(previewUrl)
      if (index >= 0) createdObjectUrls.splice(index, 1)
    }
    errorMsg.value = error?.msg || error?.message || '营业执照上传失败'
    showCertNotice('上传失败', errorMsg.value, 'error')
  } finally {
    uploading.value = false
  }
}

async function removeLocalFile(file) {
  if (isSubAccount.value) {
    errorMsg.value = '子账号继承主账号企业认证，无权删除认证附件'
    showCertNotice('操作失败', errorMsg.value, 'error')
    return
  }
  if (file.id && !file.isNew) {
    try {
      await deleteEnterpriseCertFile(file.id)
    } catch (error) {
      errorMsg.value = error?.msg || error?.message || '删除附件失败'
      showCertNotice('删除失败', errorMsg.value, 'error')
      return
    }
  }
  revokeFilePreview(file)
  revokePersistedBlob(file)
  fileList.business_license = fileList.business_license.filter(item => item !== file)
}

function collectBody() {
  const newFiles = currentId.value
    ? fileList.business_license.filter(file => file.filePath && (!file.id || file.isNew))
    : fileList.business_license.filter(file => file.filePath)
  const body = {
    enterpriseName: form.enterpriseName,
    unifiedSocialCreditCode: form.unifiedSocialCreditCode,
    legalRepresentativeName: form.legalRepresentativeName,
    contactPerson: form.contactPerson,
    contactPhone: form.contactPhone
  }
  if (newFiles.length) {
    body.fileList = newFiles.map((file, index) => ({
      fileType: file.fileType || 'business_license',
      filePath: normalizeStoragePath(file.filePath),
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
    showCertNotice('保存失败', errorMsg.value, 'error')
    return
  }
  errorMsg.value = ''
  if (!form.enterpriseName) {
    errorMsg.value = '请至少填写企业名称'
    showCertNotice('保存失败', errorMsg.value, 'error')
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
    showCertNotice('草稿保存成功', '企业认证资料已保存，可稍后继续编辑或提交审核。')
    await loadList()
    if (currentId.value) await loadDetail(currentId.value)
  } catch (error) {
    errorMsg.value = error?.msg || error?.message || '保存失败'
    showCertNotice('保存失败', errorMsg.value, 'error')
  } finally {
    saving.value = false
  }
}

async function submitAudit() {
  if (isSubAccount.value) {
    errorMsg.value = '子账号继承主账号企业认证，无权提交或修改企业认证'
    showCertNotice('提交失败', errorMsg.value, 'error')
    return
  }
  errorMsg.value = ''
  const validationError = validateForSubmit()
  if (validationError) {
    errorMsg.value = validationError
    showCertNotice('提交失败', errorMsg.value, 'error')
    return
  }
  auditConfirmVisible.value = true
}

async function confirmSubmitAudit() {
  auditConfirmVisible.value = false
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
    showCertNotice('提交成功', '认证申请已提交，请等待审核。')
    await loadList()
    window.setTimeout(closePanel, 1000)
  } catch (error) {
    errorMsg.value = error?.msg || error?.message || '提交失败'
    showCertNotice('提交失败', errorMsg.value, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadProfile()
  await loadList()
})

onBeforeUnmount(() => {
  createdObjectUrls.forEach(url => URL.revokeObjectURL(url))
  releasePersistedBlobs()
})
</script>

<style scoped>
.cert-layout{display:grid;grid-template-columns:380px minmax(0,1fr);gap:20px;align-items:start}
.cert-left,.cert-right{display:flex;flex-direction:column;gap:20px;min-width:0}
.cert-status-card{display:flex;flex-direction:column;gap:22px}
.cert-status-head{display:flex;align-items:center;gap:16px}
.cert-status-icon{width:58px;height:58px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--bg);color:var(--text2)}
.cert-status-icon svg{width:29px;height:29px}
.cert-status-icon.approved{background:var(--success-bg);color:var(--success)}
.cert-status-icon.draft{background:var(--primary-light);color:var(--primary)}
.cert-status-icon.pending,.cert-status-icon.reviewing{background:var(--warning-bg);color:var(--warning)}
.cert-status-icon.rejected{background:var(--error-bg);color:var(--error)}
.cert-status-title{font-size:20px;font-weight:700;color:var(--text1)}
.cert-status-desc{font-size:13px;color:var(--text2);line-height:1.6;margin-top:4px}
.cert-actions{display:grid;grid-template-columns:1fr;gap:10px}
.cert-btn{width:100%;height:42px;justify-content:center}
.inherit-tip,.reject-box{padding:12px 14px;font-size:13px;line-height:1.7;border-left:3px solid}
.inherit-tip{background:var(--primary-light);border-color:var(--primary);color:var(--primary)}
.reject-box{background:var(--error-bg);border-color:var(--error);color:var(--error)}
.cert-steps{padding-top:20px;border-top:1px solid var(--border)}
.cert-steps h3{font-size:15px;font-weight:600;color:var(--text1);margin-bottom:16px}
.cert-steps ol{display:flex;flex-direction:column;gap:0;list-style:none}
.cert-steps li{position:relative;display:flex;gap:12px;padding-bottom:18px}
.cert-steps li:last-child{padding-bottom:0}
.cert-steps li:not(:last-child)::before{content:'';position:absolute;left:12px;top:28px;bottom:2px;width:1px;background:var(--border)}
.step-num{position:relative;z-index:1;width:25px;height:25px;display:flex;align-items:center;justify-content:center;background:var(--primary-light);color:var(--primary);font-size:12px;font-weight:700;flex-shrink:0}
.cert-steps strong{display:block;font-size:14px;color:var(--text1)}
.cert-steps em{display:block;margin-top:3px;font-size:12px;color:var(--text3);font-style:normal;line-height:1.6}
.benefit-list{list-style:none;display:flex;flex-direction:column;gap:12px}
.benefit-item{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--text1);line-height:1.6}
.benefit-icon{width:16px;height:16px;margin-top:2px;background:var(--success-bg);position:relative;flex-shrink:0}
.benefit-icon::after{content:'';position:absolute;left:4px;top:3px;width:7px;height:4px;border-left:2px solid var(--success);border-bottom:2px solid var(--success);transform:rotate(-45deg)}
.card-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);margin-bottom:16px;padding-bottom:12px}
.card-header .card-title{border-bottom:0;margin-bottom:0;padding-bottom:0}
.cert-records{display:flex;flex-direction:column}
.cert-record{width:100%;display:flex;align-items:center;gap:14px;padding:16px 0;border:0;border-bottom:1px solid var(--border2);background:#fff;text-align:left;cursor:pointer;font-family:inherit}
.cert-record:last-child{border-bottom:none}
.cert-record:hover{background:#F8FAFC}
.record-icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:var(--primary-light);color:var(--primary);flex-shrink:0}
.record-icon svg{width:20px;height:20px}
.record-main{display:flex;flex-direction:column;gap:5px;flex:1;min-width:0}
.record-main strong{font-size:14px;color:var(--text1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.record-main em{font-size:12px;color:var(--text3);font-style:normal}
.faq-list{display:flex;flex-direction:column;gap:14px}
.faq-item{display:flex;flex-direction:column;gap:4px}
.faq-q{font-size:13px;font-weight:600;color:var(--text1)}
.faq-a{font-size:12px;color:var(--text2);line-height:1.6}
.state-box{padding:40px 0;text-align:center;color:var(--text3);font-size:14px}
.cert-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}
.license-section{margin-top:2px}
.license-title{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin-bottom:12px}
.license-title span{font-size:13px;font-weight:600;color:var(--text1)}
.license-title b{color:var(--error);font-weight:400}
.license-title em{font-size:12px;color:var(--text3);font-style:normal}
.license-list{display:flex;gap:12px;flex-wrap:wrap}
.license-thumb{width:150px;height:104px;border:1px solid var(--border);position:relative;background:#F8FAFC;overflow:hidden}
.license-thumb img{width:100%;height:100%;object-fit:cover;cursor:pointer;display:block}
.license-thumb button{position:absolute;right:6px;bottom:6px;height:24px;padding:0 8px;border:none;background:rgba(15,23,42,.72);color:#fff;font-size:12px;cursor:pointer}
.upload-tile{width:150px;height:104px;border:1px dashed var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text3);cursor:pointer;background:#F8FAFC}
.upload-tile:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-light)}
.upload-tile input{display:none}
.upload-tile strong{font-size:24px;font-weight:400;line-height:1}
.upload-tile span{font-size:13px}
.panel-reject{margin-top:16px}
.cert-form-alert{margin-top:14px}
.required{color:var(--error);font-weight:400}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}

@media (max-width:1100px){
  .cert-layout{grid-template-columns:1fr}
  .cert-form-grid{grid-template-columns:1fr}
}
</style>
