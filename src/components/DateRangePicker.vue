<template>
  <div ref="rootRef" class="date-range" :class="{ single }">
    <div class="date-picker-wrap">
      <button
        type="button"
        class="date-picker-trigger"
        :class="{ filled: startDate }"
        @click="toggleDatePicker('startDate')"
      >
        <span>{{ startDate || startPlaceholder }}</span>
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="15" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 3V7M16 3V7M4 10H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div v-if="openDatePicker === 'startDate'" class="date-panel">
        <div class="date-panel-head">
          <div class="date-nav-group">
            <button type="button" aria-label="上一年" @click="changeCalendarYear(-1)">
              <svg class="date-nav-icon double" viewBox="0 0 24 24" fill="none">
                <path d="M11 6L5 12L11 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 6L13 12L19 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button type="button" aria-label="上一月" @click="changeCalendarMonth(-1)">
              <svg class="date-nav-icon" viewBox="0 0 24 24" fill="none">
                <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <strong>{{ calendarTitle }}</strong>
          <div class="date-nav-group next">
            <button type="button" aria-label="下一月" @click="changeCalendarMonth(1)">
              <svg class="date-nav-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button type="button" aria-label="下一年" @click="changeCalendarYear(1)">
              <svg class="date-nav-icon double" viewBox="0 0 24 24" fill="none">
                <path d="M5 6L11 12L5 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 6L19 12L13 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="date-week-grid">
          <span v-for="week in weekLabels" :key="week">{{ week }}</span>
        </div>
        <div class="date-day-grid">
          <button
            v-for="day in calendarDays"
            :key="day.value"
            type="button"
            class="date-day"
            :class="{ muted: !day.inMonth, selected: startDate === day.value, today: day.isToday }"
            @click="selectCalendarDate(day.value)"
          >
            {{ day.day }}
          </button>
        </div>
        <div class="date-panel-foot">
          <button type="button" @click="clearCalendarDate('startDate')">清除</button>
          <button type="button" @click="openDatePicker = ''">关闭</button>
        </div>
      </div>
    </div>
    <i v-if="!single">至</i>
    <div v-if="!single" class="date-picker-wrap">
      <button
        type="button"
        class="date-picker-trigger"
        :class="{ filled: endDate }"
        @click="toggleDatePicker('endDate')"
      >
        <span>{{ endDate || endPlaceholder }}</span>
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="15" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 3V7M16 3V7M4 10H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div v-if="openDatePicker === 'endDate'" class="date-panel">
        <div class="date-panel-head">
          <div class="date-nav-group">
            <button type="button" aria-label="上一年" @click="changeCalendarYear(-1)">
              <svg class="date-nav-icon double" viewBox="0 0 24 24" fill="none">
                <path d="M11 6L5 12L11 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 6L13 12L19 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button type="button" aria-label="上一月" @click="changeCalendarMonth(-1)">
              <svg class="date-nav-icon" viewBox="0 0 24 24" fill="none">
                <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <strong>{{ calendarTitle }}</strong>
          <div class="date-nav-group next">
            <button type="button" aria-label="下一月" @click="changeCalendarMonth(1)">
              <svg class="date-nav-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button type="button" aria-label="下一年" @click="changeCalendarYear(1)">
              <svg class="date-nav-icon double" viewBox="0 0 24 24" fill="none">
                <path d="M5 6L11 12L5 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 6L19 12L13 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="date-week-grid">
          <span v-for="week in weekLabels" :key="week">{{ week }}</span>
        </div>
        <div class="date-day-grid">
          <button
            v-for="day in calendarDays"
            :key="day.value"
            type="button"
            class="date-day"
            :class="{ muted: !day.inMonth, selected: endDate === day.value, today: day.isToday }"
            @click="selectCalendarDate(day.value)"
          >
            {{ day.day }}
          </button>
        </div>
        <div class="date-panel-foot">
          <button type="button" @click="clearCalendarDate('endDate')">清除</button>
          <button type="button" @click="openDatePicker = ''">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  single: { type: Boolean, default: false },
  startPlaceholder: { type: String, default: '开始日期' },
  endPlaceholder: { type: String, default: '结束日期' }
})
const emit = defineEmits(['update:startDate', 'update:endDate', 'change'])

const rootRef = ref(null)
const openDatePicker = ref('')
const calendarCursor = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const weekLabels = ['一', '二', '三', '四', '五', '六', '日']

