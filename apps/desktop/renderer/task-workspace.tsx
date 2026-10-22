import { useI18n } from './preferences'
import { useState } from 'react'
import type { Run, Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { TaskDetail } from './task-detail'
export const taskLabels: Record<Task['status'], string> = {
  ready: '待执行',
  in_progress: '执行中',
  in_review: '待验收',
  done: '已验收',
}
export const runLabel = (run: Run) => {
  if (run.processState === 'uncertain') return '状态待确认'
  const labels: Record<Run['status'], string> = {
    queued: '排队中',
    preparing: '准备目录',
    running: '执行中',
    stopping: '停止中',
    stopped: '已停止',
    succeeded: '执行成功',
    failed: '执行失败',
    cancelled: '已取消',
    interrupted: '已中断',
  }
  return labels[run.status]
}
export const TaskWorkspace = ({
  state,
  actions,
}: {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const task = state.tasks.find((item) => item.id === selected) ?? state.tasks.at(-1)
  if (!task)
    return (
      <section className="empty-state">
        <h2>{t('还没有任务')}</h2>
        <p>{t('先在“项目与角色”中完成配置，再创建一个目标明确、可验收的任务。')}</p>
      </section>
    )
  return (
    <div className="task-workspace">
      <section className="task-list" aria-label={t('任务列表')}>
        {[...state.tasks].reverse().map((item) => (
          <button
            key={item.id}
            aria-pressed={item.id === task.id}
            onClick={() => setSelected(item.id)}
          >
            <strong>{item.title}</strong>
            <span>
              {state.projects.find((project) => project.id === item.projectId)?.name} ·{' '}
              {t(taskLabels[item.status])}
            </span>
          </button>
        ))}
      </section>
      <TaskDetail key={task.id} task={task} state={state} actions={actions} />
    </div>
  )
}
