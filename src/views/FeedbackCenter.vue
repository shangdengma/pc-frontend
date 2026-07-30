<template>
  <section class="feedback-page">
    <header class="feedback-header">
      <div>
        <p>服务支持</p>
        <h2>意见反馈</h2>
        <span>请描述您遇到的问题或建议，提交后可在右侧查看处理进度。</span>
      </div>
    </header>

    <div class="feedback-layout">
      <form class="feedback-form" @submit.prevent="handleSubmit">
        <div class="feedback-section-head">
          <span class="feedback-step">01</span>
          <div>
            <h3>提交反馈</h3>
            <p>为便于准确处理，请尽量说明出现问题的页面和操作。</p>
          </div>
        </div>

        <fieldset>
          <legend>反馈类型</legend>
          <div class="feedback-types">
            <button
              v-for="item in feedbackTypes"
              :key="item.value"
              type="button"
              :class="{ active: form.feedbackType === item.value }"
              @click="form.feedbackType = item.value"
            >
              <component :is="item.icon" :size="16" />
              {{ item.label }}
            </button>
          </div>
        </fieldset>

        <label class="feedback-field">
          <span>反馈内容 <b>*</b></span>
          <textarea
            v-model="form.content"
            maxlength="2000"
            rows="8"
            placeholder="请填写具体问题、发生时间和期望结果"
            @input="formError = ''"
          ></textarea>
          <small>{{ form.content.length }}/2000</small>
        </label>

        <label class="feedback-field">
          <span>联系方式</span>
          <input
            v-model.trim="form.contact"
            maxlength="100"
            type="text"
            placeholder="手机号、邮箱或微信号（选填）"
          />
        </label>

        <p v-if="formError" class="feedback-error" role="alert">
          <CircleAlert :size="15" />
          {{ formError }}
        </p>

        <button class="feedback-submit" type="submit" :disabled="submitting || !canSubmit">
          <LoaderCircle v-if="submitting" class="feedback-spinner" :size="17" />
          <Send v-else :size="17" />
          {{ submitting ? '正在提交' : '提交反馈' }}
        </button>

        <p v-if="successNotice" class="feedback-success" role="status">
          <CircleCheck :size="16" />
          {{ successNotice }}
        </p>
      </form>

      <aside class="feedback-history">
        <div class="feedback-section-head">
          <span class="feedback-step">02</span>
          <div>
            <h3>我的反馈</h3>
            <p>最近提交的反馈及当前处理状态。</p>
          </div>
          <button type="button" aria-label="刷新反馈记录" :disabled="historyLoading" @click="loadHistory">
            <RefreshCw :class="{ spinning: historyLoading }" :size="16" />
          </button>
        </div>

        <div v-if="historyLoading && !feedbackHistory.length" class="feedback-empty">
          <LoaderCircle class="feedback-spinner" :size="21" />
          <span>正在加载反馈记录</span>
        </div>

        <div v-else-if="historyError && !feedbackHistory.length" class="feedback-empty error">
          <CircleAlert :size="21" />
          <strong>记录加载失败</strong>
          <span>{{ historyError }}</span>
        </div>

        <div v-else-if="!feedbackHistory.length" class="feedback-empty">
          <MessageSquareText :size="23" />
          <strong>暂无反馈记录</strong>
          <span>提交后可在这里查看处理进度。</span>
        </div>

        <div v-else class="feedback-records">
          <article v-for="item in feedbackHistory" :key="item.id">
            <div class="feedback-record-top">
              <span>{{ typeLabel(item.feedbackType) }}</span>
              <b :class="statusMeta(item.status).className">{{ statusMeta(item.status).label }}</b>
            </div>
            <p>{{ item.content }}</p>
            <time>{{ formatTime(item.createTime) }}</time>
          </article>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  CircleAlert,
  CircleCheck,
  Database,
  Lightbulb,
  LoaderCircle,
  MessageSquareText,
  MonitorCog,
  MoreHorizontal,
  RefreshCw,
  Send
} from '@lucide/vue'
import { getMyFeedbackList, submitFeedback } from '../api/support'
import { getUser } from '../utils/auth'

