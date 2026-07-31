<template>
  <section class="faq-page">
    <header class="page-head">
      <div class="page-head-main">
        <p class="page-head-eyebrow">服务支持</p>
        <h2>常见问题</h2>
        <p class="page-head-desc">查找账户、查询、报告与费用相关问题。</p>
      </div>
      <label class="faq-search">
        <Search :size="17" aria-hidden="true" />
        <input v-model.trim="keyword" type="search" placeholder="搜索问题或关键词" />
        <button v-if="keyword" type="button" aria-label="清空搜索" @click="keyword = ''">
          <X :size="15" />
        </button>
      </label>
    </header>

    <div v-if="categories.length > 1" class="faq-categories" aria-label="问题分类">
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        :class="{ active: activeCategory === category }"
        @click="activeCategory = category"
      >
        {{ category }}
        <span>{{ categoryCount(category) }}</span>
      </button>
    </div>

    <div class="faq-content" :aria-busy="loading">
      <div v-if="loading" class="faq-state">
        <LoaderCircle class="faq-spinner" :size="22" />
        <span>正在加载常见问题</span>
      </div>

      <div v-else-if="loadError" class="faq-state faq-state--error">
        <CircleAlert :size="22" />
        <strong>常见问题加载失败</strong>
        <span>{{ loadError }}</span>
        <button type="button" @click="loadFaqs">重新加载</button>
      </div>

      <div v-else-if="!filteredFaqs.length" class="faq-state">
        <SearchX :size="24" />
        <strong>没有找到相关问题</strong>
        <span>可更换关键词或选择其他分类。</span>
      </div>

      <div v-else class="faq-list">
        <article
          v-for="item in filteredFaqs"
          :key="item.id"
          class="faq-item"
          :class="{ open: openIds.has(item.id) }"
        >
          <button
            type="button"
            :aria-expanded="openIds.has(item.id)"
            @click="toggleFaq(item.id)"
          >
            <span class="faq-number">{{ itemIndex(item) }}</span>
            <span class="faq-question">
              <strong>{{ item.title }}</strong>
              <small>{{ item.category || '通用问题' }}</small>
            </span>
            <ChevronDown :size="18" aria-hidden="true" />
          </button>
          <div v-if="openIds.has(item.id)" class="faq-answer">{{ item.content }}</div>
        </article>
      </div>
    </div>

    <div class="faq-help">
      <div>
        <MessageSquareText :size="19" aria-hidden="true" />
        <span>
          <strong>仍未解决？</strong>
          <small>提交具体问题，我们会在后台跟进处理。</small>
        </span>
      </div>
      <router-link to="/support/feedback">提交意见反馈</router-link>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  MessageSquareText,
  Search,
  SearchX,
  X
} from '@lucide/vue'
import { getFaqList } from '../api/support'

const loading = ref(true)
const loadError = ref('')
const keyword = ref('')
const activeCategory = ref('全部')
const faqs = ref([])
const openIds = ref(new Set())

const categories = computed(() => {
  const values = [...new Set(faqs.value.map(item => item.category || '通用问题'))]
  return ['全部', ...values]
})

const filteredFaqs = computed(() => {
  const search = keyword.value.toLowerCase()
  return faqs.value.filter(item => {
    const category = item.category || '通用问题'
    const categoryMatched = activeCategory.value === '全部' || category === activeCategory.value
    const textMatched = !search || `${item.title || ''} ${item.content || ''} ${category}`.toLowerCase().includes(search)
    return categoryMatched && textMatched
  })
})

function categoryCount(category) {
  if (category === '全部') return faqs.value.length
  return faqs.value.filter(item => (item.category || '通用问题') === category).length
}

function itemIndex(item) {
  const index = filteredFaqs.value.findIndex(row => row.id === item.id)
  return String(index + 1).padStart(2, '0')
}

function toggleFaq(id) {
  const next = new Set(openIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openIds.value = next
}

async function loadFaqs() {
  loading.value = true
  loadError.value = ''
  try {
    const response = await getFaqList()
    faqs.value = (response.rows || [])
      .filter(item => Number(item.status) === 1)
      .sort((left, right) => Number(left.sort || 0) - Number(right.sort || 0) || Number(left.id || 0) - Number(right.id || 0))
    if (faqs.value.length) openIds.value = new Set([faqs.value[0].id])
  } catch (error) {
    loadError.value = error?.msg || error?.message || '请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(loadFaqs)
</script>

<style scoped>
.faq-page {
  width: min(100%, 1040px);
  margin: 0 auto;
  color: var(--text);
}

.faq-eyebrow {
  margin: 0 0 7px;
  color: var(--blue);
  font-size: var(--fs-xs);
  font-weight: 800;
}

.faq-search {
  width: min(380px, 42vw);
  height: 42px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--muted);
}

.faq-search:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(22, 24, 29, .1);
}

.faq-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
}

