<template>
  <div class="query-layout">
  <section class="work-card">
    <div class="work-card-head">
      <h2>发起背调查询</h2>
      <p>填写候选人信息并选择查询套餐，候选人完成授权后自动执行查询。</p>
    </div>

    <div class="form-grid">
      <label><span>候选人姓名</span><input v-model.trim="form.name" placeholder="请输入姓名"></label>
      <label><span>身份证号</span><input v-model.trim="form.idCard" placeholder="请输入身份证号" maxlength="18"></label>
      <label><span>手机号</span><input v-model.trim="form.mobile" placeholder="请输入手机号" maxlength="11"></label>
      <label>
        <span>查询套餐</span>
        <select v-model="form.callTypeId">
          <option value="" disabled>请选择查询套餐</option>
          <option v-for="item in reportTypes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <div class="auth-method-panel">
      <span class="auth-method-title">授权方式</span>
      <div class="auth-method-options">
        <button type="button" :class="{ active: form.authMethod === 'esign' }" @click="setAuthMethod('esign')">
          <strong>电子签</strong>
          <small>候选人在线签署授权</small>
        </button>
        <button type="button" :class="{ active: form.authMethod === 'upload' }" @click="setAuthMethod('upload')">
          <strong>上传授权书</strong>
          <small>提交授权文件审核</small>
        </button>
      </div>
    </div>

    <div v-if="form.authMethod === 'upload'" class="authorization-upload">
      <div>
        <strong>候选人授权书</strong>
        <span>支持 PDF、DOC、DOCX、JPG、PNG，文件不超过 5MB。</span>
      </div>
      <label class="upload-box">
        <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" @change="handleAuthFileChange">
        <span>{{ authFileName || '选择授权书文件' }}</span>
      </label>
    </div>

    <div v-if="message" class="form-message" :class="messageType">{{ message }}</div>
    <button class="primary-btn page-action" :disabled="loading" @click="submitQuery">{{ loading ? '提交中...' : '提交查询' }}</button>
  </section>

  <aside class="query-aside">
    <div class="cost-card">
      <h3>本次查询</h3>
      <div class="cost-row">
        <span>候选人</span>
        <strong>{{ form.name || '—' }}</strong>
      </div>
      <div class="cost-row">
        <span>查询套餐</span>
        <strong>{{ selectedTypeName || '未选择' }}</strong>
      </div>
      <div class="cost-row">
        <span>授权方式</span>
        <strong>{{ form.authMethod === 'esign' ? '电子签授权' : '上传授权书' }}</strong>
      </div>
      <div class="cost-total">
        <span>预计费用</span>
        <strong>{{ selectedPrice !== '' ? `¥${selectedPrice}` : '—' }}</strong>
      </div>
      <p class="cost-hint">提交后将预占本次查询额度；任务成功后完成结算，失败或终止时自动释放。</p>
    </div>

    <div class="flow-card">
      <h4>查询流程</h4>
      <ol>
        <li>提交候选人信息并选择套餐</li>
        <li>候选人完成电子签授权（或上传授权书待审核）</li>
        <li>系统执行核验，生成背调报告</li>
        <li>在「查询记录」中查看与下载报告</li>
      </ol>
    </div>
  </aside>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createPendingQuery, getAllData, launchEsign, preCheckQuery, uploadAuthorizationFile } from '../api/data'
import { listQueryTypeConfig } from '../api/queryType'
import { getUserProfile } from '../api/user'

const emit = defineEmits(['balance-updated'])
const router = useRouter()
const loading = ref(false)
const message = ref('')
const messageType = ref('info')
const queryTypeConfigs = ref([])
const priceMap = ref({})
const selectedAuthFile = ref(null)
const authFileName = ref('')
const form = reactive({
  name: '',
  idCard: '',
  mobile: '',
  callTypeId: '',
  authMethod: 'esign',
  authorizationFile: ''
})

