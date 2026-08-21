<template>
  <main class="candidate-shell">
    <header class="candidate-header">
      <div class="candidate-brand">
        <span class="candidate-brand-mark">钟馗</span>
        <span>
          <strong>钟馗背调</strong>
          <small>候选人信息授权</small>
        </span>
      </div>
      <!-- 新窗口打开：候选人多半填到一半，当前页导航走会丢掉已填内容 -->
      <a
        class="candidate-help-button"
        :href="contactUrl"
        target="_blank"
        rel="noopener"
        title="联系客服"
      >
        <CircleHelp :size="18" />
        <span>客服与帮助</span>
      </a>
    </header>

    <div v-if="!terminalState && currentStep > 0" class="candidate-progress-wrap">
      <button type="button" class="candidate-back-button" @click="back">
        <ChevronLeft :size="19" />
        返回
      </button>
      <ol class="candidate-progress">
        <li v-for="(item, index) in progressSteps" :key="item" :class="{ active: currentStep === index + 1, done: currentStep > index + 1 }">
          <span>{{ currentStep > index + 1 ? '✓' : index + 1 }}</span>
          <em>{{ item }}</em>
        </li>
      </ol>
    </div>

    <div class="candidate-content">
      <section v-if="terminalState" class="candidate-step candidate-complete-step">
        <span class="candidate-complete-icon" :class="terminalTone">
          <component :is="terminalIcon" :size="38" />
        </span>
        <h1>{{ terminalTitle }}</h1>
        <p>{{ terminalMessage }}</p>
      </section>

      <section v-else-if="taskLoading" class="candidate-step candidate-complete-step">
        <h1>加载中…</h1>
        <p>正在获取本次授权任务信息，请稍候。</p>
      </section>

      <template v-else>
        <div
          v-if="!demoMode && (currentStep === 2 || currentStep === 3)"
          class="candidate-autosave"
          :class="`is-${draftSaveStatus}`"
          role="status"
          aria-live="polite"
        >
          <TriangleAlert v-if="draftSaveStatus === 'error'" :size="16" />
          <CheckCircle2 v-else-if="draftSaveStatus === 'saved' || draftSaveStatus === 'restored'" :size="16" />
          <Clock3 v-else :size="16" />
          <span>{{ draftStatusText }}</span>
          <button v-if="draftSaveStatus === 'error'" type="button" @click="flushDraftSave">重新保存</button>
        </div>

        <PhoneVerifyStep
          v-if="currentStep === 0"
          v-model:phone="verification.phone"
          v-model:code="verification.code"
          :phone-hint="maskedExpectedPhone"
          :countdown="countdown"
          :sending="sendingCode"
          :loading="verifying"
          :demo-mode="demoMode"
          :error="stepError"
          @send-code="sendCode"
          @continue="verifyPhone"
        />

        <ConsentStep
          v-else-if="currentStep === 1"
          v-model:accepted="consentAccepted"
          :company-name="task.companyName"
          @continue="confirmConsent"
          @show-agreement="showDocument('agreement')"
          @show-privacy="showDocument('privacy')"
        />

        <DynamicFormStep
          v-else-if="currentStep === 2"
          :model="formModel"
          :modules="task.modules"
          :error="stepError"
          @back="back"
          @continue="reviewForm"
        />

        <ReviewStep
          v-else-if="currentStep === 3"
          :model="formModel"
          :modules="task.modules"
          :loading="submitting"
          :error="stepError"
          @back="back"
          @sign="submitAndSign"
        />

        <section v-else class="candidate-step candidate-complete-step">
          <span class="candidate-complete-icon"><CheckCircle2 :size="38" /></span>
          <h1>信息已提交</h1>
          <p>您的信息已确认完成，请点击下方按钮前往 e签宝 完成电子签署。</p>
          <p v-if="stepError" class="candidate-form-error" role="alert">{{ stepError }}</p>
          <button class="candidate-primary-button" type="button" :disabled="submitting" @click="submitAndSign">
            {{ submitting ? '正在获取签署链接…' : '前往电子签署' }}
          </button>
        </section>
      </template>
    </div>

    <footer class="candidate-page-footer">
      <span class="candidate-footer-line">
        <ShieldCheck :size="16" />
        信息加密传输 · 授权过程全程留痕
      </span>
      <!-- 备案号需可点击跳工信部，这是备案要求 -->
      <span class="candidate-footer-line">
        河南钟馗科技有限公司 ·
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">豫ICP备2025138155号</a>
      </span>
      <a
        class="candidate-footer-line candidate-police-record"
        href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=41019602002676"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/gongan-beian.png" alt="" aria-hidden="true">
        <span>豫公网安备41019602002676号</span>
      </a>
    </footer>

    <div v-if="documentDialog" class="candidate-document-overlay" @click.self="documentDialog = ''">
      <section class="candidate-document-dialog" role="dialog" aria-modal="true">
        <button type="button" class="candidate-dialog-close" title="关闭" @click="documentDialog = ''">
          <X :size="20" />
        </button>
        <h2>{{ documentDialog === 'privacy' ? '隐私政策' : '背调用户协议' }}</h2>

        <div v-if="documentDialog === 'agreement'" class="candidate-dialog-copy candidate-legal-copy">
          <p class="candidate-legal-lead">
            欢迎使用钟馗背调候选人授权服务。本协议由您与背景调查服务机构
            <strong>{{ SERVICE_PROVIDER }}</strong> 共同订立。请在使用本服务前完整阅读，
            尤其注意个人信息处理、电子签署、责任边界等内容。
          </p>

          <section>
            <h3>一、服务内容与适用范围</h3>
            <ol>
              <li>本服务用于协助您完成手机号验证、阅读授权声明、填写核验资料、确认信息并跳转至电子签署页面。</li>
              <li>
                本次背景调查由 <strong>{{ task.companyName || '调查发起企业' }}</strong> 发起，
                实际核验项目仅限发起企业选定的背调套餐及授权页面向您展示的范围。
              </li>
              <li>平台不会要求您填写与本次核验无关的信息，也不会以本服务替代发起企业依法开展的招聘、录用与人力资源管理活动。</li>
            </ol>
          </section>

          <section>
            <h3>二、身份验证与账号安全</h3>
            <ol>
              <li>您应使用短信指定手机号接收验证码并完成本人验证，不得冒用他人身份、转让链接或协助他人规避验证。</li>
              <li>验证码、授权链接及电子签署链接仅限本人使用。因您主动泄露、转发或交由他人操作产生的风险，由您依法承担相应责任。</li>
              <li>如您发现手机号、姓名、发起企业或调查事项有误，请暂停填写并联系发起企业或平台客服核实。</li>
            </ol>
          </section>

          <section>
            <h3>三、信息填写与授权签署</h3>
            <ol>
              <li>您应确保提交的信息真实、准确、完整，并有权提供所填写的证明人联系方式等相关信息。</li>
              <li>如信息发生变化或填写有误，您应在电子签署前及时更正；完成签署后需要修改的，请联系发起企业或平台客服处理。</li>
              <li>您勾选同意并继续操作，表示已阅读本协议及《隐私政策》；最终授权内容及效力以您在电子签署页面签署的文件为准。</li>
              <li>您拒绝提供某项核验所必需的信息或拒绝签署授权，将导致本次背调无法继续，但不影响您依法享有的其他权利。</li>
            </ol>
          </section>

          <section>
            <h3>四、核验结果与使用边界</h3>
            <ol>
              <li>报告内容来自您提交的信息、依法公开的信息、经合法授权的核验渠道及必要的人工访谈，可能受数据更新周期、同名同姓、来源完整性等因素影响。</li>
              <li>平台将对核验过程和结果进行合理审慎处理，但不承诺任何第三方数据在所有时点绝对完整或不存在合理误差。</li>
              <li>背景调查报告仅作为发起企业开展招聘与人力资源管理的参考。录用、任用或其他决定由发起企业依法独立作出，平台不代替其作出决定。</li>
              <li>如您认为核验结果存在错误或遗漏，可通过发起企业或平台客服提出复核，并提供必要的证明材料。</li>
            </ol>
          </section>

          <section>
            <h3>五、服务中断与禁止行为</h3>
            <ol>
              <li>因网络、运营商、电子签平台、核验机构维护或不可抗力造成短时中断的，平台将采取合理措施恢复服务，并尽量降低影响。</li>
              <li>您不得攻击、干扰本页面及相关接口，不得批量尝试验证码、篡改页面数据、伪造材料或以其他方式妨碍核验。</li>
              <li>发现异常访问、身份冒用、材料伪造或其他违法违规行为时，平台有权暂停相关任务、保存必要证据并依法配合有关机关处理。</li>
            </ol>
          </section>

          <section>
            <h3>六、协议变更、联系与争议处理</h3>
            <ol>
              <li>如服务内容或个人信息处理规则发生实质变化，平台将依法通过显著提示重新告知；依法需要重新取得同意的，将在继续处理前另行征得同意。</li>
              <li>
                如对本协议、核验事项或报告内容有疑问，请先联系调查发起企业，或前往
                <a :href="contactUrl" target="_blank" rel="noopener">客服与帮助</a> 与我们联系。
              </li>
              <li>本协议的订立、履行和解释适用中华人民共和国法律。争议发生后，各方应先友好协商；协商不成的，可依法向有管辖权的人民法院提起诉讼。</li>
            </ol>
          </section>
        </div>

        <div v-else class="candidate-dialog-copy candidate-legal-copy">
          <p class="candidate-legal-lead">
            <strong>{{ SERVICE_PROVIDER }}</strong> 重视您的个人信息安全。
            本政策说明在受 <strong>{{ task.companyName || '调查发起企业' }}</strong> 委托提供本次职业背景调查服务时，
            我们如何处理您的个人信息以及您如何行使相关权利。
          </p>

          <section>
            <h3>一、处理主体与处理原则</h3>
            <ol>
              <li>调查发起企业决定本次背调目的和套餐范围；河南钟馗科技有限公司依据委托和您的授权，提供信息收集、核验、报告生成及交付服务。</li>
              <li>我们遵循合法、正当、必要、诚信和最小范围原则，只处理完成本次背景调查所必需的信息，不将其用于与本次服务无关的营销或用户画像。</li>
              <li>本次实际处理项目以授权页面展示的套餐模块为准。未选中的核验项目，不会仅因其属于平台能力范围而自动查询。</li>
            </ol>
          </section>

          <section>
            <h3>二、我们处理的信息</h3>
            <ol>
              <li><strong>身份与联系信息：</strong>姓名、手机号码、短信验证码验证结果、身份证号码。</li>
              <li><strong>候选人填写资料：</strong>学历证书编号、教育经历、任职单位、任职时间、职位、薪酬范围、离职信息，以及您主动填写的证明人姓名、职位和联系方式。</li>
              <li><strong>核验与访谈信息：</strong>依法公开的信息、经授权从核验服务方取得的结果、证明人访谈内容、人工核验结论及相关说明材料。</li>
              <li><strong>电子签署信息：</strong>授权文件、签署状态、签署时间、签署流水号及用于证明签署过程的必要记录。</li>
              <li><strong>安全与运行信息：</strong>访问时间、网络地址、设备与浏览器基本信息、操作日志、异常记录。此类信息仅用于安全防护、故障排查和争议举证。</li>
            </ol>
          </section>

          <section>
            <h3>三、敏感个人信息特别说明</h3>
            <ol>
              <li>身份证号码、金融信用相关信息以及法律规定的其他敏感个人信息，一旦泄露或被非法使用，可能对您的人身、财产安全或人格权益造成影响。</li>
              <li>我们仅在所选核验项目确有必要、您已充分知情并明确授权的情况下处理相关敏感个人信息，并采取更严格的访问控制、加密和审计措施。</li>
              <li>拒绝提供敏感个人信息不会影响与其无关的功能，但可能使对应身份核验或背调项目无法完成。需要书面授权的内容，以您的电子签署文件为准。</li>
            </ol>
          </section>

          <section>
            <h3>四、处理目的和处理方式</h3>
            <ol>
              <li>用于核验本人身份、接收并校验候选人资料、执行所选背调项目、开展必要访谈、生成与交付报告、处理退款或任务异常。</li>
              <li>用于保障系统和数据安全、留存授权与操作证据、处理投诉、异议、复核及争议。</li>
              <li>处理方式包括收集、存储、校验、查询、比对、分析、生成报告、向授权接收方提供，以及在达到保存期限后删除或匿名化。</li>
              <li>平台不会仅依靠自动化处理对您作出录用或不录用决定；报告中的风险提示应由发起企业结合岗位要求和您的说明进行人工审慎判断。</li>
            </ol>
          </section>

          <section>
            <h3>五、信息来源及必要的对外提供</h3>
            <ol>
              <li>信息可能来源于您本人、调查发起企业、您指定的证明人、依法公开渠道，以及具备合法数据来源和服务能力的核验服务方。</li>
              <li>为完成核验，我们可能按最小必要范围向实名认证、学历核验、司法与风险核验、电子签署、短信、邮件、云服务等服务方提供必要信息，并通过协议约束其处理目的、范围和安全责任。</li>
              <li>核验结果和最终报告仅向本次调查发起企业及其依法授权的人员交付。未经您的授权或法律法规要求，不会向无关第三方出售或提供您的个人信息。</li>
              <li>如发生依法需要告知并取得单独同意的第三方提供、转移或处理目的变更，我们将在处理前另行向您告知并征得相应同意。</li>
            </ol>
          </section>

          <section>
            <h3>六、保存期限与存储地点</h3>
            <ol>
              <li>候选人填写任务及中间页访问权限仅在完成本次授权所需期限内有效，链接失效后不再允许继续提交。</li>
              <li>背景调查报告及其关联核验资料原则上自报告完成之日起保存不超过 360 天；到期后按照系统规则删除或匿名化，但法律法规另有规定或处理争议、诉讼确有必要的除外。</li>
              <li>授权、签署、安全审计和依法需要留存的记录，将在法定或实现相应目的所必需的最短期限内保存；期限届满后删除、匿名化或停止除存储和安全保护以外的处理。</li>
              <li>您的个人信息原则上存储在中华人民共和国境内。当前服务不以向境外提供个人信息为目的；确需跨境提供时，将依法另行告知并履行相应程序。</li>
            </ol>
          </section>

          <section>
            <h3>七、您的个人信息权利</h3>
            <ol>
              <li>您有权依法查询、复制、更正、补充或删除个人信息，并有权要求我们解释个人信息处理规则。</li>
              <li>基于同意开展的处理，您有权撤回同意。撤回不影响撤回前已进行处理的效力，但可能导致尚未完成的背调项目终止。</li>
              <li>如报告信息存在错误或遗漏，您可申请复核并提交证明材料。我们将在核验身份后，于合理期限内处理并反馈。</li>
              <li>
                您可联系调查发起企业，或通过
                <a :href="contactUrl" target="_blank" rel="noopener">客服与帮助</a>
                提交权利请求。为保障安全，我们可能先核验您的身份和请求关联性。
              </li>
            </ol>
          </section>

          <section>
            <h3>八、安全保护与事件处置</h3>
            <ol>
              <li>我们采取加密传输、分级授权、访问控制、日志审计、备份与恢复、安全监测等措施保护个人信息。</li>
              <li>发生或可能发生个人信息泄露、篡改、丢失时，我们将立即采取补救措施，并按照法律法规要求履行通知和报告义务。</li>
              <li>互联网环境并非绝对安全，请妥善保管短信验证码和授权链接，不要通过不可信渠道转发身份证件或报告材料。</li>
            </ol>
          </section>

          <section>
            <h3>九、未成年人限制与政策更新</h3>
            <ol>
              <li>本平台的背景调查服务仅面向年满十八周岁的候选人，不接受未成年人使用本服务或作为本平台背景调查对象。</li>
              <li>如在身份核验、资料填写或后续处理过程中发现候选人未满十八周岁，我们将停止本次授权和背调流程，不再继续查询，并按照适用规则处理已收集的信息。</li>
              <li>本政策发生重大变化时，我们将通过页面显著提示等方式重新告知；依法需要重新取得同意的，不会以更新政策替代您的同意。</li>
            </ol>
          </section>
        </div>
        <button type="button" class="candidate-primary-button" @click="documentDialog = ''">我已了解</button>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle2, ChevronLeft, CircleHelp, CircleSlash, Clock3, ShieldCheck, TriangleAlert, X } from '@lucide/vue'
