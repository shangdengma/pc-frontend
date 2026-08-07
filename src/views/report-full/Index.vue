<template>
	
  <div class="page_canvas" ref="pdfRoot" :class="{ 'exporting-capturing': exporting }">

    <!-- 顶部返回按钮移除，改为底部固定按钮 -->
<div ref="pdfdom" class="module-container">
    <!-- 报告头部：Logo + 标题 + 元信息 -->
    <div class="report-header">
      <div class="report-brand">
        <div class="report-logo">
          <i class="fas fa-shield-alt"></i>
          <span class="logo-text">钟馗背调</span>
        </div>
      </div>
      <h1 class="report-title">{{ reportTitle }}</h1>
      <div class="report-meta">
        <div class="meta-row">
          <span class="meta-label">报告编号</span>
          <span class="meta-value">{{ reportNo || '--' }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">查询时间</span>
          <span class="meta-value">{{ queryTime || '--' }}</span>
        </div>
      </div>
    </div>

    <!-- 总述只聚合本报告已经返回或套餐明确配置的项目，不替代各模块原始明细。 -->
    <div class="module-container report-overview-module" id="overview" v-if="overviewSummaryRows.length">
      <div class="module-title">报告总述</div>
      <div class="overview-body">
        <div class="overview-headline">
          <div>
            <p class="overview-eyebrow">REPORT OVERVIEW</p>
            <h2>本次核验概况</h2>
            <p>先查看需关注事项，再结合下方各模块明细进行复核。</p>
          </div>
          <div class="overview-metrics" aria-label="报告核验概况">
            <div class="overview-metric">
              <strong>{{ overviewSummaryRows.length }}</strong>
              <span>核验项目</span>
            </div>
            <div class="overview-metric overview-metric--complete">
              <strong>{{ overviewCompletedCount }}</strong>
              <span>已完成</span>
            </div>
            <div class="overview-metric" :class="{ 'overview-metric--attention': overviewRiskTips.length }">
              <strong>{{ overviewRiskTips.length }}</strong>
              <span>需关注</span>
            </div>
          </div>
        </div>

        <section class="overview-section overview-risk-section">
          <div class="overview-section-header">
            <div>
              <div class="overview-section-heading">风险提示</div>
              <p>仅呈现已返回结果中的命中、异常或需人工复核事项。</p>
            </div>
            <span v-if="overviewRiskTips.length" class="overview-count">{{ overviewRiskTips.length }} 项</span>
          </div>

          <ol v-if="overviewRiskTips.length" class="overview-risk-list">
            <li v-for="(item, index) in overviewRiskTips" :key="item.key" :class="`is-${item.level}`">
              <span class="overview-risk-index">{{ index + 1 }}</span>
              <div class="overview-risk-content">
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
              </div>
            </li>
          </ol>
          <div v-else class="overview-empty-state">
            <span class="overview-empty-mark">✓</span>
            <div>
              <strong>已返回项目暂未发现明确命中项</strong>
              <p>该结果不代表对候选人作出无风险结论，仍应结合岗位要求和各模块明细审慎判断。</p>
            </div>
          </div>

          <div v-if="overviewPendingRows.length" class="overview-pending-note">
            <strong>信息待补充</strong>
            <span>{{ overviewPendingRows.map(item => item.project).join('、') }}尚未完整返回，不计入风险结论。</span>
          </div>
        </section>

        <section class="overview-section overview-project-section">
          <div class="overview-section-header">
            <div>
              <div class="overview-section-heading">项目摘要</div>
              <p>汇总本次调查范围、处理进度和关键结果。</p>
            </div>
          </div>

          <div class="overview-table-wrap">
            <table class="overview-table">
              <thead>
                <tr>
                  <th>调查类型</th>
                  <th>调查项目</th>
                  <th>是否完成</th>
                  <th>调查结果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in overviewSummaryRows" :key="item.key">
                  <td data-label="调查类型">{{ item.category }}</td>
                  <td data-label="调查项目">{{ item.project }}</td>
                  <td data-label="是否完成">
                    <span class="overview-status" :class="`is-${item.statusTone}`">
                      <span class="overview-status-dot"></span>{{ item.status }}
                    </span>
                  </td>
                  <td data-label="调查结果">
                    <span class="overview-result" :class="`is-${item.resultTone}`">{{ item.result }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <p class="overview-disclaimer">总述依据本报告已返回数据自动归纳，仅用于提示复核重点，不应作为录用、淘汰或其他决定的唯一依据。</p>
      </div>
    </div>

    <!-- 身份信息核验模块 -->
    <div class="module-container" id="identity" v-if="hasIdentityData">
      <div class="module-title">身份信息核验</div>
      <div class="report-card">
        <div class="card-body">
          <div class="profile-section">
            <div class="avatar-wrapper">
              <div class="avatar">
                <i class="fas fa-user"></i>
              </div>
            </div>
            <div class="profile-name">{{this.name}}</div>

            <div class="badge-group">
              <div class="trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                扫脸核验身份
              </div>
              <div class="trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                签署授权书
              </div>
            </div>
      
            <div class="profile-tags">
              <span class="tag">{{ (genderData && genderData.value) || '-' }}</span>
              <span class="tag">{{ (ageData && ageData.value) ? ageData.value + '岁' : '-' }}</span>
              <span class="tag">{{ marriageStatus || '-' }}</span>
            </div>
          </div>
      
          <div class="data-section">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-icon"><i class="fas fa-sim-card"></i></div>
                <div class="info-content">
                  <span class="info-label">手机号码</span>
                  <div class="info-value-wrapper">
                    <span class="info-value">{{ displayMobile }}</span>
                    <span class="status-dot"></span><span class="status-text">{{ phoneStatusText }}</span>
                  </div>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon"><i class="fas fa-id-card"></i></div>
                <div class="info-content">
                  <span class="info-label">身份证号码</span>
                  <span class="info-value">{{ displayIdNumber }}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon"><i class="fas fa-globe"></i></div>
                <div class="info-content">
                  <span class="info-label">手机号归属地</span>
                  <span class="info-value">
                    {{ comprehensiveScoress("shouji_province") || "" }}{{ comprehensiveScoress("shouji_city") ? '-' + comprehensiveScoress("shouji_city") : '' }}
                  </span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon"><i class="fas fa-city"></i></div>
                <div class="info-content">
                  <span class="info-label">身份证归属地</span>
                  <span class="info-value">{{ (addressData && addressData.value) || '-' }}</span>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-icon"><i class="fas fa-wifi"></i></div>
                <div class="info-content">
                  <span class="info-label">手机号使用时长</span>
                  <span class="info-value">{{ comprehensiveScoress("zaiwangf_msg") || comprehensiveScoress("zaiwang_inTime") || '24个月以上' }}</span>
                </div>
              </div>
			  <div class="info-item">
			    <div class="info-icon"><i class="fas fa-heart"></i></div>
			    <div class="info-content">
			      <span class="info-label">婚姻情况</span>
			      <span class="info-value">{{ marriageStatusDisplay }}</span>
			    </div>
			  </div>
            </div>
          </div>
        </div>
      
        <div class="card-footer">
          <i>i</i> <span>备注：婚姻情况有一定延迟，最近刚进行的登记可能未联网收录</span>
        </div>
      </div>
     
    </div>

    <!-- 学历证书核验：仅渲染后端标准结构 -->
    <div class="module-container" id="education" v-if="hasEducationData">
      <div class="module-title">学历证书核验</div>

      <div class="education-list">
        <div
          class="education-record"
          v-for="(edu, index) in educationData"
          :key="`education-${edu.sequence || index + 1}-${edu.certificateNo || 'empty'}`"
        >
          <div class="education-record-header">
            <div class="education-record-icon">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="education-record-title-wrap">
              <span class="education-record-badge">学历记录 {{ edu.sequence || index + 1 }}</span>
              <span class="education-certificate-no">
                证书编号：{{ edu.certificateNo || '候选人未提供' }}
              </span>
            </div>
            <span class="education-status" :class="`education-status--${edu.statusClass}`">
              {{ edu.statusLabel }}
            </span>
          </div>

          <div
            v-if="edu.queryStatus !== 'MATCHED'"
            class="education-result-message"
            :class="`education-result-message--${edu.statusClass}`"
          >
            {{ edu.message }}
          </div>

          <div v-else class="education-info-grid">
            <div class="education-info-item">
              <span class="label">院校名称</span>
              <span class="value">{{ edu.school || '-' }}</span>
            </div>
            <div class="education-info-item">
              <span class="label">专业名称</span>
              <span class="value">{{ edu.major || '-' }}</span>
            </div>
            <div class="education-info-item">
              <span class="label">学历层次</span>
              <span class="value">{{ edu.educationLevel || '-' }}</span>
            </div>
            <div class="education-info-item">
              <span class="label">入学日期</span>
              <span class="value">{{ edu.enrollmentDate || '-' }}</span>
            </div>
            <div class="education-info-item">
              <span class="label">毕业日期</span>
              <span class="value">{{ edu.graduationDate || '-' }}</span>
            </div>
            <div class="education-info-item">
              <span class="label">学习形式</span>
              <span class="value">{{ edu.learningForm || '-' }}</span>
            </div>
            <div class="education-info-item">
              <span class="label">学制</span>
              <span class="value">{{ edu.duration || '-' }}</span>
            </div>
            <div class="education-info-item">
              <span class="label">学籍状态</span>
              <span class="value">{{ edu.studyStatus || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- 职业风险审查（近五年）模块 -->
    <div class="module-container" id="career-risk" v-if="hasCareerRiskData">
      <div class="module-title">职业履职风险（近五年）</div>
      <div class="career-risk-grid">
        <div class="career-card">
          <div class="career-card-header">
            <span class="icon"><i class="fas fa-balance-scale"></i></span>
            <span class="title">司法与信用风险</span>
          </div>
          <div class="career-card-body">
            <div class="career-row">
              <span class="label">失信被执行人</span>
              <span class="status-chip" :class="getCareerRiskStatusClass(getCareerRiskValue('ty_dishonesty'))">{{ getCareerRiskStatus(getCareerRiskValue('ty_dishonesty')) }}</span>
            </div>
            <div class="career-row">
              <span class="label">限制高消费</span>
              <span class="status-chip" :class="getCareerRiskStatusClass(getCareerRiskValue('ty_high_consumption'))">{{ getCareerRiskStatus(getCareerRiskValue('ty_high_consumption')) }}</span>
            </div>
			<div class="career-row">
			  <span class="label">被发送仲裁、调解、涉诉通知函</span>
			  <span class="status-chip" :class="getCareerRiskStatusClass(getCareerRiskValue('ty_notice_letter'))">{{ getCareerRiskStatus(getCareerRiskValue('ty_notice_letter')) }}</span>
			</div>
          </div>
        </div>

        <div class="career-card">
          <div class="career-card-header">
            <span class="icon"><i class="fas fa-user-tie"></i></span>
            <span class="title">人事争议风险（近五年）</span>
          </div>
          <div class="career-card-body">
            <div class="career-row">
              <span class="label">聘用合同争议</span>
              <span class="status-chip" :class="getCareerRiskStatusClass(getCareerRiskValue('ty_employment_contract_5y'))">{{ getCareerRiskStatus(getCareerRiskValue('ty_employment_contract_5y')) }}</span>
            </div>
            <div class="career-row">
              <span class="label">辞职争议</span>
              <span class="status-chip" :class="getCareerRiskStatusClass(getCareerRiskValue('ty_resignation_dispute_5y'))">{{ getCareerRiskStatus(getCareerRiskValue('ty_resignation_dispute_5y')) }}</span>
            </div>
            <div class="career-row">
              <span class="label">人事争议（综合）</span>
              <span class="status-chip" :class="getCareerRiskStatusClass(getCareerRiskValue('ty_personnel_dispute'))">{{ getCareerRiskStatus(getCareerRiskValue('ty_personnel_dispute')) }}</span>
            </div>
          </div>
        </div>

        <div class="career-card">
          <div class="career-card-header">
            <span class="icon"><i class="fas fa-briefcase"></i></span>
            <span class="title">劳动争议风险（近五年）</span>
          </div>
          <div class="career-card-body">
            <div class="career-row" v-for="item in laborRiskItems" :key="item.key">
              <span class="label">{{ item.label }}</span>
              <span class="status-chip" :class="getCareerRiskStatusClass(getCareerRiskValue(item.key))">{{ getCareerRiskStatus(getCareerRiskValue(item.key)) }}</span>
            </div>
          </div>
        </div>

        <div class="career-card">
          <div class="career-card-header">
            <span class="icon"><i class="fas fa-shield-alt"></i></span>
            <span class="title">社保待遇纠纷（近五年）</span>
          </div>
          <div class="career-card-body">
            <div class="career-row" v-for="item in socialRiskItems" :key="item.key">
              <span class="label">{{ item.label }}</span>
              <span class="status-chip" :class="getCareerRiskStatusClass(getCareerRiskValue(item.key))">{{ getCareerRiskStatus(getCareerRiskValue(item.key)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- 车辆与ETC信息模块 -->
    <div class="module-container" id="assets" v-if="hasVehicleCount || hasEtcFieldFromBackend">
      <div class="module-title">机动车与 ETC 信息</div>

      <div class="assets-wrapper">
        <!-- 上半部分：名下登记车辆总览 -->
        <div class="assets-summary-card">
          <div class="assets-summary-header">
            <span class="summary-title">名下所有车辆数量</span>
            <span class="summary-tip"></span>
          </div>
          <div class="summary-body">
            <span class="summary-count">{{ getCarNum() }}</span>
            <span class="summary-unit">辆</span>
          </div>
          <div class="summary-note">
            基于车管所登记数据，数值 0-9 对应实际辆数，10 表示 10 辆及以上。
          </div>
        </div>

        <!-- 下半部分：ETC 关联车辆表格 -->
        <div class="assets-etc-card" v-if="hasEtcFieldFromBackend">
          <div class="assets-etc-header">
            <div class="etc-title-row">
              <span class="etc-title">关联ETC车辆（疑似实控车辆）</span>
              <span class="etc-subtitle">（ETC 绑定其信息车辆均显示）</span>
            </div>
          </div>

          <div
            v-if="hasEtcData"
            class="asset-detail-table"
          >
            <table>
              <thead>
                <tr>
                  <th>车牌号码</th>
                  <th>车牌颜色</th>
                  <th>车辆类型</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(vehicle, index) in vehicleList" :key="index">
                  <td>{{ getFieldFromVehicle(vehicle, 'plateNum') }}</td>
                  <td>{{ getFieldFromVehicle(vehicle, 'plateColor') }}</td>
                  <td>{{ getFieldFromVehicle(vehicle, 'vehicleType') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="asset-empty">
            暂未查询到 ETC 关联车辆记录。
          </div>
        </div>
      </div>
    </div>

    <!-- 公安重点人员核验模块 -->
    <div class="module-container" id="police" v-if="hasPoliceData">
      <div class="module-title">不良人员核查</div>
      <div class="personnel-check-grid">
        <div class="check-card">
          <div>
            <div class="icon"><i class="fas fa-gavel"></i></div>
            <div class="title">前科</div>
            <div class="description">有刑事犯罪前科记录（包含缓刑）</div>
          </div>
          <div class="status" :class="getStatusColor(getBadPersonTextA(policeBadLevel, 'A'))">
            {{ getBadPersonTextA(policeBadLevel, 'A') }}</div>
        </div>
        <div class="check-card">
          <div>
            <div class="icon"><i class="fas fa-biohazard"></i></div>
            <div class="title">经济类前科</div>
            <div class="description">破坏金融秩序、非法吸存、违发贷款、金融诈骗、集资诈骗、保险诈骗、假币..在刑或前科等。</div>
          </div>
          <div class="status" :class="getStatusColor(getBadPersonTextA(policeBadLevel, 'B'))">
            {{ getBadPersonTextA(policeBadLevel, 'B') }}</div>
        </div>
        <div class="check-card">
          <div>
            <div class="icon"><i class="fas fa-syringe"></i></div>
            <div class="title">妨害社会管理秩序</div>
            <div class="description">扰乱社会公共秩序、妨害司法、妨害国境管理、妨害文物管理、涉毒、涉黄....在刑或前科等。</div>
          </div>
          <div class="status" :class="getStatusColor(getBadPersonTextA(policeBadLevel, 'C'))">
            {{ getBadPersonTextA(policeBadLevel, 'C') }}</div>
        </div>
        <div class="check-card">
          <div>
            <div class="icon"><i class="fas fa-running"></i></div>
            <div class="title">在逃</div>
            <div class="description">公安机关通缉的在逃犯罪嫌疑人。</div>
          </div>
          <div class="status" :class="getStatusColor(getBadPersonTextA(policeBadLevel, 'D'))">
            {{ getBadPersonTextA(policeBadLevel, 'D') }}</div>
        </div>
        <div class="check-card">
          <div>
            <div class="icon"><i class="fas fa-balance-scale"></i></div>
            <div class="title">涉案</div>
            <div class="description">与当前正在调查中的案件有关联​（包含证人或其他需要配合调查的身份）。</div>
          </div>
          <div class="status" :class="getStatusColor(getBadPersonTextA(policeBadLevel, 'E'))">
            {{ getBadPersonTextA(policeBadLevel, 'E') }}</div>
        </div>
        <div class="check-card">
          <div>
            <div class="icon"><i class="fas fa-car-crash"></i></div>
            <div class="title">涉交通刑案</div>
            <div class="description">涉及严重的交通违法犯罪记录​（如醉驾、肇事逃逸）。</div>
          </div>
          <div class="status" :class="getStatusColor(getBadPersonTextA(policeBadLevel, 'G'))">
            {{ getBadPersonTextA(policeBadLevel, 'G') }}</div>
        </div>
        <div class="check-card">
          <div>
            <div class="icon"><i class="fas fa-bullseye"></i></div>
            <div class="title">重点</div>
            <div class="description">国家重点管控、关注的人员类型​（可能涉及维稳、安全、境外敏感背景等领域）</div>
          </div>
          <div class="status" :class="getStatusColor(getBadPersonTextA(policeBadLevel, 'F'))">
            {{ getBadPersonTextA(policeBadLevel, 'F') }}</div>
        </div>
        <div class="check-card">
          <div>
            <div class="icon"><i class="fas fa-file-signature"></i></div>
            <div class="title">诉讼当事人</div>
            <div class="description">涉及法院诉讼程序的相关当事人（如原告、被告等）。</div>
          </div>
          <div class="status" :class="getStatusColor(getLitigationPartyStatus())">
            {{ getLitigationPartyStatus() }}</div>
        </div>
      </div>
      <div class="hit-details-section">
        <div class="hit-details-title">
          <div class="hit-icon-badge">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <div class="hit-title-text">
            <div class="main">详细命中信息</div>
            <div class="sub">展示公安重点人员相关的实际命中类别说明</div>
          </div>
        </div>
        <div class="hit-details-list">
          <div class="hit-item">
            <span class="hit-item-label">具体类型</span>
            <span class="hit-item-value">{{ BadPersonnel() + normalbadtext() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 涉赌涉诈核验模块 -->
    <div class="module-container" id="fraud" v-if="hasFraudData">
      <div class="module-title">涉赌涉诈风险核查</div>
      <div class="fraud-check-grid">
        <div class="fraud-card">
          <div class="icon"><i class="fas fa-random"></i></div>
          <div class="fraud-card-content">
            <div class="fraud-card-text">
              <div class="title">疑似跑分风险</div>
              <div class="description">该用户疑似与跑分洗钱资金相关联。</div>
            </div>
            <div class="status" :class="getfandufanzhaColorClass(getfanzhafuduA(comprehensiveScoress('moneyLaundering')))">{{ getfanzhafuduA(comprehensiveScoress('moneyLaundering')) }}
            </div>
          </div>
        </div>
        <div class="fraud-card">
          <div class="icon"><i class="fas fa-user-secret"></i></div>
          <div class="fraud-card-content">
            <div class="fraud-card-text">
              <div class="title">疑似欺诈风险</div>
              <div class="description">该用户疑似涉及欺诈行为，交易模式存在异常。</div>
            </div>
            <div class="status" :class="getfandufanzhaColorClass(getfanzhafuduA(comprehensiveScoress('deceiver')))">{{ getfanzhafuduA(comprehensiveScoress('deceiver')) }}
            </div>
          </div>
        </div>
        <div class="fraud-card">
          <div class="icon"><i class="fas fa-dice"></i></div>
          <div class="fraud-card-content">
            <div class="fraud-card-text">
              <div class="title">疑似赌博玩家风险</div>
              <div class="description">该用户疑似参与网络赌博活动，与网赌相关平台或资金有关联。</div>
            </div>
            <div class="status" :class="getfandufanzhaColorClass(getfanzhafuduA(comprehensiveScoress('gamblerPlayer')))">{{ getfanzhafuduA(comprehensiveScoress('gamblerPlayer')) }}
            </div>
          </div>
        </div>
        <div class="fraud-card">
          <div class="icon"><i class="fas fa-chess-king"></i></div>
          <div class="fraud-card-content">
            <div class="fraud-card-text">
              <div class="title">疑似赌博庄家风险</div>
              <div class="description">该用户疑似充当赌博庄家，资金结算存在违法风险。</div>
            </div>
            <div class="status" :class="getfandufanzhaColorClass(getfanzhafuduA(comprehensiveScoress('gamblerBanker')))">{{ getfanzhafuduA(comprehensiveScoress('gamblerBanker')) }}
            </div>
          </div>
        </div>
      </div>
      <div class="risk-level-explanation">
        <div class="explanation-title">
          <i class="fas fa-info-circle"></i>
          <span>风险等级说明</span>
        </div>
        <div class="explanation-content">
          <div class="risk-item">
            <div class="risk-label low-risk">较低风险：</div>
            <div class="risk-desc">
              近三个月有参与疑似涉赌涉诈中风险交易，或历史有参与涉赌诈高风险交易，近期未参与涉赌诈等交易的账号。
              同时包含其他整体风险水平较低的交易行为。
            </div>
          </div>
          <div class="risk-item">
            <div class="risk-label low-risk-alt">低风险：</div>
            <div class="risk-desc">
              近三个月有参与疑似涉赌涉诈高风险交易，近期未参与涉赌诈等交易的账号，
              整体风险偏低、但仍需关注交易行为。
            </div>
          </div>
          <div class="risk-item">
            <div class="risk-label mid-risk">中风险：</div>
            <div class="risk-desc">
              近三个月有与赌博庄家、欺诈收款等账户发生关联交易，或疑似具备团伙性质的账户；
              也包括被第三方支付投诉举报、疑似为涉诈或涉赌收款账户，以及其他中等及以上风险水平的交易行为。需较谨慎交易。
            </div>
          </div>
          <div class="risk-item">
            <div class="risk-label high-risk">高风险(需谨慎交易)：</div>
            <div class="risk-desc">
              近三个月内曾因涉赌、涉诈等高危风险交易被处罚，或近期被风控系统、四方巡检稽核为高风险收款账户，
              同时包含被第三方支付正式定性为涉诈账户，且近期仍存在高危收款行为等严重风险情形。
            </div>
          </div>
        </div>
      </div>
    </div>

<!-- 互联网行为推测模块 -->
                        <div class="module-container" id="internet-behavior" v-if="hasInternetBehaviorData">
                            <div class="module-title">互联网行为分析</div>
                            <div class="internet-behavior-grid">
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-file-contract"></i></div>
                                        <div class="title">资料包装中介</div>
                                        <div class="description">表明用户可能通过中介包装个人信息资料</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_zlbz')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_zlbz'))}}
                                    </div>
                                </div>
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-industry"></i></div>
                                        <div class="title">异常行业</div>
                                        <div class="description">用户从事或关联风险较高行业</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_ychy')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_ychy'))}}
                                    </div>
                                </div>
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-user-edit"></i></div>
                                        <div class="title">虚假资料</div>
                                        <div class="description">用户提供的信息存在虚假嫌疑</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_xjzl')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_xjzl'))}}
                                    </div>
                                </div>
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-shekel-sign"></i></div>
                                        <div class="title">羊毛党</div>
                                        <div class="description">用户有薅羊毛、套利等行为特征</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_ymd')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_ymd'))}}
                                    </div>
                                </div>
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-id-card"></i></div>
                                        <div class="title">身份信息存疑</div>
                                        <div class="description">用户身份信息存在不一致或可疑</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_sfcy')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_sfcy'))}}
                                    </div>
                                </div>
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-exclamation-triangle"></i></div>
                                        <div class="title">严重异常行为</div>
                                        <div class="description">用户行为模式存在严重异常</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_ycxw')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_ycxw'))}}
                                    </div>
                                </div>
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-gavel"></i></div>
                                        <div class="title">失信行为</div>
                                        <div class="description">用户有违约、失信等不良记录</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_sxxw')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_sxxw'))}}
                                    </div>
                                </div>
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-money-check-alt"></i></div>
                                        <div class="title">支付异常行为</div>
                                        <div class="description">用户支付行为模式存在异常</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_zfyc')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_zfyc'))}}
                                    </div>
                                </div>
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-shield-alt"></i></div>
                                        <div class="title">其他异常行为</div>
                                        <div class="description">其他未分类的异常行为模式</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_qtyc')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_qtyc'))}}
                                    </div>
                                </div>
                                <div class="check-card">
                                    <div>
                                        <div class="icon"><i class="fas fa-wifi"></i></div>
                                        <div class="title">上网环境异常</div>
                                        <div class="description">用户上网设备或环境存在风险</div>
                                    </div>
                                    <div class="status":class="getBehaviorStatusColor(getBehaviorText(comprehensiveScoress('sjbq_swhjyc')))">
                                        {{getBehaviorText(comprehensiveScoress('sjbq_swhjyc'))}}
                                    </div>
                                </div>
                            </div>
                        </div>
    <!-- 司法案件模块 -->
    <div class="module-container" id="judicial" v-if="hasJudicialData">
      <div class="module-title">司法涉诉记录</div>
      <div class="judicial-wrapper">
        <div class="judicial-grid">
          <!-- 1. 民事案件卡片：动态绑定 class 和数量 -->
          <div class="judicial-card" :class="{ 'has-case': minshiCases && minshiCases.length > 0 }">

            <!-- v-if 控制图标显示 -->
            <div v-if="minshiCases && minshiCases.length > 0" class="alert-icon">!</div>
            <div class="title">民事案件</div>
            <div class="count">{{ minshiCases ? minshiCases.length : 0 }}</div>
          </div>

          <!-- 2. 刑事案件卡片：暂时保持您原来的静态样式，但可以按同样逻辑修改 -->
          <div class="judicial-card" :class="{ 'has-case': xingshiCases && xingshiCases.length > 0 }">

            <!-- v-if 控制图标显示 -->
            <div v-if="xingshiCases && xingshiCases.length > 0" class="alert-icon">!</div>
            <div class="title">刑事案件</div>
            <div class="count">{{ xingshiCases ? xingshiCases.length : 0 }}</div>
          </div>

          <div class="judicial-card" :class="{ 'has-case': xingzhengCases && xingzhengCases.length > 0 }">

            <!-- v-if 控制图标显示 -->
            <div v-if="xingzhengCases && xingzhengCases.length > 0" class="alert-icon">!</div>
            <div class="title">行政案件</div>
            <div class="count">{{ xingzhengCases ? xingzhengCases.length : 0 }}</div>
          </div>

          <div class="judicial-card" :class="{ 'has-case': baoquanCases && baoquanCases.length > 0 }">

            <!-- v-if 控制图标显示 -->
            <div v-if="baoquanCases && baoquanCases.length > 0" class="alert-icon">!</div>
            <div class="title">财产保全案件</div>
            <div class="count">{{ baoquanCases ? baoquanCases.length : 0 }}</div>
          </div>

          <div class="judicial-card" :class="{ 'has-case': zhixingCases && zhixingCases.length > 0 }">

            <!-- v-if 控制图标显示 -->
            <div v-if="zhixingCases && zhixingCases.length > 0" class="alert-icon">!</div>
            <div class="title">执行案件</div>
            <div class="count">{{ zhixingCases ? zhixingCases.length : 0 }}</div>
          </div>

          <div class="judicial-card" :class="{ 'has-case': bankruptCases && bankruptCases.length > 0 }">

            <!-- v-if 控制图标显示 -->
            <div v-if="bankruptCases && bankruptCases.length > 0" class="alert-icon">!</div>
            <div class="title">强制清算与破产案件</div>
            <div class="count">{{ bankruptCases ? bankruptCases.length : 0 }}</div>
          </div>
        </div>
      </div>
      <div class="case-category">
        <h4 class="case-category-title">民事案件</h4>
        <div v-if="minshiCases && minshiCases.length > 0">
          <details class="detail-container judicial-case-perfect" v-for="(caseItem, index) in minshiCases"
            :key="`minshi-${(caseItem.c_ah && String(caseItem.c_ah)) || index}-${index}`" open>

            <summary>
              <div class="summary-left"><span>{{ caseItem.c_ah }} {{ caseItem.n_ajjzjd }}</span></div>
              <div class="summary-right"></div>
            </summary>

            <div class="case-detail-content">
              <div class="detail-row">
                <div class="detail-field"><span class="label">当事人:</span><span class="value">{{
                  formatParticipantsToString(caseItem.c_dsrxx) }}</span></div>
                <div class="detail-field"><span class="label">审理程序:</span><span class="value">{{ caseItem.n_ajlx || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">立案时间:</span><span class="value">{{ caseItem.d_larq || '--'
                }}</span></div>
                <div class="detail-field"><span class="label">结案时间:</span><span class="value">{{ caseItem.d_jarq || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">立案案由详情:</span><span class="value">{{
                  caseItem.n_jaay || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">结案方式:</span><span class="value">判决</span></div>
                <div class="detail-field"><span class="label">结案标的额金额:</span><span class="value">{{ caseItem.n_jabdje
                  !== '0' ? caseItem.n_jabdje : '-' }}</span></div>
              </div>

              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">经办法院:</span><span class="value">{{
                  caseItem.n_jbfy || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">当事人详情:</span>
                  <span class="value">{{ truncateText(caseItem.c_gkws_dsr, 200) }}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">判决结果:</span>
                  <span class="value">{{ caseItem.c_gkws_pjjg || '--' }}</span>
                </div>
              </div>
            </div>



          </details>
        </div>

        <div class="empty-data-placeholder" v-else>
          <p>未查询到相关司法案件信息。</p>
        </div>


        <h4 class="case-category-title">刑事案件</h4>
        <div v-if="xingshiCases && xingshiCases.length > 0">
          <details class="detail-container judicial-case-perfect" v-for="(caseItem, index) in xingshiCases"
            :key="`xingshi-${(caseItem.c_ah && String(caseItem.c_ah)) || index}-${index}`" open>

            <summary>
              <div class="summary-left"><span>{{ caseItem.c_ah }} {{ caseItem.n_ajjzjd }}</span></div>
              <div class="summary-right"></div>
            </summary>

            <div class="case-detail-content">

              <div class="detail-row">
                <div class="detail-field"><span class="label">诉讼地位:</span><span class="value">{{ caseItem.n_ssdw
                }}</span></div>
                <div class="detail-field"><span class="label">审理程序:</span><span class="value">{{ caseItem.n_ajlx
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">立案时间:</span><span class="value">{{ caseItem.d_larq
                }}</span></div>
                <div class="detail-field"><span class="label">结案时间:</span><span class="value">{{ caseItem.d_jarq
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">定罪罪名:</span><span class="value">{{
                  caseItem.n_dzzm_tree }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">结案方式:</span><span class="value">{{ caseItem.n_jafs || '判决'
                }}</span></div>
                <div class="detail-field"><span class="label">犯罪金额:</span><span class="value">{{ caseItem.n_fzje || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">财产刑执行金额:</span><span class="value">{{ caseItem.n_ccxzxje
                  || '--' }}</span></div>
                <div class="detail-field"><span class="label">判处赔偿金额:</span><span class="value">{{ caseItem.n_pcpcje ||
                  '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">经办法院:</span><span class="value">{{
                  caseItem.n_jbfy || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">当事人详情:</span>
                  <span class="value">{{ caseItem.c_gkws_dsr || '--' }}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">判决结果:</span>
                  <span class="value">{{ caseItem.c_gkws_pjjg || '--' }}</span>
                </div>
              </div>
            </div>



          </details>
        </div>

        <div class="empty-data-placeholder" v-else>
          <p>未查询到相关司法案件信息。</p>
        </div>


        <h4 class="case-category-title">行政案件</h4>
        <div v-if="xingzhengCases && xingzhengCases.length > 0">
          <details class="detail-container judicial-case-perfect" v-for="(caseItem, index) in xingzhengCases"
            :key="`xingzheng-${(caseItem.c_ah && String(caseItem.c_ah)) || index}-${index}`" open>

            <summary>
              <div class="summary-left"><span>{{ caseItem.c_ah }} {{ caseItem.n_ajjzjd }}</span></div>
              <div class="summary-right"></div>
            </summary>

            <div class="case-detail-content">
              <div class="detail-row">
                <div class="detail-field"><span class="label">诉讼地位:</span><span class="value">{{ caseItem.n_ssdw || '--'
                }}</span></div>
                <div class="detail-field"><span class="label">审理程序:</span><span class="value">{{ caseItem.n_ajlx || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">立案时间:</span><span class="value">{{ caseItem.d_larq || '--'
                }}</span></div>
                <div class="detail-field"><span class="label">结案时间:</span><span class="value">{{ caseItem.d_jarq || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">立案案由:</span><span class="value">{{
                  caseItem.n_laay || '--' }}</span></div>
                <div class="detail-field full-width"><span class="label">立案案由详情:</span><span class="value">{{
                  caseItem.n_laay_tree || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">结案方式:</span><span class="value">{{ caseItem.n_jafs || '--'
                }}</span></div>
                <div class="detail-field"><span class="label">结案金额:</span><span class="value">{{ caseItem.n_jabdje ||
                  '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">结案案由:</span><span class="value">{{ caseItem.n_jaay || '--'
                }}</span></div>
                <div class="detail-field"><span class="label">结案案由详细:</span><span class="value">{{ caseItem.n_jaay_tree
                  || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">经办法院:</span><span class="value">{{
                  caseItem.n_jbfy || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">当事人详情:</span>
                  <span class="value">{{ caseItem.c_gkws_dsr || '--' }}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">判决结果:</span>
                  <span class="value">{{ caseItem.c_gkws_pjjg || '--' }}</span>
                </div>
              </div>
            </div>



          </details>
        </div>

        <div class="empty-data-placeholder" v-else>
          <p>未查询到相关司法案件信息。</p>
        </div>


        <h4 class="case-category-title">财产保全案件</h4>

        <div v-if="baoquanCases && baoquanCases.length > 0">
          <details class="detail-container judicial-case-perfect" v-for="(caseItem, index) in baoquanCases"
            :key="`baoquan-${(caseItem.c_ah && String(caseItem.c_ah)) || index}-${index}`" open>

            <summary>
              <div class="summary-left"><span>{{ caseItem.c_ah }} {{ caseItem.n_ajjzjd }}</span></div>
              <div class="summary-right"></div>
            </summary>

            <div class="case-detail-content">
              <div class="detail-row">
                <div class="detail-field"><span class="label">诉讼地位:</span><span class="value">{{ caseItem.n_ssdw || '--'
                }}</span></div>
                <div class="detail-field"><span class="label">审理程序:</span><span class="value">{{ caseItem.n_ajlx || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">立案时间:</span><span class="value">{{ caseItem.d_larq || '--'
                }}</span></div>
                <div class="detail-field"><span class="label">结案时间:</span><span class="value">{{ caseItem.d_jarq || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">申请保全额:</span><span class="value">{{
                  caseItem.n_sqbqse || '--' }}</span></div>
                <div class="detail-field full-width"><span class="label">申请保全标的物:</span><span class="value">{{
                  caseItem.c_sqbqbdw || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">结案方式:</span><span class="value">{{ caseItem.n_jafs || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">结案标的额:</span><span class="value">{{ caseItem.n_jabdje ||
                  '--' }}</span></div>

              </div>
              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">经办法院:</span><span class="value">{{
                  caseItem.n_jbfy || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">当事人详情:</span>
                  <span class="value">{{ caseItem.c_gkws_dsr || '--' }}</span>
                </div>
              </div>
			
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">判决结果:</span>
                  <span class="value">{{ caseItem.c_gkws_pjjg || '--' }}</span>
                </div>
              </div>
            </div>



          </details>
        </div>

        <div class="empty-data-placeholder" v-else>
          <p>未查询到相关司法案件信息。</p>
        </div>


        <h4 class="case-category-title">执行案件</h4>

        <div v-if="zhixingCases && zhixingCases.length > 0">
          <details class="detail-container judicial-case-perfect" v-for="(caseItem, index) in zhixingCases"
            :key="`zhixing-${(caseItem.c_ah && String(caseItem.c_ah)) || index}-${index}`" open>

            <summary>
              <div class="summary-left"><span>{{ caseItem.c_ah }} {{ caseItem.n_ajjzjd }}</span></div>
              <div class="summary-right"></div>
            </summary>

            <div class="case-detail-content">
              <div class="detail-row">
                <div class="detail-field"><span class="label">诉讼地位:</span><span class="value">{{ caseItem.n_ssdw || '--'
                }}</span></div>
                <div class="detail-field"><span class="label">审理程序:</span><span class="value">{{ caseItem.n_ajlx || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">立案时间:</span><span class="value">{{ caseItem.d_larq || '--'
                }}</span></div>
                <div class="detail-field"><span class="label">结案时间:</span><span class="value">{{ caseItem.d_jarq || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">立案案由详情:</span><span class="value">{{
                  caseItem.n_laay || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">结案方式:</span><span class="value">{{ caseItem.n_jafs || '--'
                }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">申请执行金额:</span><span class="value">{{ caseItem.n_sqzxbdje
                  || '--' }}</span></div>
                <div class="detail-field"><span class="label">实际到位金额:</span><span class="value">{{ caseItem.n_sjdwje ||
                  '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width"><span class="label">经办法院:</span><span class="value">{{
                  caseItem.n_jbfy || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">当事人详情:</span>
                  <span class="value">{{ formatParticipantsToString(caseItem.c_dsrxx) }}</span>
                </div>
              </div>
			  <div class="detail-row">
			    <div class="detail-field full-width long-text">
			      <span class="label">补充信息:</span>
			      <span class="value">{{ caseItem.c_gkws_dsr || '--' }}</span>
			    </div>
			  </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">判决结果:</span>
                  <span class="value">{{ caseItem.c_gkws_pjjg || '--' }}</span>
                </div>
              </div>
            </div>



          </details>
        </div>

        <div class="empty-data-placeholder" v-else>
          <p>未查询到相关司法案件信息。</p>
        </div>


        <h4 class="case-category-title">强制清算与破产案件</h4>

        <div v-if="bankruptCases && bankruptCases.length > 0">
          <details class="detail-container judicial-case-perfect" v-for="(caseItem, index) in bankruptCases"
            :key="`bankrupt-${(caseItem.c_ah && String(caseItem.c_ah)) || index}-${index}`" open>

            <summary>
              <div class="summary-left"><span>{{ caseItem.c_ah }} {{ caseItem.n_ajjzjd }}</span></div>
              <div class="summary-right"></div>
            </summary>

            <div class="case-detail-content">
              <div class="detail-row">
                <div class="detail-field"><span class="label">公开文书ID:</span><span class="value">{{ caseItem.c_gkws_id || '--' }}</span></div>
                <div class="detail-field"><span class="label">案件标识:</span><span class="value">{{ caseItem.n_ajbs || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">案件唯一ID:</span><span class="value">{{ caseItem.c_id || '--' }}</span></div>
                <div class="detail-field"><span class="label">案件变更码:</span><span class="value">{{ caseItem.n_crc || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">法院所属层级:</span><span class="value">{{ caseItem.n_jbfy_cj || '--' }}</span></div>
                <div class="detail-field"><span class="label">所属地域:</span><span class="value">{{ caseItem.c_ssdy || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">经办法院:</span><span class="value">{{ caseItem.n_jbfy || '--' }}</span></div>
                <div class="detail-field"><span class="label">相关案件号:</span><span class="value">{{ caseItem.c_gkws_glah || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">案件进展阶段:</span><span class="value">{{ caseItem.n_ajjzjd || '--' }}</span></div>
                <div class="detail-field"><span class="label">案件类型:</span><span class="value">{{ caseItem.n_ajlx || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">诉讼地位:</span><span class="value">{{ caseItem.n_ssdw || '--' }}</span></div>
                <div class="detail-field"><span class="label">结案方式:</span><span class="value">{{ caseItem.n_jafs || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field"><span class="label">立案时间:</span><span class="value">{{ caseItem.d_larq || '--' }}</span></div>
                <div class="detail-field"><span class="label">结案时间:</span><span class="value">{{ caseItem.d_jarq || '--' }}</span></div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">当事人:</span>
                  <span class="value">{{ caseItem.c_gkws_dsr || formatParticipantsToString(caseItem.c_dsrxx) || '--' }}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-field full-width long-text">
                  <span class="label">判决结果:</span>
                  <span class="value">{{ caseItem.c_gkws_pjjg || '--' }}</span>
                </div>
              </div>
            </div>



          </details>
        </div>

        <div class="empty-data-placeholder" v-else>
          <p>未查询到相关司法案件信息。</p>
        </div>


      </div>
    </div>

    <!-- 失信被执行信息模块 -->
    <div class="module-container" id="shixin" v-if="hasJudicialData">
      <div class="module-title">失信被执行记录</div>

      <div class="shixin-summary-wrapper">
        <div class="shixin-summary-card" :class="{ 'has-data': shixinList && shixinList.length > 0 }">
          <div class="summary-header">
            <div class="summary-title-row">
              <span class="dot"></span>
              <span class="title-text">失信被执行记录</span>
            </div>
            <div class="summary-tag" v-if="shixinList && shixinList.length > 0">存在失信记录</div>
            <div class="summary-tag safe" v-else>暂无失信记录</div>
          </div>
          <div class="summary-body">
            <div class="summary-item">
              <div class="label">失信次数</div>
              <div class="value highlight">{{ shixinList ? shixinList.length : 0 }}</div>
            </div>
            <div class="summary-item">
              <div class="label">最新发布时间</div>
              <div class="value">
                {{ shixinList && shixinList.length > 0 ? (shixinList[0].fbrq || '--') : '--' }}
              </div>
            </div>
            <div class="summary-item">
              <div class="label">最近执行法院</div>
              <div class="value">
                {{ shixinList && shixinList.length > 0 ? (shixinList[0].zxfy || '--') : '--' }}
              </div>
            </div>
            <div class="summary-item">
              <div class="label">履行情况</div>
              <div class="value">
                {{ shixinList && shixinList.length > 0 ? (shixinList[0].lxqk || '--') : '--' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="shixinList && shixinList.length > 0" class="shixin-detail-wrapper">
        <details class="detail-container shixin-detail" v-for="(item, index) in shixinList"
          :key="`shixin-${item.ah || index}`" open>
          <summary>
            <div class="summary-left">
              <div class="summary-main">
                <span class="case-no">{{ item.ah || '—' }}</span>
                <span class="case-court">{{ item.zxfy || '执行法院未知' }}</span>
              </div>
              <div class="summary-sub">
                <span class="badge badge-danger">失信被执行人</span>
                <span class="badge badge-status">{{ item.lxqk || '履行情况未知' }}</span>
              </div>
            </div>
            <div class="summary-right"></div>
          </summary>

          <div class="shixin-detail-content">
            <div class="detail-row">
              <div class="detail-field">
                <span class="label">执行依据文号</span>
                <span class="value">{{ item.zxyjwh || '—' }}</span>
              </div>
              <div class="detail-field">
                <span class="label">判决金额</span>
                <span class="value">{{ item.pjje_gj || '—' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-field">
                <span class="label">发布日期</span>
                <span class="value">{{ item.fbrq || '—' }}</span>
              </div>
              <div class="detail-field">
                <span class="label">执行法院</span>
                <span class="value">{{ item.zxfy || '—' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-field full-width">
                <span class="label">生效法律文书确定的义务</span>
                <span class="value">{{ item.yw || '—' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-field full-width">
                <span class="label">失信行为具体情形</span>
                <span class="value">{{ item.xwqx || '—' }}</span>
              </div>
            </div>
          </div>
        </details>
      </div>

      <div class="empty-data-placeholder" v-else>
        <p>未查询到失信被执行相关信息。</p>
      </div>
    </div>

    <!-- 人企关联模块 -->
    <div class="module-container" id="company" v-if="hasCompanyData">
      <div class="module-title">企业关联与任职</div>

      <!-- 判断 companyRawData 数组是否有内容 -->
      <div v-if="companyRelationData.data.data.data.datalist && companyRelationData.data.data.data.datalist.length > 0">
        <!-- 循环您的公司数据，为每个公司生成一个 <details> 卡片 -->
        <details class="detail-container company-detail" v-for="(company, companyIndex) in companyRelationData.data.data.data.datalist"
          :key="(company.basicInfo && company.basicInfo.creditCode) || (company.basicInfo && company.basicInfo.regNumber) || `company-${companyIndex}`" open>
          <summary>
            <div class="summary-left">
              <div class="company-title-row">
                <i class="fas fa-industry"></i>
                <span>{{ company.basicInfo.name || '--' }}</span>
                <span v-if="company.taxLevel" class="tax-level-badge">纳税人等级：{{ company.taxLevel }}</span>
              </div>
              <div class="company-meta">
                <span v-if="company.basicInfo && (company.basicInfo.creditCode || company.basicInfo.regNumber)">
                  {{ company.basicInfo.creditCode ? '统一社会信用代码：' + company.basicInfo.creditCode : '注册号：' + company.basicInfo.regNumber }}
                </span>
              </div>
            </div>
            <!-- summary-right 可以用来放角标或箭头，这里暂时留空 -->
            <div class="summary-right">
              <span :class="['company-status', getStatusClass(company.basicInfo && company.basicInfo.regStatus)]">
                {{ (company.basicInfo && company.basicInfo.regStatus) || '--' }}
              </span>
            </div>
          </summary>

          <!-- 卡片展开后的详细内容 -->
          <div class="enterprise-info-container">
            <div class="enterprise-info-grid">

              <!-- 任职信息 -->
              <div class="info-group-title">任职信息</div>
              <div class="enterprise-info-item">
                <div class="label">担任职务</div>
                <div class="value">{{ formatPosition(company) }}</div>
              </div>
              <div class="enterprise-info-item">
                <div class="label">任职状态</div>
                <div class="value">{{ formatPositionStatus(company) }}</div>
              </div>
              <div class="enterprise-info-item">
                <div class="label">持股</div>
                <div class="value">{{ company.stockHolderItem.investRate || '-' }}</div>
              </div>
              <div class="enterprise-info-item"></div> <!-- 空白占位 -->

              <!-- 基本信息 -->
              <div class="info-group-title">基本信息</div>
              <div class="enterprise-info-item">
                <div class="label">企业状态</div>
                <div :class="['value', getStatusClass(company.basicInfo.regStatus)]">{{ company.basicInfo.regStatus ||
                  '--' }}</div>
              </div>
              <div class="enterprise-info-item">
                <div class="label">统一社会信用代码</div>
                <div class="value">{{ company.basicInfo.creditCode || '--' }}</div>
              </div>
              <div class="enterprise-info-item">
                <div class="label">注册号</div>
                <div class="value">{{ company.basicInfo.regNumber || '--' }}</div>
              </div>
              <div class="enterprise-info-item">
                <div class="label">企业类型</div>
                <div class="value">{{ company.basicInfo.companyOrgType || '--' }}</div>
              </div>
              <div class="enterprise-info-item">
                <div class="label">行业</div>
                <div class="value">{{ company.basicInfo.industry || '--' }}</div>
              </div>
              <div class="enterprise-info-item">
                <div class="label">注册资本</div>
                <div class="value">{{ company.basicInfo.regCapital || '--' }}</div>
              </div>
              <div class="enterprise-info-item">
                <div class="label">成立日期</div>
                <div class="value"><i class="fas fa-calendar-alt"></i>{{ company.basicInfo.estiblishTime || '--' }}
                </div>
              </div>
              <div class="enterprise-info-item">
                <div class="label">法人名称</div>
                <div class="value">{{ company.basicInfo.legalPersonName || '--' }}</div>
              </div>
              <div class="enterprise-info-item full-width" v-if="company.basicInfo && company.basicInfo.opscope">
                <div class="label">经营范围</div>
                <div class="value">{{ company.basicInfo.opscope }}</div>
              </div>

              <!-- 处罚信息 -->
              <div class="info-group-title" v-if="getPenaltyNumbers(company).length > 0">处罚信息</div>
              <div class="enterprise-info-item full-width" v-if="getPenaltyNumbers(company).length > 0">
                <div class="label">处罚案号</div>
                <div class="value">共 {{ getPenaltyNumbers(company).length }} 条：{{ getPenaltyNumbers(company).join('、') }}</div>
              </div>
            </div>
          </div>
        </details>
      </div>

      <!-- 如果数组为空，显示提示信息 -->
      <div class="empty-data-placeholder" v-else>
        <p>未查询到相关企业关联信息。</p>
      </div>
    </div>

    <!-- 贷款情况模块 -->
    <div class="module-container" id="loan" v-if="hasLoanData">
      <div class="module-title">信贷与逾期状况</div>
      <div class="sub-module" v-if="hasOverdueData">
        <div class="sub-module-title"><i class="fas fa-file-invoice-dollar"></i>逾期状况</div>
        <div class="sub-module-content">
          <div class="overdue-stats-grid">
            <div class="stat-card">
              <div class="stat-card-icon"><i class="fas fa-exclamation-circle"></i></div>
              <div class="stat-card-body">
                <div class="stat-card-label">当前逾期机构数</div>
                <div class="stat-card-value" :class="{ highlight: (comprehensiveScoress('tanzhen_currently_overdue') || '0') !== '0' }">{{ comprehensiveScoress("tanzhen_currently_overdue") || '0' }}</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon"><i class="fas fa-ban"></i></div>
              <div class="stat-card-body">
                <div class="stat-card-label">黑名单命中机构数</div>
                <div class="stat-card-value" :class="{ highlight: blacklistOrgCount > 0 }">{{ blacklistOrgCount }}</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon"><i class="fas fa-yen-sign"></i></div>
              <div class="stat-card-body">
                <div class="stat-card-label">当前逾期总金额</div>
                <div class="stat-card-value stat-card-value--amount" :class="{ highlight: formatOverdueAmountDisplay(comprehensiveScoress('zc_overdueAmt')) !== '0' }">{{ formatOverdueAmountDisplay(comprehensiveScoress("zc_overdueAmt")) }}<span class="stat-card-unit">元</span></div>
              </div>
            </div>
          </div>
          <!-- 黑名单命中情况（标签矩阵） -->
          <div class="loan-tags-section" v-if="hasNewBlacklistData">
            <div class="loan-tags-title">黑名单命中情况</div>
            <div class="loan-tags-grid">
              <div class="loan-tag-card">
                <div class="loan-tag-label">银行(含信用卡)</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_isBank'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_isBank")) }}
                </div>
              </div>
              <div class="loan-tag-card">
                <div class="loan-tag-label">网络贷款</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_isNetloan'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_isNetloan")) }}
                </div>
              </div>
              <div class="loan-tag-card">
                <div class="loan-tag-label">小额贷款</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_isSloan'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_isSloan")) }}
                </div>
              </div>
              <div class="loan-tag-card">
                <div class="loan-tag-label">消费金融</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_isConsume'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_isConsume")) }}
                </div>
              </div>
              <div class="loan-tag-card">
                <div class="loan-tag-label">融资租赁</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_isFinlea'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_isFinlea")) }}
                </div>
              </div>
              <div class="loan-tag-card">
                <div class="loan-tag-label">汽车金融</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_isAutofin'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_isAutofin")) }}
                </div>
              </div>
              <div class="loan-tag-card">
                <div class="loan-tag-label">其他机构</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_isOther'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_isOther")) }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 最新欺诈/逾期状态（标签矩阵） -->
          <div class="loan-tags-section" v-if="hasFraudOverdueStatusData">
            <div class="loan-tags-title">最新贷款欺诈 / 逾期状态</div>
            <div class="loan-tags-grid">
              <div class="loan-tag-card">
                <div class="loan-tag-label">严重逾期(>90天)</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_seriousOverdue'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_seriousOverdue")) }}
                </div>
              </div>
              <div class="loan-tag-card">
                <div class="loan-tag-label">一般逾期(1-90天)</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_generalOverdue'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_generalOverdue")) }}
                </div>
              </div>
              <div class="loan-tag-card">
                <div class="loan-tag-label">轻微逾期</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_slightlOverdue'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_slightlOverdue")) }}
                </div>
              </div>
              <div class="loan-tag-card">
                <div class="loan-tag-label">疑似贷款欺诈</div>
                <div class="loan-tag-status" :class="getBlacklistHitStatusColorClass(comprehensiveScoress('zc_suspectFraud'))">
                  {{ getBlacklistHitStatus(comprehensiveScoress("zc_suspectFraud")) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 贷款申请情况（重构） -->
      <div class="loan-apply-section" v-if="hasLoanApplicationData">
        <div class="loan-tags-title" style="margin-bottom: 12px;">贷款申请情况</div>
        <div class="loan-apply-cards">
          <!-- 手机号维度 -->
          <div class="loan-apply-card">
            <div class="loan-apply-card-header">
              <div class="loan-apply-icon"><i class="fas fa-mobile-alt"></i></div>
              <span>通过手机号关联：</span>
            </div>
            <div class="loan-apply-kpi-grid">
              <div class="loan-apply-kpi">
                <div class="kpi-num">{{ getTotalLoanCountLastYearbypho() || '0' }}</div>
                <div class="kpi-label">近1年申请总次数</div>
              </div>
              <div class="loan-apply-kpi">
                <div class="kpi-num">{{ getTotalLoanOrgCountLastYearbypho() || '0' }}</div>
                <div class="kpi-label">近1年申请总机构数</div>
              </div>
            </div>
            <div class="loan-apply-rows">
              <div class="loan-apply-row">
                <span class="row-label">最近银行申请距今</span>
                <span class="row-value">{{ comprehensiveScoress("als_lst_cell_bank_inteday") || '-' }} 天</span>
              </div>
              <div class="loan-apply-row">
                <span class="row-label">最近非银申请距今</span>
                <span class="row-value">{{ comprehensiveScoress("als_lst_cell_nbank_inteday") || '-' }} 天</span>
              </div>
            </div>
          </div>
          <!-- 身份证号维度 -->
          <div class="loan-apply-card">
            <div class="loan-apply-card-header">
              <div class="loan-apply-icon"><i class="fas fa-id-card"></i></div>
              <span>通过身份证号关联：</span>
            </div>
            <div class="loan-apply-kpi-grid">
              <div class="loan-apply-kpi">
                <div class="kpi-num">{{ getTotalLoanCountLastYear() || '0' }}</div>
                <div class="kpi-label">近1年申请总次数</div>
              </div>
              <div class="loan-apply-kpi">
                <div class="kpi-num">{{ getTotalLoanOrgCountLastYear() || '0' }}</div>
                <div class="kpi-label">近1年申请总机构数</div>
              </div>
            </div>
            <div class="loan-apply-rows">
              <div class="loan-apply-row">
                <span class="row-label">最近银行申请距今</span>
                <span class="row-value">{{ comprehensiveScoress("als_lst_id_bank_inteday") || '-' }} 天</span>
              </div>
              <div class="loan-apply-row">
                <span class="row-label">最近非银申请距今</span>
                <span class="row-value">{{ comprehensiveScoress("als_lst_id_nbank_inteday") || '-' }} 天</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 贷款类型详细分析（重构） -->
      <div class="loan-detail-section" v-if="hasLoanTypeAnalysisData">
        <div class="loan-tags-title" style="margin-bottom: 12px;">贷款类型详细分析</div>

        <!-- 表1：申请时间行为 -->
        <div class="loan-detail-card">
          <div class="loan-detail-card-header">
            <div class="loan-apply-icon"><i class="fas fa-clock"></i></div>
            <span>申请时间行为分布</span>
          </div>
          <div class="loan-detail-table-wrap">
            <table class="loan-detail-table">
              <thead>
                <tr>
                  <th rowspan="2" class="sticky-col">行为类型</th>
                  <th colspan="2">近7日</th>
                  <th colspan="2">近1月</th>
                  <th colspan="2">近3月</th>
                  <th colspan="2">近6月</th>
                  <th colspan="2">近1年</th>
                </tr>
                <tr>
                  <th>机构</th><th>次数</th>
                  <th>机构</th><th>次数</th>
                  <th>机构</th><th>次数</th>
                  <th>机构</th><th>次数</th>
                  <th>机构</th><th>次数</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th class="sticky-col">银行周末申请</th>
                  <td>{{ comprehensiveScoress("als_d7_id_bank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_bank_week_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_bank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_bank_week_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_bank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_bank_week_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_bank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_bank_week_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_bank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_bank_week_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">银行夜间申请</th>
                  <td>{{ comprehensiveScoress("als_d7_id_bank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_bank_night_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_bank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_bank_night_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_bank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_bank_night_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_bank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_bank_night_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_bank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_bank_night_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">非银周末申请</th>
                  <td>{{ comprehensiveScoress("als_d7_id_nbank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_nbank_week_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_nbank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_nbank_week_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_nbank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_nbank_week_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_nbank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_nbank_week_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_nbank_week_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_nbank_week_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">非银夜间申请</th>
                  <td>{{ comprehensiveScoress("als_d7_id_nbank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_nbank_night_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_nbank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_nbank_night_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_nbank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_nbank_night_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_nbank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_nbank_night_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_nbank_night_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_nbank_night_allnum") || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 表2：借贷类别分析 -->
        <div class="loan-detail-card" style="margin-top: 12px;">
          <div class="loan-detail-card-header">
            <div class="loan-apply-icon"><i class="fas fa-layer-group"></i></div>
            <span>借贷类别分布</span>
          </div>
          <div class="loan-detail-table-wrap">
            <table class="loan-detail-table">
              <thead>
                <tr>
                  <th rowspan="2" class="sticky-col">借贷类别</th>
                  <th colspan="2">近7日</th>
                  <th colspan="2">近1月</th>
                  <th colspan="2">近3月</th>
                  <th colspan="2">近6月</th>
                  <th colspan="2">近1年</th>
                </tr>
                <tr>
                  <th>机构</th><th>次数</th>
                  <th>机构</th><th>次数</th>
                  <th>机构</th><th>次数</th>
                  <th>机构</th><th>次数</th>
                  <th>机构</th><th>次数</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th class="sticky-col">银行借贷</th>
                  <td>{{ comprehensiveScoress("als_d7_id_bank_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_bank_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_bank_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_bank_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_bank_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_bank_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_bank_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_bank_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_bank_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_bank_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">小额贷款</th>
                  <td>{{ comprehensiveScoress("als_d7_id_pdl_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_pdl_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_pdl_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_pdl_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_pdl_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_pdl_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_pdl_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_pdl_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_pdl_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_pdl_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">线上消费分期</th>
                  <td>{{ comprehensiveScoress("als_d7_id_coon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_coon_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_coon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_coon_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_coon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_coon_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_coon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_coon_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_coon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_coon_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">线上现金分期</th>
                  <td>{{ comprehensiveScoress("als_d7_id_caon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_caon_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_caon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_caon_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_caon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_caon_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_caon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_caon_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_caon_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_caon_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">信用卡相关</th>
                  <td>{{ comprehensiveScoress("als_d7_id_rel_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_rel_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_rel_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_rel_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_rel_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_rel_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_rel_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_rel_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_rel_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_rel_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">线下现金分期</th>
                  <td>{{ comprehensiveScoress("als_d7_id_caoff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_caoff_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_caoff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_caoff_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_caoff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_caoff_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_caoff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_caoff_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_caoff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_caoff_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">线下消费分期</th>
                  <td>{{ comprehensiveScoress("als_d7_id_cooff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_cooff_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_cooff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_cooff_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_cooff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_cooff_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_cooff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_cooff_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_cooff_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_cooff_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">汽车金融</th>
                  <td>{{ comprehensiveScoress("als_d7_id_af_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_af_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_af_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_af_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_af_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_af_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_af_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_af_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_af_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_af_allnum") || '-' }}</td>
                </tr>
                <tr>
                  <th class="sticky-col">其他借贷</th>
                  <td>{{ comprehensiveScoress("als_d7_id_oth_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_d7_id_oth_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_oth_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m1_id_oth_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_oth_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m3_id_oth_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_oth_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m6_id_oth_allnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_oth_orgnum") || '-' }}</td>
                  <td>{{ comprehensiveScoress("als_m12_id_oth_allnum") || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="loan-table-explanation">
            <i class="fas fa-align-left"></i>
            <span>被查询人网购时平台自动贷款支付可能被线上消费/现金分期贷款收录，仅此项不代表其有大额贷款（美团抖音月付等）</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 消费金额区间模块 -->
    <div class="module-container" id="consumption" v-if="hasSimpleConsumptionData">
      <div class="module-title">消费金额区间</div>
      <div class="sub-module">
        <div class="sub-module-content">
          <div class="details-grid">
            <div class="detail-item">
              <span class="label">近12个月金融及实物投资类消费金额区间</span>
              <span class="value">{{ comprehensiveScoress('tap082') || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">近12个月出行旅游类消费金额区间</span>
              <span class="value">{{ comprehensiveScoress('tap081') || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">近12个月在教育培训类交易的金额</span>
              <span class="value">{{ comprehensiveScoress('tap083') || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">近12个月在娱乐服务类交易的金额</span>
              <span class="value">{{ comprehensiveScoress('tap084') || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">近12个月在生活购物类交易的金额</span>
              <span class="value">{{ comprehensiveScoress('tap080') || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">近12个月在其他交易的金额</span>
              <span class="value">{{ comprehensiveScoress('tap085') || '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 过往工作履历：仅由套餐 work_history 模块控制，内容来自后台人工录入 -->
    <div class="module-container" id="history-work" v-if="hasHistoryWorkData">
      <div class="module-title">过往工作履历（社保缴纳单位记录）</div>
      <div v-if="historyWorkList && historyWorkList.length > 0" class="history-work-table-wrap">
        <table class="history-work-table">
          <thead>
            <tr>
              <th>缴纳单位</th>
              <th>缴纳时间</th>
              <th v-if="historyWorkWithMoney">缴纳基数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in historyWorkList" :key="'hw-' + idx">
              <td>{{ row.organizationName || '—' }}</td>
              <td>{{ formatHistoryWorkPeriod(row) }}</td>
              <td v-if="historyWorkWithMoney">{{ row.contributionBase || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="history-work-empty">核验人员未录入工作履历记录</div>
    </div>

    <!-- 每段工作经历将 HR 核验与直属上级表现访谈合并展示 -->
    <div
      v-for="(section, si) in employmentVerificationSections"
      :key="'ev-' + si"
      class="module-container employment-verify-module"
      :id="si === 0 ? 'employment-verify' : ('employment-verify-' + si)"
    >
      <div class="module-title">
        第 {{ si + 1 }} 段工作经历核验{{ section.companyName ? '（' + section.companyName + '）' : '' }}
      </div>

      <section class="employment-evidence-block">
        <div class="employment-evidence-heading">
          <span class="employment-evidence-number">01</span>
          <div>
            <strong>HR 证明人核验</strong>
            <span>任职单位、供职时间、职位、薪酬及离职情况</span>
          </div>
        </div>

        <template v-if="section.hasHrResult">
          <div class="manual-sub-header">证明人基本信息</div>
          <div class="manual-table-wrap">
            <table class="manual-report-table">
              <tbody>
                <tr>
                  <td class="manual-cell-label" style="width: 18%;">证明人</td>
                  <td style="width: 32%;">{{ section.employment.hrReference?.refName || '' }}</td>
                  <td class="manual-cell-label" style="width: 18%;">证明人来源</td>
                  <td>{{ section.employment.hrReference?.refSource || '' }}</td>
                </tr>
                <tr>
                  <td class="manual-cell-label">证明人联系方式</td>
                  <td>{{ section.employment.hrReference?.refPhone || '' }}</td>
                  <td class="manual-cell-label">证明人职位</td>
                  <td>{{ section.employment.hrReference?.refPosition || 'HR' }}</td>
                </tr>
                <tr>
                  <td class="manual-cell-label">共事关系</td>
                  <td>{{ section.employment.hrReference?.relation || '' }}</td>
                  <td class="manual-cell-label">共事时长</td>
                  <td>{{ section.employment.hrReference?.duration || '' }}</td>
                </tr>
                <tr v-if="section.employment.hrReference?.note">
                  <td class="manual-cell-label">额外说明</td>
                  <td colspan="3">{{ section.employment.hrReference.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="manual-sub-header">任职信息核验结果</div>
          <div class="manual-table-wrap">
            <table class="manual-report-table">
              <thead>
                <tr>
                  <th style="width: 22%;">调查项目</th>
                  <th style="width: 30%;">候选人提供</th>
                  <th style="width: 10%;">真实性</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, ii) in (section.employment.items || [])" :key="'evi-' + si + '-' + ii">
                  <td class="manual-cell-label">{{ item.label }}</td>
                  <td>{{ item.candidateValue || '' }}</td>
                  <td class="manual-cell-truth">
                    <span :class="truthIconClass(item.truth)">{{ truthIconText(item.truth) }}</span>
                  </td>
                  <td>{{ item.note || '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="history-work-empty employment-evidence-empty">HR 证明人核验结果暂未录入</div>
      </section>

      <section class="employment-evidence-block">
        <div class="employment-evidence-heading">
          <span class="employment-evidence-number">02</span>
          <div>
            <strong>直属上级证明人（工作表现访谈）</strong>
            <span>工作职责、职业表现、团队合作及综合评价</span>
          </div>
        </div>

        <template v-if="section.hasSupervisorResult">
          <div class="manual-sub-header">证明人基本信息</div>
          <div class="manual-table-wrap">
            <table class="manual-report-table">
              <tbody>
                <tr>
                  <td class="manual-cell-label" style="width: 18%;">证明人</td>
                  <td style="width: 32%;">{{ section.interview.refName || '' }}</td>
                  <td class="manual-cell-label" style="width: 18%;">证明人来源</td>
                  <td>{{ section.interview.refSource || '' }}</td>
                </tr>
                <tr>
                  <td class="manual-cell-label">证明人联系方式</td>
                  <td>{{ section.interview.refPhone || '' }}</td>
                  <td class="manual-cell-label">证明人职位</td>
                  <td>{{ section.interview.refPosition || '' }}</td>
                </tr>
                <tr>
                  <td class="manual-cell-label">共事关系</td>
                  <td>{{ section.interview.relation || '' }}</td>
                  <td class="manual-cell-label">共事时长</td>
                  <td>{{ section.interview.duration || '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="manual-sub-header">工作表现鉴定</div>
          <div class="manual-table-wrap">
            <table class="manual-report-table">
              <tbody>
                <tr v-for="row in assessmentRows(section.interview)" :key="'as-' + si + '-' + row.key">
                  <td class="manual-cell-label" style="width: 18%;">{{ row.label }}</td>
                  <td class="manual-cell-multiline">{{ row.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="history-work-empty employment-evidence-empty">直属上级表现访谈结果暂未录入</div>
      </section>
    </div>

    <!--【新增】额外信息模块：无内容则隐藏 -->
    <div class="module-container" id="extra" v-if="hasExtraInfo">
      <div class="module-title">综合补充信息</div>
      <div class="extra-info-content">
        <div class="extra-info-text">{{ extraInfo }}</div>
      </div>
    </div>

    <!-- 底部导流栏 -->
    <div class="report-cta-bar" v-if="!exporting">
      <div class="cta-inner">
        <div class="cta-brand">
        
         
        </div>
        <div class="cta-headline">此为{{ reportTitle }}全部内容，如需钟馗对报告内容进行解读分析，或更深度背调，请联系客服</div>
        <div class="cta-tags">
          <span class="cta-tag">企业背调</span>
          <span class="cta-tag">深度尽调</span>
          <span class="cta-tag">批量背调</span>
          <span class="cta-tag">长期监测</span>
        </div>
        <div class="cta-footer">钟馗背调· 让每一次雇佣与合作都有底气</div>
      </div>
    </div>

    <!-- 底部返回与导出按钮 -->
    <div class="bottom-action" v-if="!exporting">
      <button class="action-btn back" @click="goBack">
        <i class="fas fa-arrow-left"></i><span>返回</span>
      </button>
      <button class="action-btn export" @click="triggerPrint">
        <i class="fas fa-print"></i><span>导出</span>
      </button>
    </div>
    </div>
  </div>
</template>


<script>
	import { jsPDF } from "jspdf";
import { getData } from "../../api/data.js";
import { getDicts } from "../../api/dict.js";
import {
  largeVariable,
  largeVariable1,
  largeVariable2,
  largeVariable3,
  largeVariable4,
} from "./largeData.js";

export default {
  data() {
    return {
      extraInfo: '',
      employmentVerifyList: [], // 工作履历核实（人工核验），空数组=不显示
      interviewList: [], // 工作表现访谈（人工核验），空数组=不显示
      candidateModules: [], // 本单套餐配置的报告模块
      assessmentLabels: {
        leaveReason: '离职原因',
        jobDuty: '工作职责',
        professionalism: '职业素养',
        selfManagement: '自我管理',
        kpiStandard: '绩效考核标准',
        performance: '工作业绩结果',
        personality: '性格特征',
        teamwork: '团队合作',
        stressResistance: '抗压能力',
        improvement: '改进建议',
        overallScore: '整体评分'
      },
      historyWorkValue: [], // 过往工作履历，由后台人工录入
      historyWorkWithMoney: false, // 任一记录填写缴纳基数时显示该列
      data_for_fan_du_fan_zha: [],
      dataAll: [],
      currentId: null,
      reportNo: '',
      queryTime: '',
      searchType: null, // 与报告编号同级，1=基础通用 15=基层员工 16=高管
      activeNames: ["1"],
	  exporting: false,
	  autoDownloadStarted: false,
      Fan_du_fan_zha_list: [],
      // 性能优化：缓存司法数据转换结果，避免重复计算
      _cachedJudicialData: null,
      _judicialDataCacheKey: null,
      // 贷款申请标签页状态
      activeLoanTab: 'identity', // 'identity' or 'phone'
      // 字典数据
      dictData: {},
      // 字典值缓存
      dictCache: {},
      // 显示值缓存
      displayCache: {},
      // comprehensiveScoress 方法结果缓存（提升性能）
      comprehensiveScoressCache: {},
      // getItemByFiledName 方法结果缓存（提升性能）
      itemByFiledNameCache: {},
      // 性能优化：字段名到索引的映射，避免重复查找
      _fieldNameIndexMap: null,
      // 字典映射配置（统一管理，避免重复）
      dictMapping: {
        state: "tianyuan_hunyin", // 婚姻状况
        gender: "tianyuan_gender", // 性别
        hunyin_buzheng: "tianyuan_hunyin", // 婚姻状况（补充字段）
        level_buliang: 'police_risk',
		    op_type:'tianyuan_hunyin',
		    black_list:'black_list_zidian',
        final_auth_result: 'eryaosuheyan_result', // 二要素核验
        codetianyuansanyaosu: "sanyaosuheyancode", // 三要素核验
        tap001: "mingxia_yinhangka", // 名下银行卡
        plateColor: "mingxiache_yanse", // 车牌颜色
        vehicleType: "mingxiache_leixing", // 车辆类型
        range: "weilai_shouru",
        level_xiaofei: 'youshu_xiaofei',
        model_score104: 'bai_ling_fen_104',
        model_score103: "bai_ling_fen_103",
        xyp_cpl0071: "xyp_cpl0071",
        xyp_cpl0072: "xyp_cpl0072",
        tap008: "jiao_yi_e", // 历史平均单日交易额
        tap016: "xiaofei_hangye", // 交易笔数最多的行业分类
        tap017: "xiaofei_hangye", // 交易金额最高的行业分类
        tap020: "xiaofei_qujian", // 金融及实物投资类消费笔数最多的金额
        tap024: "trv_pts_qujian", // 保险类交易金额
        tap026: "trv_pts_qujian", // 航旅类交易金额
        tap080: "trv_pts_qujian", // 近12个月在生活购物类交易的金额
        tap081: "trv_pts_qujian", // 近12个月出行旅游类消费
        tap082: "trv_pts_qujian", // 近12个月金融及实物投资类消费
        tap083: "trv_pts_qujian", // 近12个月在教育培训类交易的金额
        tap084: "trv_pts_qujian", // 近12个月在娱乐服务类交易的金额
        tap085: "trv_pts_qujian", // 近12个月在其他交易的金额
        zaiwang_msg: "zaiwang_code_msg",
        zaiwangf_msg: "zaiwang_time_msg",
		geshui_range: "model_score_461",
		zc_shebao_level: "zhicha_shebao_range",
        zaiwang_inTime: "zaiwang_timeb",
        zaiwang_state: "zaiwang_stateb",
		zc_verification:"sanyaosuheyancode",
        searchType: "reporttype", // 报告类型，用于报告大标题
        eduModuleBySearchType: "if_edu_exist", // dictLabel=报告类型id，dictValue=1 显示学历模块，0 不显示
      },
      // 导出相关状态
      exporting: false,
      fraudGamingPayload: {
        api_name: "反赌反炸核验",
        api_code: "",
        success: true,
        message: "反赌反炸核验查询完成",
        data: {
          code: "200",
          message: "查询成功",
          data: {
            value: [],
          },
        },
        call_time: "2025-07-14T16:31:47.123456+00:00",
      },
      dataForComponents: largeVariable,
      dataForComponents2: {
        api_name: "个人司法涉诉",
        data: { data: { entout: [] } },
      },
      dataForComponents3: {
        api_name: "人企关联",
        data: { data: { data: { datalist: [] } } },
      },
      dataForComponents4: {
        api_name: "借贷意向",
        data: { data: {} },
      },
      relationMap: {
        lp: '法人',
        sh: '股东',
        tm: '主要人员', // 对应 "高管"
        his_lp: '历史法人',
        his_sh: '历史股东',
        his_tm: '历史主要人员' // 对应 "历史高管"
      },
      laborRiskItems: [
        { key: 'ty_labor_contract', label: '劳动合同纠纷' },
        { key: 'ty_wage_claim', label: '追索劳动报酬纠纷' },
        { key: 'ty_compensation', label: '经济补偿金纠纷' },
        { key: 'ty_dismissal_dispute', label: '辞退争议' },
        { key: 'ty_non_compete', label: '竞业限制纠纷' },
        { key: 'ty_dispatch_contract', label: '劳务派遣合同纠纷' },
        { key: 'ty_collective_contract', label: '集体合同纠纷' },
        { key: 'ty_labor_relation', label: '劳动关系纠纷' },
        { key: 'ty_labor_disputes', label: '劳动争议（综合）' }
      ],
      socialRiskItems: [
        { key: 'ty_pension_5y', label: '养老保险待遇纠纷' },
        { key: 'ty_medical_insurance', label: '医疗保险待遇纠纷' },
        { key: 'ty_injury_insurance', label: '工伤保险待遇纠纷' },
        { key: 'ty_maternity_insurance', label: '生育保险待遇纠纷' },
        { key: 'ty_commercial_insurance', label: '失业保险待遇纠纷' }
      ],
      // 与报告编号同级的基础字段
      name: '',
      idCard: '',
      phoneNumber: ''
    };
  },

  created() {
    // 在生命周期中获取参数（created 或 mounted 均可）
    this.currentId = this.$route.params.id || this.$route.query.id;

    // 加载字典数据
    this.loadDictData();

    // 修复 1：修正箭头函数语法（async 后必须有空格，箭头函数用 () =>）
    // 在接口请求成功的回调中处理数据
    (async () => {
      try {
        const res = await getData(this.currentId);
        this.extraInfo = res.data.extra || '';
        this.candidateModules = String(res.data?.candidateModules || '')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);
        this.historyWorkValue = Array.isArray(res.data?.workHistoryValue)
          ? res.data.workHistoryValue : [];
        this.historyWorkWithMoney = this.historyWorkValue.some(item =>
          item && String(item.contributionBase || '').trim() !== '');
        // 人工核验结果：工作履历核实、工作表现访谈（后端无结果时不返回该字段）
        this.employmentVerifyList = Array.isArray(res.data?.employmentVerifyValue)
          ? res.data.employmentVerifyValue : [];
        this.interviewList = Array.isArray(res.data?.interviewValue)
          ? res.data.interviewValue : [];

        // 报告编号、查询时间、基础身份字段（与页面数据同级）
        if (res && res.data) {
          this.reportNo = res.data.outTradeNo || '';
          this.queryTime = res.data.createTime || '';
          this.searchType = res.data.searchType ?? null;
          this.name = res.data.name || res.data.userName || res.data.realName || '';
          this.idCard = res.data.idCard || '';
          this.phoneNumber = res.data.phoneNumber || '';
        }
        // 检查响应数据是否存在
        if (!res || !res.data || !res.data.data) {
          console.error('API响应数据为空，res:', res);
          console.error('res.data:', res.data);

          // 即使数据为空，也要初始化dataAll为空数组，避免其他地方出错
          this.dataAll = [];

          // 继续处理其他数据转换，使用空数据


          // 性能优化：使用 nextTick 延迟非关键数据转换
          this.$nextTick(() => {
          // 转换人企关联数据
          const transformedCompanyData = this.transformCompanyRelationData();
          this.dataForComponents3 = transformedCompanyData;

          // 转换司法涉诉数据
          const transformedJudicialData = this.transformJudicialData();
          this.dataForComponents2 = transformedJudicialData;
          });

          return;
        }

        // 1. 先解析 res.data.data（如果是 JSON 字符串）
        let rawData =
          typeof res.data.data === "string"
            ? JSON.parse(res.data.data) // 如果是字符串，解析成数组
            : res.data.data; // 如果已经是数组，直接使用
        // 若接口返回的是对象（如 { list/data/dataAll 等包一层），尝试取出内部数组
        if (!Array.isArray(rawData) && rawData && typeof rawData === "object") {
          rawData = rawData.list || rawData.data || rawData.dataAll || rawData.rows || rawData;
        }
        let arr = Array.isArray(rawData) ? rawData.map((item) => ({ ...item })) : [];
        this.dataAll = arr;
        
        // 性能优化：数据更新后清除缓存和字段映射
        this.comprehensiveScoressCache = {};
        this.itemByFiledNameCache = {};
        this._fieldNameIndexMap = null; // 清除字段映射，下次使用时重新构建
        this._cachedJudicialData = null; // 清除司法数据缓存
        this._judicialDataCacheKey = null;

        // 性能优化：使用 nextTick 将非关键数据转换延迟到下一帧，避免阻塞渲染
        this.$nextTick(async () => {
        // 转换人企关联数据
        const transformedCompanyData = this.transformCompanyRelationData();
        this.dataForComponents3 = transformedCompanyData;

        // 转换司法涉诉数据
        const transformedJudicialData = this.transformJudicialData();
        this.dataForComponents2 = transformedJudicialData;
        await this.startAutoDownloadIfNeeded();
        });
      } catch (error) {
        console.error("获取数据失败:", error);
        this.$message.error("加载数据失败，请稍后重试");
      }
    })();
  },
  computed: {
    /* ---------- 报告总述 ----------
       每一行与正文模块使用同一组显隐条件和数据源。未返回、接口失败与真实命中
       分开标记，避免把“缺数据”误读成“有风险”。 */
    overviewSummaryRows() {
      const rows = [];
      const add = (key, category, project, status, result, resultTone = 'normal') => {
        const statusTone = status === '已完成'
          ? 'complete'
          : (status === '部分完成' ? 'partial' : 'pending');
        rows.push({ key, category, project, status, statusTone, result, resultTone });
      };

      if (this.hasIdentityData) {
        const authResult = String(this.finalAuthResult || '').trim();
        const hasConcern = /失败|不一致|异常|未通过/.test(authResult);
        add(
          'identity',
          '基础核验',
          '身份信息核验',
          '已完成',
          authResult || '身份基础信息已返回',
          hasConcern ? 'critical' : 'normal'
        );
      }

      if (this.hasEducationData) {
        const educationRows = this.educationData || [];
        const matched = educationRows.filter(item => item.queryStatus === 'MATCHED').length;
        const notFound = educationRows.filter(item => item.queryStatus === 'NOT_FOUND').length;
        const noInput = educationRows.filter(item => item.queryStatus === 'NO_INPUT').length;
        const failed = educationRows.filter(item => item.queryStatus === 'ERROR').length;
        const unfinished = noInput + failed;
        const status = !educationRows.length
          ? '待补充'
          : (unfinished ? (unfinished === educationRows.length ? '待补充' : '部分完成') : '已完成');
        const parts = [];
        if (matched) parts.push(`${matched} 条核验一致`);
        if (notFound) parts.push(`${notFound} 条未查询到记录`);
        if (noInput) parts.push(`${noInput} 条未提供编号`);
        if (failed) parts.push(`${failed} 条核验失败`);
        add(
          'education',
          '学历核验',
          '学历证书核验',
          status,
          parts.join('，') || '尚无学历核验结果',
          notFound ? 'warning' : (unfinished ? 'pending' : 'normal')
        );
      }

      if (this.employmentVerificationSections.length) {
        const sections = this.employmentVerificationSections || [];
        const completeSections = sections.filter(item => item.hasHrResult && item.hasSupervisorResult).length;
        const mismatchCount = sections.reduce((sum, section) => (
          sum + (section.employment?.items || []).filter(item => item?.truth === 'MISMATCH').length
        ), 0);
        const unableCount = sections.reduce((sum, section) => (
          sum + (section.employment?.items || []).filter(item => item?.truth === 'NA').length
        ), 0);
        const status = completeSections === sections.length && sections.length
          ? '已完成'
          : (completeSections ? '部分完成' : '待补充');
        const resultParts = [`共 ${sections.length} 段工作经历`];
        if (mismatchCount) resultParts.push(`${mismatchCount} 项不一致`);
        if (unableCount) resultParts.push(`${unableCount} 项无法核实`);
        if (completeSections < sections.length) resultParts.push(`${sections.length - completeSections} 段待补充`);
        if (!mismatchCount && !unableCount && completeSections === sections.length && sections.length) {
          resultParts.push('已完成 HR 与上级核验');
        }
        add(
          'employment',
          '履历核验',
          '工作经历核验',
          status,
          resultParts.join('，'),
          mismatchCount || unableCount ? 'warning' : (status === '已完成' ? 'normal' : 'pending')
        );
      }

      if (this.hasHistoryWorkData) {
        const count = (this.historyWorkList || []).length;
        add(
          'history-work',
          '履历核验',
          '过往工作履历',
          count ? '已完成' : '待补充',
          count ? `共 ${count} 条任职记录` : '核验人员尚未录入工作履历',
          count ? 'normal' : 'pending'
        );
      }

      if (this.hasCareerRiskData) {
        const careerDefinitions = [
          { key: 'ty_dishonesty', label: '失信被执行' },
          { key: 'ty_high_consumption', label: '限制高消费' },
          { key: 'ty_notice_letter', label: '仲裁、调解或涉诉通知' },
          { key: 'ty_employment_contract_5y', label: '聘用合同争议' },
          { key: 'ty_resignation_dispute_5y', label: '辞职争议' },
          { key: 'ty_personnel_dispute', label: '人事争议' },
          ...this.laborRiskItems,
          ...this.socialRiskItems
        ];
        const uniqueDefinitions = Array.from(new Map(
          careerDefinitions.map(item => [item.key, item])
        ).values());
        const hits = uniqueDefinitions.filter(item => (
          this.getCareerRiskStatus(this.getCareerRiskValue(item.key)) === '命中'
        ));
        add(
          'career-risk',
          '职业履职',
          '职业履职风险',
          '已完成',
          hits.length ? `${hits.length} 项需关注：${hits.map(item => item.label).join('、')}` : '未查询到明确命中项',
          hits.length ? 'warning' : 'normal'
        );
      }

      if (this.hasJudicialData) {
        const caseGroups = [
          ['民事案件', (this.minshiCases || []).length],
          ['刑事案件', (this.xingshiCases || []).length],
          ['执行案件', (this.zhixingCases || []).length],
          ['破产清算', (this.bankruptCases || []).length],
          ['财产保全', (this.baoquanCases || []).length],
          ['行政案件', (this.xingzhengCases || []).length]
        ];
        const total = caseGroups.reduce((sum, item) => sum + item[1], 0);
        const details = caseGroups.filter(item => item[1] > 0).map(item => `${item[0]} ${item[1]} 条`);
        add(
          'judicial',
          '司法核验',
          '司法案件核验',
          '已完成',
          total ? `共 ${total} 条记录（${details.join('、')}）` : '未查询到司法案件记录',
          total ? 'warning' : 'normal'
        );
      }

      if (this.hasJudicialData) {
        const shixin = (this.shixinList || []).length;
        const xianGao = (this.xianGaoList || []).length;
        add(
          'dishonesty',
          '信用核验',
          '失信与限制高消费',
          '已完成',
          shixin || xianGao ? `失信 ${shixin} 条，限制高消费 ${xianGao} 条` : '未查询到失信或限制高消费记录',
          shixin || xianGao ? 'critical' : 'normal'
        );
      }

      if (this.hasPoliceData) {
        const policeTypes = [
          ['A', '前科'], ['B', '经济类前科'], ['C', '妨害社会管理秩序'],
          ['D', '在逃'], ['E', '涉案'], ['G', '涉交通刑案'], ['F', '重点人员']
        ];
        const hits = policeTypes
          .filter(item => this.getBadPersonTextA(this.policeBadLevel, item[0]) === '命中')
          .map(item => item[1]);
        if (this.getLitigationPartyStatus() === '命中') hits.push('诉讼当事人');
        add(
          'police',
          '风险核验',
          '不良人员核验',
          '已完成',
          hits.length ? `命中 ${hits.length} 个类别：${hits.join('、')}` : '未查询到命中记录',
          hits.length ? 'critical' : 'normal'
        );
      }

      if (this.hasFraudData) {
        const fraudTypes = [
          ['moneyLaundering', '跑分洗钱'],
          ['deceiver', '欺诈'],
          ['gamblerPlayer', '赌博玩家'],
          ['gamblerBanker', '赌博庄家']
        ];
        const concerns = fraudTypes.map(item => ({
          label: item[1],
          status: this.getfanzhafuduA(this.comprehensiveScoress(item[0]))
        })).filter(item => item.status !== '无风险');
        add(
          'fraud',
          '风险核验',
          '涉赌涉诈风险核验',
          '已完成',
          concerns.length
            ? concerns.map(item => `${item.label}${item.status}`).join('、')
            : '未见明显异常',
          concerns.length ? 'warning' : 'normal'
        );
      }

      if (this.hasCompanyData) {
        const companyList = this.companyRelationData?.data?.data?.data?.datalist || [];
        add(
          'company',
          '企业核验',
          '人企关联',
          '已完成',
          companyList.length ? `共 ${companyList.length} 家关联企业` : '未查询到相关企业关联信息',
          'normal'
        );
      }

      if (this.hasLoanData) {
        const overdue = Number.parseInt(this.comprehensiveScoress('tanzhen_currently_overdue'), 10) || 0;
        const overdueFlags = ['zc_seriousOverdue', 'zc_generalOverdue', 'zc_slightlOverdue', 'zc_suspectFraud']
          .filter(field => Number.parseInt(this.comprehensiveScoress(field), 10) === 1).length;
        const resultParts = [];
        const attentionParts = [];
        if (this.hasLoanApplicationData) {
          const idCount = this.getTotalLoanCountLastYear();
          const phoneCount = this.getTotalLoanCountLastYearbypho();
          resultParts.push(`近1年贷款申请：身份证维度 ${idCount} 次，手机号维度 ${phoneCount} 次`);
        }
        if (overdue) attentionParts.push(`当前逾期 ${overdue} 笔`);
        if (this.blacklistOrgCount) attentionParts.push(`黑名单命中 ${this.blacklistOrgCount} 类机构`);
        if (overdueFlags) attentionParts.push(`${overdueFlags} 项逾期或欺诈标签命中`);
        resultParts.push(...attentionParts);
        add(
          'loan',
          '信贷核验',
          '信贷逾期与借贷分布',
          '已完成',
          resultParts.join('，') || '未查询到明确逾期或黑名单命中',
          attentionParts.length ? 'warning' : 'normal'
        );
      }

      if (this.hasVehicleCount || this.hasEtcFieldFromBackend) {
        const vehicleCount = this.getCarNum();
        add(
          'assets',
          '资产核验',
          '机动车与 ETC 信息',
          '已完成',
          `名下车辆 ${vehicleCount || 0} 辆，ETC 关联记录 ${(this.vehicleList || []).length} 条`,
          'normal'
        );
      }

      if (this.hasInternetBehaviorData) {
        const behaviorFields = [
          'sjbq_zlbz', 'sjbq_ychy', 'sjbq_xjzl', 'sjbq_ymd', 'sjbq_sfcy',
          'sjbq_ycxw', 'sjbq_sxxw', 'sjbq_zfyc', 'sjbq_qtyc', 'sjbq_swhjyc'
        ];
        const hitCount = behaviorFields.filter(field => (
          this.getBehaviorText(this.comprehensiveScoress(field)) === '命中'
        )).length;
        add(
          'internet-behavior',
          '行为核验',
          '互联网行为标签',
          '已完成',
          hitCount ? `${hitCount} 项行为标签命中` : '未查询到明确命中项',
          hitCount ? 'warning' : 'normal'
        );
      }

      if (this.hasSimpleConsumptionData) {
        add(
          'consumption',
          '消费核验',
          '消费金额区间',
          '已完成',
          '近十二个月消费金额区间已返回',
          'normal'
        );
      }

      if (this.hasExtraInfo) {
        add(
          'extra',
          '补充信息',
          '后台补充说明',
          '已完成',
          '已录入补充核验信息',
          'normal'
        );
      }

      return rows;
    },

    overviewScopeList() {
      return this.overviewSummaryRows.map(item => item.project);
    },

    overviewCompletedCount() {
      return this.overviewSummaryRows.filter(item => item.status === '已完成').length;
    },

    overviewPendingRows() {
      return this.overviewSummaryRows.filter(item => item.status !== '已完成');
    },

    overviewRiskTips() {
      const recommendationMap = {
        identity: '建议核对候选人提交资料与实名核验结果，确认差异原因后再作判断。',
        education: '建议核对学历证书编号，必要时要求候选人补充有效证明材料。',
        employment: '建议重点查看 HR 与直属上级核验明细，并就不一致项向候选人复核。',
        'career-risk': '建议结合争议类型、案件时间、候选人角色及岗位要求进行人工复核。',
        judicial: '建议查看案件阶段、案由、涉案身份、金额及当前执行状态，避免仅按记录数量判断。',
        dishonesty: '建议重点核验履行状态、限制措施是否解除及相关法律文书。',
        police: '建议优先核实命中身份和具体类别，排除同名、身份误匹配等情况。',
        fraud: '建议结合风险等级、发生时间和岗位资金权限进行审慎复核。',
        loan: '建议结合逾期程度、发生时间、岗位诚信要求及候选人说明综合判断。',
        'internet-behavior': '建议查看具体命中标签和数据时效，不宜脱离业务场景单独使用。'
      };

      return this.overviewSummaryRows
        .filter(item => item.resultTone === 'warning' || item.resultTone === 'critical')
        .map(item => ({
          key: item.key,
          level: item.resultTone,
          title: `${item.project}存在需关注事项`,
          description: `${item.result}。${recommendationMap[item.key] || '建议查看对应模块明细并进行人工复核。'}`
        }));
    },

    // 报告标题：根据 searchType 匹配字典 report_type 得到显示值，未匹配时用兜底
    reportTitle() {
      const label = this.getDictLabel('reporttype', this.searchType);
      if (label) return label;
      const st = this.searchType;
      if (st === 1 || st === '1') return '基础通用背调报告';
      if (st === 15 || st === '15') return '基层员工背调';
      if (st === 16 || st === '16') return '定制高管背调(带任职记录)';
      return '基础通用背调报告';
    },
    //反赌反诈

    // 车辆列表（改为计算属性，避免在模板中重复调用方法）
    vehicleList() {
      // 优先尝试 carListAll，如果找不到再尝试 list_youshuche
      let vehicleData = this.comprehensiveScoress("carListAll", true);
      
      // 如果 carListAll 找不到数据，尝试 list_youshuche
      if (!vehicleData) {
        vehicleData = this.comprehensiveScoress("list_youshuche", true);
      }
      
      if (!vehicleData) {
        return [];
      }
      
      // 新格式：数据直接在 list_result 中
      if (vehicleData.list_result && Array.isArray(vehicleData.list_result)) {
        return vehicleData.list_result;
      }
      
      // 旧格式：数据在 pointed_object.list_result 中
      if (
        vehicleData.pointed_object &&
        vehicleData.pointed_object.list_result &&
        Array.isArray(vehicleData.pointed_object.list_result)
      ) {
        return vehicleData.pointed_object.list_result;
      }
      
      return [];
    },
    // 是否有 ETC 实际明细数据（决定是否展示表格内容）
    hasEtcData() {
      return Array.isArray(this.vehicleList) && this.vehicleList.length > 0;
    },
    // 后端是否有返回与车辆 / ETC 相关的字段（用于区分“没查这个接口”和“查了但查空”）
    hasEtcFieldFromBackend() {
      // 车列表相关字段
      let vehicleData = this.comprehensiveScoress("carListAll", true);
      if (!vehicleData) {
        vehicleData = this.comprehensiveScoress("list_youshuche", true);
      }
      if (vehicleData) {
        return true;
      }

      // 兜底：如果存在车牌字段定义，也认为后端有返回车相关结构
      const plateNumDef = this.getItemByFiledName(this.dataAll, "plateNum");
      if (plateNumDef) {
        return true;
      }

      return false;
    },
    // 是否有名下车辆数量数据（决定是否展示“名下所有车辆数量”这块内容）
    hasVehicleCount() {
      const vehiclesNumInfo = this.getItemByFiledName(this.dataAll, "vehiclesNumInfo");
      if (vehiclesNumInfo && vehiclesNumInfo.list_result && Array.isArray(vehiclesNumInfo.list_result)) {
        for (const row of vehiclesNumInfo.list_result) {
          if (Array.isArray(row)) {
            for (const item of row) {
              if (item && item.filed_name === "carNum") return true; // 字段存在即显示
            }
          }
        }
      }
      return !!this.comprehensiveScoress("carNum", true); // 旧格式：字段存在即显示
    },
    
    genderData() {
      return this.comprehensiveScoress("gender", true);
    },
    ageData() {
      return this.comprehensiveScoress("age", true);
    },
    addressData() {
      return this.comprehensiveScoress("address", true);
    },
    finalAuthResult() {
      return this.comprehensiveScoress("final_auth_result");
    },
    marriageStatus() {
      // 新学历数据结构中若有婚姻状态，优先使用
      const eduMarriage = this.getEducationMarriageStatus();
      if (eduMarriage) return eduMarriage;
      return this.comprehensiveScoress("state") || this.comprehensiveScoress("op_type");
    },
    marriageStatusDisplay() {
      const status = this.marriageStatus;
      const regTimeRaw = this.comprehensiveScoress("zhicha_regTime");
      const regTime = regTimeRaw == null ? "" : String(regTimeRaw).trim();
      const hasRegTime = regTime && regTime !== "-" && regTime !== "--";
      if (status && hasRegTime) return `${status}（登记时间：${regTime}）`;
      return status || "-";
    },
    // 首页卡片展示用：手机号（脱敏）、手机状态、身份证号（脱敏）
    displayMobile() {
      const raw = this.phoneNumber || '';
      if (!raw) return '1*********';
      const s = String(raw).replace(/\s/g, '');
      if (s.length >= 7) {
        return s.replace(/(\d{3})\d{4}(\d+)/, '$1****$2');
      }
      return s;
    },
 
    phoneStatusText() {
      return (
        this.comprehensiveScoress('zaiwang_msg') ||
        this.comprehensiveScoress('zaiwang_state') ||
        '正常'
      );
    },
    displayIdNumber() {
      const raw = this.idCard || '';
      if (!raw) return '******************';
      const s = String(raw).replace(/\\s/g, '');
      if (s.length >= 8) {
        const head = s.slice(0, 2);
        const tail = s.slice(-2);
        return head + '**************' + tail;
      }
      return '******************';
    },
    // 公安重点人员核验相关计算属性（优化重复调用）
    policeBadLevel() {
      return this.comprehensiveScoress('police_bad_level');
    },
    //学历
    educationData() {

      return this.transformEducationData();
    },
    //人企
    companyRelationData() {

      return this.transformCompanyRelationData();
    },
    // 判断是否有企业关联数据（区分：后端没传 vs 传了查空）
    // 只要后端返回了企业相关结构（legRepInfoList/ryPosPerList/shareholderList 或 fr_/rz_/tz_ 字段定义），就显示模块；查空时展示「未查询到相关企业关联信息」
    hasCompanyData() {
      if (!this.dataAll || !Array.isArray(this.dataAll)) {
        return false;
      }

      // 旧格式：qiye 字段
      const oldFormatData = this.getItemByFiledName(this.dataAll, "qiye");
      if (oldFormatData?.pointed_object) {
        return true;
      }

      // 新格式：legRepInfoList / ryPosPerList / shareholderList（查空时 list_result 为 null，但字段存在即表示有查询）
      const listFields = ["legRepInfoList", "ryPosPerList", "shareholderList"];
      for (const name of listFields) {
        const ref = this.getItemByFiledName(this.dataAll, name);
        if (ref) return true;
      }

      // 新格式：存在 fr_/rz_/tz_ 前缀的字段定义（不要求 list_result 有数据，有结构即表示后端有查询）
      const hasFieldDef = this.dataAll.some(item =>
        item &&
        item.list &&
        Array.isArray(item.list) &&
        item.list.some(listItem => {
          const fn = listItem?.filed_name || "";
          return fn.startsWith("fr_") || fn.startsWith("rz_") || fn.startsWith("tz_");
        })
      );
      if (hasFieldDef) return true;

      // jh_company_detail：人企明细（list 内节点，list_result 为二维数组）
      const hasJhCompanyDetail = this.dataAll.some(
        (item) =>
          item &&
          Array.isArray(item.list) &&
          item.list.some((li) => li && li.filed_name === "jh_company_detail")
      );
      if (hasJhCompanyDetail) return true;

      return false;
    },
    //司法案件
    // 性能优化：缓存司法数据转换结果，避免重复计算
    judicialData() {
      // 生成缓存键（基于 dataAll 的引用或长度）
      const cacheKey = this.dataAll ? `${this.dataAll.length}_${JSON.stringify(this.dataAll.slice(0, 3).map(item => item?.filed_name))}` : 'empty';
      
      // 如果数据未变化且缓存存在，直接返回缓存
      if (this._judicialDataCacheKey === cacheKey && this._cachedJudicialData !== null) {
        return this._cachedJudicialData;
      }
      
      // 重新计算并缓存
      const result = this.transformJudicialData();
      this._cachedJudicialData = result;
      this._judicialDataCacheKey = cacheKey;
      
      return result;
    },
    //民事案件
    minshiCases() {
      const judicialData = this.judicialData;
      return judicialData?.data?.data?.entout?.[0]?.entout?.civil?.cases || [];
    },
    //刑事案件
    xingshiCases() {
      const judicialData = this.judicialData;
      return judicialData?.data?.data?.entout?.[0]?.entout?.criminal?.cases || [];
    },
    //执行
    zhixingCases() {
      const judicialData = this.judicialData;
      return judicialData?.data?.data?.entout?.[0]?.entout?.implement?.cases || [];
    },
    // 失信被执行列表（cases7）
    shixinList() {
      const judicialData = this.judicialData;
      return judicialData?.data?.data?.dishonesty?.shixinList || [];
    },
    // 限高被执行列表（cases8）
    xianGaoList() {
      const judicialData = this.judicialData;
      return judicialData?.data?.data?.dishonesty?.xianGaoList || [];
    },
    //强制清算与破产
    bankruptCases() {
      const judicialData = this.judicialData;
      return judicialData?.data?.data?.entout?.[0]?.entout?.bankrupt?.cases || [];
    },
    //保全
    baoquanCases() {
      const judicialData = this.judicialData;
      return judicialData?.data?.data?.entout?.[0]?.entout?.preservation?.cases || [];
    },
    //行政
    xingzhengCases() {
      const judicialData = this.judicialData;
      return judicialData?.data?.data?.entout?.[0]?.entout?.administrative?.cases || [];
    },
    // 判断是否存在司法案件数据
    hasJudicialData() {
      // 检查是否存在司法数据，支持新旧两种格式
      const judicialRawData = this.getItemByFiledName(this.dataAll, "dataAll");
      
      // 旧格式：检查 pointed_object
      if (judicialRawData && judicialRawData.pointed_object) {
        return true;
      }
      
      // 新格式：检查是否有 list_result（即使为空数组或null，只要结构存在就显示）
      if (judicialRawData && (judicialRawData.list_result || judicialRawData.list)) {
        return true;
      }
      
      // 新格式：从 dataAll 中直接查找包含司法数据的元素
      // 即使 list_result 为 null，只要 list 中有 cases1-6 的定义就显示
      if (this.dataAll && Array.isArray(this.dataAll)) {
        const judicialItem = this.dataAll.find(item => 
          item && 
          item.list && 
          Array.isArray(item.list) &&
          item.list.some(listItem => listItem && ['cases1', 'cases2', 'cases3', 'cases4', 'cases5', 'cases6'].includes(listItem.filed_name))
        );
        if (judicialItem) {
          return true;
        }
      }
      
      return false;
    },
    // 判断是否存在失信被执行信息（后端不传才隐藏；传了 dishonesty 但 shixinList 为空仍显示）
    hasShixinData() {
      return !!this.judicialData?.data?.data?.dishonesty;
    },
    // 系统字典 if_edu_exist：dictLabel=报告类型 id，dictValue=1 显示学历模块、0 隐藏；字典未加载或无匹配行时默认显示（兼容）
    // 仅在后端返回新的学历证书核验标准结构时展示。
    hasEducationData() {
      return this.educationData.length > 0;
    },
    // 额外信息：有内容才展示模块
    hasExtraInfo() {
      return !!(this.extraInfo && String(this.extraInfo).trim());
    },
    // 工作履历显隐只服从本单套餐配置，不再依赖字典或报告类型。
    hasHistoryWorkData() {
      return this.candidateModules.includes('work_history');
    },
    hasEmploymentVerification() {
      return this.candidateModules.includes('employment_one')
        || this.candidateModules.includes('employment_two');
    },
    // 后台仍分别保存 HR 核验和上级访谈，报告按工作经历序号将二者归并展示。
    employmentVerificationSections() {
      const configuredCount = this.candidateModules.includes('employment_two')
        ? 2
        : (this.candidateModules.includes('employment_one') ? 1 : 0);
      const employmentList = Array.isArray(this.employmentVerifyList)
        ? this.employmentVerifyList : [];
      const interviewList = Array.isArray(this.interviewList)
        ? this.interviewList : [];
      const sectionCount = Math.max(
        configuredCount,
        employmentList.length,
        interviewList.length
      );

      return Array.from({ length: sectionCount }, (_, index) => {
        const employment = employmentList[index] || {};
        const interview = interviewList[index] || {};
        const hrReference = employment.hrReference || {};
        const items = Array.isArray(employment.items) ? employment.items : [];
        const assessments = interview.assessments || {};
        const hasHrResult = Boolean(
          hrReference.refName
          || hrReference.refPhone
          || hrReference.refSource
          || hrReference.refPosition
          || hrReference.relation
          || hrReference.duration
          || hrReference.note
          || items.some(item => item && (
            String(item.candidateValue || '').trim()
            || String(item.truth || '').trim()
            || String(item.note || '').trim()
          ))
        );
        const hasSupervisorResult = Boolean(
          interview.refName
          || interview.refPhone
          || interview.refSource
          || interview.refPosition
          || interview.relation
          || interview.duration
          || Object.values(assessments).some(value => String(value || '').trim())
        );

        return {
          employment,
          interview,
          companyName: employment.employerName || interview.companyName || '',
          hasHrResult,
          hasSupervisorResult
        };
      });
    },
    historyWorkList() {
      return Array.isArray(this.historyWorkValue) ? this.historyWorkValue : [];
    },
    // 判断是否存在“是否有房”字段（只要后端返回该字段就显示，即使值为空也显示）
    hasHouseData() {
      const houseData = this.comprehensiveScoress("house_ownership_bool", true);
      return !!houseData;
    },
    // 判断是否存在公安重点人员核验数据
    hasPoliceData() {
      // 只检查是否存在公安重点人员核验的标签，只要标签存在就显示板块（使用短路求值优化性能）
      return !!(this.comprehensiveScoress("police_bad_level", true)?.pointed_object);
    },
    // 判断是否存在涉赌涉诈核验数据
    hasFraudData() {
      // 只检查是否存在涉赌涉诈核验的标签，只要标签存在就显示板块（即使数据列表为空，使用短路求值优化性能）
      return !!(this.comprehensiveScoress("fandufanzha_code",true)?.pointed_object);
    },
    // 判断是否存在职业风险审查数据（后端不传才隐藏；传了 ty_ 字段即显示，即使值为空）
    hasCareerRiskData() {
      const careerFields = ['ty_dishonesty', 'ty_high_consumption', 'ty_labor_contract_5y', 'ty_collective_contract_5y', 'ty_compensation_5y', 'ty_dispatch_contract_5y', 'ty_labor_disputes_5y', 'ty_labor_relation_5y', 'ty_non_compete_5y', 'ty_wage_claim_5y', 'ty_dismissal_dispute_5y', 'ty_employment_contract_5y', 'ty_personnel_dispute_5y', 'ty_resignation_dispute_5y', 'ty_injury_insurance_5y', 'ty_maternity_insurance_5y', 'ty_medical_insurance_5y', 'ty_pension_5y', 'ty_commercial_insurance_5y'];
      return careerFields.some(f => !!this.comprehensiveScoress(f, true));
    },
    // 判断是否存在互联网行为推测数据
    hasInternetBehaviorData() {
      // 只检查是否存在互联网行为推测的标签，只要标签存在就显示板块（使用短路求值优化性能）
      return !!(this.comprehensiveScoress("sjbq_zlbz", true)?.pointed_object);
    },
    // 判断是否存在名下资产数据（后端不传才隐藏；传了但 list_result 为空仍显示）
    hasAssetsData() {
      const carNumData = this.comprehensiveScoress("carNum", true);
      const carListData = this.comprehensiveScoress("carListAll", true);
      const oldCarListData = this.comprehensiveScoress("list_youshuche", true);
      if ((carNumData && carNumData.pointed_object) || (oldCarListData && oldCarListData.pointed_object)) return true;
      if (carListData && carListData.list_result && Array.isArray(carListData.list_result)) return true;
      return false;
    },
    // 黑名单命中机构数（统计各类型 zc_is* 为 1 的个数）
    blacklistOrgCount() {
      const fields = ['zc_isBank', 'zc_isNetloan', 'zc_isSloan', 'zc_isConsume', 'zc_isFinlea', 'zc_isAutofin', 'zc_isOther'];
      return fields.reduce((sum, field) => {
        const v = this.comprehensiveScoress(field);
        if (v !== null && v !== undefined && v !== '' && v !== '—' && parseInt(v) === 1) return sum + 1;
        return sum;
      }, 0);
    },
    // 判断是否存在逾期状况数据
    hasOverdueData() {
      // 检查逾期相关标签，只要其中一个存在就显示子模块（使用短路求值优化性能）
      // 检查旧格式（pointed_object）或新格式（直接有值）
      const hasOldFormat = (this.comprehensiveScoress("xyp_cpl0071", true)?.pointed_object) || 
             (this.comprehensiveScoress("xyp_cpl0072", true)?.pointed_object) || 
             (this.comprehensiveScoress("latest_overdue_time", true)?.pointed_object) ||
             (this.comprehensiveScoress("quan_neng_xiao_jin", true)?.pointed_object);
      
      // 检查新格式字段（黑名单、欺诈/逾期状态；字段存在即显示）
      const hasNewFormat = this.hasNewBlacklistData || 
                           this.hasFraudOverdueStatusData ||
                           !!this.comprehensiveScoress("tanzhen_currently_overdue", true);
      
      return hasOldFormat || hasNewFormat;
    },
    // 判断是否存在贷款申请情况数据
    hasLoanApplicationData() {
      // 检查贷款申请相关标签，只要其中一个存在就显示子模块（使用短路求值优化性能）
      return (this.comprehensiveScoress("sq_pho_num_tot_diffday_min", true)?.pointed_object) || 
             (this.comprehensiveScoress("sq_per_num_tot_diffday_min", true)?.pointed_object) ||
             (this.comprehensiveScoress("als_m12_id_bank_allnum", true)?.pointed_object) ||
             (this.comprehensiveScoress("als_m12_cell_bank_allnum", true)?.pointed_object);
    },
    // 判断是否存在贷款类型详细分析数据
    hasLoanTypeAnalysisData() {
      // 检查贷款类型分析相关标签，只要其中一个存在就显示子模块（使用短路求值优化性能）
      return (this.comprehensiveScoress("als_d7_id_bank_week_orgnum", true)?.pointed_object) ||
             (this.comprehensiveScoress("als_d7_id_bank_orgnum", true)?.pointed_object);
    },
    // 判断是否存在新版黑名单数据（后端不传才隐藏；传了但值为空仍显示）
    hasNewBlacklistData() {
      const fields = ["zc_isBank", "zc_isNetloan", "zc_isSloan", "zc_isConsume", "zc_isFinlea", "zc_isAutofin", "zc_isOther"];
      return fields.some(field => !!this.comprehensiveScoress(field, true));
    },
    // 判断是否存在最新欺诈/逾期状态数据（后端不传才隐藏；传了但值为空仍显示）
    hasFraudOverdueStatusData() {
      const fields = ["zc_seriousOverdue", "zc_generalOverdue", "zc_slightlOverdue", "zc_suspectFraud"];
      return fields.some(field => !!this.comprehensiveScoress(field, true));
    },
    // 判断是否存在贷款情况数据（父容器）
    hasLoanData() {
      // 只要有一个子模块显示，父容器就显示
      return this.hasOverdueData ||
             this.hasLoanApplicationData ||
             this.hasLoanTypeAnalysisData;
    },
    // 消费金额区间：后端不传才隐藏；后端传了但值为空仍显示
    hasSimpleConsumptionData() {
      const fields = ['tap080', 'tap081', 'tap082', 'tap083', 'tap084', 'tap085'];
      return fields.some((f) => this.getItemByFiledName(this.dataAll, f));
    },
    // 判断是否存在身份信息核验数据
    hasIdentityData() {
      // 检查身份信息相关标签，只要其中一个存在就显示模块（使用短路求值优化性能）
      // 排除只有手机号码归属地相关字段的情况
      const gender = this.comprehensiveScoress("gender", true)?.pointed_object;
      const age = this.comprehensiveScoress("age", true)?.pointed_object;
      const address = this.comprehensiveScoress("address", true)?.pointed_object;
      const final_auth_result = this.comprehensiveScoress("final_auth_result", true)?.pointed_object;
      const state = this.comprehensiveScoress("state", true)?.pointed_object;
      const zaiwang_msg = this.comprehensiveScoress("zaiwang_msg", true)?.pointed_object;
      const shouji_province = this.comprehensiveScoress("shouji_province", true)?.pointed_object;
      const shouji_city = this.comprehensiveScoress("shouji_city", true)?.pointed_object;
      const zaiwangf_msg = this.comprehensiveScoress("zaiwangf_msg", true)?.pointed_object;
      const codetianyuansanyaosu = this.comprehensiveScoress("codetianyuansanyaosu", true)?.pointed_object;
       const op_date = this.comprehensiveScoress("op_date", true)?.pointed_object;
      // 检查是否有非手机号码归属地的字段
      const hasNonLocationField = gender || age || address || final_auth_result || 
                                   state || zaiwang_msg || zaiwangf_msg || codetianyuansanyaosu || op_date;
      
      // 如果只有手机号码归属地字段，不显示模块
      if (!hasNonLocationField && (shouji_province || shouji_city)) {
        return false;
      }
      
      // 否则，只要有一个字段存在就显示
      return hasNonLocationField || shouji_province || shouji_city;
    },

  },
  beforeUnmount() {
    // 清理缓存
    this._cachedJudicialData = null;
    this._judicialDataCacheKey = null;
  },
  methods: {
    // 导出整页为PNG图片
   async exportPdf() {
     if (this.exporting) return;
     this.exporting = true;
     // 在 try 外声明：恢复动作要放进 finally，否则导出中途抛错，
     // 报告页宽度就被永久固定在 900px，用户看到的页面直接变形
     let widthPatchTarget = null;
     let prevWidth = '';
     let prevMaxWidth = '';
     try {
       uni.showLoading({ title: '导出中' });
       // 动态加载依赖，避免首屏体积增大
       const { default: html2canvas } = await import(/* webpackChunkName: 'html2canvas' */ 'html2canvas');
       const root = this.$refs.pdfdom || (this.$el && this.$el.querySelector && this.$el.querySelector('.module-container'));
       if (!root) {
         this.$message.error('未找到需要导出的容器');
         return;
       }
       await this.$nextTick();

       // 逐模块渲染，而不是整页拍一张大图。
       // 原实现把整个报告渲成单张 canvas，一旦超过浏览器的 canvas 边长上限
       // （Chrome 约 16384px），拿到的就是被截断的图，且 html2canvas 不报错——
       // 表现就是「导出的 PDF 少了后半截」。报告通常远超这个高度。
       // 分模块后每张图都很小，既不会触顶，也能稳定用 scale=2 保住清晰度；
       // 附带好处是分页落在模块之间，表格不会再被从中间腰斩。
       const all = Array.from(root.querySelectorAll('.module-container[id]'));
       // 模块可能嵌套，只保留最外层，避免同一块被渲染两次
       const blocks = all.filter(el => !all.some(other => other !== el && other.contains(el)));
       const targets = blocks.length ? blocks : [root];

       // 导出前把容器固定到统一的打印宽度。三个原因：
       // 1) 模块是 max-width:900px 居中，窗口窄时会被压缩，导出结果随窗口大小而变；
       // 2) 报告里的表格有 min-width:800px，容器一窄表格就溢出，
       //    此时 scrollWidth 会大于模块实际渲染宽度——之前按它取 canvas 宽度，
       //    右边就多出一大条空白，高度同理不准，底部整行被切掉；
       // 3) 固定宽度后每次导出的版式一致，不会因人而异。
       widthPatchTarget = root;
       prevWidth = root.style.width;
       prevMaxWidth = root.style.maxWidth;
       root.style.width = '900px';
       root.style.maxWidth = '900px';
       await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

       const pdf = new jsPDF('p', 'mm', 'a4');
       const pageWidth = 210;
       const pageHeight = 297;
       const margin = 8;
       const gap = 4;
       const contentWidth = pageWidth - margin * 2;
       const contentBottom = pageHeight - margin;

       let cursorY = margin;
       let hasContent = false;

       for (const block of targets) {
         const rect = block.getBoundingClientRect();
         const width = Math.max(1, Math.round(rect.width));
         const height = Math.max(1, Math.round(rect.height));
         // 空模块只剩边框（实测有高度 10px 上下的），单独占一张图纯属浪费
         if (height < 40) continue;

         const scale = this._getSafeCanvasScale(width, height);
         // 不传 width/height/windowWidth：传了会改变渲染视口触发重排，
         // 让 html2canvas 按元素自身的实际渲染尺寸截取
         const canvas = await html2canvas(block, {
           scale,
           useCORS: true,
           allowTaint: false,
           backgroundColor: '#FFFFFF',
           logging: false
         });
         if (!canvas.width || !canvas.height) continue;

         const blockHeightMm = (canvas.height / canvas.width) * contentWidth;

         if (blockHeightMm <= contentBottom - margin) {
           // 整块放得下：当前页塞不下就换页，保证模块不被拆开
           if (hasContent && cursorY + blockHeightMm > contentBottom) {
             pdf.addPage();
             cursorY = margin;
           }
           pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, cursorY, contentWidth, blockHeightMm);
           cursorY += blockHeightMm + gap;
           hasContent = true;
         } else {
           // 单个模块本身就超过一页（例如司法涉诉记录条目很多），只能内部切割
           if (hasContent) {
             pdf.addPage();
             cursorY = margin;
           }
           const pxPerMm = canvas.width / contentWidth;
           const sliceHeightPx = Math.floor((contentBottom - margin) * pxPerMm);
           let offset = 0;
           while (offset < canvas.height) {
             const currentPx = Math.min(sliceHeightPx, canvas.height - offset);
             const slice = document.createElement('canvas');
             slice.width = canvas.width;
             slice.height = currentPx;
             const ctx = slice.getContext('2d');
             ctx.fillStyle = '#FFFFFF';
             ctx.fillRect(0, 0, slice.width, slice.height);
             ctx.drawImage(canvas, 0, offset, canvas.width, currentPx, 0, 0, canvas.width, currentPx);

             if (offset > 0) pdf.addPage();
             pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, contentWidth, currentPx / pxPerMm);
             offset += currentPx;
           }
           cursorY = margin + (canvas.height % sliceHeightPx || sliceHeightPx) / pxPerMm + gap;
           hasContent = true;
         }
       }

       if (!hasContent) {
         this.$message.error('报告内容为空，无法导出');
         return;
       }

       pdf.save(`综合评估报告_${this.currentId}.pdf`);
       this.$message.success('PDF 下载完成');
     } catch (e) {
       console.error('导出失败', e);
       this.$message.error('导出失败，请稍后重试');
     } finally {
       if (widthPatchTarget) {
         widthPatchTarget.style.width = prevWidth;
         widthPatchTarget.style.maxWidth = prevMaxWidth;
       }
       this.exporting = false;
       uni.hideLoading();
     }
   },
    async startAutoDownloadIfNeeded() {
      if (this.$route.query.download !== '1' || this.autoDownloadStarted) return;
      this.autoDownloadStarted = true;
      await this.$nextTick();
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
      await this.exportPdf();
    },
    _getSafeCanvasScale(width, height) {
      const preferredScale = 2;
      // 浏览器对单个 canvas 的边长有硬上限，Chrome 实测超过约 16384px 就会
      // 返回空白或截断的位图，而 html2canvas 不会报错——表现就是「导出的 PDF 少了后半截」。
      // 原值 22000 高于这个上限，报告只要超过约 8200px 高就开始丢内容。
      // 这里留出余量取 15000，长报告会自动降 scale 换取完整性。
      const maxCanvasSide = 15000;
      const maxCanvasArea = 65000000;
      const safeWidth = Math.max(1, Number(width) || 1);
      const safeHeight = Math.max(1, Number(height) || 1);
      const dimensionScale = Math.min(maxCanvasSide / safeWidth, maxCanvasSide / safeHeight);
      const areaScale = Math.sqrt(maxCanvasArea / (safeWidth * safeHeight));
      const scale = Math.min(preferredScale, dimensionScale, areaScale);

      return Math.max(0.05, Math.floor(scale * 100) / 100);
    },
    // 对外主函数：返回命中对象完整体；若非末节点，则将完整“子对象”放在 pointed_object
    getItemByFiledName(dataAll, targetFiledName) {
      if (!dataAll) return null;

      // 使用缓存键
      const cacheKey = `item_${targetFiledName}`;
      
      // 检查缓存（注意：如果 dataAll 发生变化，需要清除缓存）
      if (this.itemByFiledNameCache && this.itemByFiledNameCache[cacheKey]) {
        return this.itemByFiledNameCache[cacheKey];
      }

      // 1) 收集全集（外层对象 + list 中的对象，递归）
      const allItems = this._collectAllItemsFromListOnly(dataAll);

      // 2) 首次命中：filed_name 精确匹配
      const hit = allItems.find(
        (it) => it && it.filed_name === targetFiledName
      );
      if (!hit) return null;

      const result = this._deepClone(hit);

      // 3) 命中的是末节点：直接返回完整对象
      if (String(result.point_index) === "0") {
        return result;
      }

      // 4) 非末节点：严格命中“专属子对象”
      // 保留你现在的过滤加偏好逻辑即可：
      const candidates = allItems.filter(
        (it) =>
          it &&
          String(it.point_index) === String(result.point_index) &&
          String(it.filed_name || "") !== String(result.filed_name || "")
      );

      // 优先选择“含 list_result”的完整对象（关键）
      const preferFull =
        candidates.find((it) => "list_result" in it) ||
        candidates.find(
          (it) =>
            "list_result" in it ||
            "listResult" in it ||
            "pathArray" in it ||
            "remark" in it
        );

      const branch = preferFull || candidates[0];
      if (branch) {
        result.pointed_object = this._deepClone(branch);
      }

      // 缓存结果（注意：对象引用，如果 dataAll 变化需要清除缓存）
      if (this.itemByFiledNameCache) {
        this.itemByFiledNameCache[cacheKey] = result;
      }

      return result;
    },
    // 仅收集“外层 + 所有嵌套在 list 字段里的对象”
    _collectAllItemsFromListOnly(dataAll) {
      const bag = [];

      const pushIfObject = (obj) => {
        if (obj && typeof obj === "object") bag.push(obj);
      };

      const walkArray = (arr) => {
        if (!Array.isArray(arr)) return;
        for (const item of arr) {
          pushIfObject(item);
          // 只深入 list
          if (item && item.list) {
            walkListMap(item.list);
          }
        }
      };
      const walkListMap = (listMap) => {
        if (!listMap || typeof listMap !== "object") return;
        const keys = Object.keys(listMap);
        for (const k of keys) {
          const obj = listMap[k];
          pushIfObject(obj);
          if (obj && obj.list) {
            walkListMap(obj.list);
          }
        }
      };
      if (Array.isArray(dataAll)) {
        walkArray(dataAll);
      } else if (dataAll && typeof dataAll === "object") {
        // 根是对象：把 value 当作一层 list 扫描
        const tmp = { list: dataAll };
        walkListMap(tmp.list);
      }

      return bag;
    },

    _deepClone(obj) {
      return JSON.parse(JSON.stringify(obj));
    },

    // 从学历数据结构中提取婚姻状态（暂不实现，仅作占位）
    getEducationMarriageStatus() {
      return "";
    },

    // 只查找新的学历证书核验标准块，不再兼容旧学历字段。
    findEducationVerificationBlock(node, depth = 0) {
      if (!node || depth > 20) return null;
      if (
        node &&
        typeof node === "object" &&
        node.filed_name === "education_certificate_verification"
      ) {
        return node;
      }
      if (Array.isArray(node)) {
        for (const child of node) {
          const found = this.findEducationVerificationBlock(child, depth + 1);
          if (found) return found;
        }
        return null;
      }
      if (typeof node === "object") {
        for (const value of Object.values(node)) {
          const found = this.findEducationVerificationBlock(value, depth + 1);
          if (found) return found;
        }
      }
      return null;
    },

    transformEducationData() {
      const block = this.findEducationVerificationBlock(this.dataAll);
      const rows = Array.isArray(block?.list_result) ? block.list_result : [];
      const statusMeta = {
        MATCHED: { label: "核验一致", className: "matched", message: "学历证书信息核验成功" },
        NOT_FOUND: { label: "未查询到记录", className: "not-found", message: "未查询到与该证书编号匹配的学历记录" },
        ERROR: { label: "核验失败", className: "error", message: "学历核验服务暂时不可用" },
        NO_INPUT: { label: "未提供编号", className: "no-input", message: "候选人未提供学历证书编号，未执行自动核验" },
      };

      return rows
        .filter((row) => Array.isArray(row))
        .map((row, index) => {
          const values = {};
          row.forEach((field) => {
            const name = String(field?.filed_name || "");
            if (name.startsWith("educationVerify-")) {
              values[name.slice("educationVerify-".length)] =
                field?.value == null ? "" : String(field.value).trim();
            }
          });
          const queryStatus = statusMeta[values.queryStatus]
            ? values.queryStatus
            : "ERROR";
          const meta = statusMeta[queryStatus];
          const sequence = Number.parseInt(values.sequence, 10);
          return {
            sequence: Number.isFinite(sequence) ? sequence : index + 1,
            certificateNo: values.certificateNo || "",
            queryStatus,
            statusLabel: meta.label,
            statusClass: meta.className,
            message: values.message || meta.message,
            school: values.school || "",
            major: values.major || "",
            majorCategory: values.majorCategory || "",
            educationLevel: values.educationLevel || "",
            enrollmentDate: values.enrollmentDate || "",
            graduationDate: values.graduationDate || "",
            learningForm: values.learningForm || "",
            duration: values.duration || "",
            studyStatus: values.studyStatus || "",
            certificateType: values.certificateType || "",
          };
        })
        .sort((left, right) => left.sequence - right.sequence);
    },
    //-------------------------------------------------
    //-------------------------------------------------
    //-------------------------------------------------
    //-------------------------------------------------
    //-------------------------------------------------
    //-------------------------------------------------
    //-------------------------------------------------
    //不良人员名单
    BadPersonnel() {
      const result = this.comprehensiveScoress('level_buliang')
	  if (result === '无犯罪记录' && this.normalbadtext()!='') {
	    return '';
	  }
      if (result != '') {
        return result;
      }
      else {
        return '无犯罪记录';
      }

    },
    // 通用方法：计算借贷类别字段的总和（消除重复代码）
    calculateLoanTotal(fields) {
      if (!Array.isArray(fields)) {
        return 0;
      }
      
      let total = 0;
      fields.forEach(field => {
        const value = this.comprehensiveScoress(field);
        const numValue = Number(value);
        if (!isNaN(numValue) && value !== '-' && value !== null && value !== undefined && value !== '') {
          total += numValue;
        }
      });
      
      return total;
    },
    // 计算借贷类别里所有近一年次数的和
    getTotalLoanCountLastYear() {
      const loanTypeFields = [
        'als_m12_id_bank_allnum',   // 银行借贷
        'als_m12_id_pdl_allnum',    // 小额贷款
        'als_m12_id_coon_allnum',   // 线上消费分期
        'als_m12_id_caon_allnum',   // 线上现金分期
        'als_m12_id_rel_allnum',    // 信用卡相关
        'als_m12_id_caoff_allnum',  // 线下现金分期
        'als_m12_id_cooff_allnum',  // 线下消费分期
        'als_m12_id_af_allnum',     // 汽车金融
        'als_m12_id_oth_allnum'     // 其他借贷
      ];
      return this.calculateLoanTotal(loanTypeFields);
    },
    // 计算借贷类别里所有近一年机构数的和
    getTotalLoanOrgCountLastYear() {
      const loanTypeOrgFields = [
        'als_m12_id_bank_orgnum',   // 银行借贷
        'als_m12_id_pdl_orgnum',    // 小额贷款
        'als_m12_id_coon_orgnum',   // 线上消费分期
        'als_m12_id_caon_orgnum',   // 线上现金分期
        'als_m12_id_rel_orgnum',    // 信用卡相关
        'als_m12_id_caoff_orgnum',  // 线下现金分期
        'als_m12_id_cooff_orgnum',  // 线下消费分期
        'als_m12_id_af_orgnum',     // 汽车金融
        'als_m12_id_oth_orgnum'     // 其他借贷
      ];
      return this.calculateLoanTotal(loanTypeOrgFields);
    },
    // 计算借贷类别里所有近一年次数（手机号）的和
	getTotalLoanCountLastYearbypho() {
      const loanTypeFields = [
	    'als_m12_cell_bank_allnum',   // 银行借贷
	    'als_m12_cell_pdl_allnum',    // 小额贷款
	    'als_m12_cell_coon_allnum',   // 线上消费分期
	    'als_m12_cell_caon_allnum',   // 线上现金分期
	    'als_m12_cell_rel_allnum',    // 信用卡相关
	    'als_m12_cell_caoff_allnum',  // 线下现金分期
	    'als_m12_cell_cooff_allnum',  // 线下消费分期
	    'als_m12_cell_af_allnum',     // 汽车金融
	    'als_m12_cell_oth_allnum'     // 其他借贷
	  ];
      return this.calculateLoanTotal(loanTypeFields);
    },
    // 计算借贷类别里所有近一年机构数（手机号）的和
	getTotalLoanOrgCountLastYearbypho() {
	  const loanTypeOrgFields = [
	    'als_m12_cell_bank_orgnum',   // 银行借贷
	    'als_m12_cell_pdl_orgnum',    // 小额贷款
	    'als_m12_cell_coon_orgnum',   // 线上消费分期
	    'als_m12_cell_caon_orgnum',   // 线上现金分期
	    'als_m12_cell_rel_orgnum',    // 信用卡相关
	    'als_m12_cell_caoff_orgnum',  // 线下现金分期
	    'als_m12_cell_cooff_orgnum',  // 线下消费分期
	    'als_m12_cell_af_orgnum',     // 汽车金融
	    'als_m12_cell_oth_orgnum'     // 其他借贷
	  ];
      return this.calculateLoanTotal(loanTypeOrgFields);
	},
    comprehensiveScoress(filed_name, status) {
      if (!this.dataAll || !Array.isArray(this.dataAll)) {
        return " - ";
      }
      
      if (status) {
        // status 为 true 时，返回对象，不缓存
        const educationData = this.getItemByFiledName(this.dataAll, filed_name);
        return educationData;
      }
      
      // 使用缓存键（只缓存 status 为 false 的情况）
      const cacheKey = `${filed_name}_normal`;
      
      // 检查缓存
      if (this.comprehensiveScoressCache && this.comprehensiveScoressCache[cacheKey] !== undefined) {
        return this.comprehensiveScoressCache[cacheKey];
      }
      
      // 性能优化：使用Map提高查找性能
      let item = null;
      if (this._fieldNameIndexMap && this._fieldNameIndexMap.has(filed_name)) {
        const index = this._fieldNameIndexMap.get(filed_name);
        item = this.dataAll[index];
      } else {
        // 首次查找，构建映射并查找
        item = this.dataAll.find((item) => item.filed_name == filed_name);
        // 构建映射（延迟初始化）
        if (!this._fieldNameIndexMap) {
          this._fieldNameIndexMap = new Map();
          this.dataAll.forEach((item, index) => {
            if (item && item.filed_name) {
              this._fieldNameIndexMap.set(item.filed_name, index);
            }
          });
        } else if (item) {
          // 如果找到但映射中没有，添加到映射
          const index = this.dataAll.indexOf(item);
          if (index !== -1) {
            this._fieldNameIndexMap.set(filed_name, index);
          }
        }
      }

      if (item && item.value !== undefined && item.value !== null) {
        // 第一步：获取原始值
        const rawValue = item.value;
        // 第二步：使用字典转换
        const dictType = this.getDictTypeByFieldName(filed_name);
        // if(dictType == 'sanyaosuheyancode') console.log(rawValue, 'rawValue-------->');
        if (dictType) {
          // 特殊处理 level_buliang 字段的多值情况
          if (filed_name === 'level_buliang' && rawValue && typeof rawValue === 'string') {
            const values = rawValue.split(',').map(v => v.trim()).filter(v => v);
            const dictCacheKey = `${filed_name}_${rawValue}`;

            if (this.dictCache && this.dictCache[dictCacheKey]) {
              const displayValue = this.dictCache[dictCacheKey];
              // 更新 comprehensiveScoressCache
              if (this.comprehensiveScoressCache) {
                this.comprehensiveScoressCache[cacheKey] = displayValue;
              }
              return displayValue;
            }

            // 如果缓存中没有且不在加载中，调用 getDicts 接口
            if (!this.dictCache[dictCacheKey + "_loading"]) {
              this.dictCache[dictCacheKey + "_loading"] = true;

              getDicts(dictType)
                .then((dictData) => {
                  if (dictData && dictData.data && Array.isArray(dictData.data)) {
                    const displayValues = values.map(value => {
                      const dictItem = dictData.data.find(d => d.dictValue === value);
                      return dictItem ? dictItem.dictLabel : value;
                    });

                    const displayValue = displayValues.join('、');
                    this.$set(this.dictCache, dictCacheKey, displayValue);
                    // 同时更新 comprehensiveScoressCache（字典转换完成后的最终值）
                    if (this.comprehensiveScoressCache) {
                      this.comprehensiveScoressCache[cacheKey] = displayValue;
                    }
                    delete this.dictCache[dictCacheKey + "_loading"];
                  } else {
                    delete this.dictCache[dictCacheKey + "_loading"];
                  }
                })
                .catch((error) => {
                  console.error(`调用getDicts失败 ${dictType}:`, error);
                  delete this.dictCache[dictCacheKey + "_loading"];
                });
            }

            // 先返回原始值，异步完成后会自动更新显示
            return rawValue;
          }

          // 处理单个值的情况
          const dictCacheKey = `${filed_name}_${rawValue}`;
          if (this.dictCache && this.dictCache[dictCacheKey]) {
            const displayValue = this.dictCache[dictCacheKey];
            // 更新 comprehensiveScoressCache
            if (this.comprehensiveScoressCache) {
              this.comprehensiveScoressCache[cacheKey] = displayValue;
            }
            return displayValue;
          }

          // 如果缓存中没有且不在加载中，调用 getDicts 接口
          if (!this.dictCache[dictCacheKey + "_loading"]) {
            this.dictCache[dictCacheKey + "_loading"] = true;

            getDicts(dictType)
              .then((dictData) => {
                if (dictData && dictData.data && Array.isArray(dictData.data)) {
                  const dictItem = dictData.data.find(
                    (d) => d.dictValue === rawValue
                  );

                  const displayValue = dictItem ? dictItem.dictLabel : rawValue;

                  this.$set(this.dictCache, dictCacheKey, displayValue);
                  // 同时更新 comprehensiveScoressCache（字典转换完成后的最终值）
                  if (this.comprehensiveScoressCache) {
                    this.comprehensiveScoressCache[cacheKey] = displayValue;
                  }
                  delete this.dictCache[dictCacheKey + "_loading"];
                } else {
                  delete this.dictCache[dictCacheKey + "_loading"];
                }
              })
              .catch((error) => {
                console.error(`调用getDicts失败 ${dictType}:`, error);
                delete this.dictCache[dictCacheKey + "_loading"];
              });
          }

          // 先返回原始值，异步完成后会自动更新显示
          // 注意：字典转换是异步的，这里先返回原始值，转换完成后会更新 dictCache
          // 不缓存原始值到 comprehensiveScoressCache，因为字典转换后的值才是最终值
          return rawValue;
        }

        // 没有字典转换，直接返回原始值并缓存
        if (this.comprehensiveScoressCache) {
          this.comprehensiveScoressCache[cacheKey] = rawValue;
        }
        return rawValue;
      }
      
      // 没有找到 item 或 value 为空，缓存并返回默认值
      if (this.comprehensiveScoressCache) {
        this.comprehensiveScoressCache[cacheKey] = "";
      }
      return "";
    },

    // 转换人企关联数据为目标格式（支持新旧两种格式）
    transformCompanyRelationData() {
      // 如果没有数据，返回默认结构
      if (!this.dataAll || !Array.isArray(this.dataAll)) {
        console.warn("dataAll 不存在或不是数组");
        return {
          api_name: "人企关联",
          api_code: "QYGL6F2D",
          success: true,
          message: "人企关联查询完成",
          data: {
            data: {
              code: "0",
              data: {
                datalist: [],
              },
              message: "成功",
              seqNo: "8754EWP2250923221708786",
            },
          },
        };
      }

      // 先尝试旧格式（qiye 字段）：仅当 list_result 非空时才走此分支，避免空 qiye 挡住 jh / fr·rz·tz
      const companyData = this.getItemByFiledName(this.dataAll, "qiye");
      const qiyeListResult =
        companyData?.pointed_object?.list_result;
      if (
        companyData &&
        companyData.pointed_object &&
        Array.isArray(qiyeListResult) &&
        qiyeListResult.length > 0
      ) {
        // 旧格式处理
        const datalist = qiyeListResult.map((companyRecord) => {
          const getFieldObjectFromRecord = (fieldName) => {
            if (!Array.isArray(companyRecord)) return null;
            return companyRecord.find((item) => item && item.filed_name === fieldName) || null;
          };
          const getFieldFromRecord = (fieldName) => {
            const field = getFieldObjectFromRecord(fieldName);
            return field && field.value !== null && field.value !== undefined ? String(field.value).trim() : "";
          };
          const getPenaltyNumbersFromRecord = () => {
            const penaltyField = getFieldObjectFromRecord("adminPenalty");
            const rows = penaltyField && Array.isArray(penaltyField.list_result) ? penaltyField.list_result : [];
            const numbers = rows.map((row) => {
              if (Array.isArray(row)) {
                const numberField = row.find((item) => item && item.filed_name === "punishNumber");
                return numberField && numberField.value !== null && numberField.value !== undefined
                  ? String(numberField.value).trim()
                  : "";
              }
              if (row && typeof row === "object" && row.punishNumber !== null && row.punishNumber !== undefined) {
                return String(row.punishNumber).trim();
              }
              return "";
            }).filter(Boolean);
            return Array.from(new Set(numbers));
          };

            const orgName = getFieldFromRecord("orgName") || "未知公司";
            const regStatus = getFieldFromRecord("regStatus") || "未知状态";
            const regCapital = getFieldFromRecord("regCapital") || "未知";
            const industry = getFieldFromRecord("industry") || "未知行业";
            const estiblishTime = getFieldFromRecord("estiblishTime") || "未知";
            const investRate = getFieldFromRecord("investRate") || "0%";
            const relationship = getFieldFromRecord("relationship") || "";
          const relationshipArray = relationship ? relationship.split(",") : [];

            return {
              adminPenalty: getPenaltyNumbersFromRecord().map((punishNumber) => ({ punishNumber })),
              basicInfo: {
                apprdate: getFieldFromRecord("apprdate") || "",
                base: getFieldFromRecord("base") || "",
                candate: getFieldFromRecord("candate") || "",
                city: getFieldFromRecord("city") || "",
                companyOrgType: getFieldFromRecord("companyOrgType") || "",
                creditCode: getFieldFromRecord("creditCode") || "",
                district: getFieldFromRecord("district") || "",
                estiblishTime: estiblishTime,
                industry: industry,
                industry_code: getFieldFromRecord("industry_code") || "",
                legalPersonName: getFieldFromRecord("legalPersonName") || "",
                name: orgName,
                nic_code: getFieldFromRecord("nic_code") || "",
                nic_name: getFieldFromRecord("nic_name") || "",
                opscope: getFieldFromRecord("opscope") || "",
                province: getFieldFromRecord("province") || "",
                reccap: getFieldFromRecord("reccap") || 0,
                reccapcur: getFieldFromRecord("reccapcur") || "",
                regCapital: regCapital,
              regCapitalCurrency: getFieldFromRecord("regCapitalCurrency") || "",
                regNumber: getFieldFromRecord("regNumber") || "",
                regStatus: regStatus,
                regorg: getFieldFromRecord("regorg") || "",
                revdate: getFieldFromRecord("revdate") || "",
                tel: getFieldFromRecord("tel") || "",
                type: getFieldFromRecord("type") || "",
              },
              dishonestExecutedPerson: [],
              executedPerson: [],
              orgName: orgName,
              pName: getFieldFromRecord("pName") || "",
              relationship: relationshipArray,
              taxLevel: getFieldFromRecord("tax_level") || "",
              stockHolderItem: {
                investDate: getFieldFromRecord("investDate") || "",
                investRate: investRate,
                orgHolderName: getFieldFromRecord("orgHolderName") || "",
                orgHolderType: getFieldFromRecord("orgHolderType") || "",
                subscriptAmt: parseFloat(investRate.replace("%", "")) || 0,
            },
          };
        });

        return {
          api_name: "人企关联",
          api_code: "QYGL6F2D",
          success: true,
          message: "人企关联查询完成",
          data: {
            data: {
              code: "0",
              data: {
                datalist: datalist,
              },
              message: "成功",
              seqNo: "8754EWP2250923221708786",
            },
              },
            };
          }

      // jh_company_detail 格式：某 dataAll 项的 list 中含 filed_name=jh_company_detail，其 list_result 为 [[字段行], ...]
      const collectJhCompanyDetailRows = (dataAll) => {
        const rows = [];
        if (!Array.isArray(dataAll)) return rows;
        const isRowAllEmpty = (recordArray) => {
          if (!Array.isArray(recordArray)) return true;
          return recordArray.every((f) => {
            if (!f) return true;
            const v = f.value;
            return v === null || v === undefined || String(v).trim() === "";
          });
        };
        for (const root of dataAll) {
          if (!root || !Array.isArray(root.list)) continue;
          for (const li of root.list) {
            if (li && li.filed_name === "jh_company_detail" && Array.isArray(li.list_result)) {
              for (const companyRecord of li.list_result) {
                if (Array.isArray(companyRecord) && !isRowAllEmpty(companyRecord)) {
                  rows.push(companyRecord);
                }
              }
            }
          }
        }
        return rows;
      };

      const mapJhRowToCompany = (companyRecord) => {
        const getFieldFromRecord = (fieldName) => {
          if (!Array.isArray(companyRecord)) return "";
          const field = companyRecord.find((item) => item && item.filed_name === fieldName);
          return field && field.value !== null && field.value !== undefined
            ? String(field.value).trim()
            : "";
        };
        const orgName = getFieldFromRecord("orgName") || "未知公司";
        const regStatus = getFieldFromRecord("regStatus") || "未知状态";
        const regCapital = getFieldFromRecord("regCapital") || "未知";
        const industry = getFieldFromRecord("industry") || "未知行业";
        const estiblishTime = getFieldFromRecord("estiblishTime") || "未知";
        const investRateRaw = getFieldFromRecord("investRate");
        const relationship = getFieldFromRecord("relationship") || "";
        const relationshipArray = relationship
          ? relationship.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const taxLevel = getFieldFromRecord("tax_level") || "";
        const penaltyNumbers = (() => {
          const field = companyRecord.find((item) => item && item.filed_name === "adminPenalty");
          const rows = field && Array.isArray(field.list_result) ? field.list_result : [];
          const numbers = rows.map((row) => {
            if (Array.isArray(row)) {
              const numberField = row.find((item) => item && item.filed_name === "punishNumber");
              return numberField && numberField.value !== null && numberField.value !== undefined
                ? String(numberField.value).trim()
                : "";
            }
            if (row && typeof row === "object" && row.punishNumber !== null && row.punishNumber !== undefined) {
              return String(row.punishNumber).trim();
            }
            return "";
          }).filter(Boolean);
          return Array.from(new Set(numbers));
        })();
        return {
          adminPenalty: penaltyNumbers.map((punishNumber) => ({ punishNumber })),
          basicInfo: {
            apprdate: getFieldFromRecord("apprdate") || "",
            base: getFieldFromRecord("base") || "",
            candate: getFieldFromRecord("candate") || "",
            city: getFieldFromRecord("city") || "",
            companyOrgType: getFieldFromRecord("companyOrgType") || "",
            creditCode: getFieldFromRecord("creditCode") || "",
            district: getFieldFromRecord("district") || "",
            estiblishTime: estiblishTime,
            industry: industry,
            industry_code: getFieldFromRecord("industry_code") || "",
            legalPersonName: getFieldFromRecord("legalPersonName") || "",
            name: orgName,
            nic_code: getFieldFromRecord("nic_code") || "",
            nic_name: getFieldFromRecord("nic_name") || "",
            opscope: getFieldFromRecord("opscope") || "",
            province: getFieldFromRecord("province") || "",
            reccap: getFieldFromRecord("reccap") || 0,
            reccapcur: getFieldFromRecord("reccapcur") || "",
            regCapital: regCapital,
            regCapitalCurrency: getFieldFromRecord("regCapitalCurrency") || "",
            regNumber: getFieldFromRecord("regNumber") || "",
            regStatus: regStatus,
            regorg: getFieldFromRecord("regorg") || "",
            revdate: getFieldFromRecord("revdate") || "",
            tel: getFieldFromRecord("tel") || "",
            type: getFieldFromRecord("type") || "",
          },
          dishonestExecutedPerson: [],
          executedPerson: [],
          orgName: orgName,
          pName: getFieldFromRecord("pName") || "",
          relationship: relationshipArray,
          taxLevel,
          stockHolderItem: {
            investDate: getFieldFromRecord("investDate") || "",
            investRate: investRateRaw || "-",
            orgHolderName: getFieldFromRecord("orgHolderName") || "",
            orgHolderType: getFieldFromRecord("orgHolderType") || "",
            subscriptAmt: investRateRaw ? parseFloat(investRateRaw.replace("%", "")) || 0 : 0,
          },
        };
      };

      const jhRows = collectJhCompanyDetailRows(this.dataAll);
      if (jhRows.length > 0) {
        const datalist = jhRows.map((row) => mapJhRowToCompany(row));
        return {
          api_name: "人企关联",
          api_code: "QYGL6F2D",
          success: true,
          message: "人企关联查询完成",
          data: {
            data: {
              code: "0",
              data: {
                datalist: datalist,
              },
              message: "成功",
              seqNo: "8754EWP2250923221708786",
            },
          },
        };
      }

      // 新格式处理：从 dataAll 中查找包含 fr_/rz_/tz_ 前缀的对象
      const newFormatData = this.dataAll.filter(item => 
        item && 
        item.list && 
        Array.isArray(item.list) &&
        item.list.some(listItem => {
          const filedName = listItem?.filed_name || '';
          return filedName.startsWith('fr_') || filedName.startsWith('rz_') || filedName.startsWith('tz_');
        })
      );

      if (newFormatData.length === 0) {
        // 新旧格式都不存在，返回空数据
        return {
          api_name: "人企关联",
          api_code: "QYGL6F2D",
          success: true,
          message: "人企关联查询完成",
          data: {
            data: {
              code: "0",
              data: {
                datalist: [],
              },
              message: "成功",
              seqNo: "8754EWP2250923221708786",
            },
          },
        };
      }

      // 处理新格式数据
      const companyMap = new Map(); // 用于去重和合并，key: 唯一标识符
      const regNoMap = new Map(); // 注册号 -> companyKey 映射
      const orgNameMap = new Map(); // 企业名称 -> companyKey 映射
      const creditNoMap = new Map(); // 信用代码 -> companyKey 映射
      let companyCounter = 0; // 用于生成唯一key

      // 辅助函数：从记录数组中提取字段值
      const getFieldFromRecord = (record, fieldName) => {
        if (!Array.isArray(record)) return "";
        const field = record.find(item => item && item.filed_name === fieldName);
        return field && field.value !== null && field.value !== undefined ? String(field.value).trim() : "";
      };

      // 查找已存在的企业（通过注册号、企业名称、信用代码匹配）
      const findExistingCompanyKey = (regNo, orgName, creditNo) => {
        // 优先通过注册号匹配
        if (regNo && regNoMap.has(regNo)) {
          return regNoMap.get(regNo);
        }
        // 其次通过企业名称匹配
        if (orgName && orgNameMap.has(orgName)) {
          return orgNameMap.get(orgName);
        }
        // 最后通过信用代码匹配
        if (creditNo && creditNoMap.has(creditNo)) {
          return creditNoMap.get(creditNo);
        }
        return null;
      };

      // 获取或创建企业key（用于去重）
      const getOrCreateCompanyKey = (record, prefix) => {
        const regNo = getFieldFromRecord(record, `${prefix}_regNo`);
        const orgName = getFieldFromRecord(record, `${prefix}_orgName`);
        const creditNo = getFieldFromRecord(record, `${prefix}_creditNo`);
        
        // 先尝试查找已存在的企业
        const existingKey = findExistingCompanyKey(regNo, orgName, creditNo);
        if (existingKey) {
          // 如果找到了已存在的企业，更新映射关系（可能这个记录有新的标识符）
          if (regNo && !regNoMap.has(regNo)) {
            regNoMap.set(regNo, existingKey);
          }
          if (orgName && !orgNameMap.has(orgName)) {
            orgNameMap.set(orgName, existingKey);
          }
          if (creditNo && !creditNoMap.has(creditNo)) {
            creditNoMap.set(creditNo, existingKey);
          }
          return existingKey;
        }
        
        // 如果没有找到，创建新的key（使用计数器确保唯一性）
        const newKey = `company_${companyCounter++}`;
        
        // 建立映射关系（所有可用的标识符都映射到同一个key）
        if (regNo) regNoMap.set(regNo, newKey);
        if (orgName) orgNameMap.set(orgName, newKey);
        if (creditNo) creditNoMap.set(creditNo, newKey);
        
        return newKey;
      };

      // 处理每个数据对象
      newFormatData.forEach(dataItem => {
        if (!dataItem.list_result || !Array.isArray(dataItem.list_result)) return;

        // 确定前缀类型（fr_/rz_/tz_）
        const prefix = dataItem.list && dataItem.list.length > 0 
          ? (dataItem.list[0]?.filed_name || '').split('_')[0] + '_'
          : '';

        if (!prefix || !['fr_', 'rz_', 'tz_'].includes(prefix)) return;

        // 处理 list_result 中的每条记录
        dataItem.list_result.forEach(recordArray => {
          if (!Array.isArray(recordArray)) return;

          const companyKey = getOrCreateCompanyKey(recordArray, prefix);
          
          // 获取或创建企业对象
          let company = companyMap.get(companyKey);
          if (!company) {
            company = {
              adminPenalty: [],
              basicInfo: {
                apprdate: "",
                base: "",
                candate: "",
                city: "",
                companyOrgType: "",
                creditCode: "",
                district: "",
                estiblishTime: "",
                industry: "",
                industry_code: "",
                legalPersonName: "",
                name: "",
                nic_code: "",
                nic_name: "",
                opscope: "",
                province: "",
                reccap: 0,
                reccapcur: "",
                regCapital: "",
                regCapitalCurrency: "",
                regNumber: "",
                regStatus: "",
                regorg: "",
                revdate: "",
                tel: "",
                type: "",
              },
              dishonestExecutedPerson: [],
              executedPerson: [],
              orgName: "",
              pName: "",
              relationship: [],
              taxLevel: "",
              stockHolderItem: {
                investDate: "",
                investRate: "0%",
                orgHolderName: "",
                orgHolderType: "",
                subscriptAmt: 0,
              },
            };
            companyMap.set(companyKey, company);
          }

          // 根据前缀类型填充数据
          if (prefix === 'fr_') {
            // 法人信息（企业基本信息）
            const regNo = getFieldFromRecord(recordArray, 'fr_regNo');
            const orgName = getFieldFromRecord(recordArray, 'fr_orgName');
            const creditNo = getFieldFromRecord(recordArray, 'fr_creditNo');
            
            company.basicInfo.name = company.basicInfo.name || orgName;
            company.basicInfo.regNumber = company.basicInfo.regNumber || regNo;
            company.basicInfo.creditCode = company.basicInfo.creditCode || creditNo;
            company.basicInfo.industry = company.basicInfo.industry || getFieldFromRecord(recordArray, 'fr_industry');
            company.basicInfo.regStatus = company.basicInfo.regStatus || getFieldFromRecord(recordArray, 'fr_orgStatus');
            company.basicInfo.companyOrgType = company.basicInfo.companyOrgType || getFieldFromRecord(recordArray, 'fr_orgType');
            company.basicInfo.estiblishTime = company.basicInfo.estiblishTime || getFieldFromRecord(recordArray, 'fr_esDate');
            company.basicInfo.regCapital = company.basicInfo.regCapital || getFieldFromRecord(recordArray, 'fr_regCap');
            company.basicInfo.province = company.basicInfo.province || getFieldFromRecord(recordArray, 'fr_regorgProvince');
            company.basicInfo.legalPersonName = company.basicInfo.legalPersonName || getFieldFromRecord(recordArray, 'fr_ryName');
            company.orgName = company.orgName || orgName;
            if (!company.relationship.includes('lp')) {
              company.relationship.push('lp');
            }
          } else if (prefix === 'rz_') {
            // 任职信息
            const regNo = getFieldFromRecord(recordArray, 'rz_regNo');
            const orgName = getFieldFromRecord(recordArray, 'rz_orgName');
            const creditNo = getFieldFromRecord(recordArray, 'rz_creditNo');
            
            if (orgName && !company.basicInfo.name) {
              company.basicInfo.name = orgName;
            }
            if (regNo && !company.basicInfo.regNumber) {
              company.basicInfo.regNumber = regNo;
            }
            if (creditNo && !company.basicInfo.creditCode) {
              company.basicInfo.creditCode = creditNo;
            }
            if (!company.basicInfo.industry) {
              company.basicInfo.industry = getFieldFromRecord(recordArray, 'rz_industry');
            }
            if (!company.basicInfo.regStatus) {
              company.basicInfo.regStatus = getFieldFromRecord(recordArray, 'rz_orgStatus');
            }
            if (!company.basicInfo.companyOrgType) {
              company.basicInfo.companyOrgType = getFieldFromRecord(recordArray, 'rz_orgType');
            }
            if (!company.basicInfo.estiblishTime) {
              company.basicInfo.estiblishTime = getFieldFromRecord(recordArray, 'rz_esDate');
            }
            if (!company.basicInfo.regCapital) {
              company.basicInfo.regCapital = getFieldFromRecord(recordArray, 'rz_regCap');
            }
            if (!company.basicInfo.province) {
              company.basicInfo.province = getFieldFromRecord(recordArray, 'rz_regorgProvince');
            }
            if (!company.basicInfo.legalPersonName) {
              company.basicInfo.legalPersonName = getFieldFromRecord(recordArray, 'rz_frName');
            }
            company.orgName = company.orgName || orgName;
            const position = getFieldFromRecord(recordArray, 'rz_position');
            if (position && !company.relationship.includes('tm')) {
              company.relationship.push('tm');
            }
            // 保存职务信息到 stockHolderItem（如果存在）
            if (position) {
              company.stockHolderItem.orgHolderType = position;
            }
          } else if (prefix === 'tz_') {
            // 投资信息
            const regNo = getFieldFromRecord(recordArray, 'tz_regNo');
            const orgName = getFieldFromRecord(recordArray, 'tz_orgName');
            const creditNo = getFieldFromRecord(recordArray, 'tz_creditNo');
            
            if (orgName && !company.basicInfo.name) {
              company.basicInfo.name = orgName;
            }
            if (regNo && !company.basicInfo.regNumber) {
              company.basicInfo.regNumber = regNo;
            }
            if (creditNo && !company.basicInfo.creditCode) {
              company.basicInfo.creditCode = creditNo;
            }
            if (!company.basicInfo.industry) {
              company.basicInfo.industry = getFieldFromRecord(recordArray, 'tz_industry');
            }
            if (!company.basicInfo.regStatus) {
              company.basicInfo.regStatus = getFieldFromRecord(recordArray, 'tz_orgStatus');
            }
            if (!company.basicInfo.companyOrgType) {
              company.basicInfo.companyOrgType = getFieldFromRecord(recordArray, 'tz_orgType');
            }
            if (!company.basicInfo.estiblishTime) {
              company.basicInfo.estiblishTime = getFieldFromRecord(recordArray, 'tz_esDate');
            }
            if (!company.basicInfo.regCapital) {
              company.basicInfo.regCapital = getFieldFromRecord(recordArray, 'tz_regCap');
            }
            if (!company.basicInfo.province) {
              company.basicInfo.province = getFieldFromRecord(recordArray, 'tz_regorgProvince');
            }
            company.orgName = company.orgName || orgName;
            const investRate = getFieldFromRecord(recordArray, 'tz_fundedRatio');
            const subConAmt = getFieldFromRecord(recordArray, 'tz_subConAmt');
            if (investRate) {
              company.stockHolderItem.investRate = investRate;
              const rateNum = parseFloat(investRate.replace("%", "")) || 0;
              company.stockHolderItem.subscriptAmt = rateNum;
            }
            if (subConAmt) {
              company.stockHolderItem.subscriptAmt = parseFloat(subConAmt) || 0;
            }
            if (!company.relationship.includes('sh')) {
              company.relationship.push('sh');
            }
          }
        });
      });

      // 转换为数组
      let datalist = Array.from(companyMap.values());

      // 最终去重：使用注册号、企业名称、信用代码进行二次去重
      const finalDedupMap = new Map();

      datalist.forEach(company => {
        const regNo = company.basicInfo?.regNumber || '';
        const orgName = company.basicInfo?.name || company.orgName || '';
        const creditNo = company.basicInfo?.creditCode || '';
        
        // 生成唯一标识：优先使用注册号，其次企业名称，最后信用代码
        const companyId = regNo || orgName || creditNo || `unknown_${Math.random()}`;
        
        // 检查是否已存在（通过注册号、企业名称、信用代码匹配）
        let found = false;
        let existingKey = null;
        
        // 通过注册号匹配
        if (regNo) {
          for (const [key, existingCompany] of finalDedupMap.entries()) {
            if (existingCompany.basicInfo?.regNumber === regNo && regNo) {
              found = true;
              existingKey = key;
              break;
            }
          }
        }
        
        // 通过企业名称匹配
        if (!found && orgName) {
          for (const [key, existingCompany] of finalDedupMap.entries()) {
            const existingName = existingCompany.basicInfo?.name || existingCompany.orgName || '';
            if (existingName === orgName && orgName) {
              found = true;
              existingKey = key;
              break;
            }
          }
        }
        
        // 通过信用代码匹配
        if (!found && creditNo) {
          for (const [key, existingCompany] of finalDedupMap.entries()) {
            if (existingCompany.basicInfo?.creditCode === creditNo && creditNo) {
              found = true;
              existingKey = key;
              break;
            }
          }
        }
        
        if (found && existingKey) {
          // 合并到已存在的企业
          const existingCompany = finalDedupMap.get(existingKey);
          
          // 合并基本信息（保留非空值）
          if (!existingCompany.basicInfo.name && company.basicInfo.name) {
            existingCompany.basicInfo.name = company.basicInfo.name;
          }
          if (!existingCompany.basicInfo.regNumber && company.basicInfo.regNumber) {
            existingCompany.basicInfo.regNumber = company.basicInfo.regNumber;
          }
          if (!existingCompany.basicInfo.creditCode && company.basicInfo.creditCode) {
            existingCompany.basicInfo.creditCode = company.basicInfo.creditCode;
          }
          if (!existingCompany.basicInfo.industry && company.basicInfo.industry) {
            existingCompany.basicInfo.industry = company.basicInfo.industry;
          }
          if (!existingCompany.basicInfo.regStatus && company.basicInfo.regStatus) {
            existingCompany.basicInfo.regStatus = company.basicInfo.regStatus;
          }
          if (!existingCompany.basicInfo.companyOrgType && company.basicInfo.companyOrgType) {
            existingCompany.basicInfo.companyOrgType = company.basicInfo.companyOrgType;
          }
          if (!existingCompany.basicInfo.estiblishTime && company.basicInfo.estiblishTime) {
            existingCompany.basicInfo.estiblishTime = company.basicInfo.estiblishTime;
          }
          if (!existingCompany.basicInfo.regCapital && company.basicInfo.regCapital) {
            existingCompany.basicInfo.regCapital = company.basicInfo.regCapital;
          }
          if (!existingCompany.basicInfo.province && company.basicInfo.province) {
            existingCompany.basicInfo.province = company.basicInfo.province;
          }
          if (!existingCompany.basicInfo.legalPersonName && company.basicInfo.legalPersonName) {
            existingCompany.basicInfo.legalPersonName = company.basicInfo.legalPersonName;
          }
          if (!existingCompany.orgName && company.orgName) {
            existingCompany.orgName = company.orgName;
          }
          if (!existingCompany.taxLevel && company.taxLevel) {
            existingCompany.taxLevel = company.taxLevel;
          }
          
          // 合并关系数组（去重）
          if (company.relationship && Array.isArray(company.relationship)) {
            company.relationship.forEach(rel => {
              if (!existingCompany.relationship.includes(rel)) {
                existingCompany.relationship.push(rel);
              }
            });
          }
          
          // 合并投资信息
          if (company.stockHolderItem?.investRate && company.stockHolderItem.investRate !== "0%") {
            existingCompany.stockHolderItem.investRate = company.stockHolderItem.investRate;
          }
          if (company.stockHolderItem?.subscriptAmt && company.stockHolderItem.subscriptAmt > 0) {
            existingCompany.stockHolderItem.subscriptAmt = company.stockHolderItem.subscriptAmt;
          }
          if (company.stockHolderItem?.orgHolderType && !existingCompany.stockHolderItem.orgHolderType) {
            existingCompany.stockHolderItem.orgHolderType = company.stockHolderItem.orgHolderType;
          }
        } else {
          // 新企业，添加到结果中
          finalDedupMap.set(companyId, company);
        }
      });

      // 转换为最终数组
      datalist = Array.from(finalDedupMap.values());

      return {
        api_name: "人企关联",
        api_code: "QYGL6F2D",
        success: true,
        message: "人企关联查询完成",
        data: {
          data: {
            code: "0",
            data: {
              datalist: datalist,
            },
            message: "成功",
            seqNo: "8754EWP2250923221708786",
          },
        },
      };
    },


    // 转换司法涉诉数据为目标格式
    transformJudicialData() {
      // 先尝试不同的字段名来获取司法数据
      let judicialRawData = this.getItemByFiledName(this.dataAll, "dataAll");

        // 构建案件数据结构
        const entout = {
          preservation: { cases: [] },
          civil: { cases: [] },
          implement: { cases: [] },
          criminal: { cases: [] },
          administrative: { cases: [] },
          bankrupt: { cases: [] }
        };

        // 失信被执行 & 限高被执行（cases7 / cases8）
        const dishonesty = {
          shixinList: [],   // 失信被执行列表（cases7）
          xianGaoList: []   // 限高被执行列表（cases8）
        };
   
         // 新数据格式：数据直接在顶层，不再有 pointed_object 嵌套
         // 检查新格式：直接从 dataAll 中查找包含 list_result 的司法数据
         let listResultData = null;
         let dishonestyData = null; // 对应 cases7 / cases8
         
         // 尝试从 pointed_object.list_result 获取（旧格式兼容）
         if (judicialRawData && judicialRawData.pointed_object && judicialRawData.pointed_object.list_result) {
           listResultData = judicialRawData.pointed_object.list_result;
           // 部分旧格式中，失信/限高信息可能挂在 pointed_object 下
           dishonestyData = judicialRawData.pointed_object;
         } 
         // 新格式：直接从顶层获取 list_result
         else if (judicialRawData && judicialRawData.list_result) {
           listResultData = judicialRawData.list_result;
           dishonestyData = judicialRawData;
         }
         // 如果 judicialRawData 不存在，尝试从 dataAll 中直接查找
         else if (this.dataAll && Array.isArray(this.dataAll)) {
          // 查找第一个 list 中包含 cases1-6 的元素（即使 list_result 为 null 也要找到）
           const judicialItem = this.dataAll.find(item => 
             item && 
             item.list && 
             Array.isArray(item.list) &&
            item.list.some(listItem => listItem && ['cases1', 'cases2', 'cases3', 'cases4', 'cases5', 'cases6'].includes(listItem.filed_name))
           );
           if (judicialItem && judicialItem.list_result && Array.isArray(judicialItem.list_result)) {
             listResultData = judicialItem.list_result;
             dishonestyData = judicialItem;
           } else if (judicialItem) {
             // 即使 list_result 为 null，也找到了司法数据结构，返回 null 表示需要返回默认结构
             listResultData = null;
             dishonestyData = judicialItem;
           }
         }

      // 如果没有司法数据，返回默认结构
         if (!listResultData || !Array.isArray(listResultData)) {
        return {
         api_name: "个人司法涉诉",
         api_code: "JUDICIAL_001",
         success: true,
         message: "个人司法涉诉查询完成",
         data: {
            data: {
             entout: [{
               entout: {
                 preservation: { cases: [] },
                 civil: { cases: [] },
                 implement: { cases: [] },
                 criminal: { cases: [] },
                 administrative: { cases: [] },
                 bankrupt: { cases: [] }
               }
             }],
             dishonesty: dishonesty
           }
         },
         call_time: new Date().toISOString()
        };
      }

         // 处理数据：支持新旧两种格式
         // 新格式：list_result 是一个扁平数组，每个元素是一个案件记录数组
         // 旧格式：list_result 是二维数组，第一层是分类，第二层是案件类型数据
         
         // 检查是否是旧格式（二维数组结构）
        const isOldFormat = listResultData.length > 0 && 
                            Array.isArray(listResultData[0]) && 
                            listResultData[0].length > 0 &&
                            listResultData[0][0] &&
                            typeof listResultData[0][0] === 'object' &&
                            listResultData[0][0].filed_name &&
                            ['cases1', 'cases2', 'cases3', 'cases4', 'cases5', 'cases6'].includes(listResultData[0][0].filed_name);
   
         if (isOldFormat) {
           // 旧格式处理：二维数组结构
           listResultData.forEach(categoryData => {
          if (!categoryData || !Array.isArray(categoryData)) return;

          categoryData.forEach(caseTypeData => {
            if (!caseTypeData) return;

            const caseTypeName = caseTypeData.filed_name;

            let targetCategory = '';

           // 根据字段名映射到对应类型
           switch (caseTypeName) {
             case 'cases1':
               targetCategory = 'preservation';
               break;
             case 'cases2':
               targetCategory = 'civil';
               break;
             case 'cases3':
               targetCategory = 'implement';
               break;
             case 'cases4':
               targetCategory = 'criminal';
               break;
             case 'cases5':
               targetCategory = 'administrative';
               break;
             case 'cases6':
               targetCategory = 'bankrupt';
               break;
             default:
               return;
           }

            // 转换每个案件数据
            if (caseTypeData.list_result && Array.isArray(caseTypeData.list_result)) {
              caseTypeData.list_result.forEach((caseRecord) => {
                if (!Array.isArray(caseRecord)) return;

                // 从每条记录中提取字段值
                const caseData = {};

                caseRecord.forEach(field => {
                  if (field && field.value !== null && field.value !== undefined) {
                    // 使用 path 作为字段名（如 c_ah, d_larq 等）
                    if (field.path) {
                      caseData[field.path] = field.value;
                    }

                    // 同时也保存 filed_name 以兼容现有代码
                    if (field.filed_name) {
                      caseData[field.filed_name] = field.value;
                    }
                  }
                });

                // 处理当事人信息
                const partyInfo = caseRecord.find(field => field.filed_name && field.filed_name.includes('c_dsrxx'));
                if (partyInfo && partyInfo.list_result) {
                  caseData.c_dsrxx = partyInfo;
                }

                // 添加到对应类型
                if (Object.keys(caseData).length > 0) {
                  entout[targetCategory].cases.push(caseData);
                }
              });
               }
             });
           });
         } else {
           // 新格式处理：list_result 是一个扁平数组，需要通过 filed_name 来匹配案件类型
           // 遍历 list_result，根据 filed_name 前缀来分类案件
           listResultData.forEach((caseRecord) => {
             if (!Array.isArray(caseRecord)) return;
   
             // 从第一条记录中获取 filed_name 来判断案件类型
             const firstField = caseRecord.find(field => field && field.filed_name);
             if (!firstField || !firstField.filed_name) return;
   
            // 根据 filed_name 前缀判断案件类型
            let targetCategory = '';
            const filedName = firstField.filed_name;
            
            if (filedName.startsWith('cases1') || filedName.startsWith('case1')) {
              targetCategory = 'preservation';
            } else if (filedName.startsWith('cases2') || filedName.startsWith('case2')) {
              targetCategory = 'civil';
            } else if (filedName.startsWith('cases3') || filedName.startsWith('case3')) {
              targetCategory = 'implement';
            } else if (filedName.startsWith('cases4') || filedName.startsWith('case4')) {
              targetCategory = 'criminal';
            } else if (filedName.startsWith('cases5') || filedName.startsWith('case5')) {
              targetCategory = 'administrative';
            } else if (filedName.startsWith('cases6') || filedName.startsWith('case6')) {
              targetCategory = 'bankrupt';
            } else {
              return; // 不匹配任何类型，跳过
            }
   
             // 从每条记录中提取字段值
             const caseData = {};
   
             caseRecord.forEach(field => {
               if (field && field.value !== null && field.value !== undefined) {
                 // 使用 path 作为字段名（如 c_ah, d_larq 等）
                 if (field.path) {
                   caseData[field.path] = field.value;
                 }
   
                 // 同时也保存 filed_name 以兼容现有代码
                 if (field.filed_name) {
                   caseData[field.filed_name] = field.value;
                 }
            }
          });
   
             // 处理当事人信息
             const partyInfo = caseRecord.find(field => field.filed_name && field.filed_name.includes('c_dsrxx'));
             if (partyInfo && partyInfo.list_result) {
               caseData.c_dsrxx = partyInfo;
             }
   
             // 添加到对应类型
             if (Object.keys(caseData).length > 0) {
               entout[targetCategory].cases.push(caseData);
             }
        });
      }

      // 处理失信被执行（cases7）与限高（cases8）
      if (dishonestyData && Array.isArray(dishonestyData.list)) {
        dishonestyData.list.forEach(item => {
          if (!item) return;
          if (item.filed_name === 'cases7' && Array.isArray(item.list_result)) {
            item.list_result.forEach(row => {
              if (!Array.isArray(row)) return;
              const record = {};
              row.forEach(field => {
                if (field && field.path && field.value !== undefined && field.value !== null) {
                  record[field.path] = field.value;
                }
              });
              if (Object.keys(record).length > 0) {
                dishonesty.shixinList.push(record);
              }
            });
          } else if (item.filed_name === 'cases8' && Array.isArray(item.list_result)) {
            item.list_result.forEach(row => {
              if (!Array.isArray(row)) return;
              const record = {};
              row.forEach(field => {
                if (field && field.path && field.value !== undefined && field.value !== null) {
                  record[field.path] = field.value;
                }
              });
              if (Object.keys(record).length > 0) {
                dishonesty.xianGaoList.push(record);
              }
            });
          }
        });
      }

      return {
        api_name: "个人司法涉诉",
        api_code: "JUDICIAL_001",
        success: true,
        message: "个人司法涉诉查询完成",
        data: {
          data: {
            entout: [{
              entout: entout
            }],
            dishonesty: dishonesty
          }
        },
        call_time: new Date().toISOString()
      };
    },

    getHeimingdanColorClass(text) {
      if (text === '命中') {
        return 'red-color';
      } else {
        return 'green-color';
      }
    },
    getHeimingdandengjiColorClass(text) {
      if (text === '0') {
        return 'green-color';
      } else {
        return 'red-color';
      }
    },
    getHeimingdanNumColorClass(text) {
      if (text != '0.000') {
        return 'red-color';
      }
    },
    // 根据字段名获取对应的字典类型
    getDictTypeByFieldName(filed_name) {
      return this.dictMapping[filed_name];
    },
    // 根据字典类型和值获取显示标签（用于 report_type 等非 dataAll 字段）
    getDictLabel(dictType, value) {
      if (value === null || value === undefined || value === '') return '';
      const list = this.dictData && this.dictData[dictType];
      if (!Array.isArray(list)) return '';
      const strVal = String(value).trim();
      const item = list.find((d) => {
        if (!d) return false;
        const v = (d.dictValue ?? d.value ?? '').toString().trim();
        return v === strVal;
      });
      return item ? (item.dictLabel ?? item.label ?? '') : '';
    },

    // 加载字典数据
    async loadDictData() {
      try {
        // 获取所有需要加载的字典类型（从字典映射中提取）
        // 获取所有唯一的字典类型
        const dictTypes = [...new Set(Object.values(this.dictMapping))];

        // 并发加载所有字典数据
        const promises = dictTypes.map(async (dictType) => {
          try {
            const res = await getDicts(dictType);
            if (!res) return;
            let arr = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.data) ? res.data.data : null);
            if (arr) {
              this.$set(this.dictData, dictType, arr);
            }
          } catch (error) {
            console.error(`加载字典 ${dictType} 失败:`, error);
          }
        });

        await Promise.all(promises);
        // 字典数据加载完成
      } catch (error) {
        console.error("加载字典数据失败:", error);
      }
    },

    // 根据字典类型和值获取显示标签

    goBack() {
      // 1. 浏览器历史返回（H5 场景）
      try {
        if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
          window.history.back();
          return;
        }
      } catch (e) { }

      // 2. 自定义 tab 导航（如果在 uni-app 拆分 tab 结构中）
      try {
        if (this.$tab && typeof this.$tab.navigateTo === 'function') {
          this.$tab.navigateTo('/pages/work/index');
          return;
        } else if (typeof uni !== 'undefined' && (uni.navigateBack || uni.navigateTo)) {
          // 优先 navigateBack，没有则退回到工作列表页
          if (uni.navigateBack) {
            uni.navigateBack();
            return;
          }
          uni.navigateTo({ url: '/pages/work/index' });
          return;
        }
      } catch (e) { }

      // 3. Vue Router 兜底
      if (this.$router) {
        this.$router.push('/');
        return;
      }

      // 4. 最终兜底：直接跳首页
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    },
    triggerPrint() {
      // 调用导出图片功能
      this.exportPdf();
    },
    // 公安不良人员名单普通版
normalbadtext(){
	let text = this.comprehensiveScoress('police_bad_level');
	if(text === '' || text === undefined || text==='0'){
		return '';
	}
	let result = '';
	let list = text.split(",");
	if(list.includes('A2')){
		result+= '、命中近 5年涉破坏金融管理秩序案';
	}
	if(list.includes('A3')){
		result+= '、命中近5年涉非法吸收公众存款案';
	}
	if(list.includes('A4')){
		result+= '、命中近 5年涉违法发放贷款案';
	}
	if(list.includes('A5')){
		result+= '、命中近 5年涉洗钱案';
	}
	if(list.includes('A6')){
		result+= '、命中近 5年涉金融诈骗案';
	}
	if(list.includes('A7')){
		result+= '、命中近5年涉集资诈骗案';
	}
	if(list.includes('A8')){
		result+= '、命中近 5年涉贷款诈骗案';
	}
	if(list.includes('A9')){
		result+= '、命中近5年涉信用卡诈骗案';
	}
	if(list.includes('A10')){
		result+= '、命中近 5年涉保险诈骗案';
	}
	if(list.includes('A11')){
		result+= '、命中近5年其他涉刑案';
	}
	if(list.includes('A12')){
		result+= '、命中 5年前涉刑案';
	}
	if(list.includes('E13')){
		result+= '、命中涉案人员(可能为嫌疑人、证人或其他与案件有关联的人)';
	}
	if(list.includes('B14')){
		result+= '、命中涉毒人员';
	}
	if(list.includes('C15')){
		result+= '、命中吸毒人员';
	}
	if(list.includes('D16')){
		result+= '、命中在逃人员';
	}
	if(list.includes('F17')){
		result+= '、命中重点人员';
	}
	if(list.includes('F18')){
		result+= '、命中涉恐人员';
	}
	if(list.includes('F19')){
		result+= '、命中涉稳人员';
	}
	if(list.includes('F20')){
		result+= '、命中其他重点人员';
	}
	if(list.includes('G21')){
		result+= '、命中涉交通类案件';
	}
	if(list.includes('G22')){
		result+= '、命中近 5年涉危险驾驶案';
	}
	if(list.includes('G23')){
		result+= '、命中近 5 年涉交通肇事案';
	}
	if(list.includes('G24')){
		result+= '、命中近5年涉交通肇事案';
	}
	return  result;
},

// 获取车辆列表数据
    // 从车辆数据中获取指定字段的值
    getFieldFromVehicle(vehicle, fieldName) {
      if (Array.isArray(vehicle)) {
        const field = vehicle.find((item) => item.filed_name === fieldName);
        if (!field || !field.value) return "";

        const rawValue = field.value;

        // 根据字段类型进行字典转换
        let dictType = "";
        if (fieldName === "plateColor") {
          dictType = "mingxiache_yanse";
        } else if (fieldName === "vehicleType") {
          dictType = "mingxiache_leixing";
        }

        if (dictType) {
          // 检查缓存中是否已有转换后的值
          const cacheKey = `${fieldName}_${rawValue}`;
          if (this.dictCache && this.dictCache[cacheKey]) {
            return this.dictCache[cacheKey];
          }

          // 如果缓存中没有且不在加载中，调用 getDicts 接口
          if (!this.dictCache[cacheKey + "_loading"]) {
            this.dictCache[cacheKey + "_loading"] = true;

            getDicts(dictType)
              .then((dictData) => {
                if (dictData && dictData.data && Array.isArray(dictData.data)) {
                  const dictItem = dictData.data.find(
                    (d) => d.dictValue === rawValue
                  );
                  const displayValue = dictItem ? dictItem.dictLabel : rawValue;

                  // 缓存结果
                  this.$set(this.dictCache, cacheKey, displayValue);
                  delete this.dictCache[cacheKey + "_loading"];
                } else {
                  delete this.dictCache[cacheKey + "_loading"];
                }
              })
              .catch((error) => {
                console.error(`调用getDicts失败 ${dictType}:`, error);
                delete this.dictCache[cacheKey + "_loading"];
              });
          }

          // 先返回原始值，异步完成后会自动更新显示
          return rawValue;
        }

        return rawValue;
      }
      return "";
    },

    // 切换贷款申请标签页


    // 根据当前标签页获取贷款统计数据

    getStatusClass(status) {
      if (!status) return 'status-unknown';
      if (status.includes('存续') || status.includes('在营') || status.includes('开业')) {
        return 'status-active'; // 存续
      }
      if (status.includes('注销')) {
        return 'status-cancelled'; // 注销
      }
      if (status.includes('吊销')) {
        return 'status-revoked'; // 吊销
      }
      return 'status-unknown'; // 其他
    },

    // 【新增】一个辅助方法，用于判断某个关系是否存在
    hasRelation(company, relationCode) {
      return company.relationship && company.relationship.includes(relationCode);
    },

    // 【新增】一个辅助方法，用于格式化“担任职务”
    formatPosition(company) {
      if (!company) return '--';

      // 若有具体职务（如 rz_position 存入的 orgHolderType），优先显示
      const specificRole = company.stockHolderItem?.orgHolderType;
      if (specificRole && String(specificRole).trim()) {
        return String(specificRole).trim();
      }

      if (!company.relationship || !Array.isArray(company.relationship)) {
        return '--';
      }

      // 定义关系映射（显示名称）
      const positionMap = {
        'lp': '法人',
        'sh': '股东',
        'tm': '高管',
        'his_lp': '历史法人',
        'his_sh': '历史股东',
        'his_tm': '历史高管'
      };
      
      // 定义优先级顺序：先显示当前职位，再显示历史职位
      const priorityOrder = ['lp', 'sh', 'tm', 'his_lp', 'his_sh', 'his_tm'];
      
      // 收集所有匹配的关系
      const positions = [];
      priorityOrder.forEach(relCode => {
        if (this.hasRelation(company, relCode) && positionMap[relCode]) {
          positions.push(positionMap[relCode]);
        }
      });
      
      return positions.length > 0 ? positions.join('、') : '--';
    },

    // 【新增】一个辅助方法，用于格式化"任职状态"
    formatPositionStatus(company) {
      const hasCurrent = ['lp', 'sh', 'tm'].some(rel => this.hasRelation(company, rel));
      const hasHistory = ['his_lp', 'his_sh', 'his_tm'].some(rel => this.hasRelation(company, rel));

      if (hasCurrent) return '在任';
      if (hasHistory) return '历史';
      return '--';
    },

    getPenaltyNumbers(company) {
      const penalties = company && Array.isArray(company.adminPenalty) ? company.adminPenalty : [];
      const numbers = penalties.map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item.trim();
        if (item.punishNumber !== null && item.punishNumber !== undefined) {
          return String(item.punishNumber).trim();
        }
        return "";
      }).filter(Boolean);
      return Array.from(new Set(numbers));
    },

    truncateText(text, maxLength = 50) { // 默认截断长度为50
      if (!text || typeof text !== 'string') {
        return '--';
      }
      if (text.length <= maxLength) {
        return text;
      }
      return text.substring(0, maxLength) + '...';
    },
    formatParticipantsToString(dsrxx) {
      // 安全检查，如果 dsrxx 或其内部的 list_result 不存在，则返回 '--'
      const listResult = dsrxx?.list_result;
      if (!Array.isArray(listResult) || listResult.length === 0) {
        return '--';
      }

      // 使用 map 处理每个当事人，并最后用 join 拼接
      return listResult.map(participantArray => {
        // 安全检查内层数组
        if (!Array.isArray(participantArray)) {
          return ''; // 如果内层不是数组，则返回空字符串，后续会被过滤掉
        }

        // 使用 .find() 方法精确地查找“诉讼地位”和“姓名”
        const roleObject = participantArray.find(p => p.path === 'n_ssdw');
        const nameObject = participantArray.find(p => p.path === 'c_mc');

        // 提取值，如果找不到则使用默认值
        const role = roleObject ? roleObject.value : '未知地位';
        const name = nameObject ? nameObject.value : '未知姓名';

        // 拼接成 "诉讼地位: 姓名" 的格式
        return `${role}: ${name}`;
      })
        .filter(str => str) // 过滤掉可能产生的空字符串
        .join(', '); // 使用逗号和空格将所有当事人拼接起来
    },
    getBadPersonTextA(level = '', text = '') {
      if (!level) return '未命中';

      const textList = level.split(',');
	  for(let i=0;i<textList.length;i++){
		  textList[i]=textList[i][0];
	  }
		  
	  
      return textList.includes(text) ? '命中' : '未命中';
    },
    // 诉讼当事人：从 level_buliang 字段解析命中状态
    getLitigationPartyStatus() {
      const raw = this.comprehensiveScoress('level_buliang')
      if (!raw) return '未命中'
      const text = String(raw)
      // 若整体标注为无犯罪记录，则视为未命中
      if (text.indexOf('无犯罪记录') !== -1) return '未命中'
      // level_buliang 可能是逗号分隔的多类目名称
      if (text.indexOf('诉讼当事人') !== -1 || text.indexOf('诉讼') !== -1) {
        return '命中'
      }
      return '未命中'
    },

    getStatusColor(text='') {
      if (text === '命中') {
        return 'hit';
      } else {
        return 'not-hit';
      }
    },
	getBehaviorStatusColor(text='') {
	  if (text === '命中') {
	    return 'hit';
	  } else {
	    return 'not-hit';
	  }
	},
    getfanzhafuduA(text) {
      // 安全检查
      if(!text||this.comprehensiveScoress('riskScore')==='0'||text==='0'){
		  return '无风险';
	  }
	  
	  if(text==='A'){
		  return '较低风险';
	  }
	  if(text==='B'){
	  		  return '低风险';
	  }
	  if(text==='C'){
	  		  return '中风险';
	  }
	  if(text==='D'){
	  		  return '高风险';
	  }
	  return '无风险';
    },
    // 获取黑名单命中状态显示文本（1:命中;0:未命中）
    // 从职业风险数据格式中按 filed_name 取值（数据在 list_result[0] 中，每项含 filed_name、value）
    getCareerRiskValue(filed_name) {
      if (!this.dataAll || !Array.isArray(this.dataAll)) return undefined;
      for (const item of this.dataAll) {
        const row = item && item.list_result && Array.isArray(item.list_result[0]) ? item.list_result[0] : null;
        if (!row) continue;
        const cell = row.find((c) => c && c.filed_name === filed_name);
        if (cell) return cell.value;
      }
      return undefined;
    },
    // 职业风险审查状态：1=未命中，2=命中
    getCareerRiskStatus(value) {
      if (value == null || value === '' || value === '—') return '—';
      const v = typeof value === 'object' && value?.value != null ? value.value : value;
      const n = parseInt(v, 10);
      if (n === 1) return '未命中';
      if (n === 2) return '命中';
      return String(v);
    },
    getCareerRiskStatusClass(value) {
      const status = this.getCareerRiskStatus(value);
      if (status === '命中') return 'risk-high';
      if (status === '未命中') return 'risk-safe';
      return '';
    },
    // 人工核验-真实性图标：一致/不一致/无法核实
    truthIconText(truth) {
      if (truth === 'MATCH') return '✓';
      if (truth === 'MISMATCH') return '!';
      if (truth === 'NA') return '−';
      return '';
    },
    truthIconClass(truth) {
      if (truth === 'MATCH') return 'truth-icon truth-match';
      if (truth === 'MISMATCH') return 'truth-icon truth-mismatch';
      if (truth === 'NA') return 'truth-icon truth-na';
      return '';
    },
    // 工作表现鉴定：按固定顺序输出已填写的项目
    assessmentRows(segment) {
      const assessments = (segment && segment.assessments) || {};
      return Object.keys(this.assessmentLabels)
        .map(key => ({ key, label: this.assessmentLabels[key], value: assessments[key] || '' }))
        .filter(row => String(row.value).trim() !== '');
    },
    formatHistoryWorkPeriod(row) {
      if (!row) return '—';
      const start = String(row.startMonth || '').trim();
      const end = row.currentlyActive ? '至今' : String(row.endMonth || '').trim();
      if (!start && !end) return '—';
      return `${start || '—'} 至 ${end || '—'}`;
    },
    getBlacklistHitStatus(value) {
      if (value === null || value === undefined || value === '' || value === '—') {
        return '—';
      }
      const numValue = parseInt(value);
      return numValue === 1 ? '命中' : numValue === 0 ? '未命中' : '—';
    },
    // 逾期金额展示：支持数字、">5000" 等格式，空值显示 0
    formatOverdueAmountDisplay(value) {
      if (value === null || value === undefined || value === '' || value === '—') return '0';
      const s = String(value).trim();
      if (!s) return '0';
      if (/[><]/.test(s)) return s;
      const num = parseFloat(s);
      if (!isNaN(num)) {
        return num >= 10000 ? (num / 10000).toFixed(1) + '万' : String(Math.round(num));
      }
      return s;
    },
    // 获取黑名单命中状态的颜色类
    getBlacklistHitStatusColorClass(value) {
      if (value === null || value === undefined || value === '' || value === '—') {
        return '';
      }
      const numValue = parseInt(value);
      return numValue === 1 ? 'red-color' : numValue === 0 ? 'green-color' : '';
    },
    // 获取名下车数量（兼容新旧数据格式）
    getCarNum() {
      // 新格式：从 vehiclesNumInfo 的 list_result 中获取
      const vehiclesNumInfo = this.getItemByFiledName(this.dataAll, "vehiclesNumInfo");
      if (vehiclesNumInfo && vehiclesNumInfo.list_result && Array.isArray(vehiclesNumInfo.list_result)) {
        // list_result 是二维数组，遍历查找 carNum
        for (const row of vehiclesNumInfo.list_result) {
          if (Array.isArray(row)) {
            for (const item of row) {
              if (item && item.filed_name === "carNum" && item.value !== null && item.value !== undefined) {
                return item.value;
              }
            }
          }
        }
      }
      
      // 旧格式：直接通过 carNum 获取
      const carNumData = this.comprehensiveScoress("carNum", true);
      if (carNumData && carNumData.value !== null && carNumData.value !== undefined) {
        return carNumData.value;
      }
      
      // 如果都找不到，返回0
      return 0;
    },
    getfandufanzhaColorClass(text) {
      if (text === '无风险') {
        return 'no-risk';
      } else if (text === '较低风险') {
        return 'low-risk';
      } else if (text === '低风险') {
        return 'medium-low-risk';
      } else if (text === '中风险') {
        return 'medium-risk';

      } else if (text === '高风险') {
        return 'medium-high-risk';
      } else {
        return 'high-risk';
      }
    },

	//黑名单去除小数点前
	getheimingdanText(text = ''){
		if(text[0]==='0'){
			return '0';
		}
		let result ='';
		for(let i = 2;i<text.length;i++){
			if(i===2&&text[i]==='0'){
				continue;
			}
			if(i===3&&text[i]==='0'&&text[2]==='0'){
				continue;
			}
			result+=text[i];
		}
		return result;
	},
	getBehaviorText(text){
		// 仅考虑新格式：直接传入字符串或数值（如 '0' / '1' / 0 / 1）
		if (text == null) return '未命中';
		const v = String(text).trim();
		if (v === '' || v === '0') return '未命中';
		// '1' 或其它非 0 且非空的值视为命中
		return '命中';
	}
	

  },
 
};
</script>

<style scoped>
/* 页面总标题样式 */
.page_canvas {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #f3f4f6;
  margin: 0;
  padding: 10px;
  /* 移动端默认边距 */
}

.report-header {
  max-width: 900px;
  margin: 0 auto 24px auto;
  padding: 24px 20px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  text-align: center;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
}

.report-brand {
  margin-bottom: 16px;
}

.report-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #1e40af;
  font-weight: 700;
}

.report-logo i {
  font-size: var(--fs-2xl);
  opacity: 0.9;
}

.report-logo .logo-text {
  font-size: var(--fs-2xl);
  letter-spacing: 2px;
}

.report-title {
  font-size: var(--fs-xl);
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
  letter-spacing: 0.5px;
}

.report-meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24px 32px;
}

.report-meta .meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-sm);
}

.report-meta .meta-label {
  color: #64748b;
}

.report-meta .meta-value {
  color: #334155;
  font-weight: 500;
  font-family: ui-monospace, monospace;
}

/* 底部导流栏 */
.report-cta-bar {
  max-width: 900px;
  margin: 24px auto 80px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%);
  border: 1px solid #7dd3fc;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(14, 165, 233, 0.08);
  position: relative;
  overflow: hidden;
}

.report-cta-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #0284c7, #0ea5e9);
  border-radius: 12px 0 0 12px;
}

.report-cta-bar .cta-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.report-cta-bar .cta-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-base);
  font-weight: 700;
  color: #0369a1;
}

.report-cta-bar .cta-brand i {
  font-size: var(--fs-lg);
}

.report-cta-bar .cta-headline {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: #0c4a6e;
  line-height: 1.5;
}

.report-cta-bar .cta-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.report-cta-bar .cta-tag {
  padding: 4px 12px;
  font-size: var(--fs-xs);
  color: #0369a1;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #7dd3fc;
  border-radius: 20px;
}

.report-cta-bar .cta-footer {
  font-size: var(--fs-xs);
  color: #64748b;
}

.bottom-action {
  /* position: fixed; */
  left: 0;
  right: 0;
  bottom: 20px;
  display: flex;
  justify-content: center;
  z-index: 2000;
  pointer-events: none;
}

.bottom-action .back-button.page-bottom {
  width: auto;
  height: 40px;
  background: #ffffff;
  color: #333333;
  border: 1px solid #e6e6e6;
  padding: 10px 40px;
  border-radius: 8px;
  font-size: var(--fs-base);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  pointer-events: auto;
}

.bottom-action .back-button.page-bottom:active {
  background: #f5f5f5;
}

/* 导出时隐藏底部按钮 */
.exporting-capturing+.bottom-action {
  display: none;
}

.module-container {
  max-width: 900px;
  margin: 0 auto 32px auto;
  background-color: #fff;
  border-radius: 12px;
  padding: 24px 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);
  transition: box-shadow 0.2s ease;
}

/* 各板块主题色区分：左侧强调条 + 标题色 + 微背景 */
.module-container[id] {
  border-left: 4px solid #3b82f6;
  padding-left: 26px;
}

.module-container[id="identity"] {
  border-left-color: #2563eb;
  background: linear-gradient(to right, rgba(37, 99, 235, 0.03) 0%, #fff 8%);
}
.module-container[id="education"] {
  border-left-color: #7c3aed;
  background: linear-gradient(to right, rgba(124, 58, 237, 0.04) 0%, #fff 8%);
}
.module-container[id="career-risk"] {
  border-left-color: #d97706;
  background: linear-gradient(to right, rgba(217, 119, 6, 0.04) 0%, #fff 8%);
}
.module-container[id="assets"] {
  border-left-color: #059669;
  background: linear-gradient(to right, rgba(5, 150, 105, 0.03) 0%, #fff 8%);
}
.module-container[id="police"] {
  border-left-color: #dc2626;
  background: linear-gradient(to right, rgba(220, 38, 38, 0.04) 0%, #fff 8%);
}
.module-container[id="fraud"] {
  border-left-color: #b91c1c;
  background: linear-gradient(to right, rgba(185, 28, 28, 0.04) 0%, #fff 8%);
}
.module-container[id="internet-behavior"] {
  border-left-color: #0891b2;
  background: linear-gradient(to right, rgba(8, 145, 178, 0.03) 0%, #fff 8%);
}
.module-container[id="judicial"] {
  border-left-color: #4f46e5;
  background: linear-gradient(to right, rgba(79, 70, 229, 0.03) 0%, #fff 8%);
}
.module-container[id="shixin"] {
  border-left-color: #991b1b;
  background: linear-gradient(to right, rgba(153, 27, 27, 0.04) 0%, #fff 8%);
}
.module-container[id="company"] {
  border-left-color: #0d9488;
  background: linear-gradient(to right, rgba(13, 148, 136, 0.03) 0%, #fff 8%);
}
.module-container[id="loan"] {
  border-left-color: #6d28d9;
  background: linear-gradient(to right, rgba(109, 40, 217, 0.03) 0%, #fff 8%);
}
.module-container[id="economic"] {
  border-left-color: #047857;
  background: linear-gradient(to right, rgba(4, 120, 87, 0.03) 0%, #fff 8%);
}
.module-container[id="extra"] {
  border-left-color: #475569;
  background: linear-gradient(to right, rgba(71, 85, 105, 0.04) 0%, #fff 8%);
}
.module-container[id="history-work"] {
  border-left-color: #0e7490;
  background: linear-gradient(to right, rgba(14, 116, 144, 0.04) 0%, #fff 8%);
}
.employment-verify-module {
  border-left-color: #1d4ed8;
  background: linear-gradient(to right, rgba(29, 78, 216, 0.04) 0%, #fff 8%);
}
.employment-verify-module .module-title {
  border-bottom-color: #1d4ed8;
  color: #1e40af;
}

/* 人工核验模块表格（工作履历核实 / 工作表现访谈） */
.employment-evidence-block {
  margin-top: 18px;
}
.employment-evidence-block + .employment-evidence-block {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid #dbe4ef;
}
.employment-evidence-heading {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}
.employment-evidence-number {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  border: 1px solid #b8c7da;
  border-radius: 3px;
  background: #eef3fb;
  color: #1d4ed8;
  font-size: var(--fs-xs);
  font-weight: 700;
}
.employment-evidence-heading > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.employment-evidence-heading strong {
  color: #1f2d4d;
  font-size: var(--fs-base);
}
.employment-evidence-heading > div > span {
  color: #64748b;
  font-size: var(--fs-xs);
  line-height: 1.6;
}
.employment-evidence-empty {
  margin-top: 8px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
}

.manual-table-wrap {
  width: 100%;
  overflow-x: auto;
}
.manual-report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
  line-height: 1.7;
  table-layout: fixed;
}
.manual-report-table th,
.manual-report-table td {
  border: 1px solid #d6dee8;
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}
.manual-report-table th {
  background: #eef3fb;
  color: #1f2d4d;
  font-weight: 600;
  text-align: center;
}
.manual-cell-label {
  background: #f5f8fc;
  color: #2b3a55;
  font-weight: 600;
}
.manual-cell-truth {
  text-align: center;
  vertical-align: middle;
}
.manual-cell-multiline {
  white-space: pre-wrap;
}
.manual-sub-header {
  margin: 14px 0 8px;
  padding: 6px 10px;
  background: #eef3fb;
  border-radius: 3px;
  font-weight: 600;
  color: #1f2d4d;
  font-size: var(--fs-sm);
}
.truth-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #fff;
  font-size: var(--fs-sm);
  font-weight: 700;
  line-height: 1;
}
.truth-match {
  background: #2563eb;
}
.truth-mismatch {
  background: #f59e0b;
}
.truth-na {
  background: #9ca3af;
}

.module-title {
  font-size: var(--fs-lg);
  font-weight: 600;
  color: #1f2933;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
  padding-left: 4px;
  margin-left: -4px;
}

/* 板块标题与左侧色条联动 */
.module-container[id="identity"] .module-title { border-bottom-color: #2563eb; color: #1e40af; }
.module-container[id="education"] .module-title { border-bottom-color: #7c3aed; color: #5b21b6; }
.module-container[id="career-risk"] .module-title { border-bottom-color: #d97706; color: #b45309; }
.module-container[id="assets"] .module-title { border-bottom-color: #059669; color: #047857; }
.module-container[id="police"] .module-title { border-bottom-color: #dc2626; color: #b91c1c; }
.module-container[id="fraud"] .module-title { border-bottom-color: #b91c1c; color: #991b1b; }
.module-container[id="internet-behavior"] .module-title { border-bottom-color: #0891b2; color: #0e7490; }
.module-container[id="judicial"] .module-title { border-bottom-color: #4f46e5; color: #4338ca; }
.module-container[id="shixin"] .module-title { border-bottom-color: #991b1b; color: #7f1d1d; }
.module-container[id="company"] .module-title { border-bottom-color: #0d9488; color: #0f766e; }
.module-container[id="loan"] .module-title { border-bottom-color: #6d28d9; color: #5b21b6; }
.module-container[id="economic"] .module-title { border-bottom-color: #047857; color: #065f46; }
.module-container[id="extra"] .module-title { border-bottom-color: #475569; color: #334155; }
.module-container[id="history-work"] .module-title { border-bottom-color: #0e7490; color: #0d6a7a; }

/* 过往工作履历表格 */
.history-work-table-wrap {
  overflow-x: auto;
}
.history-work-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-base);
}
.history-work-table th,
.history-work-table td {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  text-align: left;
}
.history-work-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
}
.history-work-table tbody tr:nth-child(even) {
  background: #fafbfc;
}
.history-work-empty {
  padding: 24px;
  text-align: center;
  color: #64748b;
  font-size: var(--fs-base);
}
.history-work-querying {
  color: #0d9488;
  font-weight: 500;
}

/* --- 桌面端默认样式 (min-width: 768px) --- */

/* 身份信息核验模块 */
.avatar-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ffffff, #e0f2fe);
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  font-size: var(--fs-xl);
}

.detail-item .label {
  font-size: var(--fs-xs);
  color: #888;
}

.detail-item .value {
  font-size: var(--fs-sm);
  font-weight: 500;
}

.info-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 20px 15px;
}

/* 名下资产模块 */
.assets-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assets-summary-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
}

.assets-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.summary-title {
  font-size: var(--fs-base);
  font-weight: 600;
  color: #111827;
}

.summary-tip {
  font-size: var(--fs-xs);
  color: #9ca3af;
}

.summary-body {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
}

.summary-count {
  font-size: var(--fs-2xl);
  font-weight: 700;
  color: #111827;
}

.summary-unit {
  font-size: var(--fs-sm);
  color: #6b7280;
}

.summary-note {
  margin-top: 4px;
  font-size: var(--fs-xs);
  color: #6b7280;
  line-height: 1.6;
}

.assets-etc-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  overflow: hidden;
}

.assets-etc-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.etc-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
}

.etc-title {
  font-size: var(--fs-base);
  font-weight: 600;
  color: #111827;
}

.etc-subtitle {
  font-size: var(--fs-xs);
  color: #9ca3af;
}

.asset-detail-table {
  overflow-x: auto;
}

.asset-detail-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
  text-align: left;
}

.asset-detail-table th,
.asset-detail-table td {
  padding: 10px 12px;
  border-top: 1px solid #e5e7eb;
}

.asset-detail-table th {
  background-color: #f3f4f6;
  color: #4b5563;
  font-weight: 500;
}

.asset-detail-table tbody tr:nth-child(even) td {
  background-color: #fafafa;
}

.asset-detail-table tbody tr:nth-child(odd) td {
  background-color: #ffffff;
}

.asset-empty {
  padding: 16px;
  font-size: var(--fs-sm);
  color: #9ca3af;
}

/* 公安重点人员核验模块 */
.personnel-check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 768px) {
  .personnel-check-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
}

.check-card {
  border-radius: 10px;
  padding: 14px 12px;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 150px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

.check-card .icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #dbeafe);
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: var(--fs-lg);
  margin-bottom: 10px;
}

.check-card .title {
  font-size: var(--fs-base);
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.check-card .description {
  font-size: var(--fs-xs);
  color: #9ca3af;
  margin-bottom: 10px;
  line-height: 1.5;
  flex-grow: 1;
}

.check-card .status {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: var(--fs-sm);
  font-weight: 500;
  align-self: flex-start;
}

.status {
  border-radius: 999px;
  padding: 4px 10px;
}

.status.not-hit {
  background-color: #ecfdf3;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status.hit {
  background-color: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.hit-details-section {
  margin-top: 25px;
  padding: 16px 18px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.hit-details-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.hit-icon-badge {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #fee2e2);
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  font-size: var(--fs-lg);
}

.hit-title-text .main {
  font-size: var(--fs-base);
  font-weight: 600;
  color: #111827;
}

.hit-title-text .sub {
  margin-top: 2px;
  font-size: var(--fs-xs);
  color: #9ca3af;
}

.hit-details-list {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: var(--fs-base);
}

.hit-item {
  display: flex;
  padding: 6px 0;
}

.hit-item:not(:last-child) {
  border-bottom: 1px dashed #e5e7eb;
}

.hit-item-label {
  flex-shrink: 0;
  font-weight: 500;
  color: #4b5563;
  margin-right: 10px;
  width: 90px;
}

.hit-item-value {
  color: #111827;
}

.status.no-risk {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

/* 低风险 - 浅绿色系 */
.status.low-risk {
  background-color: #f0fff3;
  color: #73d13d;
  border: 1px solid #95de64;
}

/* 中低风险 - 黄色系 */
.status.medium-low-risk {
  background-color: #fffbe6;
  color: #faad14;
  border: 1px solid #ffe58f;
}

/* 中风险 - 橙色系 */
.status.medium-risk {
  background-color: #fff7e6;
  color: #ff7a45;
  border: 1px solid #ffbb96;
}

/* 中高风险 - 浅红色系 */
.status.medium-high-risk {
  background-color: #fff2e8;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
}

/* 高风险 - 红色系 */
.status.high-risk {
  background-color: #fff1f0;
  color: #a8071a;
  border: 1px solid #ff7875;
}

/* 涉赌涉诈核验模块 */
.fraud-check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 768px) {
  .fraud-check-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
}

.fraud-card {
  border-radius: 10px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

.fraud-card .icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #fee2e2);
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b91c1c;
  font-size: var(--fs-lg);
  margin-bottom: 10px;
}

.fraud-card-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.fraud-card-text .title {
  font-size: var(--fs-base);
  font-weight: 600;
  color: #111827;
}

.fraud-card-text .description {
  font-size: var(--fs-xs);
  color: #9ca3af;
  margin-top: 4px;
  line-height: 1.5;
}

.fraud-card .status {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: var(--fs-sm);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: flex-start;
}

.risk-level-explanation {
  margin-top: 20px;
  padding: 16px 18px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.explanation-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-base);
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.explanation-title i {
  color: #2563eb;
  font-size: var(--fs-lg);
}

.explanation-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.risk-label {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
}

.risk-label::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 999px;
  margin-right: 6px;
}

.risk-label.low-risk {
  background-color: #ecfdf3;
  color: #16a34a;
}

.risk-label.low-risk::before {
  background-color: #16a34a;
}

.risk-label.low-risk-alt {
  background-color: #fefce8;
  color: #ca8a04;
}

.risk-label.low-risk-alt::before {
  background-color: #ca8a04;
}

.risk-label.mid-risk {
  background-color: #fff7ed;
  color: #ea580c;
}

.risk-label.mid-risk::before {
  background-color: #ea580c;
}

.risk-label.high-risk {
  background-color: #fef2f2;
  color: #b91c1c;
}

.risk-label.high-risk::before {
  background-color: #b91c1c;
}

.risk-desc {
  font-size: var(--fs-xs);
  color: #6b7280;
  line-height: 1.6;
  text-align: justify;
}

/* 通用折叠样式 */
.detail-container {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  margin-bottom: 15px;
  overflow: hidden;
}

.detail-container:last-child {
  margin-bottom: 0;
}

.detail-container summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: #fafafa;
  font-size: var(--fs-base);
  font-weight: 500;
  cursor: pointer;
}

summary::-webkit-details-marker {
  display: none;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
}

.detail-container.judicial-case-perfect .summary-left {
  color: #111827;
}

.summary-left i {
  color: #2563eb;
  font-size: var(--fs-base);
}

.summary-right::after {
  content: '▲';
  font-size: var(--fs-xs);
  color: #888;
  transform: rotate(180deg);
  transition: transform 0.2s;
}

.detail-container[open] .summary-right::after {
  transform: rotate(0deg);
}

/* 学历证书核验 */
.education-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.education-record {
  background: #ffffff;
  border: 1px solid #dfe5ec;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.education-record-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5eaf0;
}

.education-record-icon {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #255d85;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-lg);
}

.education-record-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.education-record-badge {
  font-size: var(--fs-xs);
  color: #52606d;
  font-weight: 600;
}

.education-certificate-no {
  font-size: var(--fs-base);
  font-weight: 600;
  color: #1e293b;
  overflow-wrap: anywhere;
}

.education-status {
  flex: 0 0 auto;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-weight: 600;
}

.education-status--matched {
  color: #166534;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.education-status--not-found {
  color: #92400e;
  background: #fffbeb;
  border-color: #fde68a;
}

.education-status--error {
  color: #b42318;
  background: #fef3f2;
  border-color: #fecdca;
}

.education-status--no-input {
  color: #475467;
  background: #f2f4f7;
  border-color: #d0d5dd;
}

.education-info-grid {
  padding: 20px 20px 20px 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 32px;
}

.education-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.education-info-item .label {
  font-size: var(--fs-xs);
  color: #64748b;
}

.education-info-item .value {
  font-size: var(--fs-base);
  font-weight: 500;
  color: #1e293b;
}

.education-result-message {
  margin: 18px 20px;
  padding: 12px 14px;
  border: 1px solid;
  border-radius: 6px;
  font-size: var(--fs-sm);
  line-height: 1.6;
}

.education-result-message--not-found {
  color: #92400e;
  background: #fffbeb;
  border-color: #fde68a;
}

.education-result-message--error {
  color: #b42318;
  background: #fef3f2;
  border-color: #fecdca;
}

.education-result-message--no-input {
  color: #475467;
  background: #f8fafc;
  border-color: #d0d5dd;
}


/* 司法案件模块 */
.judicial-wrapper {
  background-color: #f8fafc;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
}

.judicial-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.judicial-card {
  position: relative;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 14px 12px 14px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.judicial-card.has-case {
  background-color: #fff7f7;
  border-color: #fecaca;
}

.judicial-card .title {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: #111827;
  margin-bottom: 10px;
  line-height: 1.25;
}

.judicial-card .count {
  font-size: var(--fs-2xl);
  font-weight: 700;
  color: #2563eb;
  line-height: 1;
}

.judicial-card .count::after {
  content: ' 件';
  font-size: var(--fs-xs);
  font-weight: 400;
  color: #6b7280;
  margin-left: 2px;
}

.judicial-card.has-case .count {
  color: #b91c1c;
}

.judicial-card .alert-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 6px;
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-style: normal;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
}

@media (max-width: 767px) {
  .judicial-wrapper {
    padding: 12px;
  }

  .judicial-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .judicial-card {
    padding: 12px 10px;
    border-radius: 10px;
  }

  .judicial-card .title {
    font-size: var(--fs-xs);
    margin-bottom: 8px;
  }

  .judicial-card .count {
    font-size: var(--fs-xl);
  }
}

.case-category {
  margin-top: 20px;
}

.case-category-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--fs-lg);
  font-weight: 600;
  color: #111827;
  margin: 18px 0 8px 0;
  padding: 0 0 10px 0;
  border-bottom: 2px solid #111827;
  position: relative;
}

.case-category-title::before {
  content: '';
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: #111827;
  flex-shrink: 0;
}

.case-category > .case-category-title:first-child {
  margin-top: 0;
}

/* 标题到首条详情的过渡更顺滑 */
.case-category-title + div > .detail-container.judicial-case-perfect:first-child {
  margin-top: 10px;
}

/* 【重构】司法案件详情布局 */
.judicial-case-perfect .case-detail-content {
  margin: 12px 14px 14px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
  font-size: var(--fs-sm);
}

.judicial-case-perfect .detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.judicial-case-perfect .detail-row + .detail-row {
  border-top: 1px solid #d1d5db;
}

.judicial-case-perfect .detail-field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  min-width: 0;
}

.judicial-case-perfect .detail-row .detail-field:first-child {
  border-right: 1px solid #d1d5db;
}

.judicial-case-perfect .detail-field .label {
  flex-shrink: 0;
  min-width: 84px;
  color: #64748b;
  text-align: right;
}

.judicial-case-perfect .detail-field .value {
  color: #111827;
  font-weight: 500;
  word-break: break-all;
}

.judicial-case-perfect .detail-field.full-width {
  grid-column: 1 / -1;
  border-right: none !important;
}

.judicial-case-perfect .detail-field.long-text {
  flex-direction: column;
  gap: 6px;
}

.judicial-case-perfect .detail-field.long-text .label {
  min-width: unset;
  text-align: left;
  color: #64748b;
}

/* 失信被执行信息模块 */
.shixin-summary-wrapper {
  margin-top: 10px;
  margin-bottom: 18px;
}

.shixin-summary-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.shixin-summary-card.has-data {
  border-color: #fecaca;
  background: #fff7f7;
}

.shixin-summary-card .summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.shixin-summary-card .summary-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shixin-summary-card .summary-title-row .dot {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: #b91c1c;
}

.shixin-summary-card .summary-title-row .title-text {
  font-size: var(--fs-base);
  font-weight: 600;
  color: #111827;
}

.shixin-summary-card .summary-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  color: #b91c1c;
  background: #fee2e2;
  border: 1px solid #fecaca;
}

.shixin-summary-card .summary-tag.safe {
  color: #166534;
  background: #dcfce7;
  border-color: #bbf7d0;
}

.shixin-summary-card .summary-body {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 18px;
  font-size: var(--fs-sm);
}

.shixin-summary-card .summary-item .label {
  color: #6b7280;
  margin-bottom: 4px;
}

.shixin-summary-card .summary-item .value {
  color: #111827;
  font-weight: 500;
}

.shixin-summary-card .summary-item .value.highlight {
  font-size: var(--fs-lg);
  font-weight: 700;
  color: #b91c1c;
}

.shixin-detail-wrapper {
  margin-top: 10px;
}

.detail-container.shixin-detail {
  border-radius: 10px;
  border-color: #e5e7eb;
  background: #ffffff;
}

.detail-container.shixin-detail summary {
  padding: 12px 16px;
  background: #f9fafb;
}

.detail-container.shixin-detail .summary-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shixin-detail .summary-main {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
}

.shixin-detail .case-no {
  font-weight: 600;
  color: #111827;
}

.shixin-detail .case-court {
  font-size: var(--fs-sm);
  color: #6b7280;
}

.shixin-detail .summary-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.shixin-detail .badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  border: 1px solid #e5e7eb;
  color: #4b5563;
  background: #ffffff;
}

.shixin-detail .badge-danger {
  border-color: #fecaca;
  background: #fee2e2;
  color: #b91c1c;
}

.shixin-detail .badge-status {
  border-color: #e5e7eb;
  background: #f9fafb;
}

.detail-container.shixin-detail .summary-right {
  font-size: var(--fs-xs);
  color: #9ca3af;
}

.shixin-detail-content {
  padding: 0 16px 14px 16px;
  border-top: 1px solid #e5e7eb;
  font-size: var(--fs-sm);
}

.shixin-detail-content .detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.shixin-detail-content .detail-row + .detail-row {
  border-top: 1px solid #e5e7eb;
}

.shixin-detail-content .detail-field {
  padding: 9px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shixin-detail-content .detail-field.full-width {
  grid-column: 1 / -1;
}

.shixin-detail-content .label {
  font-size: var(--fs-xs);
  color: #64748b;
}

.shixin-detail-content .value {
  color: #111827;
  font-weight: 500;
  word-break: break-all;
}

/* 人企关联模块 */
.enterprise-info-container {
  padding: 20px;
  border-top: 1px solid #e8e8e8;
  font-size: var(--fs-base);
}

/* 人企关联模块（优化版，仅作用于 company-detail） */
.detail-container.company-detail {
  border-radius: 10px;
  border-color: #e5e7eb;
  background: #ffffff;
}

.detail-container.company-detail summary {
  padding: 14px 16px;
  background: #f8fafc;
}

.detail-container.company-detail .summary-left {
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;
}

.detail-container.company-detail .company-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-base);
  font-weight: 600;
  color: #111827;
  flex-wrap: wrap;
}

.tax-level-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
  font-size: var(--fs-xs);
  font-weight: 500;
  line-height: 1.4;
}

.detail-container.company-detail .company-meta {
  font-size: var(--fs-xs);
  color: #64748b;
  line-height: 1.4;
  word-break: break-all;
}

.detail-container.company-detail .summary-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
}

.detail-container.company-detail .summary-right::after {
  color: #94a3b8;
}

.company-status {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #64748b;
  line-height: 1.2;
  white-space: nowrap;
}

.company-status.status-active {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #16a34a;
}

.company-status.status-cancelled,
.company-status.status-unknown {
  border-color: #e5e7eb;
  background: #ffffff;
  color: #64748b;
}

.company-status.status-revoked {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.detail-container.company-detail .enterprise-info-container {
  padding: 14px 16px 16px 16px;
  border-top: 1px solid #e5e7eb;
}

.detail-container.company-detail .enterprise-info-grid {
  gap: 12px;
}

.detail-container.company-detail .info-group-title {
  margin-top: 6px;
  padding: 8px 0 10px 0;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
}

.detail-container.company-detail .enterprise-info-item {
  background: #f9fafb;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  padding: 10px 12px;
  min-width: 0;
}

.detail-container.company-detail .enterprise-info-item:empty {
  display: none;
}

.detail-container.company-detail .enterprise-info-item .label {
  font-size: var(--fs-xs);
  color: #64748b;
  margin-bottom: 6px;
}

.detail-container.company-detail .enterprise-info-item .value {
  font-size: var(--fs-sm);
  color: #111827;
  font-weight: 600;
  word-break: break-all;
}

.enterprise-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 30px;
}

.info-group-title {
  grid-column: 1 / -1;
  font-weight: 600;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 5px;
}

.enterprise-info-item .label {
  color: #888;
  margin-bottom: 5px;
}

.enterprise-info-item .value {
  color: #333;
  font-weight: 500;
}

.enterprise-info-item .value i {
  margin-right: 4px;
  color: #2563eb;
}

.enterprise-info-item.value.status-active {
  color: #52c41a;
  font-weight: bold;
}

.enterprise-info-item.full-width {
  grid-column: 1 / -1;
}

/* 贷款情况 & 经济能力 模块通用样式 */
.sub-module {
  border: 1px solid #eef2f7;
  border-radius: 8px;
  margin-bottom: 25px;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.sub-module:last-child {
  margin-bottom: 0;
}

.sub-module-title {
  background-color: #f7faff;
  padding: 12px 20px;
  font-size: var(--fs-base);
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  align-items: center;
}

.sub-module-title i {
  color: #2563eb;
  margin-right: 10px;
  font-size: var(--fs-lg);
}

.sub-module-content {
  padding: 20px;
}

.sub-module-content.no-padding {
  padding: 0;
}

.overdue-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 768px) {
  .overdue-stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.stat-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-card-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 10px;
  color: #6b7280;
  font-size: var(--fs-lg);
}

.stat-card-body {
  flex: 1;
  min-width: 0;
}

.stat-card-label {
  font-size: var(--fs-xs);
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 6px;
}

.stat-card-value {
  font-size: var(--fs-2xl);
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.stat-card-value.highlight {
  color: #b91c1c;
}

.stat-card-value--amount {
  font-size: var(--fs-xl);
}

.stat-card-unit {
  font-size: var(--fs-sm);
  font-weight: 500;
  color: #9ca3af;
  margin-left: 4px;
}

.loan-tags-section {
  margin-top: 18px;
}

.loan-tags-title {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 8px;
}

.loan-tags-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

@media (min-width: 768px) {
  .loan-tags-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.loan-tag-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
}

.loan-tag-label {
  font-size: var(--fs-sm);
  color: #374151;
}

.loan-tag-status {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-weight: 500;
  border: 1px solid transparent;
  background: #f3f4f6;
  color: #6b7280;
}

/* 黑名单/逾期：命中/未命中 更明显的胶囊区分 */
.loan-tag-status.red-color {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.loan-tag-status.green-color {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #16a34a;
}

/* 贷款申请情况 - 重构卡片 */
.loan-apply-section {
  margin-top: 18px;
}

.loan-apply-cards {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

@media (min-width: 768px) {
  .loan-apply-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.loan-apply-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  overflow: hidden;
}

.loan-apply-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: #111827;
}

.loan-apply-icon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #dbeafe);
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: var(--fs-sm);
}

.loan-apply-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: #e5e7eb;
}

.loan-apply-kpi {
  background: #ffffff;
  padding: 12px 14px;
  text-align: center;
}

.kpi-num {
  font-size: var(--fs-xl);
  font-weight: 700;
  color: #2563eb;
  line-height: 1.2;
}

.kpi-label {
  font-size: var(--fs-xs);
  color: #6b7280;
  margin-top: 4px;
}

.loan-apply-rows {
  border-top: 1px solid #e5e7eb;
}

.loan-apply-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid #f3f4f6;
}

.loan-apply-row:last-child {
  border-bottom: none;
}

.row-label {
  font-size: var(--fs-xs);
  color: #6b7280;
}

.row-value {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: #111827;
}

/* 贷款类型详细分析 - 新表格卡片 */
.loan-detail-section {
  margin-top: 18px;
}

.loan-detail-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  overflow: hidden;
}

.loan-detail-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: #111827;
}

.loan-detail-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.loan-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-xs);
  text-align: center;
}

.loan-detail-table th,
.loan-detail-table td {
  padding: 6px 4px;
  border-bottom: 1px solid #f3f4f6;
  word-break: break-all;
  white-space: normal;
}

.loan-detail-table thead th {
  background-color: #f3f4f6;
  color: #4b5563;
  font-weight: 600;
  font-size: var(--fs-xs);
  border-bottom: 1px solid #e5e7eb;
}

.loan-detail-table tbody th {
  background-color: #f9fafb;
  font-weight: 500;
  color: #374151;
  text-align: left;
  padding-left: 12px;
  font-size: var(--fs-xs);
}

.loan-detail-table tbody td {
  color: #6b7280;
  background-color: #fff;
}

.loan-detail-table tbody tr:nth-child(even) td {
  background-color: #fafafa;
}

.loan-detail-table tbody tr:hover td {
  background-color: #f0f7ff;
}

.loan-detail-table .sticky-col {
  text-align: left;
  padding-left: 8px;
}

.table-scroll-wrapper {
  overflow-x: auto;
  margin-bottom: 20px;
}

.table-scroll-wrapper:last-child {
  margin-bottom: 0;
}

.final-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-base);
  text-align: center;
  min-width: 800px;
}

.final-table th,
.final-table td {
  padding: 14px 10px;
  border: 1px solid #f0f0f0;
  white-space: nowrap;
}

.final-table thead th {
  background-color: #fafafa;
  color: #333;
  font-weight: 600;
  border-bottom-width: 2px;
}

.final-table tbody th {
  background-color: #fafafa;
  font-weight: 500;
  color: #555;
  text-align: left;
  padding-left: 15px;
}

.final-table tbody td {
  color: #555;
  background-color: #fff;
}

.final-table tbody tr:nth-child(even) td {
  background-color: #fcfcfc;
}

.final-table .total-row th,
.final-table .total-row td {
  font-weight: 600;
  background-color: #f7faff;
}

/* 经济能力模块 */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.kpi-grid-full {
  max-width: 100%;
  margin: 0;
}

.kpi-card {
  border: 1px solid #eef2f7;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background-color: #fff;
}

.kpi-card .label {
  font-size: var(--fs-base);
  color: #555;
  margin-bottom: 12px;
  display: block;
}

.kpi-card .value {
  font-size: var(--fs-2xl);
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 8px;
}

.kpi-card .value-desc {
  font-size: var(--fs-xs);
  color: #999;
}

.kpi-card .level-low {
  color: #52c41a;
}

.kpi-card .level-mid {
  color: #faad14;
}

.kpi-card .level-high {
  color: #ff4d4f;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 40px;
}

.details-grid .detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--fs-base);
  padding: 12px 0;
  border-bottom: 1px dashed #e8e8e8;
}

.details-grid .detail-item .label {
  color: #555;
  white-space: nowrap;
  margin-right: 10px;
}

.details-grid .detail-item .value {
  color: #2563eb;
  font-weight: 500;
  text-align: right;
}

.details-grid .full-width-item {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f7faff;
  padding: 15px;
  border-radius: 6px;
  margin: 5px 0 15px 0;
  border-bottom: none;
}

.details-grid .full-width-item .label {
  font-size: var(--fs-base);
  font-weight: 600;
  color: #333;
}

.details-grid .full-width-item .value {
  font-size: var(--fs-xl);
  font-weight: 600;
}

.supplementary-note {
  margin-top: 20px;
  padding: 12px 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  font-size: var(--fs-sm);
  color: #666;
  line-height: 1.6;
  display: flex;
  gap: 8px;
}

.loan-table-explanation {
  margin-top: 16px;
  padding: 14px 18px;
  background-color: #f8f9fa;
  border-left: 3px solid #dee2e6;
  border-radius: 4px;
  font-size: var(--fs-sm);
  color: #495057;
  line-height: 1.6;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.loan-table-explanation i {
  color: #868e96;
  font-size: var(--fs-base);
  flex-shrink: 0;
  margin-top: 2px;
}

.supplementary-note i {
  color: #2563eb;
  font-size: var(--fs-base);
  margin-top: 2px;
  flex-shrink: 0;
}

.house-note {
  margin-top: 10px;
  margin-bottom: 15px;
  padding: 10px 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  font-size: var(--fs-xs);
  color: #666;
  line-height: 1.5;
  display: flex;
  gap: 8px;
}

.house-note i {
  color: #2563eb;
  font-size: var(--fs-sm);
  margin-top: 2px;
  flex-shrink: 0;
}

.car-note {
  margin-top: 2px;
  margin-bottom: 10px;
  font-size: var(--fs-xs);
  color: #888;
  line-height: 1.5;
}

.car-note i {
  display: none;
}

/* --- 移动端响应式样式 (max-width: 767px) --- */
@media (max-width: 767px) {
  body {
    padding: 10px;
  }

  .module-container {
    padding: 16px 14px;
    margin-bottom: 24px;
  }
  .module-container[id] {
    padding-left: 20px;
  }

  .info-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .education-info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .fraud-check-grid {
    grid-template-columns: 1fr;
  }

  /* 职业风险审查：移动端更整齐的单列布局 */
  .career-risk-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .career-card {
    padding: 10px 12px 8px 12px;
  }

  .career-card-header {
    padding: 2px 0 8px 0;
  }

  .career-card-header .title {
    font-size: var(--fs-base);
  }

  .career-row {
    align-items: flex-start;
    gap: 10px;
    padding: 6px 0;
  }

  .career-row .label {
    flex: 1;
    min-width: 0;
    line-height: 1.45;
    word-break: break-all;
  }

  .status-chip {
    flex-shrink: 0;
  }

  .risk-level-explanation {
    margin-top: 20px;
    padding: 15px;
  }

  .explanation-title {
    font-size: var(--fs-base);
    margin-bottom: 12px;
  }

  .explanation-content {
    gap: 10px;
  }

  .risk-item {
    gap: 3px;
  }

  .risk-label {
    font-size: var(--fs-xs);
  }

  .risk-desc {
    font-size: var(--fs-xs);
  }

  .judicial-wrapper {
    padding: 15px;
  }

  .judicial-grid {
    grid-template-columns: 1fr 1fr;
  }

  /* 【重构】司法案件详情移动端适配 */
  .judicial-case-perfect .case-detail-content {
    margin: 10px 10px 12px 10px;
  }

  .judicial-case-perfect .detail-row {
    grid-template-columns: 1fr;
  }

  .judicial-case-perfect .detail-row .detail-field:first-child {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .judicial-case-perfect .detail-field .label {
    text-align: left;
  }

  .enterprise-info-container {
    padding: 15px;
  }

  .shixin-summary-card .summary-body {
    grid-template-columns: 1fr 1fr;
  }

  .shixin-detail-content .detail-row {
    grid-template-columns: 1fr;
  }

  .detail-container.company-detail summary {
    padding: 12px 12px;
  }

  .detail-container.company-detail .company-title-row {
    font-size: var(--fs-base);
  }

  .detail-container.company-detail .enterprise-info-container {
    padding: 12px;
  }

  .enterprise-info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .enterprise-info-item .label {
    margin-bottom: 0;
  }

  .overdue-stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-card-value {
    font-size: var(--fs-xl);
  }

  .stat-card-value--amount {
    font-size: var(--fs-lg);
  }

  .loan-application-wrapper {
    grid-template-columns: 1fr;
  }

  .application-stats-grid {
    gap: 15px;
    padding: 15px;
  }

  .app-stat-item .stat-value {
    font-size: var(--fs-xl);
  }

  .table-scroll-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .final-table {
    min-width: 800px;
    font-size: var(--fs-sm);
  }

  .final-table th,
  .final-table td {
    white-space: nowrap;
    padding: 10px 8px;
    vertical-align: middle;
  }

  .final-table tbody th {
    text-align: center;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .details-grid .full-width-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .details-grid .full-width-item .label {
    margin-bottom: 8px;
  }

  .details-grid .full-width-item .value {
    align-self: flex-end;
  }

  .supplementary-note {
    font-size: var(--fs-xs);
  }

  .hit-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .hit-item-label {
    margin-bottom: 4px;
  }
}

.extra-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* 桌面端显示两列 */
  gap: 0 40px;
  /* 列间距 */
  background-color: #fcfdff;
  padding: 20px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
}

/* 额外信息文本内容样式 */
.extra-info-content {
  background-color: #fcfdff;
  padding: 20px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  min-height: 60px;
}

.extra-info-text {
  font-size: var(--fs-base);
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.extra-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--fs-base);
  padding: 12px 0;
  border-bottom: 1px dashed #e8e8e8;
}

/* 移除网格中最后一行的底部边框 */
.extra-info-grid>.extra-info-item:nth-last-child(-n+2) {
  border-bottom: none;
}

/* 如果是奇数个，则最后一个也没有边框 */
.extra-info-grid>.extra-info-item:last-child {
  border-bottom: none;
}


.extra-info-item .label {
  color: #555;
  white-space: nowrap;
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.extra-info-item .label i {
  color: #999;
  font-size: var(--fs-base);
  margin-right: 8px;
  width: 16px;
  /* 固定图标宽度以对齐 */
  text-align: center;
}

.extra-info-item .value {
  color: #333;
  font-weight: 500;
  text-align: right;
}

.extra-info-item .value.not-hit {
  color: #52c41a;
  /* 未命中时的绿色 */
}

.extra-info-item .value.hit {
  color: #ff4d4f;
  /* 命中时的红色 */
}

.extra-info-grid {
  grid-template-columns: 1fr;
  /* 移动端改为单列显示 */
  gap: 0;
  padding: 15px;
}

.extra-info-grid>.extra-info-item:nth-last-child(-n+2) {
  /* 在单列模式下，只有最后一个元素没有边框 */
  border-bottom: 1px dashed #e8e8e8;
}

.extra-info-content {
  padding: 15px;
}

.extra-info-text {
  font-size: var(--fs-sm);
  line-height: 1.6;
}

/* 【新增】贷款黑名单表格的特定样式 */
.blacklist-table th {
  text-align: left;
  /* 左对齐可读性更好 */
  padding-left: 20px;
  font-weight: 500;
  color: #555;
  background-color: #fafafa;
}

.blacklist-table thead th {
  text-align: center;
  /* 表头居中 */
  padding-left: 10px;
}

.blacklist-table td {
  text-align: center;
  font-weight: 500;
}

.blacklist-table td.hit {
  /* 命中时使用红色突出显示 */
  font-weight: bold;
}

.value.color-green {
  color: green;
}

.value.color-red {
  color: red;
}

.value.color-orange {
  color: #ff9800;
}

.hit.red-color {
  color: red;
}

.hit.green-color {
  color: green;
}

.risk-high {
  color: #ff4d4f;
  font-weight: bold;
}

.risk-safe {
  color: #52c41a;
}

/* 职业风险审查卡片样式 */
.career-risk-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.career-card {
  background-color: #f7f9fc;
  border: 1px solid #e4e7f0;
  border-radius: 6px;
  padding: 10px 16px 6px 16px;
}
.career-card-header {
  display: flex;
  align-items: center;
  padding: 4px 0 8px 0;
  border-bottom: 1px solid #e4e7f0;
  margin-bottom: 6px;
}
.career-card-header .icon {
  margin-right: 6px;
  color: #2563eb;
}
.career-card-header .title {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: #333;
}
.career-card-body {
  padding: 4px 0 4px 0;
}
.career-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  font-size: var(--fs-sm);
  color: #333;
}
.career-row .label {
  color: #555;
}
.status-chip {
  min-width: 56px;
  padding: 2px 10px;
  border-radius: 16px;
  font-size: var(--fs-xs);
  text-align: center;
  border: 1px solid #d9d9d9;
  color: #666;
  background-color: #fff;
}
.status-chip.risk-high {
  border-color: #ffccc7;
  background-color: #fff1f0;
  color: #ff4d4f;
}
.status-chip.risk-safe {
  border-color: #b7eb8f;
  background-color: #f6ffed;
  color: #52c41a;
}

.numOFhei.red-color {
  color: red;
}

/* 你可以将这个样式添加到你的 <style> 标签中 */
.empty-data-placeholder {
  padding: 20px 15px;
  color: #888;
  text-align: center;
  font-size: var(--fs-base);
  background-color: #f9f9f9;
  /* 可选的淡灰色背景 */
  border-radius: 4px;
  margin-top: 10px;
}

.empty-data-placeholder .sub-text {
  font-size: var(--fs-xs);
  color: #aaa;
  margin-top: 8px;
}

.value.status-active {
  color: #52c41a;
  font-weight: 500;
}

.value.status-cancelled {
  color: #909399;
  font-weight: 500;
}

.value.status-revoked {
  color: #f5222d;
  font-weight: 500;
}

.value.status-unknown {
  color: #909399;
  font-weight: 500;
}

/* 无数据时的提示信息样式 */
.empty-data-placeholder {
  padding: 20px 15px;
  color: #888;
  text-align: center;
  font-size: var(--fs-base);
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-top: 10px;
}

/* ============================================= */
/* ==   司法案件模块 CSS (真正还原图片最终版)  == */
/* ============================================= */

.detail-container.judicial-case-perfect {
  border: 1px solid #EBEEF5;
  background-color: #fff;
  margin-bottom: 16px;
}

.detail-container.judicial-case-perfect summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background-color: #f8fafc;
  font-weight: 600;
  font-size: var(--fs-base);
  color: #111827;
  cursor: pointer;
}

.summary-status {
  color: #909399;
  font-weight: normal;
}

/* --- 核心布局 --- */
.info-list-perfect {
  padding: 16px;
  font-size: var(--fs-base);
}

.info-row,
.info-row-full {
  display: flex;
  /* 关键：每一行都是flex容器 */
  padding: 8px 0;
  border-bottom: 1px dashed #EBEEF5;
}

.info-list-perfect>div:last-of-type {
  border-bottom: none;
}

/* 左侧标签区域 (固定宽度) */
.info-label-area {
  flex-shrink: 0;
  width: 120px;
  /* 固定标签宽度 */
  color: #606266;
  padding-right: 16px;
}

/* 右侧内容区域 (自适应宽度) */
.info-content-area {
  flex-grow: 1;
  display: flex;
  /* 关键：内容区内部也是flex，用于并排 */
  flex-wrap: wrap;
  /* 允许内容换行 */
  align-items: center;
  color: #303133;
}

/* 内容区内部的元素 */
.content-item {
  margin-right: 16px;
  /* 右侧元素间距 */
}

.content-item.label {
  color: #606266;
  /* 内容区里的标签颜色 */
}

.content-item.full {
  flex-basis: 100%;
  /* 如果内容区只有一个元素需要占满，则使用这个 */
}

.info-content-area.full-text {
  display: block;
  /* 对于整块文本，取消flex */
}


/* --- 长文本的特殊处理 --- */
.info-row-full {
  display: block;
  /* 长文本块取消行的flex布局 */
  padding-top: 16px;
}

.info-row-full .info-label-area {
  font-weight: normal;
  /* 和短标签样式保持一致 */
  margin-bottom: 8px;
}

.info-row-full .info-content-area.long-text {
  color: #303133;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 18px;
  display: flex;
  justify-content: center;
  gap: 16px;
  z-index: 2000;
  pointer-events: none;
}
.bottom-action .action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  color: #333333;
  border: 1px solid #e6e6e6;
  padding: 10px 28px;
  border-radius: 10px;
  font-size: var(--fs-base);
  line-height: 1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all .2s ease;
  pointer-events: auto;
  user-select: none;
}
.bottom-action .action-btn i { font-size: var(--fs-base); opacity: .85; }
.bottom-action .action-btn:hover { background:#f5faff; }
.bottom-action .action-btn:active { transform: translateY(1px); }
.bottom-action .action-btn.export { background:#2563eb; color:#fff; border-color:#2563eb; }
.bottom-action .action-btn.export:hover { background:#1677d7; }
.bottom-action .action-btn.export:active { background:#155fb0; }
.bottom-action .action-btn.back:hover { border-color:#2563eb; color:#2563eb; }

/* 打印/导出时隐藏操作区域 */
@media print {
  .bottom-action { display:none !important; }
}
/* 旧的 exporting 捕获也隐藏 */
.exporting-capturing + .bottom-action { display:none; }

/* 确保所有模块都有对应的id和适当的滚动边距 */
.module-container {
  scroll-margin-top: 60px;
  /* 滚动时留出导航栏空间 */
}
/* 互联网行为推测网格布局 */
.internet-behavior-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 15px;
}

/* 移动端适配 */
@media (max-width: 767px) {
    .internet-behavior-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
/* ---------- 报告总述 ---------- */
.module-container[id="overview"] {
  border-left-color: #1d4ed8;
  background: linear-gradient(to right, rgba(29, 78, 216, 0.035) 0%, #fff 8%);
}
.module-container[id="overview"] .module-title {
  border-bottom-color: #1d4ed8;
  color: #1e3a8a;
}
.overview-body {
  overflow: hidden;
  border: 1px solid #dce4ee;
  border-radius: 6px;
  background: #fff;
}
.overview-headline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 22px 24px;
  background: #f5f8fc;
  border-bottom: 1px solid #dce4ee;
}
.overview-eyebrow {
  margin: 0 0 5px;
  color: #2563eb;
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0;
}
.overview-headline h2 {
  margin: 0;
  color: #17233b;
  font-size: var(--fs-xl);
  font-weight: 700;
}
.overview-headline > div > p:last-child {
  margin: 7px 0 0;
  color: #64748b;
  font-size: var(--fs-sm);
  line-height: 1.7;
}
.overview-metrics {
  display: grid;
  grid-template-columns: repeat(3, 86px);
  border: 1px solid #d7e0eb;
  border-radius: 6px;
  background: #fff;
}
.overview-metric {
  min-height: 68px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e2e8f0;
}
.overview-metric:last-child { border-right: 0; }
.overview-metric strong {
  color: #1e3a8a;
  font-size: var(--fs-xl);
  line-height: 1.2;
}
.overview-metric span {
  margin-top: 3px;
  color: #64748b;
  font-size: var(--fs-xs);
}
.overview-metric--complete strong { color: #047857; }
.overview-metric--attention strong { color: #b45309; }
.overview-section { padding: 22px 24px; }
.overview-section + .overview-section { border-top: 1px solid #e2e8f0; }
.overview-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.overview-section-heading {
  color: #1f2d4d;
  font-size: var(--fs-base);
  font-weight: 700;
}
.overview-section-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: var(--fs-xs);
  line-height: 1.6;
}
.overview-count {
  flex: 0 0 auto;
  padding: 3px 9px;
  border: 1px solid #f3d6aa;
  border-radius: 4px;
  background: #fff8eb;
  color: #9a5608;
  font-size: var(--fs-xs);
  font-style: normal;
  font-weight: 700;
}
.overview-risk-list { margin: 0; padding: 0; list-style: none; }
.overview-risk-list li {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid #edf0f4;
}
.overview-risk-list li:first-child { padding-top: 2px; }
.overview-risk-list li:last-child { padding-bottom: 0; border-bottom: 0; }
.overview-risk-index {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff1f2;
  color: #be123c;
  font-size: var(--fs-xs);
  font-weight: 700;
}
.overview-risk-list li.is-warning .overview-risk-index {
  background: #fff7e6;
  color: #b45309;
}
.overview-risk-content strong {
  display: block;
  margin-bottom: 4px;
  color: #2b3445;
  font-size: var(--fs-sm);
}
.overview-risk-content p {
  margin: 0;
  color: #4b5565;
  font-size: var(--fs-sm);
  line-height: 1.75;
}
.overview-empty-state {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #cce8dc;
  border-radius: 5px;
  background: #f3faf7;
}
.overview-empty-mark {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #0f8a62;
  color: #fff;
  font-size: var(--fs-xs);
  font-weight: 700;
}
.overview-empty-state strong { color: #195b47; font-size: var(--fs-sm); }
.overview-empty-state p {
  margin: 4px 0 0;
  color: #4c6b61;
  font-size: var(--fs-xs);
  line-height: 1.65;
}
.overview-pending-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 14px;
  padding: 10px 12px;
  border-left: 3px solid #94a3b8;
  background: #f8fafc;
  color: #5f6b7a;
  font-size: var(--fs-xs);
  line-height: 1.7;
}
.overview-pending-note strong { flex: 0 0 auto; color: #334155; }
.overview-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #d8e1ec;
  border-radius: 5px;
}
.overview-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  color: #344054;
  font-size: var(--fs-sm);
}
.overview-table th,
.overview-table td {
  padding: 11px 13px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: middle;
  line-height: 1.6;
  word-break: break-word;
}
.overview-table th:last-child,
.overview-table td:last-child { border-right: 0; }
.overview-table tbody tr:last-child td { border-bottom: 0; }
.overview-table th { background: #eef3f9; color: #31415f; font-weight: 700; }
.overview-table th:nth-child(1) { width: 17%; }
.overview-table th:nth-child(2) { width: 23%; }
.overview-table th:nth-child(3) { width: 16%; }
.overview-table tbody tr:nth-child(even) { background: #fbfcfe; }
.overview-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #334155;
  font-weight: 600;
  white-space: nowrap;
}
.overview-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}
.overview-status.is-complete .overview-status-dot { background: #059669; }
.overview-status.is-partial .overview-status-dot { background: #d97706; }
.overview-result { color: #334155; font-weight: 600; }
.overview-result.is-normal { color: #166a57; }
.overview-result.is-warning { color: #b45309; }
.overview-result.is-critical { color: #c2413b; }
.overview-result.is-pending { color: #64748b; }
.overview-disclaimer {
  margin: 0;
  padding: 12px 24px;
  border-top: 1px solid #e2e8f0;
  background: #fafbfd;
  color: #7a8697;
  font-size: var(--fs-xs);
  line-height: 1.7;
}
@media (max-width: 768px) {
  .overview-headline { grid-template-columns: 1fr; gap: 16px; padding: 18px 16px; }
  .overview-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .overview-metric { min-height: 62px; }
  .overview-section { padding: 18px 16px; }
  .overview-table-wrap { overflow: visible; border: 0; }
  .overview-table,
  .overview-table tbody,
  .overview-table tr,
  .overview-table td { display: block; width: 100%; }
  .overview-table thead { display: none; }
  .overview-table tbody { display: grid; gap: 10px; }
  .overview-table tr {
    padding: 11px 12px;
    border: 1px solid #dbe3ed;
    border-radius: 5px;
    background: #fff !important;
    box-sizing: border-box;
  }
  .overview-table td {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 10px;
    padding: 5px 0;
    border: 0;
  }
  .overview-table td::before {
    content: attr(data-label);
    color: #7a8697;
    font-size: var(--fs-xs);
    font-weight: 500;
  }
  .overview-pending-note { flex-direction: column; gap: 3px; }
  .overview-disclaimer { padding: 12px 16px; }
}
@media print {
  .overview-risk-list li,
  .overview-table tr { break-inside: avoid; page-break-inside: avoid; }
}

.report-card { background: #ffffff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04); width: 100%; max-width: 900px; border: 1px solid #ebeef5; overflow: hidden; }
  
  .card-header { padding: 16px 20px; border-bottom: 1px solid #ebeef5; display: flex; align-items: center; }
  .header-accent { width: 4px; height: 16px; background-color: #3b82f6; border-radius: 2px; margin-right: 10px; }
  .card-header h2 { margin: 0; font-size: var(--fs-lg); color: #1e293b; font-weight: 600; }

  /* 核心容器：默认左右弹性布局 */
  .card-body { display: flex; flex-direction: row; }

  /* 左侧：人物画像与双重认证 */
  .profile-section { width: 220px; background-color: #f8fafc; padding: 24px 20px; display: flex; flex-direction: column; align-items: center; border-right: 1px solid #ebeef5; box-sizing: border-box; }
  .avatar { width: 64px; height: 64px; background-color: #eff6ff; color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: var(--fs-2xl); margin-bottom: 12px; }
  .profile-name { font-size: var(--fs-lg); font-weight: bold; color: #0f172a; margin-bottom: 16px; }
  
  /* 认证徽章组：纵向排列，彰显严密性 */
  .badge-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; width: 100%; }
  .trust-badge { display: flex; align-items: center; justify-content: center; gap: 6px; background-color: #ecfdf5; color: #059669; font-size: var(--fs-xs); font-weight: 500; padding: 6px 12px; border-radius: 6px; border: 1px solid #a7f3d0; width: 100%; box-sizing: border-box; }
  
.profile-tags { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
/* 性别、年龄、婚姻标签：白底+深灰边框，适配中性背景 */
.tag {
  font-size: var(--fs-xs);
  padding: 4px 10px;
  border-radius: 4px;
  background: #ffffff;
  color: #374151;
  border: 1px solid #6b7280;
}

  /* 右侧：客观数据矩阵 */
  .data-section { flex: 1; padding: 24px 32px; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box; }
  .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); row-gap: 24px; column-gap: 32px; }
  
  .info-item { display: flex; align-items: flex-start; }
  .info-icon { width: 32px; height: 32px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; color: #64748b; font-size: var(--fs-base); flex-shrink: 0; }
  .info-content { display: flex; flex-direction: column; }
  .info-label { font-size: var(--fs-xs); color: #64748b; margin-bottom: 6px; }
  .info-value-wrapper { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .info-value { font-size: var(--fs-base); color: #1e293b; font-weight: 500; word-break: break-all; }
  .status-dot { width: 6px; height: 6px; background-color: #10b981; border-radius: 50%; display: inline-block; }
  .status-text { font-size: var(--fs-xs); color: #10b981; }

  .card-footer { padding: 12px 20px; background-color: #fafafa; border-top: 1px solid #ebeef5; font-size: var(--fs-xs); color: #94a3b8; display: flex; align-items: flex-start; line-height: 1.5; }
  .card-footer i { margin-right: 6px; margin-top: 2px; font-style: normal; border: 1px solid #cbd5e1; border-radius: 50%; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: var(--fs-xs); flex-shrink: 0; }

  /* =========================================
     🔥 核心：移动端响应式适配 (手机小屏) 
     当屏幕宽度小于 768px 时触发以下样式
  ========================================= */
  @media (max-width: 768px) {
    body { padding: 10px; }
    
    /* 改为上下堆叠布局 */
    .card-body { flex-direction: column; }
    
    /* 左侧(现为上方)自适应宽度，取消右边框，加上下边框 */
    .profile-section { width: 100%; border-right: none; border-bottom: 1px solid #ebeef5; padding: 24px 20px; }
    
    /* 徽章组在手机端可以横向排列，节省高度 */
    .badge-group { flex-direction: row; justify-content: center; flex-wrap: wrap; }
    .trust-badge { width: auto; padding: 6px 16px; }
    
    /* 数据区内边距减小 */
    .data-section { padding: 20px; }
    
    /* 数据网格改为 1 列 */
    .info-grid { grid-template-columns: 1fr; row-gap: 20px; }
  }
</style>
