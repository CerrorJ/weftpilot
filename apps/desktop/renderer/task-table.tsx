import type { Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { taskLabels, runLabel } from './task-status'
import { taskOwnerName } from './task-owner'

export const TaskTable = ({
  tasks,
  state,
  selectTask,
}: {
  tasks: Task[]
  state: WorkspaceSnapshot
  selectTask: (id: string) => void
}) => {
  const { t } = useI18n()
  return (
    <div className="task-table-scroll">
      <table className="task-table">
        <thead>
          <tr>
            {['任务名称', '所属项目', '状态', '步骤进度', '负责人'].map((label) => (
              <th key={label}>{t(label)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...tasks].reverse().map((task) => (
            <TaskRow key={task.id} task={task} state={state} selectTask={selectTask} />
          ))}
        </tbody>
      </table>
      {!tasks.length && <p className="empty-state">{t('没有符合条件的任务')}</p>}
    </div>
  )
}

const TaskRow = ({
  task,
  state,
  selectTask,
}: {
  task: Task
  state: WorkspaceSnapshot
  selectTask: (id: string) => void
}) => {
  const { t } = useI18n()
  const run = state.runs.filter((item) => item.taskId === task.id).at(-1)
  const children = state.tasks.filter((item) => item.parentTaskId === task.id)
  const completed = children.filter((item) => item.status === 'done').length
  const owner = taskOwnerName({ run, task, roles: state.roles })
  return (
    <tr>
      <td>
        <button className="task-title" onClick={() => selectTask(task.id)}>
          <code>{task.id.slice(0, 8)}</code>
          <strong>{task.title}</strong>
        </button>
        <small>{run ? t(runLabel(run)) : t('尚未开始执行')}</small>
      </td>
      <td>{state.projects.find((item) => item.id === task.projectId)?.name}</td>
      <td>
        <span className={`task-status ${task.status}`}>{t(taskLabels[task.status])}</span>
      </td>
      <td>
        {children.length ? (
          <div className="known-steps">
            <progress aria-label={t('子任务验收')} max={children.length} value={completed} />
            <span>
              {completed}/{children.length}
            </span>
          </div>
        ) : (
          <span className="unknown-steps">—</span>
        )}
      </td>
      <td>{owner ?? '—'}</td>
    </tr>
  )
}
