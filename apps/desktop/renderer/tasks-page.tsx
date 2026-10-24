import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { PageHeading } from './page-heading'
import { TaskCreate } from './task-create'
import { TeamTaskCreate } from './team-task-create'
import { TaskWorkspace } from './task-workspace'
import { HumanPage } from './human-page'
import { latestVersions } from './object-versions'
import { TaskOverview } from './task-overview'
import { useTaskBrowser, type TaskBrowser } from './use-task-browser'

export const TasksPage = ({ actions, taskId }: { actions: WorkspaceActions; taskId: string }) => {
  const { t } = useI18n()
  const browser = useTaskBrowser(taskId)
  return (
    <>
      <PageHeading
        title="任务管理"
        description="每一项工作，都有清晰的归属与进展。"
        eyebrow="TASKS / EXECUTION"
      >
        <div className="task-create-actions">
          <button disabled={actions.busy} onClick={() => void actions.refresh()}>
            {t('刷新状态')}
          </button>
          <TaskCreation actions={actions} created={browser.created} />
        </div>
      </PageHeading>
      <TaskOverview state={actions.state} />
      <TaskListContent actions={actions} browser={browser} />
    </>
  )
}

const TaskCreation = ({
  actions,
  created,
}: {
  actions: WorkspaceActions
  created: (id: string) => void
}) => {
  const state = actions.state
  if (!state) return null
  return (
    <>
      <TeamTaskCreate state={state} actions={actions} onCreated={created} />
      <TaskCreate
        projects={state.projects}
        roles={latestVersions(state.roles)}
        actions={actions}
        onCreated={created}
      />
    </>
  )
}

const TaskListContent = ({
  actions,
  browser,
}: {
  actions: WorkspaceActions
  browser: TaskBrowser
}) => {
  const { t } = useI18n()
  const state = actions.state
  return (
    <>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      {!state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : (
        <>
          <TaskWorkspace state={state} actions={actions} browser={browser} />
          {browser.view === 'pending' && (
            <section className="human-panel" hidden={!!browser.selected}>
              <HumanPage actions={actions} embedded />
            </section>
          )}
        </>
      )}
    </>
  )
}
