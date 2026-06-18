import { useEffect, useMemo, useState } from 'react'
import { analyzeCode, getDashboard, type AnalysisJobDto, type DashboardMetric } from './api'
import './App.css'

type ViewId =
  | 'dashboard'
  | 'repositories'
  | 'new-analysis'
  | 'code-analysis'
  | 'detail'
  | 'history'
  | 'ai-center'
  | 'templates'
  | 'rules'
  | 'toolbox'
  | 'models'
  | 'audit'
  | 'settings'

type Tone = 'success' | 'warning' | 'danger' | 'blue' | 'purple' | 'neutral'

const jobs = [
  {
    platform: 'GitHub',
    repo: 'spring-projects/spring-petclinic',
    pr: '#123',
    branch: 'feature/user-api -> main',
    risk: '中风险',
    tone: 'warning' as Tone,
    score: 68,
    findings: 5,
    conclusion: '需补充接口测试与健康检查',
    status: '已完成',
  },
  {
    platform: 'GitHub',
    repo: 'acme/api-gateway',
    pr: '#42',
    branch: 'fix/security-header -> release/1.8',
    risk: '高风险',
    tone: 'danger' as Tone,
    score: 86,
    findings: 9,
    conclusion: '建议阻断合并，存在配置泄露风险',
    status: '已完成',
  },
  {
    platform: 'GitLab',
    repo: 'platform/order-service',
    pr: '!18',
    branch: 'feature/payment-refactor -> develop',
    risk: '低风险',
    tone: 'success' as Tone,
    score: 22,
    findings: 1,
    conclusion: '变更范围可控，建议常规回归',
    status: '分析中',
  },
]