const feedbackTypes = [
  { value: 'experience', label: '体验问题', icon: MonitorCog },
  { value: 'feature', label: '功能建议', icon: Lightbulb },
  { value: 'data', label: '数据问题', icon: Database },
  { value: 'other', label: '其他', icon: MoreHorizontal }
]

const localUser = getUser() || {}
const form = reactive({
  feedbackType: 'experience',
  content: '',
  contact: localUser.phonenumber || localUser.email || ''
})
const submitting = ref(false)
const formError = ref('')
const successNotice = ref('')
const feedbackHistory = ref([])
const historyLoading = ref(false)
const historyError = ref('')

const canSubmit = computed(() => form.content.trim().length >= 5)

function typeLabel(type) {
  return feedbackTypes.find(item => item.value === type)?.label || '其他'
}

function statusMeta(status) {
  return ({
    pending: { label: '待处理', className: 'pending' },
    processing: { label: '处理中', className: 'processing' },
    resolved: { label: '已处理', className: 'resolved' },
    rejected: { label: '已关闭', className: 'rejected' }
  })[status] || { label: status || '待处理', className: 'pending' }
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date).replaceAll('/', '-')
}

async function loadHistory() {
  historyLoading.value = true
  historyError.value = ''
  try {
    const response = await getMyFeedbackList()
    feedbackHistory.value = Array.isArray(response.data) ? response.data.slice(0, 20) : []
  } catch (error) {
    historyError.value = error?.msg || error?.message || '请稍后重试'
  } finally {
    historyLoading.value = false
  }
}

