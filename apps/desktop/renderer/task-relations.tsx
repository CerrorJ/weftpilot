import type { Task, Run, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { taskLabels } from './task-workspace'
export const TaskRelations = ({
  task,
  state,
  selectTask,
}: {
  task: Task
  state: WorkspaceSnapshot
  selectTask: (id: string) => void
}) => {
  const { t } = useI18n()
  const parent = state.tasks.find((item) => item.id === task.parentTaskId)
  const children = state.tasks.filter((item) => item.parentTaskId === task.id)
  const dependencies = state.tasks.filter((item) => task.dependencyTaskIds?.includes(item.id))
  return (
    <section className="task-relations">
      {parent && (
        <p>
          {t('所属团队任务：')}
          <button onClick={() => selectTask(parent.id)}>{parent.title}</button>
        </p>
      )}
      {children.length > 0 && (
        <>
          <h3>
            {t('子任务验收')} {children.filter((item) => item.status === 'done').length} /{' '}
            {children.length}
          </h3>
          <TaskLinks tasks={children} selectTask={selectTask} />
          <p>{t('全部子任务人工验收后，团队任务才标记完成。')}</p>
        </>
      )}
      {dependencies.length > 0 && (
        <>
          <h3>{t('上游依赖')}</h3>
          <TaskLinks tasks={dependencies} selectTask={selectTask} />
        </>
      )}
      {task.teamSnapshot && (
        <p>
          {t('固定团队版本：')}
          {task.teamSnapshot.name} · v{task.teamSnapshot.version}
        </p>
      )}
    </section>
  )
}
const TaskLinks = ({ tasks, selectTask }: { tasks: Task[]; selectTask: (id: string) => void }) => {
  const { t } = useI18n()
  return (
    <ul className="task-links">
      {tasks.map((item) => (
        <li key={item.id}>
          <button onClick={() => selectTask(item.id)}>{item.title}</button>
          <span>{t(taskLabels[item.status])}</span>
        </li>
      ))}
    </ul>
  )
}
const waitingLabels: Record<NonNullable<Run['waitingReason']>, string> = {
  uncertain_project: '项目存在待确认进程',
  dependency_acceptance: '等待上游人工验收',
  project_busy: '等待项目执行槽',
  role_busy: '等待角色执行槽',
  capacity: '等待全局执行槽',
}
export const RunInputs = ({ run, state }: { run: Run; state: WorkspaceSnapshot }) => {
  const { t } = useI18n()
  const deliveries = state.deliveries.filter((item) => run.inputDeliveryIds?.includes(item.id))
  return (
    <section>
      {run.waitingReason && <p role="status">{t(waitingLabels[run.waitingReason])}</p>}
      {run.requirementSnapshot && (
        <details>
          <summary>
            {t('固定需求版本：')}
            {run.requirementSnapshot.title} · v{run.requirementSnapshot.version}
          </summary>
          <p className="preserve-text">{run.requirementSnapshot.body}</p>
          <p className="preserve-text">{run.requirementSnapshot.acceptanceCriteria}</p>
        </details>
      )}
      {deliveries.length > 0 && (
        <>
          <h3>{t('本次固定上游交付')}</h3>
          <ul>
            {deliveries.map((item) => (
              <li key={item.id}>
                {state.tasks.find((task) => task.id === item.taskId)?.title} · v{item.version}
                <code>{item.id}</code>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
