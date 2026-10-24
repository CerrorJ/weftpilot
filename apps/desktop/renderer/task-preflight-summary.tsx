import type { Project, TaskPreflight, PreflightCheck } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

export const PreflightSummary = ({
  result,
  project,
}: {
  result: TaskPreflight | undefined
  project: Project | undefined
}) => {
  const { t } = useI18n()
  return (
    <section className="preflight-summary" aria-label={t('本次执行配置')}>
      <div>
        <h4>{t('执行成员')}</h4>
        {!result?.tasks.length && <p className="muted">{t('通过配置检查后显示本次成员快照。')}</p>}
        {result?.tasks.map((task) => (
          <PreflightMember key={task.id} task={task} />
        ))}
      </div>
      <PreflightRepository checked={result?.project ?? null} project={project} />
    </section>
  )
}

const PreflightRepository = ({
  checked,
  project,
}: {
  checked: TaskPreflight['project']
  project: Project | undefined
}) => {
  const { t } = useI18n()
  const known = checked ?? project
  const pending = t('待检查')
  const commit = (value: string | undefined) => (value ? value.slice(0, 12) : pending)
  const rows = [
    ['默认分支', known?.defaultBranch ?? '—'],
    ['基准提交', commit(checked?.baselineCommit)],
    ['项目当前分支', checked ? (checked.currentBranch ?? t('分离头指针')) : pending],
    ['当前提交', commit(checked?.currentCommit)],
    ['Git 地址', known?.gitUrl || t('本地仓库')],
  ] as const
  return (
    <div>
      <h4>{t('代码基线')}</h4>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{t(label)}</dt>
            <dd className="code">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const PreflightMember = ({ task }: { task: TaskPreflight['tasks'][number] }) => {
  const { t } = useI18n()
  const role = task.role
  return (
    <div className="preflight-member">
      <p>
        {role.name} · v{role.version} · {role.cli}
      </p>
      <PreflightModel role={role} />
      <p className="muted">
        {t(role.permission === 'read-only' ? '只读' : '工作区写入')} · {t('技能')}{' '}
        {role.skills.length} · {t('并发上限')} {role.maxConcurrency ?? 1}
      </p>
      <details>
        <summary>{task.title}</summary>
        <p className="preserve-text">{task.goal}</p>
        <h5>{t('验收条件')}</h5>
        <p className="preserve-text">{task.acceptanceCriteria}</p>
        {task.requirementRef && (
          <p>
            {t('需求版本')} · {task.requirementRef.id.slice(0, 8)} · v{task.requirementRef.version}
          </p>
        )}
        {task.dependencyTaskIds.length > 0 && (
          <p>
            {t('依赖任务')} · {task.dependencyTaskIds.map((id) => id.slice(0, 8)).join(', ')}
          </p>
        )}
        {task.feedback && (
          <>
            <h5>{t('本次修订依据')}</h5>
            <p className="preserve-text">{task.feedback}</p>
          </>
        )}
      </details>
    </div>
  )
}

const PreflightModel = ({ role }: { role: TaskPreflight['tasks'][number]['role'] }) => {
  const { t } = useI18n()
  const profile = role.modelProfileSnapshot
  const model = role.model || profile?.model || t('CLI 默认模型')
  return (
    <div className="muted">
      {profile && (
        <p>
          {profile.name} · v{profile.version}
        </p>
      )}
      <p>{model}</p>
    </div>
  )
}

const checkLabels: Record<string, string> = {
  CONFIGURATION_READY: '角色已启用，任务与技能版本引用可用',
  GIT_BASELINE_READY: '仓库与默认分支检查通过，现有工作区干净',
  QUEUE_AVAILABLE: '当前有可用执行槽位',
  DEPENDENCY_NOT_ACCEPTED: '等待上游任务人工验收',
  PROJECT_BUSY: '等待同项目执行结束',
  ROLE_BUSY: '等待角色并发名额',
  MACHINE_CAPACITY: '等待本机执行槽位',
  LIVE_AUTHENTICATION_UNVERIFIED: 'CLI 登录状态尚未验证',
  CLI_VERSION_UNVERIFIED: 'CLI 版本兼容性尚未验证',
  LIVE_MODEL_UNVERIFIED: '实际模型调用尚未验证',
}
const stateLabels = {
  passed: '通过',
  blocked: '阻塞',
  waiting: '等待',
  unverified: '未验证',
} as const

export const PreflightChecks = ({
  result,
  querying,
}: {
  result: TaskPreflight | undefined
  querying: boolean
}) => {
  const { t } = useI18n()
  return (
    <section className="preflight-checks" aria-label={t('检查结果')}>
      <h4>{t('开始前检查')}</h4>
      {querying && <p role="status">{t('正在检查实际配置与仓库…')}</p>}
      <ul>
        {result?.checks.map((check) => (
          <PreflightCheckRow key={check.id} check={check} tasks={result.tasks} />
        ))}
      </ul>
    </section>
  )
}

const PreflightCheckRow = ({
  check,
  tasks,
}: {
  check: PreflightCheck
  tasks: TaskPreflight['tasks']
}) => {
  const { t } = useI18n()
  const label =
    check.code === 'CLI_DISCOVERY'
      ? check.state === 'passed'
        ? '已找到所选 CLI 文件'
        : '未找到所选 CLI，请先安装并重启应用'
      : (checkLabels[check.code] ?? check.code)
  const task = tasks.find((item) => item.id === check.taskId)
  return (
    <li
      className={`preflight-check ${check.state}`}
      role={check.state === 'blocked' ? 'alert' : undefined}
    >
      <span className="preflight-check-state">{t(stateLabels[check.state])}</span>
      <span>
        {t(label)}
        {tasks.length > 1 && task && <small> · {task.title}</small>}
      </span>
    </li>
  )
}