async function handleSubmit() {
  formError.value = ''
  successNotice.value = ''
  const content = form.content.trim()
  if (content.length < 5) {
    formError.value = '请至少填写 5 个字的反馈内容'
    return
  }

  submitting.value = true
  try {
    await submitFeedback({
      feedbackType: form.feedbackType,
      content,
      contact: form.contact.trim()
    })
    form.content = ''
    successNotice.value = '反馈已提交，我们会尽快核实处理。'
    await loadHistory()
  } catch (error) {
    formError.value = error?.msg || error?.message || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

onMounted(loadHistory)
</script>

<style scoped>
.feedback-page {
  width: min(100%, 1120px);
  margin: 0 auto;
  color: var(--text);
}

.feedback-header {
  padding: 2px 0 23px;
  border-bottom: 1px solid var(--line);
}

.feedback-header p {
  margin: 0 0 7px;
  color: var(--blue);
  font-size: 12px;
  font-weight: 800;
}

.feedback-header h2 {
  margin: 0;
  font-size: 26px;
  line-height: 1.3;
}

.feedback-header span {
  display: block;
  margin-top: 7px;
  color: var(--muted);
  font-size: 14px;
}

.feedback-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
  gap: 24px;
  padding-top: 24px;
}

.feedback-form,
.feedback-history {
  border: 1px solid #dfe4eb;
  border-radius: 7px;
  background: #fff;
}

.feedback-form {
  padding: 24px;
}

.feedback-history {
  min-height: 520px;
  padding: 20px;
}

.feedback-section-head {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding-bottom: 19px;
  border-bottom: 1px solid #e6e9ee;
}

.feedback-step {
  color: #3469a8;
  font-size: 12px;
  font-weight: 900;
  line-height: 24px;
}

.feedback-section-head > div {
  min-width: 0;
  flex: 1;
}

.feedback-section-head h3 {
  margin: 0;
  font-size: 16px;
}

.feedback-section-head p {
  margin: 5px 0 0;
  color: #7a8696;
  font-size: 12px;
  line-height: 1.55;
}

.feedback-section-head > button {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid #dce1e8;
  border-radius: 5px;
  background: #fff;
  color: #647184;
  cursor: pointer;
}

.feedback-section-head > button:disabled {
  opacity: .55;
  cursor: default;
}

fieldset {
  margin: 22px 0;
  padding: 0;
  border: 0;
}

legend,
.feedback-field > span {
  display: block;
  margin-bottom: 9px;
  color: #344054;
  font-size: 13px;
  font-weight: 800;
}

.feedback-field b {
  color: #d92d20;
}

.feedback-types {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.feedback-types button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px;
  border: 1px solid #d8dee7;
  border-radius: 5px;
  background: #fff;
  color: #586577;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.feedback-types button:hover,
.feedback-types button.active {
  border-color: #7395bf;
  background: #f0f5fb;
  color: #214f85;
}

.feedback-field {
  position: relative;
  display: block;
  margin-top: 20px;
}

.feedback-field textarea,
.feedback-field input {
  width: 100%;
  border: 1px solid #d4dae3;
  border-radius: 6px;
  background: #fff;
  color: #1f2937;
  font-size: 14px;
  outline: 0;
}

.feedback-field textarea {
  min-height: 174px;
  padding: 12px 14px 30px;
  line-height: 1.7;
  resize: vertical;
}

.feedback-field input {
  height: 42px;
  padding: 0 13px;
}

.feedback-field textarea:focus,
.feedback-field input:focus {
  border-color: #497bb8;
  box-shadow: 0 0 0 3px rgba(52, 105, 168, .1);
}

.feedback-field > small {
  position: absolute;
  right: 12px;
  bottom: 9px;
  color: #98a2b3;
  font-size: 11px;
}

.feedback-error,
.feedback-success {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 15px 0 0;
  font-size: 13px;
}

.feedback-error {
  color: #b42318;
}

.feedback-success {
  color: #067647;
}

.feedback-submit {
  min-width: 136px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 0 18px;
  border: 0;
  border-radius: 5px;
  background: #234f85;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.feedback-submit:hover:not(:disabled) {
  background: #1b416f;
}

.feedback-submit:disabled {
  background: #aab6c5;
  cursor: not-allowed;
}

.feedback-records {
  max-height: 600px;
  overflow-y: auto;
}

.feedback-records article {
  padding: 16px 2px;
  border-bottom: 1px solid #e7eaf0;
}

.feedback-records article:last-child {
  border-bottom: 0;
}

.feedback-record-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.feedback-record-top > span {
  color: #435166;
  font-size: 12px;
  font-weight: 800;
}

.feedback-record-top b {
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 11px;
}

.feedback-record-top .pending {
  color: #b54708;
  background: #fffaeb;
}

.feedback-record-top .processing {
  color: #175cd3;
  background: #eff8ff;
}

.feedback-record-top .resolved {
  color: #067647;
  background: #ecfdf3;
}

.feedback-record-top .rejected {
  color: #667085;
  background: #f2f4f7;
}

.feedback-records p {
  display: -webkit-box;
  margin: 10px 0 8px;
  overflow: hidden;
  color: #4b586a;
  font-size: 13px;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.feedback-records time {
  color: #98a2b3;
  font-size: 11px;
}

.feedback-empty {
  min-height: 390px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: #8390a0;
  text-align: center;
}

.feedback-empty strong {
  color: #435166;
  font-size: 14px;
}

.feedback-empty span {
  font-size: 12px;
}

.feedback-empty.error svg {
  color: #d92d20;
}

.feedback-spinner,
.spinning {
  animation: feedback-spin .8s linear infinite;
}

@keyframes feedback-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .feedback-layout {
    grid-template-columns: 1fr;
  }

  .feedback-history {
    min-height: auto;
  }

  .feedback-empty {
    min-height: 220px;
  }
}

@media (max-width: 620px) {
  .feedback-form,
  .feedback-history {
    padding: 18px;
  }

  .feedback-types {
    grid-template-columns: repeat(2, 1fr);
  }

  .feedback-submit {
    width: 100%;
  }
}
</style>
