<template>
  <div class="legal-page">
    <header class="legal-header">
      <router-link class="legal-brand" to="/login" aria-label="返回钟馗背调登录页">
        <span class="legal-brand-seal" aria-hidden="true">钟馗</span>
        <span>
          <strong>钟馗背调</strong>
          <small>企业版工作台</small>
        </span>
      </router-link>
      <router-link class="legal-back" to="/login">
        <ArrowLeft :size="16" aria-hidden="true" />
        返回登录
      </router-link>
    </header>

    <main class="legal-main">
      <div class="legal-heading">
        <p>平台服务条款</p>
        <h1>{{ legalDocument.title }}</h1>
      </div>

      <article class="legal-content" :aria-busy="loading">
        <div v-if="loading" class="legal-loading">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <template v-else>
          <p v-if="legalDocument.summary" class="legal-intro">{{ legalDocument.summary }}</p>
          <div
            v-if="legalDocument.contentFormat !== 'PLAIN'"
            class="legal-rich-text"
            v-html="renderedContent"
          ></div>
          <div v-else class="legal-plain">{{ legalDocument.content }}</div>
        </template>
      </article>
    </main>

    <footer class="legal-footer">
      河南钟馗科技有限公司 · 豫ICP备2025138155号
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { getPublicLegalDocument } from '../api/legal'

const props = defineProps({
  type: {
    type: String,
    default: 'agreement'
  }
})

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: false
})

const fallbackDocuments = {
  agreement: {
    docKey: 'user_agreement',
    title: '用户协议',
    version: '默认版本',
    summary: '欢迎使用钟馗背调企业版工作台。请在使用平台服务前认真阅读本协议，登录或继续使用平台即表示您理解并同意遵守本协议。',
    contentFormat: 'MARKDOWN',
    content: `## 一、服务范围

平台为依法开展人才招聘、用工管理及相关合规业务的企业用户提供背景调查订单管理、授权管理、报告查询、账户及配套服务。具体功能以平台实际提供的内容为准。

## 二、账号与安全

您应提供真实、准确、完整的企业及账号信息，妥善保管登录凭证，并对账号下发生的操作承担相应责任。发现账号异常时，请立即停止使用并联系平台处理。

## 三、合规使用

您应确保查询目的合法、授权真实有效，并仅在获得候选人充分授权后发起背景调查。不得绕过授权、冒用身份、批量探测、转售数据，或将查询结果用于任何违法及歧视性用途。

## 四、订单与费用

服务价格、扣费方式、退款条件及报告状态以订单页面和平台规则为准。因信息缺失转入人工处理时，平台可按照下单时展示的价格收取相应服务费用。

## 五、服务变更与责任

平台将持续维护服务稳定性，但因第三方接口、通信网络、不可抗力或必要维护造成的中断，将在合理范围内及时处理。用户违反法律法规或本协议的，平台有权限制或终止相关服务。

## 六、协议更新

平台可依据法律法规及业务变化更新本协议，并通过页面提示、公告等合理方式告知。对本协议有疑问，可通过平台公布的客服渠道联系我们。`
  },
  privacy: {
    docKey: 'privacy_policy',
    title: '隐私政策',
    version: '默认版本',
    summary: '河南钟馗科技有限公司重视您的个人信息和业务数据安全。本政策说明平台在提供服务过程中如何收集、使用、保存和保护相关信息。',
    contentFormat: 'MARKDOWN',
    content: `## 一、信息收集

为完成注册、登录、企业认证、订单处理和安全审计，平台可能收集账号、手机号、企业信息、登录日志、设备及网络信息，以及您在使用具体业务功能时主动提交的信息。

## 二、信息使用

相关信息仅用于身份验证、提供平台功能、处理订单与支付、发送必要通知、保障账号安全、排查故障及履行法律法规规定的义务。

## 三、候选人信息处理

企业用户提交候选人信息前，应取得合法、充分、明确的授权。平台依据授权范围处理背景调查所需信息，并采取权限控制、日志审计等措施防止未经授权的访问和使用。

## 四、共享与委托处理

为完成短信、电子签、支付及背景核验等必要服务，平台可能向依法合作的服务商提供完成该项服务所必需的信息，并要求其按照约定和法律规定保护信息安全。

## 五、保存与保护

平台在实现服务目的所必需的期限内保存信息，并采取访问控制、传输保护、数据备份和安全审计等措施。超过保存期限后，将依法删除或进行匿名化处理。

## 六、您的权利

您可依法申请查询、更正或删除相关个人信息，也可以撤回非必要授权或注销账号。部分信息因履行合同、安全审计或法律义务，可能需要在法定期限内继续保存。

## 七、政策更新与联系

本政策可能根据法律法规及服务变化进行更新。对个人信息处理有疑问或需要行使相关权利，可通过平台公布的客服渠道联系我们。`
  }
}

