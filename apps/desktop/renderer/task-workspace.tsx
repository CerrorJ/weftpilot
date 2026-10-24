import { useI18n } from './preferences'
import { useState, useEffect, useRef } from 'react'
import type { Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { TaskDetail } from './task-detail'
import { TaskTable } from './task-table'
import { TaskToolbar } from './task-toolbar'
export const TaskWorkspace = ({
  state,
  actions,
  initialTaskId = '',
}: {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  initialTaskId?: string
}) => {
  const { t } = useI18n()
  const [project, setProject] = useState('')
  const [search, setSearch] = useState('')
  const tasks = state.tasks.filter((item) => item.purpose !== 'role_trial')
  const last = tasks.filter((item) => !item.parentTaskId).at(-1)?.id ?? ''
  const [selected, setSelected] = useTaskSelection(last, initialTaskId)
  const task = tasks.find((item) => item.id === selected)
  const visible = tasks.filter((item) => matchesTask(item, state, { project, search }))
  if (!tasks.length)
    return (
      <section className="empty-state">
        <h2>{t('还没有任务')}</h2>
        <p>{t('先添加项目和角色，再开始第一项真实任务。')}</p>
      </section>
    )
  return (
    <section aria-label={t('任务列表')}>
      <TaskToolbar
        projects={state.projects}
        count={tasks.length}
        project={project}
        search={search}
        setProject={setProject}
        setSearch={setSearch}
      />
      <TaskTable tasks={visible} state={state} selectTask={setSelected} />
      {task && (
        <TaskDrawer
          task={task}
          state={state}
          actions={actions}
          selectTask={setSelected}
          close={() => setSelected('')}
        />
      )}
    </section>
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

/** 创建任务后打开其详情，普通快照轮询不会改变用户正在查看的任务。 */
const useTaskSelection = (last: string, initialTaskId: string) => {
  const [selected, setSelected] = useState(initialTaskId)
  const previous = useRef(last)
  useEffect(() => {
    if (last && previous.current !== last) setSelected(last)
    previous.current = last
  }, [last])
  return [selected, setSelected] as const
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
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const trigger = document.activeElement
    button.current?.focus()
    return () => {
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [task.id])
  return (
    <aside
      className="task-drawer"
      aria-label={t('任务详情')}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close()
      }}
    >
      <div className="drawer-header">
        <strong>{t('任务详情')}</strong>
        <button ref={button} onClick={close}>
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
