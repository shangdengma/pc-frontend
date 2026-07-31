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
      <!-- 嵌在工作台里时跟「常见问题」「意见反馈」用同一套页头，
           三页在同一菜单下切换不该长得不一样；
           独立页（未登录直接访问）仍保留宋体大标题的品牌感 -->
      <header v-if="embedded" class="page-head">
        <div class="page-head-main">
          <p class="page-head-eyebrow">服务支持</p>
          <h2>{{ contact.title || '联系我们' }}</h2>
          <p class="page-head-desc">
            {{ contact.content || '如您在使用平台时遇到问题，请通过以下方式联系我们。' }}
          </p>
        </div>
      </header>

      <section v-else class="contact-intro">
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
            <button type="button" :class="{ copied: copiedKey === 'phoneOne' }" @click="copyContact('phoneOne', contact.phoneOne)">
              <Check v-if="copiedKey === 'phoneOne'" :size="14" aria-hidden="true" />
              <Copy v-else :size="14" aria-hidden="true" />
              {{ copiedKey === 'phoneOne' ? '已复制' : '点击复制' }}
            </button>
          </div>

          <div v-if="contact.phoneTwo" class="contact-row">
            <span class="contact-icon"><Smartphone :size="20" aria-hidden="true" /></span>
            <span class="contact-label">客服电话二</span>
            <strong>{{ contact.phoneTwo }}</strong>
            <button type="button" :class="{ copied: copiedKey === 'phoneTwo' }" @click="copyContact('phoneTwo', contact.phoneTwo)">
              <Check v-if="copiedKey === 'phoneTwo'" :size="14" aria-hidden="true" />
              <Copy v-else :size="14" aria-hidden="true" />
              {{ copiedKey === 'phoneTwo' ? '已复制' : '点击复制' }}
            </button>
          </div>

          <div v-if="contact.wechat" class="contact-row">
            <span class="contact-icon wechat"><MessageCircle :size="20" aria-hidden="true" /></span>
            <span class="contact-label">微信号</span>
            <strong>{{ contact.wechat }}</strong>
            <button type="button" :class="{ copied: copiedKey === 'wechat' }" @click="copyContact('wechat', contact.wechat)">
              <Check v-if="copiedKey === 'wechat'" :size="14" aria-hidden="true" />
              <Copy v-else :size="14" aria-hidden="true" />
              {{ copiedKey === 'wechat' ? '已复制' : '点击复制' }}
            </button>
          </div>

          <div v-if="contact.qq" class="contact-row">
            <span class="contact-icon"><UserRound :size="20" aria-hidden="true" /></span>
            <span class="contact-label">QQ号</span>
            <strong>{{ contact.qq }}</strong>
            <button type="button" :class="{ copied: copiedKey === 'qq' }" @click="copyContact('qq', contact.qq)">
              <Check v-if="copiedKey === 'qq'" :size="14" aria-hidden="true" />
              <Copy v-else :size="14" aria-hidden="true" />
              {{ copiedKey === 'qq' ? '已复制' : '点击复制' }}
            </button>
          </div>

          <div v-if="contact.email" class="contact-row">
            <span class="contact-icon"><Mail :size="20" aria-hidden="true" /></span>
            <span class="contact-label">邮箱</span>
            <strong>{{ contact.email }}</strong>
            <button type="button" :class="{ copied: copiedKey === 'email' }" @click="copyContact('email', contact.email)">
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
  color: var(--text);
  background: var(--line-soft);
}

.contact-page--embedded {
  min-height: auto;
  background: transparent;
}

.contact-page--embedded .contact-main {
  width: min(1040px, 100%);
  padding: 8px 0 32px;
}

.contact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 max(24px, calc((100vw - 920px) / 2));
  border-bottom: 1px solid var(--line);
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
.contact-brand strong { font-size: var(--fs-base); }
.contact-brand small { color: var(--muted); font-size: var(--fs-xs); }

.contact-brand-seal {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--cinnabar);
  color: var(--card);
  font-family: "Songti SC", "SimSun", serif;
  font-size: var(--fs-xs);
  font-weight: 700;
}

.contact-back {
  gap: 6px;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
}

.contact-main {
  width: min(760px, calc(100% - 40px));
  margin: 0 auto;
  padding: 68px 0 56px;
}