const calendarTitle = computed(() => `${calendarCursor.value.getFullYear()}年${calendarCursor.value.getMonth() + 1}月`)
const calendarDays = computed(() => {
  const year = calendarCursor.value.getFullYear()
  const month = calendarCursor.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const offset = (firstDay.getDay() + 6) % 7
  const start = new Date(year, month, 1 - offset)
  const todayValue = formatDateValue(new Date())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const value = formatDateValue(date)
    return {
      value,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: value === todayValue
    }
  })
})

function parseDateValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDateValue(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toggleDatePicker(key) {
  openDatePicker.value = openDatePicker.value === key ? '' : key
  const selected = parseDateValue(key === 'startDate' ? props.startDate : props.endDate)
  const today = new Date()
  calendarCursor.value = selected || new Date(today.getFullYear(), today.getMonth(), 1)
}

function changeCalendarMonth(delta) {
  calendarCursor.value = new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth() + delta, 1)
}

function changeCalendarYear(delta) {
  calendarCursor.value = new Date(calendarCursor.value.getFullYear() + delta, calendarCursor.value.getMonth(), 1)
}

function selectCalendarDate(value) {
  if (!openDatePicker.value) return
  emit(`update:${openDatePicker.value}`, value)
  emit('change')
  openDatePicker.value = ''
}

function clearCalendarDate(key) {
  emit(`update:${key}`, '')
  emit('change')
  openDatePicker.value = ''
}

function closeOnOutside(event) {
  if (!rootRef.value || rootRef.value.contains(event.target)) return
  openDatePicker.value = ''
}

onMounted(() => document.addEventListener('click', closeOnOutside))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutside))
</script>

<style scoped>
.date-range{display:flex;align-items:center;gap:8px;width:100%}
.date-range.single{display:block}
.date-range i{font-style:normal;font-size:12px;color:var(--text3);flex-shrink:0}
.date-picker-wrap{position:relative;flex:1;min-width:0}
.date-picker-trigger{width:100%;height:40px;border:1px solid var(--border);background:#fff;padding:0 11px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:14px;color:var(--text3);font-family:inherit;cursor:pointer}
.date-picker-trigger.filled{color:var(--text1)}
.date-picker-trigger:focus{outline:none;border-color:var(--primary)}
.date-picker-trigger svg{width:16px;height:16px;color:var(--text3);flex-shrink:0}
.date-panel{position:absolute;top:calc(100% + 6px);left:0;width:284px;background:#fff;border:1px solid var(--border);box-shadow:var(--shadow-lg);z-index:40;padding:12px}
.date-picker-wrap:last-child .date-panel{left:auto;right:0}
.date-range.single .date-panel{left:0;right:auto}
.date-panel-head{display:grid;grid-template-columns:60px minmax(0,1fr) 60px;align-items:center;gap:6px;margin-bottom:10px}
.date-panel-head strong{font-size:14px;color:var(--text1);text-align:center;white-space:nowrap}
.date-panel-head button,.date-panel-foot button{border:none;background:#fff;color:var(--text2);font-family:inherit;cursor:pointer}
.date-panel-head button{width:28px;height:28px;display:flex;align-items:center;justify-content:center;line-height:1}
.date-panel-head button:hover,.date-panel-foot button:hover{color:var(--primary)}
.date-nav-group{display:flex;align-items:center;gap:2px}
.date-nav-group.next{justify-content:flex-end}
.date-nav-icon{width:16px;height:16px;display:block}
.date-nav-icon.double{width:18px}
.date-week-grid,.date-day-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.date-week-grid{margin-bottom:6px}
.date-week-grid span{text-align:center;font-size:12px;color:var(--text3);line-height:24px}
.date-day{height:30px;border:none;background:#fff;color:var(--text1);font-size:13px;font-family:inherit;cursor:pointer}
.date-day:hover{background:var(--primary-light);color:var(--primary)}
.date-day.muted{color:var(--text3)}
.date-day.today{box-shadow:inset 0 0 0 1px var(--border)}
.date-day.selected{background:var(--primary);color:#fff}
.date-panel-foot{display:flex;justify-content:flex-end;gap:14px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border2)}
.date-panel-foot button{font-size:13px}

@media (max-width:980px){
  .date-panel{left:0;right:auto;width:280px}
}
</style>
