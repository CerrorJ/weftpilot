import type { Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { homeAttentionTasks } from './home-attention'
import { latestTaskRun } from './task-display'
import { taskGroups } from './task-views'
import { TaskStatusBadge } from './task-status-badge'
import type { HomeProps } from './workspace-home'

type PanelContext = { state: WorkspaceSnapshot | undefined; openTask: HomeProps['openTask'] }

export const HomeTaskPanels = (context: PanelContext) => {
  const state = context.state
  return (
    <div className="home-columns">
      <HomeTaskList
        title="待我处理"
        empty="当前没有需要处理的任务"
        tasks={state ? homeAttentionTasks(state).reverse() : []}
        {...context}
      />
      <HomeTaskList
        title="近期工作"
        empty="先添加项目和角色，再开始第一项真实任务。"
        tasks={state ? taskGroups(state).all.slice(-8).reverse() : []}
        {...context}
      />
    </div>
  )
}

const HomeTaskList = ({
  title,
  empty,
  tasks,
  state,
  openTask,
}: PanelContext & {
  title: string
  empty: string
  tasks: Task[]
}) => {
  const { t } = useI18n()
  return (
    <section className="home-task-panel" aria-label={t(title)}>
      <h2>
        {t(title)} <small>{state ? tasks.length : '—'}</small>
      </h2>
      {!state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : !tasks.length ? (
        <p className="home-empty">{t(empty)}</p>
      ) : (
        <ul className="recent-task-list">
          {tasks.map((task) => (
            <li key={task.id} data-home-task-id={task.id}>
              <button onClick={() => openTask(task.id)}>
                <strong>{task.title}</strong>
                <small>{state.projects.find((item) => item.id === task.projectId)?.name}</small>
                <TaskStatusBadge task={task} run={latestTaskRun(state.runs, task.id)} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