import ConsentStep from './components/ConsentStep.vue'
import DynamicFormStep from './components/DynamicFormStep.vue'
import PhoneVerifyStep from './components/PhoneVerifyStep.vue'
import ReviewStep from './components/ReviewStep.vue'
import {
  MAX_EDUCATION_ITEMS,
  MODULE_KEYS,
  createEducation,
  createEmployment,
  employmentSegmentCount,
  moduleDefinitions,
  normalizeModules
} from './candidateFormSchema'
import {
  getCandidateTask,
  sendCandidateCode,
  verifyCandidateCode,
  consentCandidate,
  saveCandidateDraft,
  submitCandidateForm
} from '../../api/candidate'
import './candidate-authorization.css'

const route = useRoute()
const router = useRouter()
const SERVICE_PROVIDER = '河南钟馗科技有限公司'
const contactUrl = computed(() => router.resolve({
  name: 'contactUs',
  query: { source: 'candidate' }
}).href)
const progressSteps = ['阅读授权', '填写信息', '确认签署']
const currentStep = ref(0)
const countdown = ref(0)
const sendingCode = ref(false)
const verifying = ref(false)
const submitting = ref(false)
const consentAccepted = ref(false)
const stepError = ref('')
const documentDialog = ref('')
const taskLoading = ref(false)
const terminalState = ref('')
const ticket = ref('')
const draftSaveStatus = ref('idle')
const draftSavedAt = ref('')
const draftSaveError = ref('')
let countdownTimer = null
let draftSaveTimer = null
let draftSaveInFlight = false
let draftSaveQueued = false
let restoringDraft = false

