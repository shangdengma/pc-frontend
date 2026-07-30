<template>
  <main class="main-content message-list-page">
    <div class="notice-panel-head">
      <div>
        <h3>消息通知</h3>
        <p>系统消息、站内信和业务提醒集中展示</p>
      </div>
      <span>{{ filtered.length }} 条</span>
    </div>

    <!-- Tab -->
    <div class="tab-bar">
      <button v-for="t in tabs" :key="t.key" class="tab-item" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">
        {{ t.label }}
        <span v-if="(t.key === 'all' || t.key === 'unread') && unreadCount > 0" class="tab-count">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>
    </div>

    <!-- 消息列表 -->
    <div class="card list-card">
      <div v-if="filtered.length === 0" class="empty">暂无消息</div>
      <div v-else class="message-list">
        <article v-for="item in pagedMessages" :key="item.id" class="message-item" :class="{ unread: !item.read, selected: detail && detail.id === item.id }" @click="openDetail(item)">
          <span class="message-status-dot"></span>
          <div class="message-main">
            <div class="message-title-row">
              <h3>{{ item.title || '消息通知' }}</h3>
              <span class="message-time">{{ item.time }}</span>
            </div>
            <p>{{ item.content || '-' }}</p>
            <div class="message-tags">
              <span v-for="channel in channelLabels(item.badge)" :key="channel" class="channel-tag">{{ channel }}</span>
              <span class="read-tag" :class="{ unread: !item.read }">{{ item.read ? '已读' : '未读' }}</span>
            </div>
          </div>
          <button v-if="!item.read" class="text-btn" type="button" @click.stop="markRead(item)">标记已读</button>
        </article>
      </div>
      <BusinessTableFooter
        v-if="filtered.length > 0"
        :total="filtered.length"
        :page="page"
        :page-size="pageSize"
        :total-pages="totalPages"
        @update:page-size="changeMessagePageSize"
        @page-change="changeMessagePage"
      />
    </div>

    <!-- 详情弹窗 -->
    <AppModal v-model="detailOpen" :title="detail?.title || '消息通知'" eyebrow="消息详情" :description="detail?.time || ''" size="md">
      <template v-if="detail">
        <div class="message-detail-meta message-detail-inline-meta">
          <span class="message-detail-badge" :class="{ read: detail.read, unread: !detail.read }">{{ detail.read ? '已读' : '未读' }}</span>
        </div>
        <div class="message-detail-body">
          <p>{{ detail.content }}</p>
          <div v-if="imageList(detail).length" class="message-images">
            <img v-for="url in imageList(detail)" :key="url" :src="url" alt="通知图片" />
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-primary message-confirm-btn" type="button" @click="confirmDetail">确认</button>
      </template>
    </AppModal>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppModal from '../components/AppModal.vue'
import BusinessTableFooter from '../components/BusinessTableFooter.vue'
import { getUserNotices, markNoticeRead } from '../api/notice'
import { getUserProfile } from '../api/user'

const tabs = [{ key: 'all', label: '全部' }, { key: 'unread', label: '未读' }, { key: 'read', label: '已读' }]
const activeTab = ref('all')
const detail = ref(null)
const messages = ref([])
const page = ref(1)
const pageSize = ref(10)

const unreadCount = computed(() => messages.value.filter(m => !m.read).length)
const detailOpen = computed({
  get: () => !!detail.value,
  set: value => {
    if (!value) detail.value = null
  }
})

