<template>
  <section class="candidate-step candidate-dynamic-step">
    <div class="candidate-page-heading">
      <div>
        <div class="candidate-step-kicker">
          <ClipboardPenLine :size="17" />
          信息填写
        </div>
        <h1>补充核验信息</h1>
        <p>请根据本次调查内容如实填写，带 * 为必填项。</p>
      </div>
    </div>

    <p v-if="error" class="candidate-form-error" role="alert">{{ error }}</p>

    <section class="candidate-form-section">
      <div class="candidate-section-title">
        <UserRound :size="20" />
        <div>
          <h2>个人信息</h2>
          <p>姓名、手机号来自调查发起方，请填写您本人的身份证号用于实名核验。</p>
        </div>
      </div>
      <div class="candidate-grid candidate-grid-two">
        <label class="candidate-field">
          <span>姓名</span>
          <input v-model.trim="model.candidate.name" disabled />
        </label>
        <label class="candidate-field">
          <span>手机号码</span>
          <input v-model.trim="model.candidate.phone" disabled />
        </label>
        <label class="candidate-field">
          <span>身份证号 *</span>
          <input
            v-model.trim="model.candidate.idCard"
            maxlength="18"
            placeholder="请输入本人18位身份证号"
          />
        </label>
        <label class="candidate-field">
          <span>邮箱地址（选填）</span>
          <input v-model.trim="model.candidate.email" type="email" placeholder="用于接收必要的服务通知" />
        </label>
      </div>
    </section>

    <section v-if="hasModule(MODULE_KEYS.EDUCATION)" class="candidate-form-section">
      <div class="candidate-section-heading-row">
        <div class="candidate-section-title">
          <GraduationCap :size="21" />
          <div>
            <h2>学历信息</h2>
            <p>{{ moduleDefinitions.education.description }}</p>
          </div>
        </div>
      </div>
      <!-- 指引服务的是「填编号」这个动作，放在说明下方独立一行，
           既不挤占标题行宽度，也离它真正服务的输入框更近 -->
      <button type="button" class="candidate-guide-trigger" aria-haspopup="dialog" @click="educationGuideOpen = true">
        <BookOpenCheck :size="17" />
        证书编号填写指引
      </button>

      <div
        v-for="(item, index) in model.educations"
        :key="item.id"
        class="candidate-repeat-item"
      >
        <div class="candidate-repeat-head">
          <strong>学历 {{ index + 1 }}</strong>
          <button
            v-if="model.educations.length > 1"
            type="button"
            class="candidate-icon-text-button candidate-danger-button"
            @click="model.educations.splice(index, 1)"
          >
            <Trash2 :size="16" />
            删除
          </button>
        </div>
        <label class="candidate-field candidate-field-compact">
          <span>学历证书编号</span>
          <input
            v-model.trim="item.credentialNo"
            :disabled="item.noCredential"
            :placeholder="item.noCredential ? '已声明暂时无法提供' : '请输入证书编号'"
          />
        </label>
        <label class="candidate-inline-check">
          <input type="checkbox" :checked="item.noCredential" @change="toggleNoCredential(item, $event)" />
          <span>暂时无法提供该证书编号</span>
        </label>
      </div>
      <button
        v-if="model.educations.length < MAX_EDUCATION_ITEMS"
        type="button"
        class="candidate-add-button"
        @click="model.educations.push(createEducation())"
      >
        <Plus :size="17" />
        添加学历
      </button>
    </section>

    <Teleport to="body">
      <div v-if="educationGuideOpen" class="candidate-document-overlay" @click.self="educationGuideOpen = false">
        <section
          class="candidate-document-dialog candidate-education-guide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="education-guide-title"
        >
          <button
            type="button"
            class="candidate-dialog-close"
            title="关闭"
            aria-label="关闭学历证书编号填写指引"
            @click="educationGuideOpen = false"
          >
            <X :size="20" />
          </button>

          <div class="candidate-guide-heading">
            <BookOpenCheck :size="23" />
            <div>
              <h2 id="education-guide-title">学历证书编号填写指引</h2>
              <p>登录本人学信档案，按照以下步骤找到证书编号，并按原样完整填写。</p>
            </div>
          </div>

          <div class="candidate-guide-steps">
            <figure v-for="(step, index) in educationGuideSteps" :key="step.title" class="candidate-guide-step">
              <div class="candidate-guide-step-index">步骤 {{ index + 1 }}</div>
              <div class="candidate-guide-image-frame">
                <img :src="step.image" :alt="step.title" loading="lazy" />
              </div>
              <figcaption>
                <strong>{{ step.title }}</strong>
                <span>{{ step.description }}</span>
              </figcaption>
            </figure>
          </div>

          <div class="candidate-guide-warning">
            <strong>不要填写：</strong>
            <span>学号、学位证书编号、在线验证码或学历认证报告编号。</span>
          </div>
          <p class="candidate-guide-fallback">
            如暂时无法找到，可以留空继续提交。报告中会标记“候选人未提供编号”，不会误判为核验通过。
          </p>

          <button type="button" class="candidate-primary-button candidate-guide-confirm" @click="educationGuideOpen = false">
            我知道了
          </button>
        </section>
      </div>
    </Teleport>

    <section v-if="employmentCount > 0" class="candidate-form-section">
      <div class="candidate-section-title">
        <BriefcaseBusiness :size="21" />
        <div>
          <h2>{{ employmentCount === 2 ? '两段工作经历核验' : '一段工作经历核验' }}</h2>
          <p>{{ employmentDefinition.description }}</p>
        </div>
      </div>

      <div
        v-for="(item, index) in model.employments"
        :key="item.id"
        class="candidate-repeat-item"
      >
        <div class="candidate-repeat-head">
          <strong>工作经历 {{ index + 1 }}</strong>
          <span class="candidate-repeat-caption">本段需提供 HR 与直属上级两位证明人</span>
        </div>
        <div class="candidate-grid candidate-grid-two">
          <label class="candidate-field candidate-grid-full">
            <span>工作单位名称 *</span>
            <input v-model.trim="item.companyName" placeholder="请输入完整公司名称" />
          </label>
          <label class="candidate-field">
            <span>入职时间 *</span>
            <input v-model="item.startMonth" type="month" />
          </label>
          <label class="candidate-field">
            <span>离职时间 *</span>
            <input v-model="item.endMonth" type="month" :disabled="item.isCurrent" />
          </label>
          <label class="candidate-field">
            <span>供职方式 *</span>
            <select v-model="item.employmentType">
              <option value="" disabled>请选择供职方式</option>
              <option v-for="type in employmentTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>
          <label class="candidate-field">
            <span>职位名称 *</span>
            <input v-model.trim="item.positionName" placeholder="请输入离职前或当前职位" />
          </label>
          <label class="candidate-field">
            <span>薪酬范围 *</span>
            <select v-model="item.salaryRange">
              <option value="" disabled>请选择税前月薪范围</option>
              <option v-for="range in salaryRanges" :key="range" :value="range">{{ range }}</option>
            </select>
          </label>
          <label class="candidate-field">
            <span>{{ item.isCurrent ? '当前状态' : '离职原因' }} *</span>
            <input
              v-model.trim="item.leaveReason"
              :disabled="item.isCurrent"
              :placeholder="item.isCurrent ? '在职' : '请简要填写离职原因'"
            />
          </label>
        </div>
        <label class="candidate-inline-check">
          <input v-model="item.isCurrent" type="checkbox" @change="handleCurrentChange(item)" />
          <span>目前仍在职</span>
        </label>

        <div class="candidate-reference-grid">
          <section class="candidate-reference-panel">
            <div class="candidate-reference-heading">
              <ContactRound :size="19" />
              <div>
                <strong>证明人一：HR</strong>
                <span>用于核实任职单位、时间、职位、薪酬及离职情况</span>
              </div>
            </div>
            <div class="candidate-grid candidate-grid-two">
              <label class="candidate-field">
                <span>HR 姓名 *</span>
                <input v-model.trim="item.hrReference.contactName" placeholder="请输入HR姓名" />
              </label>
              <label class="candidate-field">
                <span>HR 联系方式 *</span>
                <input v-model.trim="item.hrReference.contactPhone" type="tel" maxlength="20" placeholder="手机号码或办公电话" />
              </label>
            </div>
          </section>

          <section class="candidate-reference-panel">
            <div class="candidate-reference-heading">
              <ContactRound :size="19" />
              <div>
                <strong>证明人二：直属上级</strong>
                <span>用于核实工作职责、职业表现、团队合作和综合评价</span>
              </div>
            </div>
            <div class="candidate-grid candidate-grid-two">
              <label class="candidate-field">
                <span>上级姓名 *</span>
                <input v-model.trim="item.supervisorReference.contactName" placeholder="请输入直属上级姓名" />
              </label>
              <label class="candidate-field">
                <span>上级职位 *</span>
                <input v-model.trim="item.supervisorReference.contactRole" placeholder="请输入证明人职位" />
              </label>
              <label class="candidate-field candidate-grid-full">
                <span>上级联系方式 *</span>
                <input v-model.trim="item.supervisorReference.contactPhone" type="tel" maxlength="20" placeholder="手机号码或办公电话" />
              </label>
            </div>
          </section>
        </div>
      </div>
    </section>

    <div class="candidate-footer-actions">
      <button type="button" class="candidate-secondary-button" @click="$emit('back')">返回上一步</button>
      <button type="button" class="candidate-primary-button" @click="$emit('continue')">
        预览填写信息
        <ArrowRight :size="18" />
      </button>
    </div>
  </section>
