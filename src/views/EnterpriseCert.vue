<template>
  <section class="enterprise-cert-page">
    <header class="page-head">
      <div class="page-head-main">
        <p class="page-head-eyebrow">企业管理</p>
        <h2>企业认证</h2>
        <p class="page-head-desc">{{ isSubAccount ? "认证信息继承自主账号。" : "提交企业资料，完成账户认证。" }}</p>
      </div>
    </header>

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
        <dl v-if="mainCert && mainCert.status === 'approved'" class="cert-facts">
          <div><dt>企业名称</dt><dd>{{ mainCert.enterpriseName || '-' }}</dd></div>
          <div><dt>认证时间</dt><dd>{{ formatTime(mainCert.reviewedAt) || '-' }}</dd></div>
          <div><dt>认证方式</dt><dd>营业执照<button class="link-btn" type="button" @click="openView(mainCert)">查看</button></dd></div>
        </dl>

        <div v-if="mainCert?.rejectReason" class="reject-box">
          驳回原因：{{ mainCert.rejectReason }}
        </div>
        <div class="status-actions">
          <!-- 未认证/草稿/被驳回的表单已直接内联在下方，此处不再重复放入口按钮 -->
          <template v-if="mainCert && mainCert.status === 'approved'">
            <button class="primary-action small" type="button" @click="openView(mainCert)">查看认证信息</button>
            <!-- 二次认证：企业更名或主体变更时重新提交 -->
            <button v-if="!isSubAccount" class="ghost-btn" type="button" @click="startRecertify">重新认证</button>
          </template>
          <button v-else-if="mainCert && mainCert.status !== 'draft' && mainCert.status !== 'rejected'"
                  class="primary-action small" type="button" @click="openView(mainCert)">查看认证信息</button>
        </div>
        <div v-if="isSubAccount" class="inherit-tip">子账号使用主账号的企业认证状态，如需提交或修改认证资料，请联系主账号处理。</div>

      </div>

      <!-- 未认证 / 草稿 / 被驳回：表单直接摆在页面上，不再点按钮弹窗。
           这是这些状态下用户唯一要做的事，没有理由多一次点击。 -->
      <div v-if="showInlineForm" class="work-card cert-form-card">
        <div class="work-card-head compact-head">
          <div>
            <h3>{{ mainCert && mainCert.status === 'rejected' ? '重新提交认证' : '填写企业认证信息' }}</h3>
            <p class="cert-form-desc">认证通过后，企业名称将同步为账号的企业名，用于授权声明与短信通知。</p>
          </div>
        </div>

        <CertFormBody
          :form="form" :file-list="fileList" :form-readonly="false" :can-edit="true"
          :uploading="uploading" :detail-loading="false"
          :error-msg="errorMsg" :success-msg="successMsg" :file-url="fileUrl"
          @preview="previewFile" @remove="removeLocalFile" @file-change="handleFileChange"
        />

        <div class="cert-form-actions">
          <button type="button" class="ghost-btn" :disabled="saving" @click="saveDraft">保存草稿</button>
          <button type="button" class="primary-action" :disabled="saving" @click="submitAudit">提交审核</button>
        </div>
      </div>

      <div v-if="certList.length" class="work-card cert-history-card">
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
      :footer-visible="canEdit && !detailLoading"
      @close="closePanel"
    >
      <CertFormBody
        :form="form" :file-list="fileList" :form-readonly="formReadonly" :can-edit="canEdit"
        :uploading="uploading" :detail-loading="detailLoading"
        :error-msg="errorMsg" :success-msg="successMsg" :file-url="fileUrl"
        @preview="previewFile" @remove="removeLocalFile" @file-change="handleFileChange"
      />
      <template #footer>
        <button type="button" class="ghost-btn" :disabled="saving" @click="saveDraft">保存草稿</button>
        <button type="button" class="primary-action small" :disabled="saving" @click="submitAudit">提交审核</button>
      </template>
    </AppModal>
  </section>
</template>

<script setup>
import { useRefresh } from '../composables/pullRefresh'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import CertFormBody from './components/CertFormBody.vue'
import { BadgeCheck, Building2, CircleX, Clock3, FilePenLine, ShieldCheck } from '@lucide/vue'
import AppModal from '../components/AppModal.vue'
import { getUserProfile } from '../api/user'
import { getUser, setUser } from '../utils/auth'
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

// 未认证 / 草稿 / 被驳回时，表单直接内联在页面上——这些状态下用户唯一要做的
// 就是填表，没必要先点一次按钮再弹窗。已认证则只展示结果，需要改动走"重新认证"。
const recertifying = ref(false)
const showInlineForm = computed(() => {
  if (isSubAccount.value) return false
  if (recertifying.value) return true
  if (!mainCert.value) return true
  return mainCert.value.status === 'draft' || mainCert.value.status === 'rejected'
})

