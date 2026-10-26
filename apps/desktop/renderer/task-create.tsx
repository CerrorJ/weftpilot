import { useState } from 'react'
import type {
  Project,
  RoleVersion,
  RequirementVersion,
} from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
import { CreateDialog } from './create-dialog'
import { CreationMark } from './creation-mark'
interface CreateContext {
  projects: Project[]
  roles: RoleVersion[]
  actions: WorkspaceActions
  onCreated?: (id: string) => void
  trigger?: string
  requirement?: RequirementVersion
}
export const TaskCreate = (context: CreateContext) => {
  const { projects, actions, onCreated, trigger } = context
  const [project, setProject] = useState('')
  const projectId = project || projects[0]?.id || ''
  return (
    <CreateDialog
      title="创建任务"
      trigger={trigger ?? '创建任务'}
      triggerIcon={trigger ? <CreationMark /> : undefined}
      error={actions.error}
    >
      {(close) => (
        <TaskCreateForm
          context={context}
          selection={{ projectId, selectProject: setProject }}
          saved={(id) => {
            close()
            onCreated?.(id)
          }}
        />
      )}
    </CreateDialog>
  )
}

type ProjectSelection = { projectId: string; selectProject: (id: string) => void }

/** 打开时固定来源版本；需求后台变更不能把正在填写的任务悄悄转绑新版本。 */
const TaskCreateForm = ({
  context,
  selection,
  saved,
}: {
  context: CreateContext
  selection: ProjectSelection
  saved: (id: string) => void
}) => {
  const { t } = useI18n()
  const { projects, roles, actions } = context
  const [requirement] = useState(context.requirement)
  const fields = requirement ?? { title: '', body: '', acceptanceCriteria: '' }
  const projectId = requirement?.projectId ?? selection.projectId
  const availableProjects = requirement
    ? projects.filter((item) => item.id === projectId)
    : projects
  return (
    <form onSubmit={(event) => submitTask(event, { actions, projectId, requirement }, saved)}>
      <TaskAssignments
        projects={availableProjects}
        roles={roles}
        projectId={projectId}
        selectProject={selection.selectProject}
        lockedProject={Boolean(requirement)}
      />
      {requirement ? (
        <PinnedRequirement requirement={requirement} />
      ) : (
        <RequirementReference key={projectId} projectId={projectId} actions={actions} />
      )}
      <TextField label={t('任务名称')} name="title" value={fields.title} />
      <TextField label={t('任务目标')} name="goal" value={fields.body} multiline />
      <TextField
        label={t('验收条件')}
        name="criteria"
        value={fields.acceptanceCriteria}
        multiline
      />
      <button
        className="primary"
        disabled={actions.busy || !availableProjects.length || !roles.length}
      >
        {t('创建待执行任务')}
      </button>
    </form>
  )
}

const PinnedRequirement = ({ requirement }: { requirement: RequirementVersion }) => {
  const { t } = useI18n()
  return (
    <p className="field-note">
      {t('固定需求版本：')}
      {requirement.title} · v{requirement.version}
    </p>
  )
}
const TaskAssignments = ({
  projects,
  roles,
  projectId,
  selectProject,
  lockedProject = false,
}: Pick<CreateContext, 'projects' | 'roles'> & {
  projectId: string
  selectProject: (id: string) => void
  lockedProject?: boolean
}) => {
  const { t } = useI18n()
  return (
    <div className="form-pair">
      <label>
        {t('所属项目')}
        <select
          aria-label={t('所属项目')}
          required
          disabled={lockedProject}
          name="project"
          value={projectId}
          onChange={(event) => selectProject(event.target.value)}
        >
          {!projects.length && <option value="">{t('请先添加项目')}</option>}
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('执行角色')}
        <select required name="role" aria-label={t('执行角色')}>
          {!roles.length && <option value="">{t('请先创建角色')}</option>}
          {roles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · v{item.version}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
const RequirementReference = ({
  projectId,
  actions,
}: {
  projectId: string
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const requirements =
    actions.state?.requirements.filter((item) => item.projectId === projectId) ?? []
  return (
    <label>
      {t('绑定需求版本（可选）')}
      <select name="requirement">
        <option value="">{t('独立任务')}</option>
        {requirements.map((item) => (
          <option key={`${item.id}:${item.version}`} value={`${item.id}@${item.version}`}>
            {item.title} · v{item.version}
          </option>
        ))}
      </select>
    </label>
  )
}
const submitTask = (
  event: React.FormEvent<HTMLFormElement>,
  {
    actions,
    projectId,
    requirement: pinned,
  }: { actions: WorkspaceActions; projectId: string; requirement: RequirementVersion | undefined },
  saved: (id: string) => void,
) => {
  event.preventDefault()
  const element = event.currentTarget
  const form = new FormData(element)
  const requirement =
    pinned ??
    actions.state?.requirements.find(
      (item) => `${item.id}@${item.version}` === formText(form, 'requirement'),
    )
  void actions
    .execute({
      type: 'task.create',
      title: formText(form, 'title'),
      goal: formText(form, 'goal'),
      acceptanceCriteria: formText(form, 'criteria'),
      projectId,
      roleId: formText(form, 'role'),
      requirementRef: requirement ? { id: requirement.id, version: requirement.version } : null,
    })
    .then((result) => {
      if (result && element.isConnected) {
        element.reset()
        saved(result.id)
      }
    })
}
