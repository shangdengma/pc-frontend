<template>
  <div class="query-layout">
  <section class="work-card">
    <div class="work-card-head query-card-head">
      <div>
        <h2>{{ canOnlineTest ? '在线测试' : '发起背调查询' }}</h2>
        <p>{{ canOnlineTest ? '填写候选人信息并选择查询套餐，提交后直接进入查询。' : '填写候选人信息并选择查询套餐，候选人完成授权后自动执行查询。' }}</p>
      </div>
      <div class="query-funds" :class="{ 'is-sub-account': isSubAccount }">
        <span>{{ isSubAccount ? '剩余额度' : '可用余额' }}</span>
        <strong>{{ availableBalanceText }}</strong>
      </div>
    </div>

    <div class="form-grid">
      <label><span>候选人姓名</span><input v-model.trim="form.name" placeholder="请输入姓名"></label>
      <label><span>手机号</span><input v-model.trim="form.mobile" placeholder="请输入手机号" maxlength="11"></label>
      <label>
        <span>查询套餐</span>
        <select v-model="form.callTypeId">
          <option value="" disabled>请选择查询套餐</option>
          <option v-for="item in reportTypes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <div v-if="!canOnlineTest" class="auth-method-panel">
      <span class="auth-method-title">授权方式</span>
      <div class="auth-method-current">
        <strong>电子签授权</strong>
        <small>候选人在线签署授权后自动执行查询</small>
      </div>
    </div>

    <div v-if="message" class="form-message" :class="messageType">{{ message }}</div>

    <div v-if="candidateLink" class="candidate-link-panel">
      <span class="candidate-link-title">候选人填写链接（测试用）</span>
      <a class="candidate-link-url" :href="candidateLink" target="_blank" rel="noopener">{{ candidateLink }}</a>
      <div class="candidate-link-actions">
        <button type="button" class="ghost-btn" @click="copyCandidateLink">复制链接</button>
        <a class="ghost-btn" :href="candidateLink" target="_blank" rel="noopener">打开中间页</a>
      </div>
      <p class="candidate-link-hint">短信模板上线前，可将此链接发给候选人测试；候选人需用本单手机号接收验证码进入。</p>
    </div>

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
        <span>{{ canOnlineTest ? '执行方式' : '授权方式' }}</span>
        <strong>{{ canOnlineTest ? '在线测试' : '电子签授权' }}</strong>
      </div>
      <div class="cost-total">
        <span>预计费用</span>
        <strong>{{ selectedPrice !== '' ? `¥${selectedPrice}` : '—' }}</strong>
      </div>
      <p class="cost-hint">提交后将扣除本次查询费用；任务失败或终止时按规则自动退款。</p>
    </div>

    <div class="flow-card">
      <h4>查询流程</h4>
      <ol>
        <li>提交候选人信息并选择套餐</li>
        <li v-if="!canOnlineTest">候选人完成电子签授权</li>
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
import { getAllData, launchOnlineTest, preCheckQuery } from '../api/data'
import { listQueryTypeConfig } from '../api/queryType'
import { getUserBalance, getUserProfile } from '../api/user'
import { yuanFromFen } from '../utils/format'