// 二次认证：企业更名或主体变更后重新提交，后端允许在已认证状态下新建草稿
function startRecertify() {
  if (isSubAccount.value) return
  resetForm()
  recertifying.value = true
  // 预填现有企业名，多数情况下只是改个别字段
  if (mainCert.value) {
    form.enterpriseName = mainCert.value.enterpriseName || ''
  }
  requestAnimationFrame(() => {
    document.querySelector('.cert-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function formatTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 19)
}
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
    // 已落库的附件走鉴权接口取二进制
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

// 营业执照不再走 /profile/** 静态路径（那条路径免鉴权，猜到文件名就能下），
// 已落库的附件一律通过带归属校验的接口取二进制，转成 blob 地址渲染。
// 刚上传还没保存的文件没有 id，用本地 File 的 objectURL 直接预览。
const blobUrls = reactive({})

function fileUrl(file) {
  if (!file) return ''
  if (file.localPreview) return file.localPreview
  if (file.id) return blobUrls[file.id] || ''
  return ''
}

async function ensureBlob(file) {
  if (!file?.id || blobUrls[file.id]) return
  try {
    const blob = await fetchEnterpriseCertFile(file.id)
    blobUrls[file.id] = URL.createObjectURL(blob)
  } catch (err) {
    // 取不到就留空，界面显示破图占位好过抛错中断整页
  }
}

function releaseBlobs() {
  Object.keys(blobUrls).forEach(key => {
    try { URL.revokeObjectURL(blobUrls[key]) } catch (e) {}
    delete blobUrls[key]
  })
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
    if (!uploaded.filePath) throw new Error('上传接口未返回文件路径')    // 尚未保存的文件没有 id，用本地 objectURL 预览，避免去请求还不存在的记录
    uploaded.localPreview = URL.createObjectURL(file)
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
      errorMsg.value = error?.msg || error?.message || '删除附件失败，请稍后重试'
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
    errorMsg.value = error?.msg || error?.message || '保存失败，请稍后重试'
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
    recertifying.value = false
    await loadList()
    window.setTimeout(closePanel, 1000)
  } catch (error) {
    errorMsg.value = error?.msg || error?.message || '提交失败，请稍后重试'
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

onUnmounted(releaseBlobs)

onMounted(async () => {
  await loadProfile()
  await loadList()
})
// 移动端下拉刷新复用同一个加载函数
useRefresh(loadList)
</script>

<style scoped>
/* 整体布局：状态卡片与认证记录更均衡的两栏 */
/* 内容驱动：没有历史记录时单列（未认证是最常见状态），
   有记录才两栏。原先固定两栏会让空的「认证记录」白占一半版面。 */
.cert-layout {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  max-width: 760px;
}

/* 有内联表单时单列：表单是页面主体，不能被挤进侧栏 */
.cert-layout:has(.cert-form-card) {
  grid-template-columns: minmax(0, 1fr);
  max-width: 1040px;   /* 表单是页面主体，720px 在宽屏上右侧空掉一半 */
}

.cert-layout:has(.cert-history-card) {
  grid-template-columns: minmax(360px, .82fr) minmax(0, 1.18fr);
  max-width: none;
}

@media (max-width: 900px) {
  .cert-layout,
  .cert-layout:has(.cert-history-card) {
    grid-template-columns: minmax(0, 1fr);
    max-width: none;
  }
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
  border-radius: var(--radius);
  color: var(--muted);
  background: var(--line-soft);
}

.cert-status-icon svg {
  width: 24px;
  height: 24px;
}

.cert-status-icon.approved { color: #12b76a; background: #ecfdf3; }
.cert-status-icon.draft { color: var(--blue); background: var(--line-soft); }
.cert-status-icon.pending,
.cert-status-icon.reviewing { color: #f79009; background: #fff7ed; }
.cert-status-icon.rejected { color: #f04438; background: #fef3f2; }

.inherit-tip {
  margin-top: 18px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--cinnabar);
  background: var(--line-soft);
  font-size: var(--fs-base);
  line-height: 1.6;
}

/* 认证流程步骤 */

/* 连接竖线 */

/* 认证记录项：左图标 + 信息 + 状态徽章 */
.cert-list-item {
  display: flex;
  align-items: center;
  gap: 14px;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.cert-list-item:hover {
  border-color: var(--line);
  background: var(--line-soft);
}

.cert-item-ico {
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: var(--radius-lg);
  color: var(--blue);
  background: var(--line-soft);
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
  font-size: var(--fs-base);
}

.cert-item-main em {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: var(--fs-sm);
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
  background: var(--line-soft);
}

@media (max-width: 1280px) {
  .cert-layout {
    grid-template-columns: 1fr;
  }
}

/* ---- 已认证时的认证明细 ---- */
.cert-facts {
  display: grid;
  gap: 10px;
  margin: 16px 0 0;
  padding: 16px 0 0;
  border-top: 1px solid var(--line-soft);
}

.cert-facts > div {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.cert-facts dt {
  flex: 0 0 72px;
  font-size: var(--fs-xs);
  color: var(--muted);
}

.cert-facts dd {
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--text);
  word-break: break-all;
}

.link-btn {
  margin-left: 10px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--blue);
  font-size: var(--fs-sm);
  cursor: pointer;
  text-decoration: underline;
}

/* ---- 内联表单卡 ---- */
.cert-form-desc {
  margin: 4px 0 0;
  font-size: var(--fs-xs);
  color: var(--muted);
  line-height: 1.6;
}

.cert-form-actions {
  display: flex;
  align-items: center;        /* 不写死会取 normal(=stretch)，两个按钮基线对不齐 */
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--line-soft);
}

/* 两个按钮同高同宽，且清掉别处带来的 margin —— 之前主按钮被顶下去 20px */
.cert-form-actions > button {
  flex: 0 0 auto;
  width: auto;
  min-width: 108px;
  height: 40px;
  min-height: 0;   /* .primary-action 自带 min-height:42px，不清掉 height 压不动 */
  margin: 0;
  padding: 0 22px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: var(--fs-base);
  line-height: 1;
}

@media (max-width: 640px) {
  .cert-form-actions { flex-direction: column-reverse; align-items: stretch; }
  .cert-form-actions > button { width: 100%; }
}

@media (max-width: 768px) {
  .cert-facts > div { flex-direction: column; gap: 2px; }
  .cert-facts dt { flex: none; }
  .cert-form-actions { flex-direction: column-reverse; }
  .cert-form-actions button { width: 100%; }
}
</style>
