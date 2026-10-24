import { useI18n } from './preferences'
import { useState } from 'react'
import type { Run, Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { runLabel, taskLabels } from './task-status'
import { DeliveryReview } from './delivery-review'
import { RunControls } from './run-controls'
import { RunActivity } from './run-activity'
import { TaskRelations, RunInputs } from './task-relations'
import { RunHumanRequests } from './human-request-card'
interface TaskContext {
  task: Task
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  selectTask: (id: string) => void
}
export const TaskDetail = ({ task, state, actions, selectTask }: TaskContext) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const runs = state.runs
    .filter((item) => item.taskId === task.id)
    .sort((a, b) => a.attempt - b.attempt)
  const latest = runs.at(-1)
  const run = runs.find((item) => item.id === selected) ?? latest
  return (
    <article className="task-detail">
      <div className="section-heading">
        <h2>{task.title}</h2>
        <span className="badge">{t(taskLabels[task.status])}</span>
      </div>
      <h3>{t('任务目标')}</h3>
      <p className="preserve-text">{task.goal}</p>
      <h3>{t('验收条件')}</h3>
      <p className="preserve-text">{task.acceptanceCriteria}</p>
      <RunControls task={task} run={latest} actions={actions} />
      <TaskRelations task={task} state={state} selectTask={selectTask} />
      {runs.length > 0 && (
        <label>
          {t('执行历史')}
          <select value={run?.id} onChange={(event) => setSelected(event.target.value)}>
            {runs.map((item) => (
              <option key={item.id} value={item.id}>
                {t('第')}
                {item.attempt}
                {t('次 ·')}
                {t(runLabel(item))}
              </option>
            ))}
          </select>
        </label>
      )}
      {run && (
        <>
          <RunDetails run={run} />
          <RunInputs run={run} state={state} />
          <RunActivity runId={run.id} cursor={state.cursor} />
          <RunHumanRequests runId={run.id} actions={actions} />
          <DeliveryReview task={task} run={run} state={state} actions={actions} />
        </>
      )}
    </article>
  )
}
const RunDetails = ({ run }: { run: Run }) => {
  const { t } = useI18n()
  return (
    <section className="run-details">
      <h3>
        {t('第')}
        {run.attempt}
        {t('次执行 ·')}
        {t(runLabel(run))}
      </h3>
      {run.failureCode && (
        <p role="alert">
          {t('失败原因：')}
          {run.failureCode}
        </p>
      )}
      <dl>
        <div>
          <dt>{t('角色快照')}</dt>
          <dd>
            {run.roleSnapshot.name} · v{run.roleSnapshot.version} · {run.roleSnapshot.cli} ·{' '}
            {run.roleSnapshot.model || t('CLI 默认模型')}
          </dd>
        </div>
        <div>
          <dt>{t('执行分支')}</dt>
          <dd className="code">{run.executionBranch}</dd>
        </div>
        <div>
          <dt>{t('工作目录')}</dt>
          <dd className="code">{run.workDirectory}</dd>
        </div>
        <div>
          <dt>{t('基准提交')}</dt>
          <dd className="code">{run.baselineCommit}</dd>
        </div>
        <div>
          <dt>{t('进程状态')}</dt>
          <dd>{run.processState}</dd>
        </div>
      </dl>
    </section>
  )
}