</template>

<script setup>
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardPenLine,
  ContactRound,
  GraduationCap,
  Plus,
  Trash2,
  UserRound,
  X
} from '@lucide/vue'
import { computed, ref } from 'vue'
import educationGuideStep1 from '../../../assets/candidate/education-guide/step-1-login.png'
import educationGuideStep2 from '../../../assets/candidate/education-guide/step-2-education-entry.png'
import educationGuideStep3 from '../../../assets/candidate/education-guide/step-3-education-record.png'
import educationGuideStep4 from '../../../assets/candidate/education-guide/step-4-certificate-number.png'
import {
  MAX_EDUCATION_ITEMS,
  MODULE_KEYS,
  createEducation,
  employmentSegmentCount,
  employmentTypes,
  moduleDefinitions,
  salaryRanges
} from '../candidateFormSchema'

const props = defineProps({
  model: { type: Object, required: true },
  modules: { type: Array, default: () => [] },
  error: { type: String, default: '' }
})

const educationGuideOpen = ref(false)
const employmentCount = computed(() => employmentSegmentCount(props.modules))
const employmentDefinition = computed(() => moduleDefinitions[
  employmentCount.value === 2 ? MODULE_KEYS.EMPLOYMENT_TWO : MODULE_KEYS.EMPLOYMENT_ONE
])
const educationGuideSteps = [
  {
    image: educationGuideStep1,
    title: '登录学信档案',
    description: '进入学信档案并登录本人账号。'
  },
  {
    image: educationGuideStep2,
    title: '进入高等教育信息',
    description: '在首页选择“高等教育信息”。'
  },
  {
    image: educationGuideStep3,
    title: '选择学历记录',
    description: '找到需要核验的学历并打开详情。'
  },
  {
    image: educationGuideStep4,
    title: '复制证书编号',
    description: '在学历详情底部找到“证书编号”，完整复制到表单。'
  }
]

defineEmits(['back', 'continue'])

function hasModule(key) {
  return props.modules.includes(key)
}
// 勾选「暂时无法提供」时清掉已填内容：
// 否则会出现「声明没有编号」却又带着编号提交的自相矛盾数据
function toggleNoCredential(item, event) {
  item.noCredential = event.target.checked
  if (item.noCredential) item.credentialNo = ''
}

function handleCurrentChange(item) {
  if (item.isCurrent) {
    item.endMonth = ''
    item.leaveReason = '在职'
    return
  }
  if (item.leaveReason === '在职') item.leaveReason = ''
}
</script>

