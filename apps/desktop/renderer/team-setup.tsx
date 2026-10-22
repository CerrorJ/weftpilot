import { useState } from 'react'
import type { RoleVersion, TeamVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
import { latestVersions } from './object-versions'
export const TeamSetup = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const teams = latestVersions(actions.state?.teams ?? [])
  const team = teams.find((item) => item.id === selected)
  return (
    <section className="setup-section">
      <h2>{t('AI 团队')}</h2>
      <p>{t('成员与协调者组成版本化团队。派发时固定团队版本，每个子任务独立执行和验收。')}</p>
      <label>
        {t('编辑团队')}
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          <option value="">{t('新建团队')}</option>
          {teams.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · v{item.version}
            </option>
          ))}
        </select>
      </label>
      <TeamForm
        key={`${selected}:${team?.version ?? 0}`}
        team={team}
        roles={latestVersions(actions.state?.roles ?? [])}
        actions={actions}
      />
    </section>
  )
}
const TeamForm = ({
  team,
  roles,
  actions,
}: {
  team: TeamVersion | undefined
  roles: RoleVersion[]
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const [members, setMembers] = useState(team?.roleIds ?? [])
  return (
    <form onSubmit={(event) => submitTeam(event, team, actions)}>
      <TextField label={t('团队名称')} name="name" value={team?.name ?? ''} />
      <MemberSelection roles={roles} members={members} change={setMembers} />
      <label>
        {t('协调角色')}
        <select
          name="coordinator"
          key={members.join(':')}
          defaultValue={team?.coordinatorRoleId}
          required
        >
          {!members.length && <option value="">{t('请先选择成员')}</option>}
          {roles
            .filter((item) => members.includes(item.id))
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </label>
      <button className="primary" disabled={actions.busy || !members.length || members.length > 12}>
        {team ? t('保存新版本') : t('创建团队')}
      </button>
    </form>
  )
}
const submitTeam = (
  event: React.FormEvent<HTMLFormElement>,
  team: TeamVersion | undefined,
  actions: WorkspaceActions,
) => {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  void actions.execute({
    type: 'team.save',
    ...(team ? { id: team.id } : {}),
    expectedVersion: team?.version ?? 0,
    name: formText(form, 'name'),
    roleIds: form.getAll('roles').map(String),
    coordinatorRoleId: formText(form, 'coordinator'),
  })
}

const MemberSelection = ({
  roles,
  members,
  change,
}: {
  roles: RoleVersion[]
  members: string[]
  change: (update: (current: string[]) => string[]) => void
}) => {
  const { t } = useI18n()
  return (
    <fieldset>
      <legend>{t('团队成员（最多 12 名）')}</legend>
      {roles.map((role) => (
        <label className="check-label" key={role.id}>
          <input
            type="checkbox"
            name="roles"
            value={role.id}
            checked={members.includes(role.id)}
            onChange={(event) =>
              change((current) =>
                event.target.checked
                  ? [...current, role.id]
                  : current.filter((id) => id !== role.id),
              )
            }
          />
          {role.name} · {role.cli}
        </label>
      ))}
    </fieldset>
  )
}
