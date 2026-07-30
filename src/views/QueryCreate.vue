<template>
  <main class="main-content">
    <div class="query-layout">
      <!-- 左：表单 -->
      <div class="query-main">
        <div class="card">
          <h3 class="card-title">候选人信息</h3>
          <div class="form-grid">
            <label class="field">
              <span class="field-label">姓名 <span class="required">*</span></span>
              <input v-model.trim="form.name" class="field-input" type="text" placeholder="请输入候选人真实姓名" />
            </label>
            <label class="field">
              <span class="field-label">手机号</span>
              <input v-model.trim="form.phone" class="field-input" type="tel" maxlength="11" placeholder="用于接收授权通知" />
            </label>
            <label class="field field-full">
              <span class="field-label">身份证号</span>
              <input v-model.trim="form.idCard" class="field-input" type="text" maxlength="18" placeholder="请输入 18 位身份证号" />
            </label>
          </div>
          <div class="report-notice-panel">
            <div class="report-notice-copy">
              <span class="report-notice-title">报告完成通知</span>
              <small>报告生成后按选中的方式提醒当前账号及时查看。</small>
            </div>
            <div class="notice-checks">
              <label v-for="item in reportNoticeOptions" :key="item.value" class="notice-check" :class="{ checked: form.reportNoticeMethods.includes(item.value) }">
                <input v-model="form.reportNoticeMethods" type="checkbox" :value="item.value" />
                <span class="notice-check-box"></span>
                <span>{{ item.label }}</span>
              </label>
            </div>
          </div>
          <div class="form-tip">
            <svg viewBox="0 0 24 24" fill="none" class="tip-icon"><circle cx="12" cy="12" r="10" stroke="#94A3B8" stroke-width="1.5"/><path d="M12 8V12M12 16H12.01" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/></svg>
            所有信息须真实有效，仅用于本次背调并受《个人信息保护法》保护
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">选择背调套餐</h3>
          <div ref="packageSelectRef" class="package-select" :class="{ open: packageDropdownOpen }">
            <button
              type="button"
              class="package-select-trigger"
              :aria-expanded="packageDropdownOpen"
              @click="togglePackageDropdown"
            >
              <span class="package-trigger-main">
                <strong>{{ selectedPackage?.name || '请选择背调套餐' }}</strong>
                <small v-if="selectedPackage?.eta">预计完成：{{ selectedPackage.eta }}</small>
                <small v-else-if="!selectedPackage">选择后将自动计算本次费用</small>
              </span>
              <span v-if="selectedPackage?.recommended" class="pkg-tag">推荐</span>
              <span class="package-trigger-price">
                {{ selectedPrice !== '' ? `¥${selectedPrice}` : '—' }}
                <em>/ 次</em>
              </span>
              <svg class="package-chevron" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div v-if="packageDropdownOpen" class="package-menu">
              <button
                v-for="p in packages"
                :key="p.id"
                type="button"
                class="package-option"
                :class="{ selected: String(form.packageId) === String(p.id) }"
                @click="selectPackage(p)"
              >
                <span class="option-check"></span>
                <span class="option-main">
                  <span class="option-title">
                    <strong>{{ p.name }}</strong>
                    <em v-if="p.recommended">推荐</em>
                  </span>
                  <small v-if="p.eta">预计完成：{{ p.eta }}</small>
                  <small v-else>标准查询套餐</small>
                </span>
                <span class="option-price">{{ p.price !== '' ? `¥${p.price}` : '—' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：费用与操作 -->
      <div class="query-side">
        <div class="card summary-card">
          <h3 class="card-title">费用明细</h3>
          <div class="summary-rows">
            <div class="summary-row">
              <span class="summary-label">{{ isSubAccount ? '剩余额度' : '当前余额' }}</span>
              <span class="summary-value">¥ {{ balance }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">本次费用</span>
              <span class="summary-value">{{ selectedPrice !== '' ? `¥ ${selectedPrice}` : '—' }}</span>
            </div>
            <div v-if="selectedPackage?.eta" class="summary-row">
              <span class="summary-label">预计完成</span>
              <span class="summary-value">{{ selectedPackage.eta }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">{{ canOnlineTest ? '执行方式' : '授权方式' }}</span>
              <span class="summary-value">{{ canOnlineTest ? '在线测试' : '电子签授权' }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">报告完成通知</span>
              <span class="summary-value">{{ selectedNoticeText }}</span>
            </div>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-total">
            <span class="total-label">预计费用</span>
            <span class="total-value">{{ selectedPrice !== '' ? `¥ ${selectedPrice}` : '—' }}</span>
          </div>
          <p class="cost-hint">提交后将扣除本次查询费用；任务失败或终止时按规则自动退款。</p>
          <button class="btn-primary submit-btn" :disabled="submitting" @click="submitQuery">
            {{ submitting ? '提交中...' : '提交查询' }}
          </button>
          <FormAlert :message="message" :type="messageType" />
        </div>

        <div class="card flow-card">
          <h3 class="card-title">授权流程</h3>
          <div class="flow-steps">
            <div class="flow-step">
              <span class="step-num">1</span>
              <div class="step-info">
                <span class="step-title">提交候选人信息并选择套餐</span>
              </div>
            </div>
            <div v-if="!canOnlineTest" class="flow-step">
              <span class="step-num">2</span>
              <div class="step-info">
                <span class="step-title">候选人完成电子签授权</span>
              </div>
            </div>
            <div class="flow-step">
              <span class="step-num">{{ canOnlineTest ? 2 : 3 }}</span>
              <div class="step-info">
                <span class="step-title">系统执行核验，生成背调报告</span>
              </div>
            </div>
            <div class="flow-step">
              <span class="step-num">{{ canOnlineTest ? 3 : 4 }}</span>
              <div class="step-info">
                <span class="step-title">在「查询记录」中查看与下载报告</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <div
    v-if="duplicateDialogVisible"
    class="modal-mask duplicate-mask"
    @pointerdown="queryBackdropGuard.pointerDown"
    @click.self="queryBackdropGuard.click(() => resolveDuplicate(false))"
  >
    <div class="modal-card duplicate-card">
      <div class="duplicate-icon">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12M12 16H12.01" stroke="#014DB2" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="9" stroke="#014DB2" stroke-width="1.7"/>
        </svg>
      </div>
      <h3 class="duplicate-title">重复查询提醒</h3>
      <p class="duplicate-desc">检测到 10 分钟内相同条件的重复查询，是否继续？</p>
      <div class="duplicate-actions">
        <button type="button" class="btn-outline" @click="resolveDuplicate(false)">取消</button>
        <button type="button" class="btn-primary" @click="resolveDuplicate(true)">继续提交</button>
      </div>
    </div>
  </div>

  <ResultModal
    v-model="resultVisible"
    type="success"
    title="查询已提交"
    :description="resultDescription"
    :countdown-text="autoJumpCanceled ? '已取消自动跳转' : `${jumpCountdown} 秒后自动跳转至查询记录`"
    primary-text="查看详细"
    tertiary-text="取消"
    @primary="goRecordsNow"
    @tertiary="cancelSubmitResult"
    @close="cancelSubmitResult"
  />
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import FormAlert from '../components/FormAlert.vue'
import ResultModal from '../components/ResultModal.vue'
import { getAllData, launchEsign, launchOnlineTest, preCheckQuery } from '../api/data'
import { listQueryTypeConfig } from '../api/queryType'
import { getUserBalance, getUserProfile } from '../api/user'
import { createBackdropGuard } from '../utils/backdropGuard'
import { yuanFromFen } from '../utils/format'

const emit = defineEmits(['balance-updated'])
const router = useRouter()

const submitting = ref(false)
const message = ref('')
const messageType = ref('info')
const duplicateDialogVisible = ref(false)
const resultVisible = ref(false)
const resultDescription = ref('')
const jumpCountdown = ref(5)
const autoJumpCanceled = ref(false)
const packages = ref([])
const packageSelectRef = ref(null)
const packageDropdownOpen = ref(false)
const queryTypeConfigs = ref([])
const priceMap = ref({})
const profile = ref({})
const availableBalance = ref(null)
let duplicateConfirmResolve = null
let jumpTimer = null
const queryBackdropGuard = createBackdropGuard()

const reportNoticeOptions = [
  { label: '站内信', value: 'site' },
  { label: '短信', value: 'sms' },
  { label: '邮件', value: 'email' }
]

const form = reactive({
  name: '',
  idCard: '',
  phone: '',
  packageId: '',
  reportNoticeMethods: ['site']
})

const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))
const balance = computed(() => availableBalance.value == null ? '—' : yuanFromFen(availableBalance.value))
const canOnlineTest = computed(() => profile.value && (profile.value.onlineTestEnabled === true || profile.value.onlineTestEnabled === 1 || profile.value.onlineTestEnabled === '1'))
const selectedPackage = computed(() => packages.value.find(p => String(p.id) === String(form.packageId)))
const selectedPrice = computed(() => {
  const price = priceMap.value[String(form.packageId)]
  if (price === undefined || price === null || price === '' || Number.isNaN(Number(price))) return ''
  return price
})
const selectedNoticeText = computed(() => {
  const labels = reportNoticeOptions
    .filter(item => form.reportNoticeMethods.includes(item.value))
    .map(item => item.label)
  return labels.length ? labels.join('、') : '关闭'
})
const reportNoticeEnabled = computed(() => form.reportNoticeMethods.length > 0)

function show(text, type = 'info') {
  message.value = text
  messageType.value = type
}

async function togglePackageDropdown() {
  if (!packages.value.length) return
  packageDropdownOpen.value = !packageDropdownOpen.value
  if (packageDropdownOpen.value) {
    await nextTick()
    scrollPackageDropdownIntoView()
  }
}

function selectPackage(pack) {
  form.packageId = pack.id
  packageDropdownOpen.value = false
}

function closePackageDropdownOnOutside(event) {
  if (!packageDropdownOpen.value) return
  if (packageSelectRef.value?.contains(event.target)) return
  packageDropdownOpen.value = false
}

function scrollPackageDropdownIntoView() {
  const menu = packageSelectRef.value?.querySelector('.package-menu')
  const scrollBox = packageSelectRef.value?.closest('.main-content')
  if (!menu || !scrollBox) return
  window.requestAnimationFrame(() => {
    const menuRect = menu.getBoundingClientRect()
    const boxRect = scrollBox.getBoundingClientRect()
    const overflow = menuRect.bottom - boxRect.bottom + 18
    if (overflow > 0) {
      scrollBox.scrollBy({ top: overflow, behavior: 'smooth' })
    }
  })
}

function stopAutoJump() {
  if (jumpTimer) {
    window.clearInterval(jumpTimer)
    jumpTimer = null
  }
}

function startAutoJump() {
  stopAutoJump()
  jumpCountdown.value = 5
  autoJumpCanceled.value = false
  jumpTimer = window.setInterval(() => {
    if (autoJumpCanceled.value) return
    jumpCountdown.value -= 1
    if (jumpCountdown.value <= 0) goRecordsNow()
  }, 1000)
}

function openSubmitResult(description) {
  message.value = ''
  resultDescription.value = description
  resultVisible.value = true
  startAutoJump()
}

function cancelAutoJump() {
  autoJumpCanceled.value = true
  stopAutoJump()
}

function goRecordsNow() {
  stopAutoJump()
  resultVisible.value = false
  router.push('/records')
}

function cancelSubmitResult() {
  cancelAutoJump()
  resultVisible.value = false
}

function requestDuplicateConfirm() {
  duplicateDialogVisible.value = true
  return new Promise(resolve => {
    duplicateConfirmResolve = resolve
  })
}

function resolveDuplicate(confirmed) {
  duplicateDialogVisible.value = false
  if (duplicateConfirmResolve) {
    duplicateConfirmResolve(Boolean(confirmed))
    duplicateConfirmResolve = null
  }
}

function normalizePackage(item) {
  const id = String(item.id)
  const price = priceMap.value[id]
  return {
    id,
    name: item.callTypeName || item.name || item.queryTypeName || `类型${id}`,
    price,
    eta: item.eta || '',
    recommended: Boolean(item.recommended),
    features: Array.isArray(item.features) ? item.features : []
  }
}

function validate() {
  if (!form.name) return '请填写候选人姓名'
  if (!form.phone && !form.idCard) return '请至少填写手机号或身份证号'
  if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone)) return '手机号格式不正确'
  if (form.idCard) {
    form.idCard = form.idCard.replace(/x/g, 'X')
    if (!/^\d{17}[\dX]$/.test(form.idCard)) return '身份证号格式不正确'
  }
  if (!form.packageId) return '请选择查询套餐'
  return ''
}

function buildQueryData() {
  const hasPhone = !!form.phone
  const hasIdCard = !!form.idCard
  let lackStatus
  let searchStatus
  if (!hasIdCard && hasPhone) lackStatus = '2'
  if (!hasPhone && hasIdCard) lackStatus = '1'
  if (String(form.packageId) === '5') {
    lackStatus = '3'
    searchStatus = '1'
  } else if (lackStatus) {
    searchStatus = '1'
  }
  const noticeMethods = [...form.reportNoticeMethods]
  return {
    name: form.name,
    mobile: form.phone,
    idCard: form.idCard,
    callTypeId: form.packageId,
    data: '',
    lackStatus,
    searchStatus,
    isBackground: 0,
    reportNotice: reportNoticeEnabled.value ? 1 : 0,
    reportNoticeMethods: noticeMethods,
    reportNoticeType: noticeMethods.join(','),
    noticeInApp: noticeMethods.includes('site') ? 1 : 0,
    noticeSms: noticeMethods.includes('sms') ? 1 : 0,
    noticeEmail: noticeMethods.includes('email') ? 1 : 0
  }
}

async function submitQuery() {
  const err = validate()
  if (err) return show(err, 'error')
  submitting.value = true
  show('正在提交查询...', 'info')
  const queryData = buildQueryData()
  try {
    try {
      const pre = await preCheckQuery(queryData)
      if (pre?.data?.duplicate) {
        const ok = await requestDuplicateConfirm()
        if (!ok) return show('已取消重复查询', 'info')
      }
    } catch (err) {}

    if (canOnlineTest.value) {
      await launchOnlineTest(queryData)
      openSubmitResult('测试任务已提交，结果生成后可在查询记录中查看。')
    } else {
      const res = await getAllData(queryData)
      if (res?.data?.formDataId != null) {
        try {
          await launchEsign({ formDataId: res.data.formDataId, name: queryData.name, mobile: queryData.mobile })
        } catch (err) {}
        openSubmitResult('已发起背调授权，请提醒候选人完成电子签。')
      } else {
        openSubmitResult('查询已提交，结果生成后可在查询记录查看。')
      }
    }
    emit('balance-updated')
  } catch (err) {
    const msg = err?.msg || err?.message || '提交失败，请稍后重试'
    show(msg, 'error')
  } finally {
    submitting.value = false
  }
}

async function loadQueryTypes() {
  const res = await listQueryTypeConfig({ pageNum: 1, pageSize: 1000 })
  queryTypeConfigs.value = res.rows || res.data || []
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
  document.addEventListener('click', closePackageDropdownOnOutside)
  await Promise.all([loadQueryTypes(), loadPrices()])
  packages.value = queryTypeConfigs.value
    .map(normalizePackage)
    .filter(item => item.price !== '' || queryTypeConfigs.value.length <= 3)
  if (!form.packageId && packages.value.length) form.packageId = packages.value[0].id
})

