<template>
  <div class="contact-page" :class="{ 'contact-page--embedded': embedded }">
    <header v-if="!embedded" class="contact-header">
      <router-link class="contact-brand" to="/login" aria-label="返回钟馗背调登录页">
        <span class="contact-brand-seal" aria-hidden="true">钟馗</span>
        <span>
          <strong>钟馗背调</strong>
          <small>企业版工作台</small>
        </span>
      </router-link>
      <router-link class="contact-back" to="/login">
        <ArrowLeft :size="16" aria-hidden="true" />
        返回登录
      </router-link>
    </header>

    <main class="contact-main">
      <section class="contact-intro">
        <p>客户服务</p>
        <h1>{{ contact.title || '联系我们' }}</h1>
        <div class="contact-rule"></div>
        <p class="contact-description">
          {{ contact.content || '如您在登录或使用平台时遇到问题，请通过以下方式联系我们。' }}
        </p>
      </section>

      <section class="contact-panel" :aria-busy="loading">
        <div v-if="loading" class="contact-loading">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <template v-else>
          <div v-if="contact.phoneOne" class="contact-row">
            <span class="contact-icon"><Phone :size="20" aria-hidden="true" /></span>
            <span class="contact-label">客服电话一</span>
            <strong>{{ contact.phoneOne }}</strong>
            <button type="button" @click="copyContact('phoneOne', contact.phoneOne)">
              <Check v-if="copiedKey === 'phoneOne'" :size="14" aria-hidden="true" />
              <Copy v-else :size="14" aria-hidden="true" />
              {{ copiedKey === 'phoneOne' ? '已复制' : '点击复制' }}
            </button>
          </div>

          <div v-if="contact.phoneTwo" class="contact-row">
            <span class="contact-icon"><Smartphone :size="20" aria-hidden="true" /></span>
            <span class="contact-label">客服电话二</span>
            <strong>{{ contact.phoneTwo }}</strong>
            <button type="button" @click="copyContact('phoneTwo', contact.phoneTwo)">
              <Check v-if="copiedKey === 'phoneTwo'" :size="14" aria-hidden="true" />
              <Copy v-else :size="14" aria-hidden="true" />
              {{ copiedKey === 'phoneTwo' ? '已复制' : '点击复制' }}
            </button>
          </div>

          <div v-if="contact.wechat" class="contact-row">
            <span class="contact-icon wechat"><MessageCircle :size="20" aria-hidden="true" /></span>
            <span class="contact-label">微信号</span>
            <strong>{{ contact.wechat }}</strong>
            <button type="button" @click="copyContact('wechat', contact.wechat)">
              <Check v-if="copiedKey === 'wechat'" :size="14" aria-hidden="true" />
              <Copy v-else :size="14" aria-hidden="true" />
              {{ copiedKey === 'wechat' ? '已复制' : '点击复制' }}
            </button>
          </div>

          <div v-if="contact.qq" class="contact-row">
            <span class="contact-icon"><UserRound :size="20" aria-hidden="true" /></span>
            <span class="contact-label">QQ号</span>
            <strong>{{ contact.qq }}</strong>
            <button type="button" @click="copyContact('qq', contact.qq)">
              <Check v-if="copiedKey === 'qq'" :size="14" aria-hidden="true" />
              <Copy v-else :size="14" aria-hidden="true" />
              {{ copiedKey === 'qq' ? '已复制' : '点击复制' }}
            </button>
          </div>

          <div v-if="contact.email" class="contact-row">
            <span class="contact-icon"><Mail :size="20" aria-hidden="true" /></span>
            <span class="contact-label">邮箱</span>
            <strong>{{ contact.email }}</strong>
            <button type="button" @click="copyContact('email', contact.email)">
              <Check v-if="copiedKey === 'email'" :size="14" aria-hidden="true" />
              <Copy v-else :size="14" aria-hidden="true" />
              {{ copiedKey === 'email' ? '已复制' : '点击复制' }}
            </button>
          </div>

          <a
            v-if="contact.linkUrl"
            class="contact-row contact-online"
            :href="contact.linkUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="contact-icon"><Headphones :size="20" aria-hidden="true" /></span>
            <span class="contact-label">在线客服</span>
            <strong>联系在线客服</strong>
            <span class="contact-open">
              立即联系
              <ExternalLink :size="14" aria-hidden="true" />
            </span>
          </a>

          <div v-if="!hasContactMethod" class="contact-empty">
            <CircleAlert :size="20" aria-hidden="true" />
            <span>{{ loadError || '客服联系方式正在维护，请稍后再试。' }}</span>
          </div>
        </template>
      </section>
      <p class="contact-copy-status" aria-live="polite">{{ copyNotice }}</p>
    </main>

    <footer v-if="!embedded" class="contact-footer">河南钟馗科技有限公司</footer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Copy,
  ExternalLink,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  Smartphone,
  UserRound
} from '@lucide/vue'
import { getPublicPcContact } from '../api/contact'

defineProps({
  embedded: {
    type: Boolean,
    default: false
  }
})