const loading = ref(true)
const remoteDocument = ref(null)
let loadSequence = 0

const fallbackDocument = computed(() => fallbackDocuments[props.type] || fallbackDocuments.agreement)
const docKey = computed(() => fallbackDocument.value.docKey)
const legalDocument = computed(() => remoteDocument.value || fallbackDocument.value)

const renderedContent = computed(() => {
  const content = legalDocument.value.content || ''
  const format = legalDocument.value.contentFormat
  const html = format === 'HTML' ? content : markdown.render(content)
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['form', 'input', 'button', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload']
  })
})

function normalizeDocument(data) {
  const content = String(data?.content || '').trim()
  if (!content) return null
  const contentFormat = String(data?.contentFormat || 'MARKDOWN').toUpperCase()
  return {
    docKey: data.docKey || docKey.value,
    title: data.title || fallbackDocument.value.title,
    version: data.version || '',
    summary: data.summary || '',
    content,
    contentFormat: ['PLAIN', 'HTML', 'MARKDOWN'].includes(contentFormat) ? contentFormat : 'MARKDOWN',
    publishTime: data.publishTime || '',
    effectiveTime: data.effectiveTime || ''
  }
}

async function loadDocument() {
  const sequence = ++loadSequence
  loading.value = true
  remoteDocument.value = null
  try {
    const response = await getPublicLegalDocument(docKey.value)
    if (sequence === loadSequence) {
      remoteDocument.value = normalizeDocument(response?.data)
    }
  } catch {
    if (sequence === loadSequence) {
      remoteDocument.value = null
    }
  } finally {
    if (sequence === loadSequence) {
      loading.value = false
    }
  }
}

watch(docKey, loadDocument, { immediate: true })
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  color: #20232a;
  background: #faf9f6;
}

.legal-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 max(24px, calc((100vw - 920px) / 2));
  border-bottom: 1px solid #e4e1da;
  background: rgba(250, 249, 246, 0.96);
  backdrop-filter: blur(10px);
}

.legal-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: inherit;
}

.legal-brand-seal {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 4px;
  background: #a6392e;
  color: #fff;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 12px;
  font-weight: 700;
}

.legal-brand strong,
.legal-brand small {
  display: block;
  letter-spacing: 0;
}

.legal-brand strong {
  font-size: 15px;
  font-weight: 650;
}

.legal-brand small {
  margin-top: 1px;
  color: #938b80;
  font-size: 10px;
}

.legal-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #5f5a52;
  font-size: 13px;
  font-weight: 500;
}

.legal-back:hover {
  color: #a6392e;
}

.legal-main {
  width: min(100% - 48px, 860px);
  margin: 0 auto;
  padding: 64px 0 72px;
}

.legal-heading {
  padding-bottom: 28px;
  border-bottom: 1px solid #d9d5cd;
}

.legal-heading > p {
  margin: 0 0 10px;
  color: #a6392e;
  font-size: 12px;
  font-weight: 650;
}