onBeforeUnmount(() => {
  stopAutoJump()
  document.removeEventListener('click', closePackageDropdownOnOutside)
})
</script>

<style scoped>
.required{color:var(--error);font-weight:400}
.query-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:20px;align-items:start}
.query-main{display:flex;flex-direction:column;gap:20px;min-width:0}

.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.field-full{grid-column:1 / -1}
.report-notice-panel{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:2px;padding:15px 16px;border:1px solid var(--border);background:#F8FAFC}
.report-notice-copy{display:flex;flex-direction:column;gap:4px;min-width:0}
.report-notice-title{font-size:14px;font-weight:600;color:var(--text1)}
.report-notice-panel small{font-size:12px;color:var(--text3);line-height:1.5}
.notice-checks{display:flex;align-items:center;gap:10px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end}
.notice-check{position:relative;height:32px;display:inline-flex;align-items:center;gap:7px;padding:0 10px;border:1px solid var(--border);background:#fff;color:var(--text2);font-size:13px;font-weight:600;cursor:pointer;transition:border-color .12s,background .12s,color .12s}
.notice-check:hover{border-color:#BAD0F3;background:#F8FBFF;color:var(--primary)}
.notice-check.checked{border-color:#BAD0F3;background:#EEF4FF;color:var(--primary)}
.notice-check input{position:absolute;opacity:0;pointer-events:none}
.notice-check-box{width:14px;height:14px;border:1px solid #CBD5E1;background:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.notice-check-box::after{content:'';width:7px;height:4px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg) translate(1px,-1px);opacity:0}
.notice-check.checked .notice-check-box{border-color:var(--primary);background:var(--primary)}
.notice-check.checked .notice-check-box::after{opacity:1}
.form-tip{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text3);margin-top:4px;padding-top:14px;border-top:1px solid var(--border2)}
.tip-icon{width:16px;height:16px;flex-shrink:0}

.package-select{position:relative}
.package-select-trigger{width:100%;min-height:58px;padding:10px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto auto 20px;align-items:center;gap:12px;border:1px solid var(--border);background:#fff;color:var(--text1);font-family:inherit;text-align:left;cursor:pointer;transition:border-color .12s,background .12s}
.package-select-trigger:hover,.package-select.open .package-select-trigger{border-color:var(--primary);background:#F8FBFF}
.package-trigger-main{min-width:0;display:flex;flex-direction:column;gap:4px}
.package-trigger-main strong{font-size:15px;font-weight:700;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.package-trigger-main small{font-size:12px;color:var(--text3);line-height:1.4}
.pkg-tag{font-size:11px;font-weight:600;padding:2px 8px;background:var(--primary);color:#fff}
.package-trigger-price{font-size:20px;font-weight:700;color:var(--primary);white-space:nowrap}
.package-trigger-price em{margin-left:2px;color:var(--text2);font-size:12px;font-style:normal;font-weight:400}
.package-chevron{width:18px;height:18px;color:var(--text3);transition:transform .16s}
.package-select.open .package-chevron{transform:rotate(180deg)}
.package-menu{position:static;margin-top:6px;z-index:30;max-height:none;overflow:visible;border:1px solid var(--border);background:#fff;box-shadow:0 14px 34px rgba(15,23,42,.14)}
.package-option{width:100%;min-height:58px;padding:12px 14px;display:grid;grid-template-columns:18px minmax(0,1fr) auto;align-items:center;gap:12px;border:0;border-bottom:1px solid var(--border2);background:#fff;color:var(--text1);font-family:inherit;text-align:left;cursor:pointer}
.package-option:last-child{border-bottom:0}
.package-option:hover{background:#F8FAFC}
.package-option.selected{background:#EEF4FF}
.option-check{width:16px;height:16px;border:1px solid #CBD5E1;border-radius:50%;position:relative}
.package-option.selected .option-check{border-color:var(--primary)}
.package-option.selected .option-check::after{content:'';position:absolute;left:50%;top:50%;width:7px;height:7px;border-radius:50%;background:var(--primary);transform:translate(-50%,-50%)}
.option-main{min-width:0;display:flex;flex-direction:column;gap:4px}
.option-title{display:flex;align-items:center;gap:8px;min-width:0}
.option-title strong{font-size:14px;font-weight:700;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.option-title em{height:20px;padding:0 7px;display:inline-flex;align-items:center;background:var(--primary);color:#fff;font-size:11px;font-style:normal;font-weight:600;flex-shrink:0}
.option-main small{font-size:12px;color:var(--text3);line-height:1.4}
.option-price{color:var(--primary);font-size:15px;font-weight:700;white-space:nowrap}
.query-side{position:sticky;top:0;align-self:start;display:flex;flex-direction:column;gap:20px;max-height:calc(100vh - 113px);overflow:auto}
.query-side::-webkit-scrollbar{width:0}

.summary-card .card-title{margin-bottom:14px}
.summary-rows{display:flex;flex-direction:column;gap:10px}
.summary-row{display:flex;justify-content:space-between;align-items:center;font-size:14px}
.summary-label{color:var(--text2)}
.summary-value{font-weight:600;color:var(--text1);text-align:right}
.summary-divider{height:1px;background:var(--border);margin:14px 0}
.summary-total{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.total-label{font-size:14px;color:var(--text2)}
.total-value{font-size:24px;font-weight:700;color:var(--primary)}
.cost-hint{font-size:12px;color:var(--text3);line-height:1.7;margin-bottom:2px}

.submit-btn{width:100%;height:46px;justify-content:center;font-size:15px;margin-top:12px}

.duplicate-card{max-width:420px;padding:30px 32px;text-align:center}
.duplicate-icon{width:48px;height:48px;margin:0 auto 16px;background:var(--primary-light);display:flex;align-items:center;justify-content:center}
.duplicate-icon svg{width:26px;height:26px}
.duplicate-title{font-size:18px;font-weight:700;color:var(--text1);margin-bottom:10px}
.duplicate-desc{font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:24px}
.duplicate-actions{display:flex;justify-content:center;gap:12px}
.duplicate-actions .btn-primary,.duplicate-actions .btn-outline{height:40px;min-width:104px;justify-content:center}

.flow-card .card-title{margin-bottom:16px}
.flow-steps{display:flex;flex-direction:column;gap:14px}
.flow-step{display:flex;align-items:flex-start;gap:12px}
.step-num{width:24px;height:24px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--primary);flex-shrink:0;margin-top:1px}
.step-info{display:flex;flex-direction:column;gap:2px}
.step-title{font-size:13px;font-weight:600;color:var(--text1);line-height:1.5}

@media (max-width:1100px){
  .query-layout{grid-template-columns:1fr}
  .query-side{position:static;max-height:none;overflow:visible}
  .form-grid{grid-template-columns:1fr}
  .report-notice-panel{align-items:flex-start;flex-direction:column}
  .notice-checks{justify-content:flex-start}
}
@media (max-width:760px){
  .query-main{gap:16px}
  .package-select-trigger{grid-template-columns:minmax(0,1fr) auto 20px;gap:10px}
  .package-select-trigger .pkg-tag{display:none}
  .package-trigger-price{font-size:17px}
  .package-option{grid-template-columns:16px minmax(0,1fr);align-items:flex-start;gap:10px}
  .option-price{grid-column:2;font-size:14px}
  .duplicate-card{padding:26px 20px}
  .duplicate-actions{flex-direction:column}
  .duplicate-actions .btn-primary,.duplicate-actions .btn-outline{width:100%}
}
</style>
