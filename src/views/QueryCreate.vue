<template>
  <div class="query-layout">
  <section class="work-card">
    <!-- 余额已常驻顶栏。原先摆在卡片头右上角，和下面的输入字段挤在同一块区域里，
         看着像表单的一部分而不是账户信息；余额不足时提交按钮下方本来就有明确提示。 -->
    <div class="work-card-head query-card-head">
      <div>
        <h2>{{ canOnlineTest ? '在线测试' : '发起背调' }}</h2>
      </div>
    </div>

    <div class="form-grid">
      <label :class="{ 'has-error': touched.name && !form.name }">
        <span>候选人姓名</span>
        <input v-model.trim="form.name" placeholder="请输入姓名" @blur="touched.name = true">
        <em v-if="touched.name && !form.name" class="field-error">请填写姓名</em>
      </label>
      <label :class="{ 'has-error': touched.mobile && form.mobile && !mobileValid }">
        <span>手机号</span>
        <input v-model.trim="form.mobile" :placeholder="canOnlineTest ? '选填，与身份证号至少填一项' : '请输入手机号'" maxlength="11"
               inputmode="numeric" @blur="touched.mobile = true">
        <em v-if="touched.mobile && form.mobile && !mobileValid" class="field-error">手机号格式不正确</em>
        <em v-else-if="mobileValid && !canOnlineTest" class="field-ok">候选人将在此号码收到授权短信</em>
        <em v-else-if="canOnlineTest" class="field-ok">选填，与身份证号至少填一项</em>
      </label>
      <!-- 身份证仅在线测试模式出现：正常查询由候选人在中间页填写并做二要素核验，
           在线测试不走中间页，只能由发起方填 -->
      <label v-if="canOnlineTest" :class="{ 'has-error': touched.idCard && form.idCard && !idCardValid }">
        <span>身份证号</span>
        <input v-model.trim="form.idCard" placeholder="选填，与手机号至少填一项" maxlength="18"
               @blur="touched.idCard = true">
        <em v-if="touched.idCard && form.idCard && !idCardValid" class="field-error">身份证号格式不正确</em>
        <em v-else class="field-ok">缺项将转入后台人工处理</em>
      </label>
      <label>
        <span>查询套餐</span>
        <select v-model="form.callTypeId">
          <option value="" disabled>请选择查询套餐</option>
          <option v-for="item in reportTypes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <!-- 通知偏好设置一次即长期生效，压成一行，详情走 title 提示 -->
    <div class="notify-pref-bar">
      <span class="notify-pref-label" title="需人工处理的报告出结果后的通知方式，设置一次长期生效">报告完成通知</span>
      <label class="notify-chip" :class="{ on: notifyChannels.includes('inbox') }"
             title="登录后在「消息通知」查看">
        <input type="checkbox" :checked="notifyChannels.includes('inbox')" @change="toggleNotify('inbox')">
        站内信
      </label>
      <label class="notify-chip" :class="{ on: notifyChannels.includes('sms') }"
             :title="profile.phonenumber ? `发送至 ${maskPhone(profile.phonenumber)}` : '当前账号未绑定手机号'">
        <input type="checkbox" :checked="notifyChannels.includes('sms')" @change="toggleNotify('sms')">
        短信
      </label>
      <label class="notify-chip" :class="{ on: notifyChannels.includes('email'), off: !profile.email }"
             :title="profile.email ? `发送至 ${profile.email}` : '尚未配置邮箱，点击前往个人信息设置'">
        <!-- 未配邮箱时必须真正 disabled：只靠 toggleNotify 里拦截的话，
             原生 checkbox 会先勾上、再被 Vue 渲染回来，闪一下，看着像能选中 -->
        <input type="checkbox" :disabled="!profile.email"
               :checked="notifyChannels.includes('email')" @change="toggleNotify('email')">
        邮箱
      </label>
      <router-link v-if="!profile.email" class="notify-pref-link" to="/account-profile">配置邮箱</router-link>
      <small v-if="notifySaving" class="notify-pref-state">保存中…</small>
      <small v-else-if="notifySaved" class="notify-pref-state ok">已保存</small>
      <!-- 允许一个都不选，但要让用户知道代价：报告完成后不会有任何提醒 -->
      <small v-else-if="!notifyChannels.length" class="notify-pref-state warn">不接收提醒，需自行查看记录</small>
    </div>

    <div v-if="message" class="form-message" :class="messageType">{{ message }}</div>

    <div class="submit-area">
      <button class="primary-btn page-action"
              :disabled="loading || !formValid || insufficientBalance"
              @click="submitQuery">
        {{ loading ? '提交中...' : '提交查询' }}
      </button>
      <!-- 按钮为什么不可点，直接说明白，不用等用户点了才报错 -->
      <small v-if="!loading && blockReason" class="submit-hint" :class="{ warn: insufficientBalance }">
        {{ blockReason }}
      </small>
    </div>
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
      <!-- 非在线测试只有电子签一种授权方式，写出来是废话；在线测试则值得标出来 -->
      <div v-if="canOnlineTest" class="cost-row">
        <span>执行方式</span>
        <strong>在线测试</strong>
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
import { getUserBalance, getUserProfile, updateNotifyChannels } from '../api/user'

