<template>
  <section class="candidate-step candidate-review-step">
    <div class="candidate-page-heading">
      <div>
        <div class="candidate-step-kicker">
          <FileCheck2 :size="17" />
          信息确认
        </div>
        <h1>请确认填写信息</h1>
        <p>签名前请再次检查。确认后将进入电子签署页面。</p>
      </div>
      <span class="candidate-review-state">
        <CheckCircle2 :size="17" />
        待签署
      </span>
    </div>

    <section class="candidate-review-section">
      <h2>个人信息</h2>
      <dl class="candidate-review-list">
        <div><dt>姓名</dt><dd>{{ model.candidate.name }}</dd></div>
        <div><dt>身份证号</dt><dd>{{ maskIdCard(model.candidate.idCard) }}</dd></div>
        <div><dt>手机号码</dt><dd>{{ maskPhone(model.candidate.phone) }}</dd></div>
        <div v-if="model.candidate.email"><dt>邮箱地址</dt><dd>{{ model.candidate.email }}</dd></div>
      </dl>
    </section>

    <section v-if="hasModule(MODULE_KEYS.EDUCATION)" class="candidate-review-section">
      <h2>学历信息</h2>
      <article v-for="(item, index) in model.educations" :key="item.id" class="candidate-review-entry">
        <span>学历 {{ index + 1 }}</span>
        <strong>{{ item.credentialNo }}</strong>
      </article>
    </section>

    <section v-if="hasModule(MODULE_KEYS.EMPLOYMENT)" class="candidate-review-section">
      <h2>工作经历</h2>
      <article v-for="(item, index) in model.employments" :key="item.id" class="candidate-review-entry">
        <span>工作经历 {{ index + 1 }}</span>
        <strong>{{ item.companyName }}</strong>
        <p>{{ displayPeriod(item) }} · {{ item.salaryRange }}</p>
      </article>
    </section>

    <section v-if="hasModule(MODULE_KEYS.REFERENCE)" class="candidate-review-section">
      <h2>工作经历访谈</h2>
      <article v-for="(item, index) in model.references" :key="item.id" class="candidate-review-entry">
        <span>证明人 {{ index + 1 }}</span>
        <strong>{{ item.contactName }} · {{ item.contactRole }}</strong>
        <p>{{ item.companyName }} · {{ displayPeriod(item) }}</p>
        <p>{{ item.contactPhone }}</p>
      </article>
    </section>

    <div class="candidate-sign-notice">
      <ShieldCheck :size="20" />
      <div>
        <strong>下一步将进入电子签署</strong>
        <p>电子签署由 e签宝提供技术服务。签署完成后，本次授权正式生效。</p>
      </div>
    </div>

    <p v-if="error" class="candidate-form-error" role="alert">{{ error }}</p>

    <div class="candidate-footer-actions candidate-review-actions">
      <button type="button" class="candidate-secondary-button" @click="$emit('back')">返回修改</button>
      <button type="button" class="candidate-primary-button" :disabled="loading" @click="$emit('sign')">
        {{ loading ? '正在进入签署...' : '确认无误，去签名' }}
        <ArrowRight v-if="!loading" :size="18" />
      </button>
    </div>
  </section>
</template>

<script setup>
import { ArrowRight, CheckCircle2, FileCheck2, ShieldCheck } from '@lucide/vue'
import { MODULE_KEYS } from '../candidateFormSchema'

const props = defineProps({
  model: { type: Object, required: true },
  modules: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

defineEmits(['back', 'sign'])

function hasModule(key) {
  return props.modules.includes(key)
}

function maskPhone(value) {
  return String(value || '').replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

function maskIdCard(value) {
  const text = String(value || '')
  if (text.length < 8) return text
  return `${text.slice(0, 4)}**********${text.slice(-4)}`
}

function displayPeriod(item) {
  return `${item.startMonth || '-'} 至 ${item.isCurrent ? '至今' : item.endMonth || '-'}`
}
</script>

