import type { PreflightInput, Project, Task } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { CreateDialog } from './create-dialog'
import { useI18n } from './preferences'
import { useTaskPreflight } from './use-task-preflight'
import { SubmissionError } from './submission-error'
import { PreflightSummary, PreflightChecks } from './task-preflight-summary'
import './task-preflight.css'

interface PreflightContext {
  task: Task
  project: Project | undefined
  input: PreflightInput
  actions: WorkspaceActions
}

export const TaskPreflightButton = (context: PreflightContext) => (
  <CreateDialog
    title="执行前检查"
    trigger={context.input.operation === 'retry' ? '创建新 Run 重试' : '开始真实执行'}
    error={context.actions.error}
    disabled={context.actions.busy}
    closeIcon
  >
    {(close, resetError) => (
      <TaskPreflightForm {...context} close={close} resetError={resetError} />
    )}
  </CreateDialog>
)

const TaskPreflightForm = ({
  task,
  project,
  input,
  actions,
  close,
  resetError,
}: PreflightContext & { close: () => void; resetError: () => void }) => {
  const query = useTaskPreflight(input, actions)
  const waiting = query.result?.checks.some((check) => check.state === 'waiting') ?? false
  return (
    <form
      className="task-preflight"
      onSubmit={(event) => {
        event.preventDefault()
        void query.confirm(close)
      }}
    >
      <PreflightBody task={task} project={project} query={query} waiting={waiting} />
      <PreflightFooter
        query={query}
        busy={actions.busy}
        waiting={waiting}
        close={close}
        resetError={resetError}
      />
    </form>
  )
}

type PreflightQuery = ReturnType<typeof useTaskPreflight>

const PreflightBody = ({
  task,
  project,
  query,
  waiting,
}: {
  task: Task
  project: Project | undefined
  query: PreflightQuery
  waiting: boolean
}) => {
  const { t } = useI18n()
  const blocker = query.result?.checks.find((check) => check.state === 'blocked')
  return (
    <div className="preflight-content">
      <p className="muted code">
        {task.id.slice(0, 8)} · {project?.name}
      </p>
      <h3>{task.title}</h3>
      {blocker && (
        <p className="preflight-blocker" role="status">
          {t(
            blocker.code === 'CLI_DISCOVERY' ? '未找到所选 CLI，请先安装并重启应用' : blocker.code,
          )}
        </p>
      )}
      <SubmissionError message={query.error} />
      <PreflightSummary result={query.result} project={project} />
      <label>
        {t('工作目录方式')}
        <select value="isolated" disabled>
          <option value="isolated">{t('为本次执行建立独立目录（推荐）')}</option>
        </select>
      </label>
      <p className="muted">{t('启动后显示本次 Run 的实际分支与工作目录。')}</p>
      <PreflightChecks result={query.result} querying={query.querying} />
      <p className="preflight-note">
        {t(
          waiting
            ? '当前需要排队，启动条件满足后由内核调度。'
            : '确认后固定本次配置和 Git 基线；执行成功后仍需人工验收。',
        )}
      </p>
      <p className="muted">
        {t('CLI 登录、版本与模型调用尚未在本次检查中验证；技能目录完整性在执行准备时复核。')}
      </p>
      {query.needsRefresh && <p role="status">{t('本次操作未确认，请重新检查当前状态。')}</p>}
    </div>
  )
}

const PreflightFooter = ({
  query,
  busy,
  waiting,
  close,
  resetError,
}: {
  query: PreflightQuery
  busy: boolean
  waiting: boolean
  close: () => void
  resetError: () => void
}) => {
  const { t } = useI18n()
  const disabled =
    !query.result?.canStart ||
    !query.result.configurationFingerprint ||
    query.querying ||
    query.needsRefresh ||
    busy
  return (
    <footer className="preflight-footer">
      <button type="button" onClick={close} disabled={busy}>
        {t('取消')}
      </button>
      <button
        type="button"
        disabled={query.querying || busy}
        onClick={() => {
          resetError()
          void query.refresh()
        }}
      >
        {t('重新检查')}
      </button>
      <button className="primary" type="submit" disabled={disabled}>
        {t(waiting ? '确认并加入队列' : '确认并开始')}
      </button>
    </footer>
  )
}