const task = reactive({
  token: String(route.params.token || route.query.token || '').trim(),
  companyName: String(route.query.company || '河南钟馗科技有限公司'),
  expectedPhone: String(route.query.phone || '15936323268'),
  maskedPhone: '',
  signUrl: String(route.query.signUrl || ''),
  modules: normalizeModules(route.query.modules)
})

const demoMode = computed(() => task.token === 'demo' || route.query.demo === '1')
const maskedExpectedPhone = computed(() => demoMode.value
  ? task.expectedPhone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
  : task.maskedPhone)

const terminalCopy = {
  SIGNED: {
    title: '授权已完成',
    message: '您已完成信息填写与电子签署，无需重复操作。感谢您的配合！'
  },
  EXPIRED: {
    title: '链接已过期',
    message: '本次授权任务已超时失效。如仍需完成背景调查授权，请联系发起方重新发起。'
  },
  CANCELLED: {
    title: '任务已关闭',
    message: '本次授权任务已被取消或关闭。如有疑问，请联系发起方或平台客服。'
  },
  INVALID: {
    title: '任务不存在或已失效',
    message: '链接无效或任务已失效。请确认短信中的链接是否完整，或联系发起方重新发起。'
  }
}
// 图标必须与语义一致：原先所有终态共用绿色对勾，
// "链接已过期""任务不存在"也顶着一个成功图标，指向完全相反的含义。
const terminalVisual = {
  SIGNED:    { icon: CheckCircle2, tone: 'is-success' },
  EXPIRED:   { icon: Clock3,       tone: 'is-warn' },
  CANCELLED: { icon: CircleSlash,  tone: 'is-neutral' },
  INVALID:   { icon: TriangleAlert, tone: 'is-danger' }
}
const terminalIcon = computed(() => terminalVisual[terminalState.value]?.icon || TriangleAlert)
const terminalTone = computed(() => terminalVisual[terminalState.value]?.tone || 'is-neutral')

