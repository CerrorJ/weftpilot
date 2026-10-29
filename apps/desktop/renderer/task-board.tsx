import type { Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { taskOwnerName } from './task-owner'
import { latestTaskRun } from './task-display'
import { TaskStatusBadge } from './task-status-badge'
import { TaskProgress } from './task-progress'
import { boardColumnNames, taskBoardColumns, type BoardColumn } from './task-board-columns'
import './task-board.css'

export const TaskBoard = ({
  tasks,
  state,
  selectTask,
}: {
  tasks: Task[]
  state: WorkspaceSnapshot
  selectTask: (id: string) => void
}) => {
  const { t } = useI18n()
  const columns = taskBoardColumns(state, tasks)
  return (
    <div className="task-board-container">
      {!tasks.length && <p role="status">{t('没有符合条件的任务')}</p>}
      <div className="task-board" aria-label={t('任务看板')}>
        {(Object.keys(boardColumnNames) as BoardColumn[]).map((column) => (
          <section
            className="task-board-column"
            key={column}
            aria-label={t(boardColumnNames[column])}
          >
            <h2>
              <span>{t(boardColumnNames[column])}</span>
              <span>{columns[column].length}</span>
            </h2>
            {columns[column].map((task) => (
              <BoardCard key={task.id} task={task} state={state} selectTask={selectTask} />
            ))}
            {!columns[column].length && <p className="task-board-empty">{t('暂无任务')}</p>}
          </section>
        ))}
      </div>
      <p className="field-note">
        {t('已结束包含失败或停止；只有验收通过才是已完成。等待决定与状态待确认会单独标注。')}
      </p>
    </div>
  )
}

const BoardCard = ({
  task,
  state,
  selectTask,
}: {
  task: Task
  state: WorkspaceSnapshot
  selectTask: (id: string) => void
}) => {
  const run = latestTaskRun(state.runs, task.id)
  const children = state.tasks.filter((item) => item.parentTaskId === task.id)
  const owner = taskOwnerName({ run, task, roles: state.roles })
  return (
    <button className="task-board-card" data-task-id={task.id} onClick={() => selectTask(task.id)}>
      <span className="task-board-card-top">
        <code>{task.id.slice(0, 8)}</code>
        <TaskStatusBadge task={task} run={run} />
      </span>
      <strong>{task.title}</strong>
      <span className="task-board-project">
        {state.projects.find((project) => project.id === task.projectId)?.name}
      </span>
      <TaskProgress tasks={children} />
      <span className="task-board-owner">{owner ?? '—'}</span>
    </button>
  )
}
