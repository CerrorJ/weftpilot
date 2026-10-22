import { useI18n } from './preferences'
import type { Run, Task } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
interface ControlsContext {
  task: Task
  run: Run | undefined
  actions: WorkspaceActions
}
export const RunControls = ({ task, run, actions }: ControlsContext) => {
  const { t } = useI18n()
  if (!run) return <StartRun task={task} actions={actions} />
  if (run.processState === 'uncertain')
    return (
      <p role="status">
        {t('内核无法确认原进程是否结束，已阻止重试与继续写入。请保留现场并查看诊断。')}
      </p>
    )
  if (run.status === 'stopping')
    return <p role="status">{t('停止请求已记录，正在确认进程树结束。')}</p>
  const stop = ['queued', 'preparing', 'running'].includes(run.status)
  const retry = run.processState === 'confirmed_ended' && task.status === 'ready'
  return (
    <div className="run-controls">
      {stop && (
        <button
          disabled={actions.busy}
          onClick={() => {
            void actions.execute({ type: 'run.stop', runId: run.id, expectedVersion: run.version })
          }}
        >
          {t('请求停止')}
        </button>
      )}
      {retry && (
        <button
          disabled={actions.busy}
          onClick={() => {
            void actions.execute({ type: 'run.retry', runId: run.id, expectedVersion: run.version })
          }}
        >
          {t('创建新 Run 重试')}
        </button>
      )}
    </div>
  )
}

const StartRun = ({ task, actions }: Omit<ControlsContext, 'run'>) => {
  const { t } = useI18n()
  return task.status === 'ready' ? (
    <button
      className="primary"
      disabled={actions.busy}
      onClick={() => {
        void actions.execute({
          type: task.purpose === 'team_parent' ? 'team.start' : 'run.start',
          taskId: task.id,
          expectedVersion: task.version,
        })
      }}
    >
      {t('开始真实执行')}
    </button>
  ) : null
}
