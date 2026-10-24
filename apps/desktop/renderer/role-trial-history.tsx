import type { RoleVersion, Run, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { roleReadiness, roleTrials } from './role-card-view'
import { RunSnapshotButton } from './run-snapshot'
import { runLabel } from './task-status'

/** 版本变更不隐藏旧试运行；停止绑定旧Run版本，不对当前角色或新Run作决定。 */
export const RoleTrialHistory = ({
  role,
  state,
  actions,
}: {
  role: RoleVersion
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const runs = roleTrials(state, role.id)
  const latestTrial = roleReadiness(state, role)?.latestTrialRunId
  if (!runs.length) return null
  return (
    <section className="role-trial-history">
      <h3>{t('历次试运行')}</h3>
      {runs.map((run) => {
        const task = state.tasks.find((item) => item.id === run.taskId)
        return (
          <div key={run.id} className="role-trial-record">
            <span>
              v{run.roleSnapshot.version} · {t(runLabel(run))}
            </span>
            {task && <RunSnapshotButton task={task} run={run} state={state} actions={actions} />}
            {run.id !== latestTrial && <StopHistoricalTrial run={run} actions={actions} />}
          </div>
        )
      })}
    </section>
  )
}

const StopHistoricalTrial = ({ run, actions }: { run: Run; actions: WorkspaceActions }) => {
  const { t } = useI18n()
  if (
    run.processState === 'uncertain' ||
    !['queued', 'preparing', 'running', 'waiting_input', 'waiting_approval'].includes(run.status)
  )
    return null
  return (
    <button
      disabled={actions.busy}
      onClick={() => {
        void actions.execute({ type: 'run.stop', runId: run.id, expectedVersion: run.version })
      }}
    >
      {t('停止此试运行')}
    </button>
  )
}
