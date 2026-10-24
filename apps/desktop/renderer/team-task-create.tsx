import { useState } from 'react'
import type {
  WorkspaceSnapshot,
  TeamVersion,
  RoleVersion,
} from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { latestVersions } from './object-versions'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
import { TeamPlanSteps } from './team-plan-steps'
import { CreateDialog } from './create-dialog'
interface Context {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}
export const TeamTaskCreate = ({ state, actions }: Context) => {
  const { t } = useI18n()
  const teams = latestVersions(state.teams)
  const [selected, setSelected] = useState('')
  const team = teams.find((item) => item.id === selected) ?? teams[0]
  return (
    <CreateDialog title="创建团队任务" error={actions.error}>
      {(close) => (
        <>
          <label>
            {t('执行团队')}
            <select value={team?.id ?? ''} onChange={(event) => setSelected(event.target.value)}>
              {!teams.length && <option value="">{t('请先创建团队')}</option>}
              {teams.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · v{item.version}
                </option>
              ))}
            </select>
          </label>
          {team && (
            <TeamPlanForm
              key={`${team.id}:${team.version}`}
              team={team}
              roles={latestVersions(state.roles)}
              state={state}
              actions={actions}
              saved={close}
            />
          )}
        </>
      )}
    </CreateDialog>
  )
}
const TeamPlanForm = ({
  team,
  roles,
  state,
  actions,
  saved,
}: Context & { team: TeamVersion; roles: RoleVersion[]; saved: () => void }) => {
  const { t } = useI18n()
  const [steps, setSteps] = useState([`step${crypto.randomUUID().slice(0, 8)}`])
  return (
    <form onSubmit={(event) => submitPlan(event, { team, steps, actions }, saved)}>
      <label>
        {t('所属项目')}
        <select name="project" required>
          {!state.projects.length && <option value="">{t('请先添加项目')}</option>}
          {state.projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <TextField label={t('团队任务名称')} name="title" />
      <TextField label={t('团队目标')} name="goal" multiline />
      <TextField label={t('团队验收条件')} name="criteria" multiline />
      <p>
        {t('下游等待上游人工验收；内核将已验收代码贡献应用到下游隔离目录。冲突时保留现场并失败。')}
      </p>
      <TeamPlanSteps
        steps={steps}
        roles={roles.filter((role) => team.roleIds.includes(role.id))}
        remove={(key) => setSteps((current) => current.filter((item) => item !== key))}
      />
      <div className="run-controls">
        <button
          type="button"
          disabled={steps.length >= 12}
          onClick={() =>
            setSteps((current) => [...current, `step${crypto.randomUUID().slice(0, 8)}`])
          }
        >
          {t('添加子任务')}
        </button>
        <button className="primary" disabled={actions.busy || !state.projects.length}>
          {t('保存团队计划')}
        </button>
      </div>
    </form>
  )
}
const submitPlan = (
  event: React.FormEvent<HTMLFormElement>,
  input: { team: TeamVersion; steps: string[]; actions: WorkspaceActions },
  saved: () => void,
) => {
  event.preventDefault()
  const element = event.currentTarget
  const form = new FormData(element)
  void input.actions
    .execute({
      type: 'team.createTask',
      teamId: input.team.id,
      expectedTeamVersion: input.team.version,
      projectId: formText(form, 'project'),
      title: formText(form, 'title'),
      goal: formText(form, 'goal'),
      acceptanceCriteria: formText(form, 'criteria'),
      steps: input.steps.map((key) => ({
        key,
        roleId: formText(form, `role:${key}`),
        title: formText(form, `title:${key}`),
        goal: formText(form, `goal:${key}`),
        acceptanceCriteria: formText(form, `criteria:${key}`),
        dependsOn: form.getAll(`dependencies:${key}`).map(String),
      })),
    })
    .then((result) => {
      if (result) {
        element.reset()
        saved()
      }
    })
}
