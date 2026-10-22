import { useI18n } from './preferences'
import type { Project, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { TextField, formText } from './form-fields'
interface CreateContext {
  projects: Project[]
  roles: RoleVersion[]
  actions: WorkspaceActions
}
export const TaskCreate = ({ projects, roles, actions }: CreateContext) => {
  const { t } = useI18n()
  return (
    <details className="task-create">
      <summary>{t('创建任务')}</summary>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const element = event.currentTarget
          const form = new FormData(element)
          void actions
            .execute({
              type: 'task.create',
              title: formText(form, 'title'),
              goal: formText(form, 'goal'),
              acceptanceCriteria: formText(form, 'criteria'),
              projectId: formText(form, 'project'),
              roleId: formText(form, 'role'),
            })
            .then((result) => {
              if (result) element.reset()
            })
        }}
      >
        <TaskAssignments projects={projects} roles={roles} />
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
const TaskAssignments = ({ projects, roles }: Omit<CreateContext, 'actions'>) => {
  const { t } = useI18n()
  return (
    <div className="form-pair">
      <label>
        {t('所属项目')}
        <select required name="project">
          {!projects.length && <option value="">{t('请先添加项目')}</option>}
          {projects.map((item) => (
            <option value={item.id} key={item.id}>
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
            <option value={item.id} key={item.id}>
              {item.name} · v{item.version}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
