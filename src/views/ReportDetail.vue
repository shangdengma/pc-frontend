<template>
  <section class="work-card report-detail-card">
    <div class="work-card-head records-head">
      <div>
        <h2>报告详情</h2>
        <p>当前为 PC 迁移第一版，先展示后端记录与报告原始数据，后续把移动端报告组件拆迁过来。</p>
      </div>
      <router-link class="ghost-btn" to="/records">返回记录</router-link>
    </div>

    <div v-if="loading" class="empty-state">正在加载报告...</div>
    <template v-else>
      <div class="report-summary">
        <div><span>姓名</span><strong>{{ detail.name || '-' }}</strong></div>
        <div><span>身份证号</span><strong>{{ detail.idCard || '-' }}</strong></div>
        <div><span>手机号</span><strong>{{ detail.phoneNumber || detail.mobile || '-' }}</strong></div>
        <div><span>状态</span><strong>{{ statusText(detail.searchStatus, detail.displayStatusText) }}</strong></div>
      </div>

      <div class="json-panel">
        <div class="panel-head"><h3>原始报告数据</h3></div>
        <pre>{{ prettyData }}</pre>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getData, markDataRead } from '../api/data'
import { statusText } from '../utils/format'

const route = useRoute()
const loading = ref(false)
const detail = ref({})
const prettyData = computed(() => {
  const raw = detail.value.data || detail.value.reportData || detail.value.resultData || detail.value
  if (typeof raw === 'string') {
    try { return JSON.stringify(JSON.parse(raw), null, 2) } catch (err) { return raw }
  }
  return JSON.stringify(raw || {}, null, 2)
})

async function loadDetail() {
  loading.value = true
  try {
    const res = await getData(route.params.id)
    detail.value = res.data || res
    try { await markDataRead(route.params.id) } catch (err) {}
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)
</script>
