<template>
  <section class="feedback-page">
    <header class="page-head">
      <div class="page-head-main">
        <p class="page-head-eyebrow">服务支持</p>
        <h2>意见反馈</h2>
        <p class="page-head-desc">请描述您遇到的问题或建议，提交后可在下方查看处理进度。</p>
      </div>
    </header>

    <div class="feedback-layout">
      <form class="feedback-form" @submit.prevent="handleSubmit">
        <div class="feedback-section-head">
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
          <div>
            <h3>我的反馈</h3>
            <p>最近提交的反馈及当前处理状态。</p>
          </div>
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
  Send
} from '@lucide/vue'
import { getMyFeedbackList, submitFeedback } from '../api/support'
import { useRefresh } from '../composables/pullRefresh'
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
// 与公告页一致：移动端下拉刷新，替掉原来那个刷新按钮
useRefresh(loadHistory)
</script>

<style scoped>
.feedback-page {
  width: min(100%, 1040px);
  margin: 0 auto;
  color: var(--text);
}

.feedback-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
  gap: 24px;
  padding-top: 24px;
}

.feedback-form,
.feedback-history {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
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
  border-bottom: 1px solid var(--line);
}

.feedback-section-head > div {
  min-width: 0;
  flex: 1;
}

.feedback-section-head h3 {
  margin: 0;
  font-size: var(--fs-lg);
}

.feedback-section-head p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: var(--fs-xs);
  line-height: 1.55;
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
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  font-weight: 600;
}

.feedback-field b {
  color: var(--red);
}

.feedback-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px;
}

.feedback-types button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
}

.feedback-types button:hover {
  border-color: var(--text);
  color: var(--text);
}

/* 选中态要比 hover 更实：hover 只描边，选中填底并加粗 */
.feedback-types button.active {
  border-color: var(--text);
  background: var(--line-soft);
  color: var(--cinnabar);
  font-weight: 600;
}

.feedback-field {
  position: relative;
  display: block;
  margin-top: 20px;
}

.feedback-field textarea,
.feedback-field input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--text);
  font-size: var(--fs-base);
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
  border-color: var(--text);
  box-shadow: 0 0 0 3px rgba(52, 105, 168, .1);
}

.feedback-field > small {
  position: absolute;
  right: 12px;
  bottom: 9px;
  color: var(--faint);
  font-size: var(--fs-xs);
}

.feedback-error,
.feedback-success {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 15px 0 0;
  font-size: var(--fs-sm);
}

.feedback-error {
  color: var(--red);
}

.feedback-success {
  color: var(--green);
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
  border-radius: var(--radius);
  background: var(--cinnabar);
  color: var(--card);
  font-size: var(--fs-sm);
  font-weight: 800;
  cursor: pointer;
}

.feedback-submit:hover:not(:disabled) {
  background: var(--blue-dark);
}

.feedback-submit:disabled {
  background: var(--faint);
  cursor: not-allowed;
}

.feedback-records {
  max-height: 600px;
  overflow-y: auto;
}

.feedback-records article {
  padding: 16px 2px;
  border-bottom: 1px solid var(--line);
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
  color: var(--text-secondary);
  font-size: var(--fs-xs);
  font-weight: 800;
}

.feedback-record-top b {
  padding: 3px 7px;
  border-radius: var(--radius-sm);
  font-size: var(--fs-xs);
}

.feedback-record-top .pending {
  color: var(--orange);
  background: var(--orange-soft);
}

.feedback-record-top .processing {
  color: var(--cinnabar);
  background: var(--line-soft);
}

.feedback-record-top .resolved {
  color: var(--green);
  background: var(--green-soft);
}

.feedback-record-top .rejected {
  color: var(--muted);
  background: var(--line-soft);
}

.feedback-records p {
  display: -webkit-box;
  margin: 10px 0 8px;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.feedback-records time {
  color: var(--faint);
  font-size: var(--fs-xs);
}

.feedback-empty {
  min-height: 390px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: var(--muted);
  text-align: center;
}

.feedback-empty strong {
  color: var(--text-secondary);
  font-size: var(--fs-base);
}

.feedback-empty span {
  font-size: var(--fs-xs);
}

.feedback-empty.error svg {
  color: var(--red);
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