const terminalTitle = computed(() => terminalCopy[terminalState.value]?.title || '任务已结束')
const terminalMessage = computed(() => terminalCopy[terminalState.value]?.message || '')
const draftStatusText = computed(() => {
  if (draftSaveStatus.value === 'saving') return '正在安全保存填写内容…'
  if (draftSaveStatus.value === 'saved') return `已自动保存${draftSavedAt.value ? ` · ${draftSavedAt.value}` : ''}`
  if (draftSaveStatus.value === 'restored') return '已恢复上次填写的内容'
  if (draftSaveStatus.value === 'error') return draftSaveError.value || '自动保存失败，请检查网络后重试'
  return '填写内容将自动保存'
})

const verification = reactive({
  phone: '',
  code: ''
})

const formModel = reactive({
  candidate: {
    name: demoMode.value ? String(route.query.name || '丁文博') : '',
    idCard: demoMode.value ? String(route.query.idCard || '41100220031027301X') : '',
    phone: demoMode.value ? task.expectedPhone : '',
    email: ''
  },
  educations: [createEducation()],
  employments: []
})

syncEmploymentSegments()

const stepForStatus = {
  WAIT_SMS: 0,
  WAIT_CONSENT: 1,
  WAIT_FORM: 2,
  WAIT_SIGN: 4
}

