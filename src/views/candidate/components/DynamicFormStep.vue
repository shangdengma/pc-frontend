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
      <div class="candidate-section-title">
        <GraduationCap :size="21" />
        <div>
          <h2>学历信息</h2>
          <p>{{ moduleDefinitions.education.description }}</p>
        </div>
      </div>

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
        <label class="candidate-field">
          <span>学历证书编号 *</span>
          <input v-model.trim="item.credentialNo" placeholder="请输入毕业证书或学历证书编号" />
        </label>
      </div>
      <button type="button" class="candidate-add-button" @click="model.educations.push(createEducation())">
        <Plus :size="17" />
        添加学历
      </button>
    </section>

    <section v-if="hasModule(MODULE_KEYS.EMPLOYMENT)" class="candidate-form-section">
      <div class="candidate-section-title">
        <BriefcaseBusiness :size="21" />
        <div>
          <h2>工作经历</h2>
          <p>{{ moduleDefinitions.employment.description }}</p>
        </div>
      </div>

      <div
        v-for="(item, index) in model.employments"
        :key="item.id"
        class="candidate-repeat-item"
      >
        <div class="candidate-repeat-head">
          <strong>工作经历 {{ index + 1 }}</strong>
          <button
            v-if="model.employments.length > 1"
            type="button"
            class="candidate-icon-text-button candidate-danger-button"
            @click="model.employments.splice(index, 1)"
          >
            <Trash2 :size="16" />
            删除
          </button>
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
          <label class="candidate-field candidate-grid-full">
            <span>薪酬范围 *</span>
            <select v-model="item.salaryRange">
              <option value="" disabled>请选择税前月薪范围</option>
              <option v-for="range in salaryRanges" :key="range" :value="range">{{ range }}</option>
            </select>
          </label>
        </div>
        <label class="candidate-inline-check">
          <input v-model="item.isCurrent" type="checkbox" @change="item.isCurrent && (item.endMonth = '')" />
          <span>目前仍在职</span>
        </label>
      </div>
      <button type="button" class="candidate-add-button" @click="model.employments.push(createEmployment())">
        <Plus :size="17" />
        添加工作经历
      </button>
    </section>

    <section v-if="hasModule(MODULE_KEYS.REFERENCE)" class="candidate-form-section">
      <div class="candidate-section-title">
        <ContactRound :size="21" />
        <div>
          <h2>工作经历访谈</h2>
          <p>{{ moduleDefinitions.reference.description }}</p>
        </div>
      </div>

      <div
        v-for="(item, index) in model.references"
        :key="item.id"
        class="candidate-repeat-item"
      >
        <div class="candidate-repeat-head">
          <strong>证明人 {{ index + 1 }}</strong>
          <button
            v-if="model.references.length > 1"
            type="button"
            class="candidate-icon-text-button candidate-danger-button"
            @click="model.references.splice(index, 1)"
          >
            <Trash2 :size="16" />
            删除
          </button>
        </div>
        <div class="candidate-grid candidate-grid-two">
          <label class="candidate-field candidate-grid-full">
            <span>工作单位名称 *</span>
            <input v-model.trim="item.companyName" placeholder="请输入该段经历对应的公司名称" />
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
            <span>证明人姓名 *</span>
            <input v-model.trim="item.contactName" placeholder="请输入证明人姓名" />
          </label>
          <label class="candidate-field">
            <span>证明人职位 *</span>
            <input v-model.trim="item.contactRole" placeholder="如：直属领导、HR" />
          </label>
          <label class="candidate-field candidate-grid-full">
            <span>证明人联系方式 *</span>
            <input
              v-model.trim="item.contactPhone"
              type="tel"
              inputmode="numeric"
              maxlength="20"
              placeholder="请输入手机号码或办公电话"
            />
          </label>
        </div>
        <label class="candidate-inline-check">
          <input v-model="item.isCurrent" type="checkbox" @change="item.isCurrent && (item.endMonth = '')" />
          <span>目前仍在职</span>
        </label>
      </div>
      <button type="button" class="candidate-add-button" @click="model.references.push(createReference())">
        <Plus :size="17" />
        添加证明人
      </button>
    </section>

    <p v-if="error" class="candidate-form-error" role="alert">{{ error }}</p>

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
  BriefcaseBusiness,
  ClipboardPenLine,
  ContactRound,
  GraduationCap,
  Plus,
  Trash2,
  UserRound
} from '@lucide/vue'
import {
  MODULE_KEYS,
  createEducation,
  createEmployment,
  createReference,
  moduleDefinitions,
  salaryRanges
} from '../candidateFormSchema'

const props = defineProps({
  model: { type: Object, required: true },
  modules: { type: Array, default: () => [] },
  error: { type: String, default: '' }
})

defineEmits(['back', 'continue'])

function hasModule(key) {
  return props.modules.includes(key)
}
</script>

