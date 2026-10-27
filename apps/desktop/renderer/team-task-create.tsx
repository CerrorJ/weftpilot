import { useId, useRef, useState } from 'react'
import type {
  Project,
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
  project?: Project
  onCreated?: (id: string) => void
  hideTrigger?: boolean
  onClosed?: () => void
}

export const TeamTaskCreate = (props: Context) => (
  <CreateDialog
    title="创建团队任务"
    error={props.actions.error}
    primary={false}
    hideTrigger={props.hideTrigger ?? false}
    onClosed={() => props.onClosed?.()}
  >
    {(close) => (
      <TeamPlanSelection
        {...props}
        saved={(id) => {
          close()
          props.onCreated?.(id)
        }}
      />
    )}
  </CreateDialog>
)

const TeamPlanSelection = ({
  state,
  project,
  actions,
  saved,
}: Context & { saved: (id: string) => void }) => {
  // 对话框打开时固定可见版本，后台轮询不得清空草稿或静默换用新团队。
  const [basis] = useState(() => ({
    projects: project ? [project] : state.projects,
    teams: latestVersions(state.teams),
    roles: latestVersions(state.roles),
  }))
  const [projectId, setProjectId] = useState(basis.projects[0]?.id ?? '')
  const chosenProject = basis.projects.find((item) => item.id === projectId)
  const [teamId, setTeamId] = useState(defaultTeam(chosenProject, basis.teams))
  const team = basis.teams.find((item) => item.id === teamId)
  const changeProject = (id: string) => {
    setProjectId(id)
    setTeamId(
      defaultTeam(
        basis.projects.find((item) => item.id === id),
        basis.teams,
      ),
    )
  }
  return (
    <>
      <TeamPlanSelectors
        projects={basis.projects}
        teams={basis.teams}
        projectId={projectId}
        teamId={teamId}
        locked={!!project}
        changeProject={changeProject}
        changeTeam={setTeamId}
      />
      {team && chosenProject && (
        <TeamPlanForm
          key={`${projectId}:${teamId}`}
          team={team}
          project={chosenProject}
          roles={basis.roles}
          actions={actions}
          saved={saved}
        />
      )}
    </>
  )
}

const defaultTeam = (project: Project | undefined, teams: TeamVersion[]) =>
  project?.defaultTeamId ?? teams[0]?.id ?? ''

interface SelectorContext {
  projects: Project[]
  teams: TeamVersion[]
  projectId: string
  teamId: string
  locked: boolean
  changeProject: (id: string) => void
  changeTeam: (id: string) => void
}

const TeamPlanSelectors = ({
  projects,
  teams,
  projectId,
  teamId,
  locked,
  changeProject,
  changeTeam,
}: SelectorContext) => {
  const { t } = useI18n()
  const projectLabel = useId()
  const teamLabel = useId()
  return (
    <>
      <label>
        <span id={projectLabel}>{t('所属项目')}</span>
        <select
          aria-labelledby={projectLabel}
          value={projectId}
          disabled={locked}
          onChange={(event) => changeProject(event.target.value)}
        >
          {!projects.length && <option value="">{t('请先添加项目')}</option>}
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p className="field-note">
        {t('此计划使用打开时的项目和团队版本。切换项目或团队将重置计划；后台更新不会改写草稿。')}
      </p>
      <label>
        <span id={teamLabel}>{t('执行团队')}</span>
        <select
          aria-labelledby={teamLabel}
          value={teamId}
          onChange={(event) => changeTeam(event.target.value)}
        >
          <TeamOptions teams={teams} selected={teamId} />
        </select>
      </label>
    </>
  )
}

const TeamOptions = ({ teams, selected }: { teams: TeamVersion[]; selected: string }) => {
  const { t } = useI18n()
  return (
    <>
      {!teams.some((team) => team.id === selected) && (
        <option value={selected}>{t(selected ? '原团队不可用' : '请先创建团队')}</option>
      )}
      {teams.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name} · v{item.version}
        </option>
      ))}
    </>
  )
}

interface PlanContext {
  team: TeamVersion
  project: Project
  roles: RoleVersion[]
  actions: WorkspaceActions
  saved: (id: string) => void
}

const TeamPlanForm = ({ team, project, roles, actions, saved }: PlanContext) => {
  const { t } = useI18n()
  const [steps, setSteps] = useState([`step${crypto.randomUUID().slice(0, 8)}`])
  const pending = useRef(false)
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending.current) return
    const element = event.currentTarget
    pending.current = true
    try {
      const result = await actions.execute(
        planCommand({ team, project, steps, form: new FormData(element) }),
      )
      // 已关闭表单的迟到回执不得关闭新弹窗、清空新草稿或改变当前导航。
      if (result && element.isConnected) saved(result.id)
    } finally {
      pending.current = false
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)}>
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
        <button className="primary" disabled={actions.busy}>
          {t('保存团队计划')}
        </button>
      </div>
    </form>
  )
}

const planCommand = ({
  team,
  project,
  steps,
  form,
}: {
  team: TeamVersion
  project: Project
  steps: string[]
  form: FormData
}) => ({
  type: 'team.createTask' as const,
  teamId: team.id,
  expectedTeamVersion: team.version,
  projectId: project.id,
  expectedProjectVersion: project.version,
  title: formText(form, 'title'),
  goal: formText(form, 'goal'),
  acceptanceCriteria: formText(form, 'criteria'),
  steps: steps.map((key) => ({
    key,
    roleId: formText(form, `role:${key}`),
    title: formText(form, `title:${key}`),
    goal: formText(form, `goal:${key}`),
    acceptanceCriteria: formText(form, `criteria:${key}`),
    dependsOn: form.getAll(`dependencies:${key}`).map(String),
  })),
})
