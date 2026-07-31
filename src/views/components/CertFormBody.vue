<template>
  <div v-if="detailLoading" class="state-box">正在加载详情...</div>
  <template v-else>
    <div class="cert-fields">
      <!-- 企业名称最重要且最长，独占一行 -->
      <label class="span-2">
        <span class="fl">企业名称<i v-if="!formReadonly" class="req">*</i></span>
        <input v-model.trim="form.enterpriseName" :disabled="formReadonly" placeholder="请输入与营业执照一致的企业/个体工商户名称">
      </label>

      <label class="span-2">
        <span class="fl">统一社会信用代码<i v-if="!formReadonly" class="req">*</i></span>
        <input v-model.trim="form.unifiedSocialCreditCode" :disabled="formReadonly" maxlength="32" placeholder="营业执照上的 18 位统一社会信用代码">
      </label>

      <label>
        <span class="fl">法定代表人/负责人</span>
        <input v-model.trim="form.legalRepresentativeName" :disabled="formReadonly" placeholder="选填">
      </label>

      <label>
        <span class="fl">联系人</span>
        <input v-model.trim="form.contactPerson" :disabled="formReadonly" placeholder="选填">
      </label>

      <label>
        <span class="fl">联系电话</span>
        <input v-model.trim="form.contactPhone" :disabled="formReadonly" maxlength="11" inputmode="numeric" placeholder="选填">
      </label>
    </div>

    <div class="cert-license">
      <div class="cl-head">
        <span class="fl">营业执照照片<i v-if="canEdit" class="req">*</i></span>
        <em v-if="canEdit" class="fn">支持 JPG / PNG，单张不超过 5MB</em>
      </div>

      <div class="cl-body">
        <div v-for="file in fileList.business_license" :key="file.id || file.filePath" class="cl-thumb">
          <img :src="fileUrl(file)" alt="营业执照" @click="$emit('preview', file)">
          <button v-if="canEdit" type="button" class="cl-remove" @click="$emit('remove', file)">删除</button>
        </div>

        <label v-if="canEdit && fileList.business_license.length < 1" class="cl-upload">
          <input type="file" accept="image/jpeg,image/png" @change="onPick">
          <span class="cl-plus">+</span>
          <strong>{{ uploading ? '上传中…' : '点击上传营业执照' }}</strong>
          <small>需图片清晰、四角完整、文字可辨认</small>
        </label>
      </div>

      <p v-if="sizeError" class="cl-error">{{ sizeError }}</p>
    </div>

    <div v-if="form.rejectReason" class="reject-box panel-reject">
      驳回原因：{{ form.rejectReason }}
    </div>

    <p v-if="errorMsg" class="error-line">{{ errorMsg }}</p>
    <p v-if="successMsg" class="form-success">{{ successMsg }}</p>
  </template>
</template>

<script setup>
import { ref } from 'vue'

// 企业认证表单主体。抽成组件是为了同一份表单能用在两个位置：
//   未认证 / 草稿 / 被驳回 → 直接内联渲染在页面上（不弹窗）
//   查看历史认证记录       → 仍然放在弹窗里
defineProps({
  form: { type: Object, required: true },
  fileList: { type: Object, required: true },
  formReadonly: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  uploading: { type: Boolean, default: false },
  detailLoading: { type: Boolean, default: false },
  errorMsg: { type: String, default: '' },
  successMsg: { type: String, default: '' },
  fileUrl: { type: Function, required: true }
})

const emit = defineEmits(['preview', 'remove', 'file-change'])

const MAX_SIZE = 5 * 1024 * 1024
const sizeError = ref('')

// 前端先拦一道：超限文件不必上传完再由后端拒绝，白等一次往返
function onPick(event) {
  sizeError.value = ''
  const file = event.target.files && event.target.files[0]
  if (!file) return
  if (file.size > MAX_SIZE) {
    sizeError.value = `图片 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过 5MB 上限，请压缩后重试`
    event.target.value = ''
    return
  }
  emit('file-change', event)
}
</script>

<style scoped>
/* 字段栅格：重要字段整行，次要字段两列 */
.cert-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.cert-fields .span-2 { grid-column: 1 / -1; }

.cert-fields label {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fl {
  margin-bottom: 6px;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
}

.req { margin-left: 3px; font-style: normal; color: #e35d5b; }

.fn {
  margin-top: 6px;
  font-style: normal;
  font-size: var(--fs-xs);
  color: var(--muted);
  line-height: 1.6;
}

.cert-fields input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  font-size: var(--fs-sm);
  box-sizing: border-box;
  transition: border-color .14s ease, box-shadow .14s ease;
}

.cert-fields input:hover:not(:disabled) { border-color: var(--line); }

.cert-fields input:focus {
  outline: none;
  border-color: var(--text);
  box-shadow: 0 0 0 3px rgba(22, 24, 29, .06);
}

.cert-fields input:disabled { background: var(--line-soft); color: var(--muted); }

/* 营业执照区 */
.cert-license {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--line-soft);
}

.cl-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.cl-head .fn { margin-top: 0; }

.cl-body { display: flex; flex-wrap: wrap; gap: 12px; }

.cl-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  max-width: 360px;
  min-height: 132px;
  padding: 16px;
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
  background: #fbfbfa;
  cursor: pointer;
  text-align: center;
  transition: border-color .14s ease, background .14s ease;
}

.cl-upload:hover { border-color: var(--text); background: #f6f6f5; }
.cl-upload input { display: none; }
.cl-plus { font-size: var(--fs-2xl); line-height: 1; color: var(--muted); }
.cl-upload strong { font-size: var(--fs-sm); font-weight: 500; color: var(--text); }
.cl-upload small { font-size: var(--fs-xs); color: var(--muted); }

.cl-thumb {
  position: relative;
  width: 100%;
  max-width: 360px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #fff;
}

.cl-thumb img {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  cursor: zoom-in;
  background: #fbfbfa;
}

.cl-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: rgba(22, 24, 29, .72);
  color: #fff;
  font-size: var(--fs-xs);
  cursor: pointer;
}

.cl-error {
  margin: 10px 0 0;
  font-size: var(--fs-xs);
  color: #e35d5b;
}

@media (max-width: 640px) {
  .cert-fields { grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .cl-head { flex-direction: column; align-items: flex-start; gap: 4px; }
  .cl-upload, .cl-thumb { max-width: none; }
}
</style>