const filtered = computed(() => {
  if (activeTab.value === 'unread') return messages.value.filter(m => !m.read)
  if (activeTab.value === 'read') return messages.value.filter(m => m.read)
  return messages.value
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const pagedMessages = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
function mapMessage(item) {
  return {
    id: item.id,
    title: item.title || '消息通知',
    content: item.content || '-',
    time: String(item.createTime || item.time || '').slice(0, 16),
    createTime: item.createTime || item.time || '',
    badge: item.badge || '站内信',
    pictureUrls: item.pictureUrls || '',
    link: item.link || '',
    read: Number(item.status) === 1 || item.read === true
  }
}

function channelLabels(value) {
  return String(value || '站内信').split(',').map(item => item.trim()).filter(Boolean)
}

function imageList(item) {
  return String(item?.pictureUrls || '').split(',').map(url => url.trim()).filter(Boolean)
}

async function loadMessages() {
  const profile = await getUserProfile()
  const user = profile.data || profile.user || {}
  const res = await getUserNotices(user.userId || user.id, { pageNum: 1, pageSize: 100 })
  messages.value = (res.rows || []).map(mapMessage)
}

function openDetail(item) {
  detail.value = item
}

async function markRead(item) {
  await markNoticeRead(item.id)
  item.read = true
  const message = messages.value.find(row => row.id === item.id)
  if (message) message.read = true
  if (detail.value && detail.value.id === item.id) detail.value.read = true
}
async function confirmDetail() {
  if (detail.value && !detail.value.read) {
    await markRead(detail.value)
  }
  detail.value = null
}

function changeMessagePageSize(size) {
  pageSize.value = size
  page.value = 1
}

function changeMessagePage(nextPage) {
  page.value = nextPage
}

watch([activeTab, pageSize], () => {
  page.value = 1
})
watch(filtered, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

onMounted(loadMessages)
</script>

<style scoped>
.message-list-page{gap:0;min-height:0;overflow:hidden}
.notice-panel-head{min-height:72px;padding:16px 24px;border:1px solid var(--border);border-bottom:0;display:flex;align-items:center;justify-content:space-between;gap:16px;background:#fff;flex-shrink:0}
.notice-panel-head h3{margin:0;color:var(--text1);font-size:16px;font-weight:700}
.notice-panel-head p{margin:6px 0 0;color:var(--text3);font-size:13px}
.notice-panel-head>span{color:var(--text3);font-size:13px;white-space:nowrap}
.message-list-page .tab-bar{border:1px solid var(--border);border-bottom:0;flex-shrink:0}
.tab-count{position:absolute;top:14px;right:8px;transform:translate(35%,-35%);display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;background:var(--error);color:#fff;font-size:10px;font-weight:700;line-height:1;border-radius:999px;pointer-events:none}

.list-card{padding:0;overflow:hidden;display:flex;flex:1;min-height:0;flex-direction:column;border-top:0}
.message-list{display:block;flex:1;min-height:0;overflow-y:auto}
.message-item{position:relative;display:flex;flex:0 0 auto;align-items:flex-start;gap:14px;min-height:112px;padding:20px 24px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background .12s}
.message-item:last-child{border-bottom:none}
.message-item:hover{background:#F8FAFC}
.message-item.unread{background:rgba(239,68,68,.035)}
.message-item.selected{background:#EEF4FF}
.message-item.unread.selected{background:#FBE3E3}

.message-status-dot{width:10px;height:10px;margin-top:8px;border-radius:50%;background:#CBD5E1;flex-shrink:0}
.message-item.unread .message-status-dot{background:var(--error);box-shadow:none}

.message-main{flex:1;min-width:0}
.message-title-row{display:flex;align-items:center;justify-content:space-between;gap:18px}
.message-title-row h3{margin:0;color:var(--text1);font-size:16px;font-weight:600;line-height:1.45}
.message-item.unread .message-title-row h3{font-weight:700}
.message-main p{margin:8px 0 0;color:var(--text2);font-size:13px;line-height:1.7;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

.message-time{font-size:13px;color:var(--text3);white-space:nowrap;flex-shrink:0}
.message-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.channel-tag,.read-tag{height:24px;display:inline-flex;align-items:center;padding:0 9px;border-radius:999px;font-size:12px;font-weight:700}
.channel-tag{color:var(--primary);background:var(--primary-light)}
.read-tag{color:var(--text2);background:#F1F5F9}
.read-tag.unread{color:var(--error);background:#FDECEC}
.text-btn{border:0;background:transparent;color:var(--primary);font-size:13px;font-weight:600;font-family:inherit;white-space:nowrap;cursor:pointer;margin-top:2px}
.text-btn:hover{opacity:.82}
.list-card .empty{flex:1;display:flex;align-items:center;justify-content:center}

.message-detail-inline-meta{margin-bottom:16px}
.message-detail-body{padding:0;background:#fff;line-height:1.9}
.message-detail-body p{margin:0;padding:0;border:0;background:transparent;color:var(--text1);font-size:16px;line-height:1.85;white-space:pre-wrap}
.message-images{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.message-images img{width:138px;height:96px;border:1px solid var(--border);object-fit:cover}
.message-detail-foot{align-items:center;justify-content:flex-end;gap:14px}

@media (max-width:760px){
  .message-list-page{overflow:auto}
  .notice-panel-head{align-items:flex-start;flex-direction:column}
  .message-item{padding:16px;gap:12px}
  .message-title-row{align-items:flex-start;flex-direction:column;gap:6px}
  .text-btn{position:absolute;right:16px;bottom:16px}
}
</style>