const reportTypes = computed(() => {
  return queryTypeConfigs.value
    .map(cfg => {
      const id = String(cfg.id)
      const price = priceMap.value[id]
      const hasPrice = price !== undefined && price !== null && price !== '' && !Number.isNaN(Number(price))
      return {
        value: id,
        label: `${cfg.callTypeName || cfg.name || `类型${id}`}${hasPrice ? ` - ${price}元/次` : ''}`,
        hasPrice
      }
    })
    .filter(item => item.hasPrice || queryTypeConfigs.value.length <= 3)
})

const selectedTypeName = computed(() => {
  const cfg = queryTypeConfigs.value.find(item => String(item.id) === String(form.callTypeId))
  return cfg ? (cfg.callTypeName || cfg.name || `类型${cfg.id}`) : ''
})

const selectedPrice = computed(() => {
  const price = priceMap.value[String(form.callTypeId)]
  if (price === undefined || price === null || price === '' || Number.isNaN(Number(price))) return ''
  return price
})

function show(text, type = 'info') {
  message.value = text
  messageType.value = type
}

function validate() {
  if (!form.name) return '请填写候选人姓名'
  if (form.authMethod === 'upload' && !form.idCard) return '上传授权书方式需填写身份证号'
  if (!form.mobile && !form.idCard) return '请至少填写手机号或身份证号'
  if (form.authMethod === 'upload' && !form.mobile) return '上传授权书方式需填写手机号'
  if (form.mobile && !/^1[3-9]\d{9}$/.test(form.mobile)) return '手机号格式不正确'
  if (form.idCard) {
    form.idCard = form.idCard.replace(/x/g, 'X')
    if (!/^\d{17}[\dX]$/.test(form.idCard)) return '身份证号格式不正确'
  }
  if (!form.callTypeId) return '请选择查询套餐'
  if (form.authMethod === 'upload' && !selectedAuthFile.value && !form.authorizationFile) return '请上传候选人授权书'
  return ''
}

function buildQueryData() {
  const hasPhone = !!form.mobile
  const hasIdCard = !!form.idCard
  let lackStatus
  let searchStatus
  if (!hasIdCard && hasPhone) lackStatus = '2'
  if (!hasPhone && hasIdCard) lackStatus = '1'
  if (String(form.callTypeId) === '5') {
    lackStatus = '3'
    searchStatus = '1'
  } else if (lackStatus) {
    searchStatus = '1'
  }
  return {
    name: form.name,
    mobile: form.mobile,
    idCard: form.idCard,
    callTypeId: form.callTypeId,
    data: '',
    lackStatus,
    searchStatus,
    authorizationFile: form.authorizationFile,
    isBackground: 0
  }
}

function setAuthMethod(method) {
  form.authMethod = method
  show('', 'info')
}

