import { useI18n } from './preferences'
import type { Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import type { TaskBrowser } from './use-task-browser'
import { TaskDetail } from './task-detail'
import { TaskTable } from './task-table'
import { TaskToolbar } from './task-toolbar'
import { TaskTabs } from './task-tabs'
import { taskGroups } from './task-views'
import { useDrawerFocus } from './use-drawer-focus'
import { TaskBoard } from './task-board'
import { TaskLayoutToggle } from './task-layout-toggle'

export const TaskWorkspace = ({
  state,
  actions,
  browser,
}: {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  browser: TaskBrowser
}) => {
  const { t } = useI18n()
  const groups = taskGroups(state)
  const task = groups.all.find((item) => item.id === browser.selected)
  const visible = groups[browser.view].filter((item) => matchesTask(item, state, browser))
  return (
    <section aria-label={t(browser.layout === 'board' ? '任务看板' : '任务列表')}>
      <TaskToolbar
        projects={state.projects}
        tabs={<TaskTabs view={browser.view} groups={groups} select={browser.setView} />}
        project={browser.project}
        search={browser.search}
        setProject={browser.setProject}
        setSearch={browser.setSearch}
        layoutToggle={<TaskLayoutToggle layout={browser.layout} change={browser.setLayout} />}
      />
      <TaskResults empty={!groups.all.length} tasks={visible} state={state} browser={browser} />
      {task && (
        <TaskDrawer
          task={task}
          state={state}
          actions={actions}
          selectTask={browser.selectTask}
          close={() => browser.selectTask('')}
        />
      )}
    </section>
  )
}

const TaskResults = ({
  empty,
  tasks,
  state,
  browser,
}: {
  empty: boolean
  tasks: Task[]
  state: WorkspaceSnapshot
  browser: TaskBrowser
}) => {
  const { t } = useI18n()
  if (empty)
    return (
      <section className="empty-state">
        <h2>{t('还没有任务')}</h2>
        <p>{t('先添加项目和角色，再开始第一项真实任务。')}</p>
      </section>
    )
  return browser.layout === 'board' ? (
    <TaskBoard tasks={tasks} state={state} selectTask={browser.selectTask} />
  ) : (
    <TaskTable tasks={tasks} state={state} selectTask={browser.selectTask} />
  )
}

const matchesTask = (
  task: Task,
  state: WorkspaceSnapshot,
  filters: { project: string; search: string },
): boolean => {
  if (filters.project && task.projectId !== filters.project) return false
  const project = state.projects.find((item) => item.id === task.projectId)
  const text = `${task.id} ${task.title} ${project?.name ?? ''}`.toLocaleLowerCase()
  return text.includes(filters.search.toLocaleLowerCase())
}

const TaskDrawer = ({
  task,
  state,
  actions,
  selectTask,
  close,
}: {
  task: Task
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  selectTask: (id: string) => void
  close: () => void
}) => {
  const { t } = useI18n()
  const focus = useDrawerFocus(task.id, close)
  return (
    <aside
      ref={focus.panel}
      className="task-drawer"
      aria-label={t('任务详情')}
      onKeyDown={(event) => {
        if (event.key === 'Escape') focus.dismiss()
      }}
    >
      <div className="drawer-header">
        <strong>{t('任务详情')}</strong>
        <button ref={focus.button} onClick={focus.dismiss}>
          {t('关闭详情')}
        </button>
      </div>
      <TaskDetail
        key={task.id}
        task={task}
        state={state}
        actions={actions}
        selectTask={selectTask}
      />
    </aside>
  )
}
