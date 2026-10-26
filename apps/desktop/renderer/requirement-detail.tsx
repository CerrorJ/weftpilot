import type { RequirementVersion, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { CreateDialog } from './create-dialog'
import { RequirementEditor } from './requirement-editor'
import { TaskTable } from './task-table'
import { TaskCreate } from './task-create'
import { latestVersions } from './object-versions'

export const RequirementDetail = ({
  requirement,
  state,
  actions,
  close,
  openTask,
}: {
  requirement: RequirementVersion
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  close: () => void
  openTask: (id: string) => void
}) => {
  const { t } = useI18n()
  const project = state.projects.find((item) => item.id === requirement.projectId)
  const openLinkedTask = (id: string) => {
    close()
    openTask(id)
  }
  return (
    <CreateDialog title="需求详情" error="" autoOpen hideTrigger closeIcon onClosed={close}>
      {() => (
        <div className="requirement-detail">
          <div className="requirement-row-top">
            <span>{project?.name ?? requirement.projectId}</span>
            <span className="badge">v{requirement.version}</span>
          </div>
          <h3>{requirement.title}</h3>
          <p className="preserve-text">{requirement.body}</p>
          <h3>{t('需求验收条件')}</h3>
          <p className="preserve-text">{requirement.acceptanceCriteria}</p>
          <RequirementActions
            requirement={requirement}
            state={state}
            actions={actions}
            created={openLinkedTask}
          />
          <RequirementTasks
            requirementId={requirement.id}
            state={state}
            selectTask={openLinkedTask}
          />
          <RequirementHistory
            versions={state.requirements.filter((item) => item.id === requirement.id)}
          />
        </div>
      )}
    </CreateDialog>
  )
}

const RequirementTasks = ({
  requirementId,
  state,
  selectTask,
}: {
  requirementId: string
  state: WorkspaceSnapshot
  selectTask: (id: string) => void
}) => {
  const { t } = useI18n()
  return (
    <>
      <h3>{t('关联任务')}</h3>
      <p className="field-note">{t('包含此需求各版本的任务；任务仍保留其创建时绑定的版本。')}</p>
      <TaskTable
        tasks={state.tasks.filter((task) => task.requirementRef?.id === requirementId)}
        state={state}
        selectTask={selectTask}
      />
    </>
  )
}

const RequirementActions = ({
  requirement,
  state,
  actions,
  created,
}: {
  requirement: RequirementVersion
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  created: (id: string) => void
}) => (
  <div className="requirement-actions">
    <RequirementEditor actions={actions} requirement={requirement} />
    <TaskCreate
      projects={state.projects.filter((item) => item.id === requirement.projectId)}
      roles={latestVersions(state.roles)}
      actions={actions}
      requirement={requirement}
      trigger="创建关联任务"
      onCreated={created}
    />
  </div>
)

const RequirementHistory = ({ versions }: { versions: RequirementVersion[] }) => {
  const { t } = useI18n()
  return (
    <details>
      <summary>
        {t('需求历史')} · {versions.length}
      </summary>
      {[...versions]
        .sort((a, b) => b.version - a.version)
        .map((item) => (
          <article className="requirement-history" key={item.version}>
            <h3>
              {item.title} · v{item.version}
            </h3>
            <p className="preserve-text">{item.body}</p>
            <p className="preserve-text">{item.acceptanceCriteria}</p>
          </article>
        ))}
    </details>
  )
}
