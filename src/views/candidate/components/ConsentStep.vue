<template>
  <section class="candidate-step candidate-consent-step">
    <div class="candidate-page-heading">
      <div>
        <div class="candidate-step-kicker">
          <FileText :size="17" />
          授权声明
        </div>
        <h1>个人信息处理授权</h1>
        <p>请完整阅读本次授权范围、信息使用方式及您享有的权利。</p>
      </div>
      <span class="candidate-verified-badge">
        <BadgeCheck :size="17" />
        本人已核验
      </span>
    </div>

    <div class="candidate-consent-document">
      <p>
        本人自愿、明确同意并授权应聘公司 <strong>{{ companyName }}</strong>
        及其委托的背景调查服务机构 <strong>{{ SERVICE_PROVIDER }}</strong>
        及为完成本次核验所必需的合作方，基于职业背景调查之目的，收集、使用并核实本人的下列信息。
      </p>

      <h2>一、授权内容</h2>
      <ol>
        <li>
          本人在本页面填写并提交的全部内容，包括身份信息：<strong>姓名、身份证号码、手机号码</strong>。
          <em class="candidate-consent-note">
            其中身份证号码属于敏感个人信息，仅用于核实本人身份真实性及完成下列核验事项，不作其他用途。
          </em>
        </li>
        <li>
          基于雇佣公司及应聘岗位所需，对下列事项进行查询与核实
          （包括但不限于当前正在、历史及即将发生的相关情况）：
          <ul class="candidate-consent-scope">
            <li><strong>身份核验</strong>：姓名、身份证号码、手机号码的实名一致性。</li>
            <li><strong>教育背景</strong>：学历、学位及学历证书编号的真实性。</li>
            <li><strong>职业履历</strong>：任职单位、任职起止时间、职位、薪酬范围、离职原因，以及社会保险缴纳单位记录。</li>
            <li><strong>工作表现访谈</strong>：向本人提供的证明人核实任职情况与工作表现。</li>
            <li><strong>司法与诉讼信息</strong>：涉诉记录、失信被执行、限制高消费等依法公开的司法信息。</li>
            <li><strong>商业关联信息</strong>：对外投资、企业任职等依法公开的工商关联信息。</li>
            <li><strong>金融风险信息</strong>：借贷意向等信用风险相关信息。</li>
            <li><strong>专项合规核验</strong>：涉赌涉诈等风险名单核验。</li>
            <li><strong>其他背景信息</strong>：婚姻状况、名下车辆等与岗位适配性相关的信息。</li>
          </ul>
          <em class="candidate-consent-note">
            以上为本平台可提供的核验范围；本次实际核验项目以雇佣公司选购的套餐为准，具体以最终出具的《背景调查报告》所载内容为准。
          </em>
        </li>
        <li>
          （如有）雇佣公司基于职业背景调查认为必要核实的其他信息，具体范围详见《隐私政策》。
        </li>
      </ol>

      <h2>二、信息的使用与对外提供</h2>
      <ol>
        <li>核验结果将以《背景调查报告》的形式返回给授权主体，一般为您的应聘公司。</li>
        <li>
          核验过程中，{{ SERVICE_PROVIDER }} 需向数据核验服务方及您填写的证明人，
          提供为完成核验所必需的个人信息，用于实名认证、学历核验、履历核实等。
        </li>
        <li>
          一般情况下不会向信息核实方提供完整身份证号码；若特定核实方的规则要求必须提供完整证件号方可完成核验，
          您同意按其规则提供完成核验所必需的信息。
        </li>
        <li>各信息接收方应采取加密传输、访问控制、操作留痕等措施保护您的个人信息安全。</li>
      </ol>

      <h2>三、保存期限与您的权利</h2>
      <ol>
        <li>您的个人信息仅保存至完成本次背景调查所必需的期间，以及法律法规要求的最短期限，届满后将予以删除或匿名化处理。</li>
        <li>
          您有权查阅、复制、更正、删除您的个人信息，并有权<strong>撤回本授权</strong>。
          撤回授权不影响撤回前基于您的同意已进行的信息处理。
        </li>
        <li>如需行使上述权利或有任何疑问，可通过《隐私政策》载明的方式与我们联系。</li>
      </ol>

      <h2>四、本人确认</h2>
      <ol>
        <li>本授权由本人亲自阅读并作出，本人已充分理解上述条款，尤其是涉及敏感个人信息的内容。</li>
        <li>本人确认所填写的信息真实、准确、完整，并知悉不实信息可能影响核验结果。</li>
        <li>本人已告知相关知情人士如实披露授权事项，并免除其在如实提供信息过程中的相应责任。</li>
        <li>本人理解并同意，在完成电子签署后本授权正式生效。</li>
      </ol>
    </div>

    <label class="candidate-check-row">
      <input
        :checked="accepted"
        type="checkbox"
        @change="$emit('update:accepted', $event.target.checked)"
      />
      <span>
        我已阅读并同意
        <button type="button" @click="$emit('show-agreement')">《背调用户协议》</button>
        和
        <button type="button" @click="$emit('show-privacy')">《隐私政策》</button>
      </span>
    </label>

    <button
      class="candidate-primary-button"
      type="button"
      :disabled="!accepted"
      @click="$emit('continue')"
    >
      同意授权，填写个人信息
      <ArrowRight :size="18" />
    </button>
  </section>
</template>

<script setup>
import { ArrowRight, BadgeCheck, FileText } from '@lucide/vue'

// 背调服务机构主体名称，须与营业执照一致
const SERVICE_PROVIDER = '河南钟馗科技有限公司'

defineProps({
  accepted: { type: Boolean, default: false },
  companyName: { type: String, default: '本次调查发起企业' }
})

defineEmits(['update:accepted', 'continue', 'show-agreement', 'show-privacy'])
</script>