function riskTone(level: 'LOW' | 'MEDIUM' | 'HIGH'): Tone {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

function riskLabel(level: 'LOW' | 'MEDIUM' | 'HIGH') {
  if (level === 'HIGH') return '高风险'
  if (level === 'MEDIUM') return '中风险'
  return '低风险'
}

const findings = [
  ['高危', 'danger', 'K8S_MISSING_PROBES', 'k8s/deployment.yaml', 'Deployment 未配置 livenessProbe 或 readinessProbe。'],
  ['中危', 'warning', 'JAVA_CONTROLLER_WITHOUT_TEST', 'src/main/java/.../UserController.java', 'Controller 发生变更，但未发现关联测试文件变更。'],
  ['中危', 'warning', 'DOCKER_LATEST_TAG', 'Dockerfile', '基础镜像使用 latest 标签，存在不可重复构建风险。'],
] as const

const templates = [
  ['Java 后端代码质量基线', '代码质量', '检查异常处理、事务边界、空值处理、日志、测试覆盖和可维护性。', '启用', 'success'],
  ['依赖升级风险评估', '依赖治理', '检查版本漂移、CVE、许可证、破坏性升级和传递依赖变化。', '启用', 'success'],
  ['Kubernetes 生产发布基线', '发布风险', '检查探针、资源限制、副本数、安全上下文、镜像标签和灰度策略。', '需确认', 'warning'],
  ['支付核心变更评审标准', '业务功能', '对支付、权限、资金字段、幂等和审计日志进行专项评审。', '自定义', 'blue'],
] as const

const capabilities = [
  ['PR 风险摘要', '已启用', '根据 Diff、规则发现和知识库规范生成结构化风险摘要。'],
  ['测试建议生成', '已启用', '识别测试缺口，为 Controller、Service、SQL 和部署变更生成测试建议。'],
  ['团队规范 RAG', '演示模式', '检索团队工程规范、部署标准、安全基线，为 AI Review 提供上下文。'],
  ['失败降级策略', '已启用', '模型调用失败时自动使用 Mock Provider，保证分析链路不中断。'],
] as const

const toolboxItems = [
  ['变更影响分析', 'MVP', '根据 PR Diff 识别受影响的接口、配置、数据库表、部署资源和测试范围。'],
  ['测试用例生成', 'MVP', '基于变更代码和评判标准生成单元测试、集成测试和回归测试建议。'],
  ['依赖风险分析', '推荐', '检查依赖升级、许可证、CVE、传递依赖变化和 Spring Boot 兼容性风险。'],
  ['发布风险评分', 'MVP', '结合代码风险、测试缺口、配置变更和历史事故，对 PR 给出发布风险分。'],
  ['Incident 辅助排障', '后续', '粘贴异常日志或告警，AI 结合最近变更生成排障路径。'],
  ['AI Agent 执行计划', '后续', '生成可人工确认的修复计划、测试计划和发布计划。'],
  ['Release Note 生成', 'MVP', '从 PR Diff 生成面向研发、测试、运维和业务的多视角变更摘要。'],
  ['AI 成本与配额治理', '推荐', '按团队、仓库、Provider 统计 Token、费用、失败率和缓存命中率。'],
  ['可观测性增强', '推荐', '为 AI 调用、分析任务、Git API 和规则执行链路提供 Trace、Metric、Log 视图。'],
] as const

const navGroups: Array<{ title: string; items: Array<{ id: ViewId; label: string; icon: string }> }> = [
  {
    title: '工作台',
    items: [
      { id: 'dashboard', label: '总览看板', icon: '◇' },
      { id: 'repositories', label: '仓库接入', icon: '⌁' },
      { id: 'new-analysis', label: '新建分析', icon: '＋' },
      { id: 'code-analysis', label: '代码片段分析', icon: '⌘' },
      { id: 'detail', label: '分析详情', icon: '◎' },
      { id: 'history', label: '分析历史', icon: '≡' },
    ],
  },
  {
    title: 'AI 治理',
    items: [
      { id: 'ai-center', label: 'AI 能力中心', icon: 'AI' },
      { id: 'templates', label: '评判标准模板', icon: '▤' },
      { id: 'rules', label: '规则与策略', icon: '□' },
      { id: 'toolbox', label: 'AI DevOps 工具箱', icon: '⬡' },
      { id: 'models', label: '模型监控', icon: '◌' },
      { id: 'audit', label: '审计日志', icon: '▣' },
      { id: 'settings', label: '系统配置', icon: '⚙' },
    ],
  },
]

function Tag({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`tag ${tone}`}>{children}</span>
}

function Metric({ label, value, note, ai }: { label: string; value: string; note: string; ai?: boolean }) {
  return (
    <section className={`panel metric ${ai ? 'ai' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </section>
  )
}

function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string
  desc: string
  actions?: React.ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p className="page-desc">{desc}</p>
      </div>
      {actions ? <div className="button-row">{actions}</div> : null}
    </div>
  )
}

function DashboardPage({ go }: { go: (view: ViewId) => void }) {
  const [apiJobs, setApiJobs] = useState<AnalysisJobDto[]>([])
  const [apiMetrics, setApiMetrics] = useState<DashboardMetric[]>([])
  const [apiStatus, setApiStatus] = useState('正在连接后端 API...')

  useEffect(() => {
    getDashboard()
      .then((data) => {
        setApiJobs(data.jobs)
        setApiMetrics(data.metrics)
        setApiStatus('后端 API 已连接')
      })
      .catch((error: unknown) => {
        console.error(error)
        setApiStatus('后端 API 暂不可用，展示本地演示数据')
      })
  }, [])

  const displayJobs = apiJobs.length > 0 ? apiJobs : jobs
  const displayMetrics = apiMetrics.length > 0
    ? apiMetrics
    : [
        { label: '本月 AI 审核次数', value: '1,286', note: '较上月提升 18.4%' },
        { label: '高风险 PR', value: '17', note: '其中 5 个阻断合并' },
        { label: '代码片段分析', value: '312', note: '模板命中率 82%' },
        { label: '模型调用成本', value: '$42.8', note: '本月预算使用 36%' },
      ]

  return (
    <>
      <PageHeader
        title="总览看板"
        desc="统一查看 PR 风险、AI 审核质量、模型调用成本和团队交付健康度。"
        actions={
          <>
            <button className="btn">刷新数据</button>
            <button className="btn primary" onClick={() => go('new-analysis')}>新建 PR 分析</button>
          </>
        }
      />
      <div className="api-banner">{apiStatus}</div>
      <div className="grid metrics">
        {displayMetrics.map((metric, index) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} note={metric.note} ai={index === 0 || metric.label.includes('代码')} />
        ))}
      </div>

      <div className="split">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>近期 PR 风险分析</h2>
              <p>按最近完成时间排序，展示风险等级、AI 结论和策略命中情况。</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>平台</th>
                <th>仓库</th>
                <th>分支</th>
                <th>风险</th>
                <th>AI 结论</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {displayJobs.map((job) => (
                <tr key={`${'repo' in job ? job.repo : job.repository}${'pr' in job ? job.pr : job.pullRequest}`}>
                  <td><Tag tone="blue">{job.platform}</Tag></td>
                  <td className="mono">{'repo' in job ? job.repo : job.repository} {'pr' in job ? job.pr : job.pullRequest}</td>
                  <td className="mono">{job.branch}</td>
                  <td><Tag tone={'tone' in job ? job.tone : riskTone(job.riskLevel)}>{'risk' in job ? job.risk : riskLabel(job.riskLevel)}</Tag></td>
                  <td>{job.conclusion}</td>
                  <td><Tag tone={job.status === 'RUNNING' || job.status === '分析中' ? 'neutral' : 'success'}>{job.status === 'COMPLETED' ? '已完成' : job.status === 'RUNNING' ? '分析中' : job.status}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>企业级 AI 指标</h2>
              <p>风险分布与模型工作负载概览。</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="bar-chart">
              <div className="bar-wrap"><div className="bar low" /><span>低风险</span></div>
              <div className="bar-wrap"><div className="bar medium" /><span>中风险</span></div>
              <div className="bar-wrap"><div className="bar high" /><span>高风险</span></div>
              <div className="bar-wrap"><div className="bar ai" /><span>AI 调用</span></div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function RepositoryPage() {
  return (
    <>
      <PageHeader
        title="仓库接入"
        desc="配置 GitHub / GitLab 仓库、分支规则、Webhook 自动扫描和合并前门禁策略。"
        actions={<><button className="btn">测试 Webhook</button><button className="btn">同步分支</button><button className="btn primary">接入新仓库</button></>}
      />
      <div className="analysis-layout">
        <section className="panel">
          <div className="panel-header">
            <div><h2>仓库配置</h2><p>支持手动扫描和 Webhook 自动触发，后续可扩展 GitHub App / GitLab App。</p></div>
            <Tag tone="success">已启用自动扫描</Tag>
          </div>
          <div className="panel-body form-grid">
            <label className="field">代码平台<select><option>GitHub</option><option>GitLab</option><option>自托管 Git</option></select></label>
            <label className="field">接入方式<select><option>Webhook + Token</option><option>GitHub App</option><option>GitLab Project Access Token</option><option>仅手动扫描</option></select></label>
            <label className="field full">仓库地址<input defaultValue="https://github.com/spring-projects/spring-petclinic" /></label>
            <label className="field">默认分支<select><option>main</option><option>master</option><option>develop</option><option>release/*</option></select></label>
            <label className="field">受保护分支<input defaultValue="main, release/*, hotfix/*" /></label>
            <label className="field">扫描源分支规则<input defaultValue="feature/*, fix/*, hotfix/*" /></label>
            <label className="field">目标分支规则<input defaultValue="main, develop, release/*" /></label>
            <label className="field full">Webhook URL<input defaultValue="https://codepilotops.example.com/api/webhooks/git" /><small>GitHub / GitLab 配置该地址后，Push、PR、MR 事件会自动触发分析任务。</small></label>
            <label className="field">Webhook Secret<input type="password" defaultValue="codepilotops-secret" /></label>
            <label className="field">默认评判标准模板<select><option>Java 后端代码质量基线</option><option>支付核心变更评审标准</option></select></label>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header"><div><h2>自动扫描策略</h2><p>定义哪些事件触发 AI 分析，以及高风险时如何处理。</p></div></div>
          <div className="panel-body stack">
            {['PR / MR 创建时自动扫描', 'PR / MR 更新时自动重新扫描', 'Push 到 feature/* 分支时扫描', '合并到受保护分支前执行门禁分析', '分析完成后回写 PR / MR 评论'].map((item, index) => (
              <label className="check" key={item}><input type="checkbox" defaultChecked={index !== 2} /> {item}</label>
            ))}
            <div className="result-card">
              <strong>门禁规则</strong>
              <div className="criteria-item"><span>{'风险分 >= 85，建议阻断合并'}</span><Tag tone="danger">阻断</Tag></div>
              <div className="criteria-item"><span>命中高危安全规则，要求负责人确认</span><Tag tone="danger">阻断</Tag></div>
              <div className="criteria-item"><span>缺少测试但未达阻断阈值，评论提醒</span><Tag tone="warning">提醒</Tag></div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function NewAnalysisPage() {
  return (
    <>
      <PageHeader title="新建分析" desc="输入 GitHub / GitLab 仓库与分支信息，启动规则扫描、AI 风险评估和治理策略校验。" />
      <div className="analysis-layout">
        <section className="panel">
          <div className="panel-header"><div><h2>PR / MR 分析任务</h2><p>适合手动演示，也能复用仓库接入的分支规则和模板。</p></div></div>
          <div className="panel-body form-grid">
            <label className="field">代码平台<select><option>GitHub</option><option>GitLab</option></select></label>
            <label className="field">扫描模式<select><option>PR / MR Diff 分析</option><option>分支对比分支分析</option><option>最近一次 Push 分析</option><option>指定 Commit 分析</option></select></label>
            <label className="field">仓库 Owner<input defaultValue="spring-projects" /></label>
            <label className="field">仓库名称<input defaultValue="spring-petclinic" /></label>
            <label className="field">Pull Request 编号<input defaultValue="123" /></label>
            <label className="field">Merge Request 编号<input placeholder="GitLab 仓库可填写" /></label>
            <label className="field">源分支<input defaultValue="feature/user-api" /></label>
            <label className="field">目标分支<select><option>main</option><option>develop</option><option>release/1.0</option></select></label>
            <label className="field">AI Provider<select><option>Mock Reviewer</option><option>Ollama 本地模型</option><option>OpenAI-Compatible API</option></select></label>
            <label className="field">评判标准模板<select><option>Java 后端代码质量基线</option><option>支付核心变更评审标准</option><option>Kubernetes 生产发布基线</option></select></label>
            <label className="field full">补充上下文<textarea defaultValue="本次变更涉及用户接口与 Kubernetes 部署配置，请重点关注测试覆盖、回滚风险和生产健康检查。" /></label>
            <div className="full button-row"><button className="btn">校验权限</button><button className="btn">预估模型成本</button><button className="btn primary">启动分析任务</button></div>
          </div>
        </section>
        <PipelinePanel />
      </div>
    </>
  )
}

function PipelinePanel() {
  return (
    <section className="panel">
      <div className="panel-header"><div><h2>AI 分析链路</h2><p>企业级 AI 应用需要可解释、可审计、可降级。</p></div></div>
      <div className="panel-body timeline">
        {['拉取 PR / MR Diff', '规则引擎扫描', '检索知识库上下文', '调用 AI Reviewer', '执行治理策略'].map((item) => (
          <div className="timeline-item" key={item}><span className="timeline-dot" /><div><strong>{item}</strong><small>结构化输出、审计记录和失败降级。</small></div></div>
        ))}
      </div>
    </section>
  )
}

function CodeAnalysisPage() {
  const defaultCode = `public UserDTO updateUser(Long id, UpdateUserRequest request) {
    User user = userRepository.findById(id).orElseThrow();
    user.setEmail(request.getEmail());
    user.setRole(request.getRole());
    userRepository.save(user);
    return mapper.toDTO(user);
}`
  const [code, setCode] = useState(defaultCode)
  const [analysisStatus, setAnalysisStatus] = useState('等待分析')
  const [analysisFindings, setAnalysisFindings] = useState<string[]>([
    '方法允许直接修改用户角色，需要确认调用方是否具备权限校验。',
    '邮箱字段缺少格式校验和唯一性冲突处理。',
    '未记录关键字段变更审计日志，不利于企业权限变更追踪。',
  ])

  const handleAnalyze = () => {
    setAnalysisStatus('正在调用后端 AI 分析接口...')
    analyzeCode(code, 'Java 后端代码质量基线')
      .then((result) => {
        setAnalysisFindings(result.findings)
        setAnalysisStatus(`后端分析完成：${result.riskLevel}`)
      })
      .catch((error: unknown) => {
        console.error(error)
        setAnalysisStatus('后端分析失败，展示本地演示结果')
      })
  }

  return (
    <>
      <PageHeader
        title="代码片段分析"
        desc="无需接入 Git 仓库，直接粘贴代码、依赖、配置或日志片段，让 AI 按指定标准进行风险分析。"
        actions={<><button className="btn">导入文件</button><button className="btn primary" onClick={handleAnalyze}>开始 AI 分析</button></>}
      />
      <div className="api-banner">{analysisStatus}</div>
      <div className="code-workbench">
        <section className="panel">
          <div className="panel-header"><div><h2>粘贴待分析内容</h2><p>支持 Java、SQL、YAML、Dockerfile、pom.xml、Gradle、日志片段和异常堆栈。</p></div><Tag tone="blue">临时分析</Tag></div>
          <div className="panel-body">
            <div className="form-grid compact">
              <label className="field">内容类型<select><option>自动识别</option><option>Java 代码</option><option>Maven 依赖</option><option>Kubernetes YAML</option></select></label>
              <label className="field">评判标准模板<select><option>Java 后端代码质量基线</option><option>Spring Boot 安全检查</option><option>依赖升级风险评估</option></select></label>
            </div>
            <textarea className="code-editor" value={code} onChange={(event) => setCode(event.target.value)} />
            <div className="button-row top-gap"><button className="btn">保存为样例</button><button className="btn">生成测试建议</button><button className="btn primary" onClick={handleAnalyze}>按模板分析</button></div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header"><div><h2>AI 分析结果预览</h2><p>展示风险评分、标准命中、修复建议和可执行动作。</p></div><Tag tone="warning">中风险</Tag></div>
          <div className="panel-body stack">
            <Score label="安全风险" value={72} tone="danger" />
            <Score label="测试缺口" value={64} tone="warning" />
            <Score label="可维护性" value={38} tone="blue" />
            <div className="review-block"><h3>关键发现</h3><ul>{analysisFindings.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div className="button-row"><button className="btn">生成修复 Patch</button><button className="btn">生成测试用例</button><button className="btn">复制 Markdown 报告</button></div>
          </div>
        </section>
      </div>
    </>
  )
}

function Score({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div className="score-row">
      <span>{label}</span>
      <div className="score-track"><div className={`score-fill ${tone}`} style={{ width: `${value}%` }} /></div>
      <strong>{value}</strong>
    </div>
  )
}

function DetailPage() {
  const [tab, setTab] = useState<'findings' | 'review' | 'governance' | 'raw'>('findings')
  return (
    <>
      <PageHeader
        title="spring-projects/spring-petclinic #123"
        desc="已完成 · 12 个变更文件 · 5 条风险发现 · 使用 Mock Reviewer · 成本 $0.00"
        actions={<><button className="btn">打开 GitHub PR</button><button className="btn">重新分析</button><button className="btn primary">发布 AI Review 评论</button></>}
      />
      <section className="panel risk-overview">
        <div className="gauge"><div><strong>68</strong><span>中风险</span></div></div>
        <div>
          <h2>AI 风险摘要</h2>
          <p>本次 PR 修改了用户接口逻辑和 Kubernetes 部署配置。AI 建议重点关注接口测试覆盖、健康检查缺失、Docker 镜像版本漂移以及上线后的回滚路径。</p>
          <div className="summary-list">
            <Metric label="变更文件" value="12" note="Java / K8s / Docker" />
            <Metric label="风险发现" value="5" note="1 个高危问题" />
            <Metric label="建议测试" value="4" note="接口与容器验证" />
          </div>
        </div>
      </section>
      <section className="panel section-gap">
        <div className="tabs">
          {[
            ['findings', '风险发现'],
            ['review', 'AI Review'],
            ['governance', '治理结果'],
            ['raw', '原始数据'],
          ].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id as typeof tab)}>{label}</button>)}
        </div>
        <div className="panel-body">{tab === 'findings' ? <FindingsTable /> : tab === 'review' ? <ReviewContent /> : tab === 'governance' ? <GovernanceContent /> : <pre className="json">{JSON.stringify({ riskLevel: 'MEDIUM', riskScore: 68, policyDecision: 'REQUIRE_HUMAN_CONFIRMATION', findings: [{ ruleId: 'K8S_MISSING_PROBES', severity: 'HIGH' }] }, null, 2)}</pre>}</div>
      </section>
    </>
  )
}

function FindingsTable() {
  return (
    <table>
      <thead><tr><th>等级</th><th>规则</th><th>文件</th><th>问题描述</th></tr></thead>
      <tbody>{findings.map(([level, tone, rule, file, message]) => <tr key={rule}><td><Tag tone={tone as Tone}>{level}</Tag></td><td className="mono">{rule}</td><td className="mono">{file}</td><td>{message}</td></tr>)}</tbody>
    </table>
  )
}

function ReviewContent() {
  return <div className="review-block"><h3>摘要</h3><p>该 PR 涉及用户接口逻辑和部署配置变更，整体为中风险。建议 Reviewer 优先检查接口行为、测试覆盖、容器镜像版本和 Kubernetes 健康检查。</p><h3>建议补充测试</h3><ul><li>为 UserController 新增接口集成测试。</li><li>验证容器启动、探针成功和探针失败场景。</li><li>执行用户 API 主流程回归测试。</li></ul></div>
}

function GovernanceContent() {
  return <div className="three"><div className="policy-card"><strong>合并门禁策略</strong><Tag tone="warning">需要人工确认</Tag><small>命中高危 K8s 规则，但未达到自动阻断阈值。</small></div><div className="policy-card"><strong>敏感信息策略</strong><Tag tone="success">通过</Tag><small>未检测到疑似密钥、Token 或密码。</small></div><div className="policy-card"><strong>AI 输出合规</strong><Tag tone="success">通过</Tag><small>结构化输出解析成功，未发现越权建议。</small></div></div>
}

function HistoryPage() {
  return (
    <>
      <PageHeader title="分析历史" desc="查询历史 PR / MR 分析任务，追踪风险趋势、AI 审核效果和评论发布记录。" />
      <section className="panel">
        <div className="panel-body">
          <div className="filter-row"><input placeholder="搜索仓库或 PR/MR 编号" /><select><option>风险等级：全部</option></select><select><option>Provider：全部</option></select><button className="btn">刷新</button></div>
          <table><thead><tr><th>平台</th><th>仓库</th><th>PR/MR</th><th>风险</th><th>分数</th><th>发现</th><th>结论</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.repo}><td>{job.platform}</td><td className="mono">{job.repo}</td><td>{job.pr}</td><td><Tag tone={job.tone}>{job.risk}</Tag></td><td>{job.score}</td><td>{job.findings}</td><td>{job.conclusion}</td></tr>)}</tbody></table>
        </div>
      </section>
    </>
  )
}

function AiCenterPage() {
  return (
    <>
      <PageHeader title="AI 能力中心" desc="集中管理 CodePilotOps 的 AI Review 能力、知识库上下文、Prompt 模板和降级策略。" actions={<button className="btn primary">新增 AI 能力</button>} />
      <div className="capability-grid">{capabilities.map(([title, status, desc]) => <div className="capability" key={title}><div className="capability-title"><strong>{title}</strong><Tag tone={status === '演示模式' ? 'warning' : 'success'}>{status}</Tag></div><p>{desc}</p></div>)}</div>
      <div className="split section-gap"><section className="panel"><div className="panel-header"><div><h2>Prompt 模板</h2><p>模板版本化、结构化输出和审计能力。</p></div></div><pre className="json">System: 你是资深 Java 后端 Reviewer 和发布风险分析专家。{"\n"}Output: summary, riskLevel, riskScore, keyRisks, suggestedTests, rollbackPlan</pre></section><section className="panel"><div className="panel-header"><div><h2>知识库上下文</h2><p>用于增强 AI Review 的团队工程规范。</p></div></div><table><tbody><tr><td>Java API Review Guideline</td><td><Tag tone="success">可用</Tag></td></tr><tr><td>Kubernetes Release Checklist</td><td><Tag tone="success">可用</Tag></td></tr></tbody></table></section></div>
    </>
  )
}

function TemplatesPage() {
  return (
    <>
      <PageHeader title="评判标准模板" desc="将团队标准、业务规则、代码规范、依赖策略和发布基线沉淀为可复用分析模板。" actions={<><button className="btn">导入 YAML / JSON</button><button className="btn primary">创建模板</button></>} />
      <div className="template-grid">{templates.map(([name, category, desc, status, tone]) => <div className="template-card" key={name}><div className="template-head"><div><strong>{name}</strong><small>{category}</small></div><Tag tone={tone as Tone}>{status}</Tag></div><p>{desc}</p></div>)}</div>
    </>
  )
}

function RulesPage() {
  return <><PageHeader title="规则与策略" desc="规则引擎负责确定性风险发现，策略层负责企业治理、阻断建议和人工审批。" /><section className="panel"><FindingsTable /></section></>
}

function ToolboxPage() {
  return (
    <>
      <PageHeader title="AI DevOps 工具箱" desc="围绕代码到发布的完整链路，提供可落地的 AI 辅助研发效能能力。" actions={<button className="btn primary">启用推荐能力</button>} />
      <div className="toolbox-grid">{toolboxItems.map(([title, status, desc]) => <div className="toolbox-card" key={title}><div className="capability-title"><h3>{title}</h3><Tag tone={status === '后续' ? 'warning' : status === '推荐' ? 'blue' : 'success'}>{status}</Tag></div><p>{desc}</p></div>)}</div>
      <section className="panel section-gap"><div className="panel-header"><div><h2>Agent 安全边界</h2><p>建议可自动生成，危险操作需人工确认。</p></div></div><table><tbody><tr><td>生成 Review 报告</td><td><Tag tone="success">自动</Tag></td></tr><tr><td>发布 Git 评论</td><td><Tag tone="warning">人工确认</Tag></td></tr><tr><td>执行部署或回滚</td><td><Tag tone="danger">禁止自动执行</Tag></td></tr></tbody></table></section>
    </>
  )
}

function ModelsPage() {
  return <><PageHeader title="模型监控" desc="监控不同 AI Provider 的调用量、延迟、成本、失败率和结构化输出质量。" /><div className="grid metrics"><Metric label="今日调用量" value="348" note="PR Review 任务为主" /><Metric label="平均延迟" value="2.4s" note="P95 6.8s" /><Metric label="失败率" value="1.3%" note="已触发自动降级" /><Metric label="今日成本" value="$3.7" note="预算健康" /></div></>
}

function AuditPage() {
  return <><PageHeader title="审计日志" desc="记录 AI 调用、策略决策、Git 评论、配置变更和人工审批动作。" /><section className="panel"><table><tbody><tr><td>23:18:42</td><td>AI_REVIEW_GENERATED</td><td className="mono">spring-petclinic#123</td><td><Tag tone="success">成功</Tag></td></tr><tr><td>23:18:40</td><td>POLICY_EVALUATED</td><td className="mono">K8S_MISSING_PROBES</td><td><Tag tone="warning">人工确认</Tag></td></tr></tbody></table></section></>
}

function SettingsPage() {
  return <><PageHeader title="系统配置" desc="配置 GitHub / GitLab 接入、AI Provider、知识库、评论模板和安全策略。" actions={<button className="btn primary">保存配置</button>} /><div className="split"><section className="panel"><div className="panel-header"><div><h2>Git 接入</h2><p>用于拉取 Diff，并在授权后发布 Review 评论。</p></div></div><div className="panel-body form-grid"><label className="field full">Access Token<input type="password" defaultValue="ghp_mock_token" /></label><label className="field">默认 Owner<input defaultValue="spring-projects" /></label><label className="field">默认仓库<input defaultValue="spring-petclinic" /></label></div></section><section className="panel"><div className="panel-header"><div><h2>AI Provider</h2><p>支持 Mock、Ollama 和 OpenAI-Compatible API。</p></div></div><div className="panel-body form-grid"><label className="field full">Provider<select><option>Mock Reviewer</option><option>Ollama</option><option>OpenAI-Compatible</option></select></label><label className="field full">Base URL<input defaultValue="http://localhost:11434" /></label><label className="field">模型<input defaultValue="llama3.1" /></label><label className="field">API Key<input type="password" /></label></div></section></div></>
}

function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard')
  const title = useMemo(() => navGroups.flatMap((group) => group.items).find((item) => item.id === activeView)?.label ?? '总览看板', [activeView])

  const renderView = () => {
    switch (activeView) {
      case 'repositories': return <RepositoryPage />
      case 'new-analysis': return <NewAnalysisPage />
      case 'code-analysis': return <CodeAnalysisPage />
      case 'detail': return <DetailPage />
      case 'history': return <HistoryPage />
      case 'ai-center': return <AiCenterPage />
      case 'templates': return <TemplatesPage />
      case 'rules': return <RulesPage />
      case 'toolbox': return <ToolboxPage />
      case 'models': return <ModelsPage />
      case 'audit': return <AuditPage />
      case 'settings': return <SettingsPage />
      default: return <DashboardPage go={setActiveView} />
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CP</div><div><strong>CodePilotOps</strong><span>企业级 AI 交付风险平台</span></div></div>
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="nav-section-title">{group.title}</div>
            <nav className="nav">
              {group.items.map((item) => <button key={item.id} className={activeView === item.id ? 'active' : ''} onClick={() => setActiveView(item.id)}><span>{item.icon}</span>{item.label}</button>)}
            </nav>
          </div>
        ))}
        <div className="sidebar-card"><strong>本地企业演示模式</strong><span>当前使用 Mock Reviewer，可切换 Ollama 或 OpenAI-Compatible Provider。</span></div>
      </aside>
      <main className="main">
        <header className="topbar"><input placeholder="搜索仓库、PR、规则、策略或模型调用记录" /><div><span className="health-dot" /> AI 服务正常 · 当前页面：{title}</div></header>
        <section className="content">{renderView()}</section>
      </main>
    </div>
  )
}

export default App