function handleAuthFileChange(event) {
  const file = event.target.files && event.target.files[0]
  if (!file) {
    selectedAuthFile.value = null
    authFileName.value = ''
    return
  }
  const ext = (file.name || '').toLowerCase().split('.').pop()
  if (!['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(ext)) {
    selectedAuthFile.value = null
    authFileName.value = ''
    event.target.value = ''
    show('授权书仅支持 PDF、DOC、DOCX、JPG、PNG 格式', 'error')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    selectedAuthFile.value = null
    authFileName.value = ''
    event.target.value = ''
    show('授权书文件大小不能超过 5MB', 'error')
    return
  }
  selectedAuthFile.value = file
  authFileName.value = file.name
  form.authorizationFile = ''
}

async function uploadAuthFileIfNeeded() {
  if (form.authorizationFile) return form.authorizationFile
  if (!selectedAuthFile.value) return ''
  const res = await uploadAuthorizationFile(selectedAuthFile.value)
  const filePath = res?.filePath || res?.data?.filePath || ''
  if (!filePath) throw new Error('授权书上传失败，请重新选择文件')
  form.authorizationFile = filePath
  return filePath
}

async function submitQuery() {
  const err = validate()
  if (err) return show(err, 'error')
  loading.value = true
  show('正在提交查询...', 'info')
  const queryData = buildQueryData()
  try {
    try {
      const pre = await preCheckQuery(queryData)
      if (pre?.data?.duplicate) {
        const ok = window.confirm('检测到 10 分钟内相同条件的重复查询，是否继续？')
        if (!ok) return show('已取消重复查询', 'info')
      }
    } catch (err) {}

    if (form.authMethod === 'upload') {
      const authorizationFile = await uploadAuthFileIfNeeded()
      await createPendingQuery({ ...queryData, authorizationFile, searchStatus: '5' })
      show('授权书已提交，等待后台审核。审核通过后会自动生成报告。', 'success')
    } else {
      const res = await getAllData(queryData)
      if (res?.data?.formDataId != null) {
        try {
          await launchEsign({ formDataId: res.data.formDataId, name: queryData.name, mobile: queryData.mobile })
        } catch (err) {}
        show('已发起背调授权，请提醒候选人完成电子签。', 'success')
      } else {
        show('查询已提交，结果生成后可在查询记录查看。', 'success')
      }
    }
    emit('balance-updated')
    setTimeout(() => router.push('/records'), 800)
  } catch (err) {
    const msg = err?.msg || err?.message || '提交失败，请稍后重试'
    show(msg, 'error')
  } finally {
    loading.value = false
  }
}

async function loadQueryTypes() {
  const res = await listQueryTypeConfig({ pageNum: 1, pageSize: 1000 })
  queryTypeConfigs.value = res.rows || []
}

async function loadPrices() {
  try {
    const res = await getUserProfile()
    const data = res.data || {}
    let list = []
    if (Array.isArray(data.deductionStandardList)) list = data.deductionStandardList
    else if (data.deductionStandard) {
      try { list = JSON.parse(data.deductionStandard) } catch (err) {}
    }
    priceMap.value = (list || []).reduce((acc, item) => {
      const id = String(item.callType || item.callTypeId || item.typeId || item.type || '')
      const price = item.priceNumber || item.price || item.priceNum || ''
      if (id) acc[id] = price
      return acc
    }, {})
  } catch (err) {
    priceMap.value = {}
  }
}

onMounted(async () => {
  await Promise.all([loadQueryTypes(), loadPrices()])
  if (!form.callTypeId && reportTypes.value.length) form.callTypeId = reportTypes.value[0].value
})
</script>

<style scoped>
.auth-method-panel,
.authorization-upload {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid #e5edf8;
  border-radius: 8px;
  background: #fbfdff;
}

.auth-method-title {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #172033;
}

.auth-method-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.auth-method-options button {
  min-height: 72px;
  padding: 13px 15px;
  border: 1px solid #d8e3f2;
  border-radius: 7px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.auth-method-options button.active {
  border-color: #2563eb;
  background: #f4f8ff;
  box-shadow: inset 3px 0 0 #2563eb;
}

.auth-method-options strong,
.auth-method-options small {
  display: block;
}

.auth-method-options strong {
  color: #111827;
  font-size: 15px;
}

.auth-method-options small {
  margin-top: 6px;
  color: #667085;
}

.authorization-upload {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.authorization-upload strong,
.authorization-upload span {
  display: block;
}

.authorization-upload strong {
  color: #111827;
}

.authorization-upload span {
  margin-top: 6px;
  color: #667085;
}

.upload-box {
  min-width: 260px;
  padding: 12px 16px;
  border: 1px dashed #9bb8e8;
  border-radius: 7px;
  background: #fff;
  color: #2563eb;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
}

.upload-box input {
  display: none;
}

@media (max-width: 900px) {
  .auth-method-options {
    grid-template-columns: 1fr;
  }

  .authorization-upload {
    align-items: stretch;
    flex-direction: column;
  }

  .upload-box {
    min-width: 0;
  }
}
</style>
