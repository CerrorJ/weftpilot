import { useState } from 'react'
import type { Project, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
interface CreateContext {
  projects: Project[]
  roles: RoleVersion[]
  actions: WorkspaceActions
}
export const TaskCreate = ({ projects, roles, actions }: CreateContext) => {
  const { t } = useI18n()
  const [project, setProject] = useState('')
  const projectId = project || projects[0]?.id || ''
  return (
    <details className="task-create">
      <summary>{t('创建任务')}</summary>
      <form onSubmit={(event) => submitTask(event, { actions, projectId })}>
        <TaskAssignments
          projects={projects}
          roles={roles}
          projectId={projectId}
          selectProject={setProject}
        />
        <RequirementReference key={projectId} projectId={projectId} actions={actions} />
        <TextField label={t('任务名称')} name="title" />
        <TextField label={t('任务目标')} name="goal" multiline />
        <TextField label={t('验收条件')} name="criteria" multiline />
        <button className="primary" disabled={actions.busy || !projects.length || !roles.length}>
          {t('创建待执行任务')}
        </button>
      </form>
    </details>
  )
}
const TaskAssignments = ({
  projects,
  roles,
  projectId,
  selectProject,
}: Omit<CreateContext, 'actions'> & { projectId: string; selectProject: (id: string) => void }) => {
  const { t } = useI18n()
  return (
    <div className="form-pair">
      <label>
        {t('所属项目')}
        <select
          required
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
        <select required name="role">
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
  { actions, projectId }: { actions: WorkspaceActions; projectId: string },
) => {
  event.preventDefault()
  const element = event.currentTarget
  const form = new FormData(element)
  const requirement = actions.state?.requirements.find(
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
      if (result) element.reset()
    })
}