.faq-search button {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.faq-categories {
  display: flex;
  gap: 4px;
  margin: 20px 0 14px;
  padding-bottom: 6px;
  overflow-x: auto;
}

.faq-categories button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: transparent;
  color: var(--muted);
  font-size: var(--fs-sm);
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.faq-categories button span {
  min-width: 20px;
  padding: 1px 5px;
  border-radius: var(--radius);
  background: var(--line);
  color: var(--muted);
  font-size: var(--fs-xs);
}

.faq-categories button:hover,
.faq-categories button.active {
  border-color: var(--line);
  background: var(--line-soft);
  color: var(--cinnabar);
}

.faq-categories button.active span {
  background: var(--line-soft);
  color: var(--cinnabar);
}

.faq-content {
  min-height: 350px;
  border-top: 1px solid var(--line);
}

.faq-list {
  border-bottom: 1px solid var(--line);
}

.faq-item {
  position: relative;
  border-bottom: 1px solid var(--line);
  background: var(--card);
  transition: background .16s ease;
}

/* 展开态：整块换浅底并在左缘压一条强调线。
   原先展开与收起的背景完全一样，一屏里同时展开两三条就分不清
   哪段答案属于哪个问题。 */
.faq-item.open {
  background: var(--line-soft);
}

.faq-item.open::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--cinnabar);
}

.faq-item:last-child {
  border-bottom: 0;
}

.faq-item > button {
  width: 100%;
  min-height: 72px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 24px;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5) var(--sp-4) var(--sp-3);
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.faq-item > button:hover {
  background: var(--line-soft);
}

.faq-number {
  color: var(--faint);
  font-size: var(--fs-xs);
  font-weight: 800;
  text-align: center;
}

.faq-question {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.faq-question strong {
  color: var(--text);
  font-size: var(--fs-base);
  font-weight: 600;
  line-height: 1.5;
}

.faq-question small {
  color: var(--faint);
  font-size: var(--fs-xs);
}

.faq-item > button > svg {
  color: var(--muted);
  transition: transform .18s ease;
}

.faq-item.open > button > svg {
  transform: rotate(180deg);
}

/* 答案与问题原本同为 14px，仅靠字重区分，读起来是一团。
   降一号字、转次级色、行高放大，再用左边线挂靠到上方问题下面。 */
.faq-answer {
  margin: 0 var(--sp-5) 0 62px;
  padding: 0 0 var(--sp-5) var(--sp-4);
  border-left: 2px solid var(--line);
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  line-height: 1.9;
  white-space: pre-wrap;
}

.faq-state {
  min-height: 350px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 9px;
  color: var(--muted);
  text-align: center;
}

.faq-state strong {
  color: var(--text);
  font-size: var(--fs-base);
}

.faq-state span {
  font-size: var(--fs-sm);
}

.faq-state button {
  margin-top: 6px;
  padding: 8px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--text-secondary);
  cursor: pointer;
}

.faq-state--error svg {
  color: var(--red);
}

.faq-spinner {
  animation: faq-spin .8s linear infinite;
}

.faq-help {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 22px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--cinnabar);
  border-radius: var(--radius);
  background: var(--card);
}

.faq-help > div {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--cinnabar);
}

.faq-help span {
  display: grid;
  gap: 3px;
}

.faq-help strong {
  color: var(--text);
  font-size: var(--fs-base);
}

.faq-help small {
  color: var(--muted);
  font-size: var(--fs-xs);
}

.faq-help a {
  padding: 8px 13px;
  border-radius: var(--radius);
  background: var(--cinnabar);
  color: var(--card);
  font-size: var(--fs-sm);
  font-weight: 700;
  text-decoration: none;
}

@keyframes faq-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 720px) {

  .faq-search {
    width: 100%;
  }

  .faq-item > button {
    grid-template-columns: 30px minmax(0, 1fr) 20px;
    padding-right: 10px;
  }

  .faq-answer {
    margin-right: 40px;
    margin-left: 52px;
  }

  .faq-help {
    align-items: stretch;
    flex-direction: column;
  }

  .faq-help a {
    text-align: center;
  }
}
</style>