onMounted(async () => {
  document.addEventListener('visibilitychange', saveDraftWhenHidden)
  if (!task.token) {
    terminalState.value = 'INVALID'
    return
  }
  if (demoMode.value) return
  taskLoading.value = true
  try {
    const res = await getCandidateTask(task.token)
    const data = res.data || {}
    applyTaskView(data)
    if (['SIGNED', 'EXPIRED', 'CANCELLED'].includes(data.status)) {
      terminalState.value = data.status
    }
  } catch (e) {
    terminalState.value = 'INVALID'
  } finally {
    taskLoading.value = false
  }
})

function applyTaskView(data) {
  if (data.companyName) task.companyName = String(data.companyName)
  if (data.maskedPhone) task.maskedPhone = String(data.maskedPhone)
  task.modules = Array.isArray(data.modules) && data.modules.length
    ? data.modules.filter(key => moduleDefinitions[key])
    : []
  syncEmploymentSegments()
}

function goToStep(step) {
  stepError.value = ''
  currentStep.value = step
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function back() {
  if (currentStep.value > 0) goToStep(currentStep.value - 1)
}

function startCountdown() {
  countdown.value = 60
  clearInterval(countdownTimer)
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
}

async function sendCode() {
  stepError.value = ''
  if (!/^1\d{10}$/.test(verification.phone)) {
    stepError.value = '请输入正确的11位手机号码'
    return
  }
  if (demoMode.value) {
    if (verification.phone !== task.expectedPhone) {
      stepError.value = '手机号与本次授权任务预留号码不一致'
      return
    }
    sendingCode.value = true
    await wait(450)
    sendingCode.value = false
    startCountdown()
    return
  }
  sendingCode.value = true
  try {
    await sendCandidateCode(task.token, verification.phone)
    startCountdown()
  } catch (e) {
    stepError.value = errorMessage(e, '验证码发送失败，请稍后重试')
  } finally {
    sendingCode.value = false
  }
}

async function verifyPhone() {
  stepError.value = ''
  if (!/^1\d{10}$/.test(verification.phone)) {
    stepError.value = '请输入正确的11位手机号码'
    return
  }
  if (!/^\d{6}$/.test(verification.code)) {
    stepError.value = '请输入6位短信验证码'
    return
  }
  if (demoMode.value) {
    if (verification.phone !== task.expectedPhone) {
      stepError.value = '手机号与本次授权任务预留号码不一致'
      return
    }
    if (verification.code !== '123456') {
      stepError.value = '演示验证码为 123456'
      return
    }
    verifying.value = true
    await wait(450)
    verifying.value = false
    goToStep(1)
    return
  }
  verifying.value = true
  try {
    const res = await verifyCandidateCode(task.token, {
      phone: verification.phone,
      code: verification.code
    })
    const data = res.data || {}
    ticket.value = String(data.ticket || '')
    if (data.candidateName) formModel.candidate.name = String(data.candidateName)
    formModel.candidate.phone = verification.phone
    if (Array.isArray(data.modules)) {
      task.modules = data.modules.filter(key => moduleDefinitions[key])
      syncEmploymentSegments()
    }
    if (data.draft) await restoreDraft(data.draft, data.draftUpdatedAt)
    const resumeStep = stepForStatus[data.status]
    goToStep(resumeStep === undefined ? 1 : resumeStep)
  } catch (e) {
    stepError.value = errorMessage(e, '验证失败，请稍后重试')
  } finally {
    verifying.value = false
  }
}

async function confirmConsent() {
  stepError.value = ''
  if (demoMode.value) {
    goToStep(2)
    return
  }
  try {
    const res = await consentCandidate(task.token, ticket.value)
    if (res?.data?.draft) await restoreDraft(res.data.draft, res.data.draftUpdatedAt)
    // 身份证号始终需候选人在填写步骤录入并核验，无论是否配置了其它模块
    goToStep(2)
  } catch (e) {
    stepError.value = errorMessage(e, '操作失败，请稍后重试')
  }
}

function reviewForm() {
  stepError.value = validateForm()
  if (stepError.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  goToStep(3)
}

function validateForm() {
  if (!formModel.candidate.idCard) return '请填写身份证号'
  formModel.candidate.idCard = formModel.candidate.idCard.replace(/x/g, 'X')
  if (!/^\d{17}[\dX]$/.test(formModel.candidate.idCard)) return '身份证号格式不正确'

  if (task.modules.includes(MODULE_KEYS.EDUCATION)) {
    if (formModel.educations.length > MAX_EDUCATION_ITEMS) {
      return `每份订单最多填写 ${MAX_EDUCATION_ITEMS} 个学历证书编号`
    }
    // 既没填编号又没勾「暂时无法提供」，说明用户还没表态，不能静默放过——
    // 这正是原先「选填」两个字造成的模糊地带
    const undecided = formModel.educations.some(item => !item.credentialNo.trim() && !item.noCredential)
    if (undecided) return '请填写学历证书编号，或勾选「暂时无法提供该证书编号」'

    const credentialNumbers = formModel.educations
      .map(item => item.credentialNo.trim().toUpperCase())
      .filter(Boolean)
    if (new Set(credentialNumbers).size !== credentialNumbers.length) return '学历证书编号不能重复'
  }

  const requiredEmploymentCount = employmentSegmentCount(task.modules)
  if (requiredEmploymentCount > 0) {
    if (formModel.employments.length !== requiredEmploymentCount) {
      return `本套餐要求填写${requiredEmploymentCount}段工作经历`
    }
    for (let index = 0; index < formModel.employments.length; index += 1) {
      const item = formModel.employments[index]
      const prefix = `第${index + 1}段工作经历`
      if (!item.companyName) return `${prefix}：请填写工作单位名称`
      if (!item.startMonth) return `${prefix}：请选择入职时间`
      if (!item.isCurrent && !item.endMonth) return `${prefix}：请选择离职时间`
      if (!item.employmentType) return `${prefix}：请选择供职方式`
      if (!item.positionName) return `${prefix}：请填写职位名称`
      if (!item.salaryRange) return `${prefix}：请选择薪酬范围`
      if (item.isCurrent && !item.leaveReason) item.leaveReason = '在职'
      if (!item.leaveReason) return `${prefix}：请填写离职原因`
      if (!item.hrReference?.contactName) return `${prefix}：请填写HR姓名`
      if (!item.hrReference?.contactPhone) return `${prefix}：请填写HR联系方式`
      if (!item.supervisorReference?.contactName) return `${prefix}：请填写直属上级姓名`
      if (!item.supervisorReference?.contactRole) return `${prefix}：请填写直属上级职位`
      if (!item.supervisorReference?.contactPhone) return `${prefix}：请填写直属上级联系方式`
      if (!/^[0-9()\-\s]{7,20}$/.test(item.hrReference.contactPhone)) {
        return `${prefix}：HR联系方式格式不正确`
      }
      if (!/^[0-9()\-\s]{7,20}$/.test(item.supervisorReference.contactPhone)) {
        return `${prefix}：直属上级联系方式格式不正确`
      }
    }
  }
  return ''
}

async function submitAndSign() {
  stepError.value = ''
  if (demoMode.value) {
    submitting.value = true
    await wait(650)
    submitting.value = false
    if (task.signUrl) {
      window.location.assign(task.signUrl)
      return
    }
    goToStep(4)
    return
  }
  submitting.value = true
  try {
    const res = await submitCandidateForm(task.token, {
      ticket: ticket.value,
      form: buildFormPayload()
    })
    const signUrl = res.data && res.data.signUrl
    if (signUrl) {
      window.location.assign(signUrl)
      return
    }
    stepError.value = '未获取到签署链接，请稍后重试'
  } catch (e) {
    stepError.value = errorMessage(e, '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function buildFormPayload() {
  return {
    candidate: {
      idCard: formModel.candidate.idCard,
      email: formModel.candidate.email
    },
    educations: task.modules.includes(MODULE_KEYS.EDUCATION)
      ? formModel.educations.map(item => ({ credentialNo: item.credentialNo, noCredential: !!item.noCredential }))
      : [],
    employments: employmentSegmentCount(task.modules) > 0
      ? formModel.employments.map(item => ({
          companyName: item.companyName,
          startMonth: item.startMonth,
          endMonth: item.endMonth,
          isCurrent: !!item.isCurrent,
          employmentType: item.employmentType,
          positionName: item.positionName,
          salaryRange: item.salaryRange,
          leaveReason: item.leaveReason,
          hrReference: {
            contactName: item.hrReference.contactName,
            contactRole: 'HR',
            contactPhone: item.hrReference.contactPhone
          },
          supervisorReference: {
            contactName: item.supervisorReference.contactName,
            contactRole: item.supervisorReference.contactRole,
            contactPhone: item.supervisorReference.contactPhone
          }
        }))
      : []
  }
}

function scheduleDraftSave() {
  if (demoMode.value || restoringDraft || !ticket.value || currentStep.value < 2 || currentStep.value > 3) return
  window.clearTimeout(draftSaveTimer)
  draftSaveStatus.value = 'idle'
  draftSaveTimer = window.setTimeout(flushDraftSave, 900)
}

async function flushDraftSave() {
  window.clearTimeout(draftSaveTimer)
  draftSaveTimer = null
  if (demoMode.value || !ticket.value || currentStep.value < 2 || currentStep.value > 3) return
  if (draftSaveInFlight) {
    draftSaveQueued = true
    return
  }

  draftSaveInFlight = true
  draftSaveStatus.value = 'saving'
  draftSaveError.value = ''
  try {
    const res = await saveCandidateDraft(task.token, {
      ticket: ticket.value,
      form: buildFormPayload()
    })
    const savedAt = res?.data?.savedAt ? new Date(res.data.savedAt) : new Date()
    draftSavedAt.value = Number.isNaN(savedAt.getTime())
      ? ''
      : savedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    draftSaveStatus.value = 'saved'
  } catch (error) {
    draftSaveStatus.value = 'error'
    draftSaveError.value = errorMessage(error, '自动保存失败，请检查网络后重试')
  } finally {
    draftSaveInFlight = false
    if (draftSaveQueued) {
      draftSaveQueued = false
      draftSaveTimer = window.setTimeout(flushDraftSave, 120)
    }
  }
}

async function restoreDraft(draft, updatedAt) {
  if (!draft || typeof draft !== 'object') return
  restoringDraft = true
  const candidate = draft.candidate || {}
  formModel.candidate.idCard = String(candidate.idCard || '')
  formModel.candidate.email = String(candidate.email || '')

  if (task.modules.includes(MODULE_KEYS.EDUCATION) && Array.isArray(draft.educations) && draft.educations.length) {
    formModel.educations.splice(0, formModel.educations.length, ...draft.educations
      .slice(0, MAX_EDUCATION_ITEMS)
      .map(item => ({
        ...createEducation(),
        credentialNo: String(item?.credentialNo || ''),
        noCredential: !!item?.noCredential
      })))
  }

  syncEmploymentSegments()
  const count = employmentSegmentCount(task.modules)
  if (count > 0 && Array.isArray(draft.employments)) {
    draft.employments.slice(0, count).forEach((item, index) => {
      const base = createEmployment()
      const target = formModel.employments[index]
      if (!target || !item) return
      Object.assign(target, base, item, {
        id: target.id,
        hrReference: { ...base.hrReference, ...(item.hrReference || {}) },
        supervisorReference: { ...base.supervisorReference, ...(item.supervisorReference || {}) }
      })
    })
  }

  await nextTick()
  restoringDraft = false
  draftSaveStatus.value = 'restored'
  if (updatedAt) {
    const date = new Date(updatedAt)
    if (!Number.isNaN(date.getTime())) {
      draftSavedAt.value = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
  }
}

function saveDraftWhenHidden() {
  if (document.visibilityState === 'hidden' && draftSaveTimer !== null) flushDraftSave()
}

watch(formModel, scheduleDraftSave, { deep: true })

function syncEmploymentSegments() {
  const count = employmentSegmentCount(task.modules)
  while (formModel.employments.length < count) formModel.employments.push(createEmployment())
  if (formModel.employments.length > count) formModel.employments.splice(count)
}

function errorMessage(e, fallback) {
  if (e && typeof e.msg === 'string' && e.msg) return e.msg
  if (e && typeof e.message === 'string' && e.message && e.message !== 'Network Error') return e.message
  return fallback
}

function showDocument(type) {
  documentDialog.value = type
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

onBeforeUnmount(() => {
  clearInterval(countdownTimer)
  window.clearTimeout(draftSaveTimer)
  document.removeEventListener('visibilitychange', saveDraftWhenHidden)
})
</script>
