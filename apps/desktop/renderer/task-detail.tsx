import type { Run, Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { runLabel, taskLabels } from './task-status'
import { DeliveryReview } from './delivery-review'
import { RunControls } from './run-controls'
import { RunActivity } from './run-activity'
import { TaskRelations, RunInputs } from './task-relations'
import { RunHumanRequests } from './human-request-card'
import { RunHistory, RunFacts } from './run-snapshot'
import { taskRuns } from './task-run-history'
import './task-review.css'

interface TaskContext {
  task: Task
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  selectTask: (id: string) => void
}

export const TaskDetail = ({ task, state, actions, selectTask }: TaskContext) => {
  const { t } = useI18n()
  const runs = taskRuns(state, task.id)
  const run = runs.at(-1)
  const project = state.projects.find((item) => item.id === task.projectId)
  return (
    <article className="task-detail">
      <div className="task-detail-content">
        <p className="muted code">
          {task.id.slice(0, 8)} · {project?.name}
        </p>
        <div className="section-heading">
          <h2>{task.title}</h2>
          <span className="badge">{t(taskLabels[task.status])}</span>
        </div>
        <TaskGoals task={task} />
        <TaskRelations task={task} state={state} selectTask={selectTask} />
        {run && (
          <>
            <CurrentRun run={run} />
            <RunInputs run={run} state={state} />
            <RunHumanRequests key={run.id} runId={run.id} actions={actions} />
          </>
        )}
        <RunHistory task={task} runs={runs} state={state} actions={actions} />
        {run && <RunActivity key={run.id} runId={run.id} cursor={state.cursor} />}
      </div>
      <footer className="task-primary-actions">
        <RunControls task={task} run={run} actions={actions} project={project} />
        {run && (
          <DeliveryReview key={run.id} task={task} run={run} state={state} actions={actions} />
        )}
      </footer>
    </article>
  )
}

const CurrentRun = ({ run }: { run: Run }) => {
  const { t } = useI18n()
  return (
    <section className="current-run">
      <h3>
        {t('当前执行')} · {t('第')}
        {run.attempt}
        {t('次 ·')}
        {t(runLabel(run))}
      </h3>
      {run.failureCode && (
        <p role="alert">
          {t('失败原因：')}
          {run.failureCode}
        </p>
      )}
      <RunFacts run={run} />
    </section>
  )
}

const TaskGoals = ({ task }: { task: Task }) => {
  const { t } = useI18n()
  return (
    <section className="task-goals">
      <h3>{t('任务目标')}</h3>
      <p className="preserve-text">{task.goal}</p>
      <h3>{t('验收条件')}</h3>
      <p className="preserve-text">{task.acceptanceCriteria}</p>
    </section>
  )
}