const emit = defineEmits(['balance-updated'])
const router = useRouter()
const loading = ref(false)
const message = ref('')
const messageType = ref('info')
const candidateLink = ref('')
const queryTypeConfigs = ref([])
const priceMap = ref({})
const profile = ref({})
const availableBalance = ref(null)
const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))
const availableBalanceText = computed(() => availableBalance.value == null ? '—' : `¥${yuanFromFen(availableBalance.value)}`)
const canOnlineTest = computed(() => profile.value && (profile.value.onlineTestEnabled === true || profile.value.onlineTestEnabled === 1 || profile.value.onlineTestEnabled === '1'))
const form = reactive({
  name: '',
  mobile: '',
  callTypeId: ''
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

async function copyCandidateLink() {
  if (!candidateLink.value) return
  try {
    await navigator.clipboard.writeText(candidateLink.value)
    show('中间页链接已复制', 'success')
  } catch (e) {
    show('复制失败，请手动选择链接复制', 'error')
  }
}

function validate() {
  if (!form.name) return '请填写候选人姓名'
  if (!form.mobile) return '请填写候选人手机号'
  if (!/^1[3-9]\d{9}$/.test(form.mobile)) return '手机号格式不正确'
  if (!form.callTypeId) return '请选择查询套餐'
  return ''
}

function buildQueryData() {
  // 身份证号改由候选人在中间页填写，此处不再按缺身份证推断 lackStatus，避免误判为人工补充单。
  let lackStatus
  let searchStatus
  if (String(form.callTypeId) === '5') {
    lackStatus = '3'
    searchStatus = '1'
  }
  return {
    name: form.name,
    mobile: form.mobile,
    callTypeId: form.callTypeId,
    data: '',
    lackStatus,
    searchStatus,
    isBackground: 0
  }
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

    if (canOnlineTest.value) {
      await launchOnlineTest(queryData)
      show('测试任务已提交，结果生成后可在查询记录中查看。', 'success')
    } else {
      const res = await getAllData(queryData)
      if (res?.data?.formDataId != null) {
        candidateLink.value = res.data.candidateLink || ''
        show('已创建查询并发送候选人填写短信，请提醒候选人完成信息填写与授权签署。', 'success')
      } else {
        show('查询已提交，结果生成后可在查询记录查看。', 'success')
      }
    }
    emit('balance-updated')
    // 有候选人链接时（测试期）保留在本页展示链接，其余情况跳转记录页
    if (!candidateLink.value) {
      setTimeout(() => router.push('/records'), 800)
    }
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
    profile.value = data
    const userId = data.userId || data.id
    if (userId) {
      try {
        const balanceRes = await getUserBalance(userId)
        availableBalance.value = Number(balanceRes?.data || 0)
      } catch (err) {
        availableBalance.value = Number(data.money || 0)
      }
    }
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
    availableBalance.value = null
    priceMap.value = {}
  }
}

onMounted(async () => {
  await Promise.all([loadQueryTypes(), loadPrices()])
  if (!form.callTypeId && reportTypes.value.length) form.callTypeId = reportTypes.value[0].value
})
</script>

<style scoped>
.candidate-link-panel {
  margin: 12px 0 4px;
  padding: 14px 16px;
  border: 1px dashed #b7c4d6;
  border-radius: 10px;
  background: #f5f8fc;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.candidate-link-title {
  font-size: 13px;
  font-weight: 600;
  color: #33415c;
}
.candidate-link-url {
  word-break: break-all;
  color: #2563eb;
  font-size: 13px;
}
.candidate-link-actions {
  display: flex;
  gap: 10px;
}
.candidate-link-actions .ghost-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border: 1px solid #c3ccd9;
  border-radius: 8px;
  background: #fff;
  color: #33415c;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
}
.candidate-link-actions .ghost-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}
.candidate-link-hint {
  font-size: 12px;
  color: #8794a8;
  margin: 0;
}

.query-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.query-funds {
  flex: 0 0 auto;
  min-width: 150px;
  padding-left: 20px;
  border-left: 1px solid #dce5f0;
  text-align: right;
}

.query-funds span,
.query-funds strong {
  display: block;
}

.query-funds span {
  color: #667085;
  font-size: 12px;
  font-weight: 600;
}

.query-funds strong {
  margin-top: 5px;
  color: #172033;
  font-size: 21px;
  line-height: 1.2;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.query-funds.is-sub-account strong {
  color: #157347;
}

.auth-method-panel {
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

.auth-method-current {
  min-height: 72px;
  padding: 13px 15px;
  border: 1px solid #2563eb;
  border-radius: 7px;
  background: #f4f8ff;
  box-shadow: inset 3px 0 0 #2563eb;
  text-align: left;
}

.auth-method-current strong,
.auth-method-current small {
  display: block;
}

.auth-method-current strong {
  color: #111827;
  font-size: 15px;
}

.auth-method-current small {
  margin-top: 6px;
  color: #667085;
}

@media (max-width: 900px) {
  .query-card-head {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

  .query-funds {
    width: 100%;
    padding: 12px 0 0;
    border-top: 1px solid #e5edf8;
    border-left: 0;
    text-align: left;
  }

}
</style>
