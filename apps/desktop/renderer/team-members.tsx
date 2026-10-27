import type { TeamVersion, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

/** 团队固定成员ID；名称及CLI来自当前角色资料，不能冒充过去Run的配置。 */
export const TeamMembers = ({ team, roles }: { team: TeamVersion; roles: RoleVersion[] }) => {
  const { t } = useI18n()
  return (
    <ul className="team-members">
      {team.roleIds.map((id) => {
        const role = roles.find((item) => item.id === id)
        return (
          <li key={id}>
            <span className="team-member-initial" aria-hidden="true">
              {role?.name.slice(0, 1) ?? '—'}
            </span>
            <div>
              <strong>{role?.name ?? t('角色不可用')}</strong>
              <small>
                {role?.cli ?? '—'} · {role ? role.skills.length : '—'} Skills
              </small>
            </div>
            <span className="badge">{t(id === team.coordinatorRoleId ? '负责人' : '成员')}</span>
          </li>
        )
      })}
    </ul>
  )
}