.legal-heading h1 {
  margin: 0 0 12px;
  color: #17191e;
  font-size: 32px;
  font-weight: 650;
  letter-spacing: 0;
}

.legal-content {
  min-height: 360px;
  padding-top: 32px;
  color: #4d4942;
  font-size: 14px;
  line-height: 1.9;
}

.legal-intro {
  margin: 0 0 34px;
  color: #35322e;
}

.legal-plain {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.legal-rich-text {
  overflow-wrap: anywhere;
}

.legal-rich-text :deep(h1),
.legal-rich-text :deep(h2),
.legal-rich-text :deep(h3),
.legal-rich-text :deep(h4) {
  color: #20232a;
  font-weight: 650;
  letter-spacing: 0;
}

.legal-rich-text :deep(h1) {
  margin: 38px 0 12px;
  font-size: 20px;
}

.legal-rich-text :deep(h2) {
  margin: 30px 0 9px;
  font-size: 16px;
}

.legal-rich-text :deep(h3),
.legal-rich-text :deep(h4) {
  margin: 24px 0 8px;
  font-size: 14px;
}

.legal-rich-text :deep(p) {
  margin: 0 0 16px;
}

.legal-rich-text :deep(ul),
.legal-rich-text :deep(ol) {
  margin: 10px 0 18px;
  padding-left: 24px;
}

.legal-rich-text :deep(li + li) {
  margin-top: 5px;
}

.legal-rich-text :deep(blockquote) {
  margin: 20px 0;
  padding: 12px 16px;
  border-left: 3px solid #b34a3e;
  background: #f3f0eb;
  color: #625c54;
}

.legal-rich-text :deep(a) {
  color: #a6392e;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.legal-rich-text :deep(hr) {
  margin: 28px 0;
  border: 0;
  border-top: 1px solid #dedad2;
}

.legal-rich-text :deep(table) {
  width: 100%;
  margin: 18px 0 24px;
  border-collapse: collapse;
  background: #fff;
}

.legal-rich-text :deep(th),
.legal-rich-text :deep(td) {
  padding: 10px 12px;
  border: 1px solid #dedad2;
  text-align: left;
  vertical-align: top;
}

.legal-rich-text :deep(th) {
  background: #f3f0eb;
  color: #302d29;
  font-weight: 650;
}

.legal-rich-text :deep(code) {
  padding: 2px 5px;
  border-radius: 3px;
  background: #eeeae4;
  font-family: Consolas, monospace;
  font-size: 0.92em;
}

.legal-rich-text :deep(pre) {
  overflow-x: auto;
  padding: 14px;
  border: 1px solid #dedad2;
  background: #f3f0eb;
}

.legal-rich-text :deep(pre code) {
  padding: 0;
  background: transparent;
}

.legal-rich-text :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 18px auto;
}

.legal-loading {
  display: grid;
  gap: 14px;
}

.legal-loading span {
  display: block;
  height: 13px;
  border-radius: 3px;
  background: #eeeae4;
  animation: legal-pulse 1.2s ease-in-out infinite alternate;
}

.legal-loading span:nth-child(2) {
  width: 92%;
}

.legal-loading span:nth-child(3) {
  width: 76%;
}

@keyframes legal-pulse {
  from { opacity: 0.55; }
  to { opacity: 1; }
}

.legal-footer {
  padding: 24px;
  border-top: 1px solid #e4e1da;
  color: #aaa298;
  font-size: 11px;
  text-align: center;
}

@media (max-width: 600px) {
  .legal-header {
    min-height: 58px;
    padding: 0 18px;
  }

  .legal-brand small {
    display: none;
  }

  .legal-main {
    width: min(100% - 36px, 860px);
    padding: 42px 0 56px;
  }

  .legal-heading h1 {
    font-size: 27px;
  }

  .legal-content {
    font-size: 13.5px;
  }

  .legal-rich-text :deep(table) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>