.contact-intro > p:first-child {
  margin: 0 0 10px;
  color: var(--cinnabar);
  font-size: var(--fs-xs);
  font-weight: 600;
}

.contact-intro h1 {
  margin: 0;
  color: var(--text);
  font-family: "Songti SC", "SimSun", serif;
  font-size: var(--fs-2xl);   /* 独立页保留稍大的标题，但收进阶梯，不再是随手写的 34 */
  font-weight: 700;
  letter-spacing: 0;
}

.contact-rule {
  width: 42px;
  height: 3px;
  margin: 20px 0;
  background: var(--cinnabar);
}

.contact-description {
  max-width: 640px;
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--fs-base);
  line-height: 1.9;
  white-space: pre-line;
}

/* 两列网格：电话/微信/QQ/邮箱这类短信息，纵向铺 6 行既空又长。
   1px 的 gap 配合容器底色直接当分隔线用，省掉每格自己画 border 的对齐麻烦。 */
.contact-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin-top: var(--sp-6);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--line);
}

/* 加载 / 错误态是单块内容，不参与两列 */
.contact-loading,
.contact-error {
  grid-column: 1 / -1;
  background: var(--card);
}

/* 标签在上、值在下：原先标签靠左、值靠右，中间隔着大片空白，
   看一项要把视线横跨整行才能把名称和号码对上 */
.contact-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    "icon  label  action"
    "icon  value  action";
  align-items: center;
  gap: 2px var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  background: var(--card);
  color: var(--text);
}

.contact-row:last-child { border-bottom: 0; }

.contact-icon {
  grid-area: icon;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--radius);
  background: var(--line-soft);
  color: var(--text-secondary);
}

.contact-icon.wechat { color: var(--green); }
.contact-label { grid-area: label; color: var(--muted); font-size: var(--fs-xs); }

.contact-row strong {
  grid-area: value;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: var(--fs-base);
  font-weight: 600;
  text-align: left;
}

/* 复制按钮：六格里每格都有一个，做成描边低干扰样式，
   hover 才加深——否则六个实心块会把视线从内容上拽走 */
.contact-row button,
.contact-open {
  grid-area: action;
  min-width: 72px;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 var(--sp-2);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--fs-xs);
  cursor: pointer;
  transition: border-color .14s ease, color .14s ease, background .14s ease;
}

.contact-row button:hover,
.contact-online:hover .contact-open {
  border-color: var(--text);
  background: var(--line-soft);
  color: var(--text);
}

/* 复制成功后短暂转为强调色，给一个明确的完成反馈 */
.contact-row button.copied {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.contact-empty {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
}

.contact-loading {
  min-height: 120px;
  display: flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
}

.contact-loading span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--faint);
  animation: contact-pulse 1s ease-in-out infinite;
}

.contact-loading span:nth-child(2) { animation-delay: .14s; }
.contact-loading span:nth-child(3) { animation-delay: .28s; }

.contact-copy-status {
  min-height: 20px;
  margin: 10px 0 0;
  color: var(--green);
  font-size: var(--fs-xs);
  text-align: right;
}

.contact-footer {
  margin-top: auto;
  padding: 20px;
  color: var(--faint);
  font-size: var(--fs-xs);
  text-align: center;
}

@keyframes contact-pulse {
  0%, 100% { opacity: .35; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
}

@media (max-width: 768px) {
  /* 两列在手机上会把号码挤到折行，改单列 */
  .contact-panel { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 600px) {
  .contact-header { padding: 0 var(--sp-5); }
  .contact-main { width: calc(100% - 32px); padding: var(--sp-8) 0 var(--sp-6); }
  .contact-intro h1 { font-size: var(--fs-2xl); }
  .contact-panel { margin-top: var(--sp-5); }

  .contact-row {
    gap: 2px var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
  }

  /* 这里原本写的是 grid-column: 2 / 4，那是上一版三列布局的定位。
     改成 grid-template-areas 之后两者冲突，按钮被挤回第二列，
     直接压在号码上——必须显式回到 action 区。 */
  .contact-row button,
  .contact-open {
    grid-area: action;
    justify-self: end;
    min-width: 0;
    padding: 0 var(--sp-2);
  }

  /* 窄屏号码本来就容易折行，缩一号并允许换行不撑破格子 */
  .contact-row strong { font-size: var(--fs-sm); }
}
</style>