const emit = defineEmits(['balance-updated'])
const router = useRouter()
const loading = ref(false)
const message = ref('')
const messageType = ref('info')
const queryTypeConfigs = ref([])
const priceMap = ref({})
const profile = ref({})
const availableBalance = ref(null)
const isSubAccount = computed(() => profile.value && (profile.value.parentUserId != null || profile.value.accountType === 'sub'))
const canOnlineTest = computed(() => profile.value && (profile.value.onlineTestEnabled === true || profile.value.onlineTestEnabled === 1 || profile.value.onlineTestEnabled === '1'))
const form = reactive({
  name: '',
  mobile: '',
  idCard: '',
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

// 表单即时校验：失焦后才提示，避免一进页面就飘红
const touched = reactive({ name: false, mobile: false, idCard: false })
const mobileValid = computed(() => /^1[3-9]\d{9}$/.test(form.mobile))
const idCardValid = computed(() => /^\d{17}[\dXx]$/.test(form.idCard))

// 两条路的必填规则不同：
//   在线测试 —— 不走中间页，身份信息只能由发起方给，姓名必填 + 手机/身份证至少一项，
//               缺项由后端 resolveLackStatus 标记后转人工处理
//   正常查询 —— 身份证由候选人在中间页填并做二要素核验，这里只需姓名 + 手机号
const formValid = computed(() => {
  if (!form.name || !form.callTypeId) return false
  if (canOnlineTest.value) {
    const okMobile = form.mobile ? mobileValid.value : false
    const okIdCard = form.idCard ? idCardValid.value : false
    // 至少一项填了且格式正确；填了但格式错则不放行
    if (form.mobile && !mobileValid.value) return false
    if (form.idCard && !idCardValid.value) return false
    return okMobile || okIdCard
  }
  return mobileValid.value
})

// 余额是分，套餐价是元，比较前先统一单位
const insufficientBalance = computed(() => {
  if (selectedPrice.value === '' || availableBalance.value == null) return false
  return Number(availableBalance.value) < Number(selectedPrice.value) * 100
})

// 按钮为什么不能点，提前讲清楚，省得用户点了才知道
const blockReason = computed(() => {
  if (insufficientBalance.value) {
    return isSubAccount.value
      ? '剩余额度不足，请联系主账号增加额度'
      : '可用余额不足，请先充值'
  }
  if (!form.name) return '请填写候选人姓名'
  if (canOnlineTest.value) {
    if (form.mobile && !mobileValid.value) return '手机号格式不正确'
    if (form.idCard && !idCardValid.value) return '身份证号格式不正确'
    if (!form.mobile && !form.idCard) return '手机号与身份证号至少填写一项'
  } else {
    if (!form.mobile) return '请填写候选人手机号'
    if (!mobileValid.value) return '手机号格式不正确'
  }
  if (!form.callTypeId) return '请选择查询套餐'
  return ''
})

// 报告完成通知偏好：一次设置长期生效，勾选即保存
const notifyChannels = ref([])
const notifySaving = ref(false)
const notifySaved = ref(false)

function maskPhone(value) {
  const s = String(value || '')
  return s.length === 11 ? `${s.slice(0, 3)}****${s.slice(-4)}` : s
}

async function toggleNotify(channel) {
  if (channel === 'email' && !profile.value.email) {
    return show('请先在个人信息中配置邮箱，再开启邮箱通知', 'error')
  }
  const next = notifyChannels.value.includes(channel)
    ? notifyChannels.value.filter(item => item !== channel)
    : [...notifyChannels.value, channel]
  const previous = notifyChannels.value
  notifyChannels.value = next
  notifySaving.value = true
  notifySaved.value = false
  try {
    const res = await updateNotifyChannels(next.join(','))
    if (res?.notifyChannels) {
      notifyChannels.value = String(res.notifyChannels).split(',').filter(Boolean)
    }
    notifySaved.value = true
    setTimeout(() => { notifySaved.value = false }, 2000)
  } catch (err) {
    notifyChannels.value = previous
    show(err?.msg || '通知偏好保存失败', 'error')
  } finally {
    notifySaving.value = false
  }
}

function show(text, type = 'info') {
  message.value = text
  messageType.value = type
}

function validate() {
  if (!form.name) return '请填写候选人姓名'
  if (!form.mobile) return '请填写候选人手机号'
  if (!/^1[3-9]\d{9}$/.test(form.mobile)) return '手机号格式不正确'
  if (!form.callTypeId) return '请选择查询套餐'
  return ''
}

function buildQueryData() {
  // 正常查询：身份证号由候选人在中间页填写，这里不传，也不按缺身份证推断 lackStatus，
  //           否则会把正常单误判成人工补充单。
  // 在线测试：不走中间页，身份证由发起方填，缺项交给后端 resolveLackStatus 标记转人工。
  // 订单状态一律由后端状态服务决定，前端不再传旧的数字状态。
  const payload = {
    name: form.name,
    mobile: form.mobile,
    callTypeId: form.callTypeId,
    data: '',
    isBackground: 0
  }
  if (canOnlineTest.value && form.idCard) {
    payload.idCard = form.idCard
  }
  return payload
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
        show('已创建查询并发送候选人授权短信，请提醒候选人完成信息填写与授权签署。', 'success')
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
    profile.value = data
    // 初始化通知偏好；未设置过时默认站内信
    notifyChannels.value = String(data.notifyChannels || 'inbox').split(',').map(v => v.trim()).filter(Boolean)
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
.query-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.auth-method-panel {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid #e5edf8;
  border-radius: var(--radius);
  background: #fbfdff;
}

.auth-method-title {
  display: block;
  margin-bottom: 12px;
  font-size: var(--fs-base);
  font-weight: 700;
  color: #172033;
}

.auth-method-current {
  min-height: 72px;
  padding: 13px 15px;
  border: 1px solid var(--text);
  border-radius: var(--radius);
  background: var(--line-soft);
  box-shadow: inset 3px 0 0 var(--text);
  text-align: left;
}

.auth-method-current strong,
.auth-method-current small {
  display: block;
}

.auth-method-current strong {
  color: var(--text);
  font-size: var(--fs-base);
}

.auth-method-current small {
  margin-top: 6px;
  color: var(--muted);
}

@media (max-width: 900px) {
  .query-card-head {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

}

/* ---- 表单即时校验 ---- */
.form-grid label { position: relative; }
.form-grid label.has-error input,
.form-grid label.has-error select {
  border-color: #e35d5b;
}
.field-error,
.field-ok {
  display: block;
  margin-top: 4px;
  font-style: normal;
  font-size: var(--fs-xs);
  line-height: 1.4;
}
.field-error { color: #e35d5b; }
.field-ok { color: #8794a8; }

/* ---- 提交区 ---- */
.submit-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.submit-area .primary-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.submit-hint {
  font-size: var(--fs-xs);
  color: #8794a8;
}
.submit-hint.warn { color: #d67a00; }

/* 移动端：表单是这页的目的，必须排第一屏。
   原先把整个侧栏 order:-1 提到最前，结果打开页面先看到的是一张全是「—」的空摘要，
   要滚两屏才够得着输入框。改为拆开侧栏：表单 → 费用摘要 → 流程说明。 */
@media (max-width: 900px) {
  .query-layout { grid-template-columns: minmax(0, 1fr); }

  /* contents 让两张卡片直接参与外层网格，才能各自排序 */
  .query-aside { display: contents; }
  .query-aside .cost-card { order: 2; }
  .query-aside .flow-card { order: 3; }

  .query-card-head { flex-direction: column; align-items: stretch; gap: 10px; }

  /* 主操作在手机上占满一行；提示文字挪到按钮下方，
     不然按钮被提示挤成 80px 宽，既难点也不像主按钮 */
  .submit-area {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .submit-area .primary-btn {
    width: 100%;
    justify-content: center;
  }

  .submit-hint { text-align: center; }
}
</style>
