<template>
  <div class="business-table-footer">
    <div class="business-footer-left">
      <span class="business-total">共 {{ total }} 条</span>
      <div class="business-page-size">
        <span>每页</span>
        <div class="business-page-size-dropdown" @click.stop>
          <button
            class="business-page-size-trigger"
            :class="{ open: sizeMenuOpen }"
            type="button"
            :disabled="loading"
            :aria-expanded="sizeMenuOpen"
            @click.stop="toggleSizeMenu"
          >
            <span>{{ pageSize }}</span>
            <i class="business-select-arrow"></i>
          </button>
          <div v-if="sizeMenuOpen" class="business-page-size-menu" role="listbox">
            <button
              v-for="size in pageSizeOptions"
              :key="size"
              class="business-page-size-option"
              :class="{ active: pageSize === size }"
              type="button"
              role="option"
              :aria-selected="pageSize === size"
              @click.stop="selectPageSize(size)"
            >
              {{ size }} 条/页
            </button>
          </div>
        </div>
        <span>条</span>
      </div>
    </div>
    <div class="business-pagination">
      <button class="business-page-btn" type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">上一页</button>
      <span class="business-page-label">第</span>
      <input
        v-model="pageInput"
        class="business-page-input"
        type="number"
        min="1"
        :max="safeTotalPages"
        :disabled="loading"
        @keydown.enter.prevent="submitPage"
        @blur="submitPage"
      />
      <span class="business-page-label">/ {{ safeTotalPages }} 页</span>
      <button class="business-page-btn" type="button" :disabled="page >= safeTotalPages || loading" @click="changePage(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  totalPages: { type: Number, default: 1 },
  loading: { type: Boolean, default: false },
  pageSizeOptions: { type: Array, default: () => [10, 20, 50] }
})

const emit = defineEmits(['update:pageSize', 'page-change'])

const sizeMenuOpen = ref(false)
const pageInput = ref(String(props.page || 1))
const safeTotalPages = computed(() => Math.max(1, Number(props.totalPages || 1)))

watch(() => props.page, value => {
  pageInput.value = String(value || 1)
})

function toggleSizeMenu() {
  if (props.loading) return
  sizeMenuOpen.value = !sizeMenuOpen.value
}

function closeSizeMenu() {
  sizeMenuOpen.value = false
}

function selectPageSize(size) {
  sizeMenuOpen.value = false
  if (Number(size) === Number(props.pageSize)) return
  emit('update:pageSize', Number(size))
}

function normalizedPage(value) {
  const page = Number(value)
  return Math.min(safeTotalPages.value, Math.max(1, Number.isFinite(page) ? Math.trunc(page) : 1))
}

function changePage(target) {
  const next = normalizedPage(target)
  pageInput.value = String(next)
  if (next === Number(props.page)) return
  emit('page-change', next)
}

function submitPage() {
  changePage(pageInput.value)
}

onMounted(() => {
  window.addEventListener('click', closeSizeMenu)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', closeSizeMenu)
})
</script>

<style scoped>
.business-table-footer{min-height:48px;padding:8px 18px;border-top:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-shrink:0}
.business-footer-left,.business-pagination,.business-page-size{display:flex;align-items:center;gap:10px}
.business-total,.business-page-label,.business-page-size{font-size:13px;color:var(--text2)}
.business-page-size-dropdown{position:relative}
.business-page-size-trigger,.business-page-size-option,.business-page-input,.business-page-btn{height:32px;border:1px solid var(--border);background:#fff;color:var(--text1);font-size:13px;font-family:inherit;outline:none}
.business-page-size-trigger{min-width:70px;padding:0 28px 0 12px;display:inline-flex;align-items:center;justify-content:center;position:relative;cursor:pointer;transition:border-color .15s,background .15s,color .15s}
.business-page-size-trigger:hover,.business-page-size-trigger.open{border-color:#C7D7EE;background:#F8FBFF}
.business-page-size-trigger:disabled{opacity:.55;cursor:default}
.business-select-arrow{position:absolute;right:10px;top:50%;width:7px;height:7px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-65%) rotate(45deg);transition:transform .15s}
.business-page-size-trigger.open .business-select-arrow{transform:translateY(-35%) rotate(225deg)}
.business-page-size-menu{position:absolute;left:0;bottom:calc(100% + 6px);z-index:30;width:96px;padding:4px;background:#fff;border:1px solid var(--border);box-shadow:0 10px 24px rgba(15,23,42,.12)}
.business-page-size-option{width:100%;height:30px;border:none;padding:0 9px;text-align:left;cursor:pointer}
.business-page-size-option:hover{background:#F3F7FD;color:var(--primary)}
.business-page-size-option.active{background:#EAF1FB;color:var(--primary);font-weight:700}
.business-page-input{width:52px;padding:0 8px;text-align:center}
.business-page-input::-webkit-outer-spin-button,.business-page-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.business-page-input{appearance:textfield;-moz-appearance:textfield}
.business-page-size-trigger:focus-visible,.business-page-input:focus{border-color:var(--primary)}
.business-page-btn{min-width:64px;padding:0 12px;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.business-page-btn:disabled{opacity:.45;cursor:default}
.business-page-btn:not(:disabled):hover{border-color:#C7D7EE;background:#F5F8FC;color:var(--primary)}
@media (max-width: 860px){
  .business-table-footer{align-items:stretch;flex-direction:column}
  .business-footer-left,.business-pagination{justify-content:space-between}
}
@media (max-width: 560px){
  .business-table-footer{padding:10px 12px;gap:10px}
  .business-footer-left{gap:8px;flex-wrap:wrap}
  .business-pagination{gap:8px;overflow-x:auto;padding-bottom:2px}
  .business-page-btn{min-width:58px;padding:0 10px}
  .business-page-size-menu{bottom:calc(100% + 4px)}
}
</style>
