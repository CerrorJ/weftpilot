import { useState } from 'react'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { PageHeading } from './page-heading'
import { TaskCreate } from './task-create'
import { TeamTaskCreate } from './team-task-create'
import { TaskWorkspace } from './task-workspace'
import { HumanPage } from './human-page'
import { latestVersions } from './object-versions'
import { TaskOverview } from './task-overview'

export const TasksPage = ({ actions, taskId }: { actions: WorkspaceActions; taskId: string }) => {
  const { t } = useI18n()
  const [view, setView] = useState<'tasks' | 'human'>('tasks')
  const pending = actions.state?.humanRequests.filter((item) => item.status === 'pending').length
  return (
    <>
      <PageHeading title="任务管理" description="每一项工作，都有清晰的归属与进展。">
        <button disabled={actions.busy} onClick={() => void actions.refresh()}>
          {t('刷新状态')}
        </button>
      </PageHeading>
      <TaskOverview state={actions.state} />
      <div className="task-view-tabs">
        <button aria-pressed={view === 'tasks'} onClick={() => setView('tasks')}>
          {t('全部任务')}
        </button>
        <button
          aria-label={t('待处理')}
          aria-pressed={view === 'human'}
          onClick={() => setView('human')}
        >
          {t('待处理')} {pending ?? '—'}
        </button>
      </div>
      {view === 'human' ? (
        <HumanPage actions={actions} />
      ) : (
        <TaskListContent actions={actions} taskId={taskId} />
      )}
    </>
  )
}

const TaskListContent = ({ actions, taskId }: { actions: WorkspaceActions; taskId: string }) => {
  const { t } = useI18n()
  const state = actions.state
  return (
    <>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      {!state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : (
        <>
          <div className="task-create-actions">
            <TaskCreate
              projects={state.projects}
              roles={latestVersions(state.roles)}
              actions={actions}
            />
            <TeamTaskCreate state={state} actions={actions} />
          </div>
          <TaskWorkspace state={state} actions={actions} initialTaskId={taskId} />
        </>
      )}
    </>
  )
}