const loading = ref(true)
const loadError = ref('')
const copiedKey = ref('')
const copyNotice = ref('')
const contact = reactive({
  title: '',
  content: '',
  linkUrl: '',
  phoneOne: '',
  phoneTwo: '',
  wechat: '',
  qq: '',
  email: ''
})
let copyTimer = null

const hasContactMethod = computed(() => Boolean(
  contact.phoneOne ||
  contact.phoneTwo ||
  contact.wechat ||
  contact.qq ||
  contact.email ||
  contact.linkUrl
))

async function copyContact(key, value) {
  const text = String(value || '').trim()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    copyNotice.value = '联系方式已复制'
  } catch {
    copyNotice.value = '复制失败，请手动选择联系方式'
    return
  }
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copiedKey.value = ''
    copyNotice.value = ''
  }, 1800)
}

async function loadContact() {
  loading.value = true
  loadError.value = ''
  try {
    const response = await getPublicPcContact()
    Object.assign(contact, response?.data || {})
  } catch (error) {
    loadError.value = error?.msg || '客服联系方式加载失败，请稍后再试。'
  } finally {
    loading.value = false
  }
}

onMounted(loadContact)
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #20232a;
  background: #faf9f6;
}

.contact-page--embedded {
  min-height: auto;
  background: transparent;
}

.contact-page--embedded .contact-main {
  width: min(920px, 100%);
  padding: 8px 0 32px;
}

.contact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 max(24px, calc((100vw - 920px) / 2));
  border-bottom: 1px solid #e4e1da;
  background: rgba(250, 249, 246, 0.96);
}

.contact-brand,
.contact-back {
  display: inline-flex;
  align-items: center;
  color: inherit;
}

.contact-brand { gap: 10px; }
.contact-brand > span:last-child { display: grid; gap: 1px; }
.contact-brand strong { font-size: 14px; }
.contact-brand small { color: #8c857b; font-size: 10px; }

.contact-brand-seal {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: #a6392e;
  color: #fff;
  font-family: "Songti SC", "SimSun", serif;
  font-size: 11px;
  font-weight: 700;
}

.contact-back {
  gap: 6px;
  color: #615b53;
  font-size: 13px;
}

.contact-main {
  width: min(760px, calc(100% - 40px));
  margin: 0 auto;
  padding: 68px 0 56px;
}

.contact-intro > p:first-child {
  margin: 0 0 10px;
  color: #a6392e;
  font-size: 12px;
  font-weight: 600;
}

.contact-intro h1 {
  margin: 0;
  color: #17191e;
  font-family: "Songti SC", "SimSun", serif;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0;
}

.contact-rule {
  width: 42px;
  height: 3px;
  margin: 20px 0;
  background: #a6392e;
}

.contact-description {
  max-width: 640px;
  margin: 0;
  color: #686158;
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-line;
}

.contact-panel {
  min-height: 180px;
  margin-top: 42px;
  overflow: hidden;
  border: 1px solid #e2ded6;
  border-radius: 8px;
  background: #fff;
}

.contact-row {
  min-height: 64px;
  display: grid;
  grid-template-columns: 32px 110px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid #ece9e3;
  color: #25272c;
}

.contact-row:last-child { border-bottom: 0; }

.contact-icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: #2359b8;
}

.contact-icon.wechat { color: #079b48; }
.contact-label { font-size: 14px; }

.contact-row strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 15px;
  font-weight: 500;
  text-align: right;
}

.contact-row button,
.contact-open {
  min-width: 82px;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 10px;
  border: 0;
  border-radius: 5px;
  background: #edf4ff;
  color: #225bc0;
  font-size: 12px;
  cursor: pointer;
}

.contact-row button:hover,
.contact-online:hover .contact-open { background: #e0ecff; }

.contact-empty {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: #766f65;
  font-size: 13px;
}

.contact-loading {
  min-height: 180px;
  display: flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
}

.contact-loading span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #aaa398;
  animation: contact-pulse 1s ease-in-out infinite;
}

.contact-loading span:nth-child(2) { animation-delay: .14s; }
.contact-loading span:nth-child(3) { animation-delay: .28s; }

.contact-copy-status {
  min-height: 20px;
  margin: 10px 0 0;
  color: #5f7568;
  font-size: 12px;
  text-align: right;
}

.contact-footer {
  margin-top: auto;
  padding: 20px;
  color: #aaa398;
  font-size: 11px;
  text-align: center;
}

@keyframes contact-pulse {
  0%, 100% { opacity: .35; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
}

@media (max-width: 600px) {
  .contact-header { padding: 0 20px; }
  .contact-main { width: calc(100% - 32px); padding: 44px 0 36px; }
  .contact-intro h1 { font-size: 29px; }
  .contact-panel { margin-top: 32px; }
  .contact-row {
    grid-template-columns: 30px minmax(76px, auto) minmax(0, 1fr);
    gap: 8px;
    padding: 10px 12px;
  }
  .contact-row strong { font-size: 14px; }
  .contact-row button,
  .contact-open {
    grid-column: 2 / 4;
    justify-self: end;
  }
}
</style>
