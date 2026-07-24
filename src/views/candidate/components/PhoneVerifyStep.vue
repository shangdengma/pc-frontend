<template>
  <section class="candidate-step candidate-verify-step">
    <div class="candidate-step-kicker">
      <Smartphone :size="17" />
      本人身份核验
    </div>
    <h1>背景调查服务</h1>
    <p class="candidate-lead">
      为保障您的个人信息安全，请先完成手机号验证。验证通过后，您可以查看本次授权范围并填写核验信息。
    </p>

    <div class="candidate-security-note">
      <ShieldCheck :size="19" />
      <span>验证信息仅用于确认候选人本人身份，不会向发起方展示验证码。</span>
    </div>

    <form class="candidate-form-stack" @submit.prevent="$emit('continue')">
      <label class="candidate-field">
        <span>手机号码</span>
        <input
          :value="phone"
          type="tel"
          inputmode="numeric"
          maxlength="11"
          autocomplete="tel"
          :placeholder="`请输入 ${phoneHint} 对应的完整手机号`"
          @input="$emit('update:phone', $event.target.value.replace(/\D/g, ''))"
        />
      </label>

      <label class="candidate-field">
        <span>短信验证码</span>
        <div class="candidate-code-row">
          <input
            :value="code"
            type="tel"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
            placeholder="请输入6位验证码"
            @input="$emit('update:code', $event.target.value.replace(/\D/g, ''))"
          />
          <button
            type="button"
            class="candidate-secondary-button candidate-code-button"
            :disabled="sending || countdown > 0 || phone.length !== 11"
            @click="$emit('send-code')"
          >
            {{ countdown > 0 ? `${countdown}s 后重发` : sending ? '发送中' : '获取验证码' }}
          </button>
        </div>
      </label>

      <p v-if="demoMode" class="candidate-demo-hint">
        页面演示验证码：123456
      </p>
      <p v-if="error" class="candidate-form-error" role="alert">{{ error }}</p>

      <button class="candidate-primary-button" type="submit" :disabled="loading">
        {{ loading ? '正在核验...' : '进入个人信息授权' }}
        <ArrowRight v-if="!loading" :size="18" />
      </button>
    </form>
  </section>
</template>

<script setup>
import { ArrowRight, ShieldCheck, Smartphone } from '@lucide/vue'

defineProps({
  phone: { type: String, default: '' },
  code: { type: String, default: '' },
  phoneHint: { type: String, default: '手机尾号' },
  countdown: { type: Number, default: 0 },
  sending: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  demoMode: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

defineEmits(['update:phone', 'update:code', 'send-code', 'continue'])
</script>

