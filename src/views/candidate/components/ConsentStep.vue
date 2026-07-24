<template>
  <section class="candidate-step candidate-consent-step">
    <div class="candidate-page-heading">
      <div>
        <div class="candidate-step-kicker">
          <FileText :size="17" />
          授权声明
        </div>
        <h1>个人信息授权</h1>
        <p>请完整阅读本次授权范围和信息使用说明。</p>
      </div>
      <span class="candidate-verified-badge">
        <BadgeCheck :size="17" />
        本人已核验
      </span>
    </div>

    <div class="candidate-consent-document">
      <p>
        本人自愿并明确授权 <strong>{{ companyName }}</strong> 及其委托的背景调查服务机构，为招聘、任职核验或合规管理之目的，依法收集、使用和核验本人提供的相关信息。
      </p>

      <h2>一、授权内容</h2>
      <ol>
        <li>本人身份信息，包括姓名、身份证号码、手机号码等必要信息。</li>
        <li v-for="item in moduleLabels" :key="item">本次套餐包含的 {{ item }} 相关信息。</li>
        <li>本人主动填写并提交的其他核验资料，以及核验过程中形成的结果信息。</li>
      </ol>

      <h2>二、信息使用与共享</h2>
      <ol>
        <li>相关信息仅用于本次背景调查、身份核验、报告生成及必要的质量复核。</li>
        <li>核验结果将按照约定返回给本次调查发起方，不用于与本次服务无关的营销活动。</li>
        <li>服务机构将采取访问控制、传输加密和留痕审计等措施保护个人信息安全。</li>
      </ol>

      <h2>三、本人确认</h2>
      <ol>
        <li>本人确认所填写的信息真实、准确、完整，并知悉不实信息可能影响核验结果。</li>
        <li>本人理解并同意，在进入电子签署页面完成签名后，本次授权正式生效。</li>
      </ol>
    </div>

    <label class="candidate-check-row">
      <input
        :checked="accepted"
        type="checkbox"
        @change="$emit('update:accepted', $event.target.checked)"
      />
      <span>
        我已阅读并同意
        <button type="button" @click="$emit('show-agreement')">《背调用户协议》</button>
        和
        <button type="button" @click="$emit('show-privacy')">《隐私政策》</button>
      </span>
    </label>

    <button
      class="candidate-primary-button"
      type="button"
      :disabled="!accepted"
      @click="$emit('continue')"
    >
      同意授权，填写个人信息
      <ArrowRight :size="18" />
    </button>
  </section>
</template>

<script setup>
import { ArrowRight, BadgeCheck, FileText } from '@lucide/vue'

defineProps({
  accepted: { type: Boolean, default: false },
  companyName: { type: String, default: '本次调查发起企业' },
  moduleLabels: { type: Array, default: () => [] }
})

defineEmits(['update:accepted', 'continue', 'show-agreement', 'show-privacy'])
</script>

