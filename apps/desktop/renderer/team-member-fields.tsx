import { useId } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

interface Context {
  roles: RoleVersion[]
  leader: string
  members: string[]
  changeLeader: (id: string) => void
  changeMembers: (update: (current: string[]) => string[]) => void
}

export const TeamMemberFields = (props: Context) => {
  const { t } = useI18n()
  const label = useId()
  return (
    <>
      <label>
        <span id={label}>{t('团队负责人')}</span>
        <select
          aria-labelledby={label}
          name="coordinator"
          value={props.leader}
          required
          onChange={(event) => props.changeLeader(event.target.value)}
        >
          {!props.roles.length && !props.leader && <option value="">{t('请先创建角色')}</option>}
          {props.leader && !props.roles.some((role) => role.id === props.leader) && (
            <option value={props.leader}>{t('角色不可用')}</option>
          )}
          {props.roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} · {role.cli}
            </option>
          ))}
        </select>
      </label>
      <TeamMembers {...props} />
    </>
  )
}

const TeamMembers = ({ roles, leader, members, changeMembers }: Context) => {
  const { t } = useI18n()
  const missing = members.filter((id) => !roles.some((role) => role.id === id))
  const choices = [
    ...roles.map((role) => ({ id: role.id, label: `${role.name} · ${role.cli}` })),
    ...missing.map((id) => ({ id, label: `${t('角色不可用')} · ${id}` })),
  ]
  return (
    <fieldset className="team-members-field">
      <legend>
        {t('团队成员（最多 12 名）')} · {members.length} / 12
      </legend>
      {choices.map((role) => (
        <label className="check-label" key={role.id}>
          <input
            type="checkbox"
            name="roles"
            value={role.id}
            aria-label={role.label}
            checked={members.includes(role.id)}
            disabled={role.id === leader || (!members.includes(role.id) && members.length >= 12)}
            onChange={(event) => {
              const checked = event.currentTarget.checked
              changeMembers((current) =>
                checked ? [...current, role.id] : current.filter((id) => id !== role.id),
              )
            }}
          />
          <span>{role.label}</span>
          {role.id === leader && <span className="badge">{t('负责人')}</span>}
        </label>
      ))}
      {!choices.length && <p>{t('请先创建角色')}</p>}
      {members.length > 12 && <p role="alert">{t('最多选择12名成员，请先移除其他成员。')}</p>}
    </fieldset>
  )
}
