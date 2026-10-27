import type { TeamVersion, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { latestVersions } from './object-versions'
import { TeamMembers } from './team-members'
import { TeamDetail } from './team-detail'

export const TeamCard = ({
  team,
  state,
  actions,
}: {
  team: TeamVersion
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const roles = latestVersions(state.roles)
  const projects = state.projects.filter((project) => project.defaultTeamId === team.id)
  return (
    <article className="team-card" data-team-id={team.id}>
      <div className="team-card-heading">
        <h2>{team.name}</h2>
        <span className="badge">
          {team.roleIds.length === 1 ? t('1 位成员') : `${team.roleIds.length} ${t('位成员')}`} · v
          {team.version}
        </span>
      </div>
      <p className="team-description">{team.description || t('尚未记录团队说明')}</p>
      <TeamMembers team={team} roles={roles} />
      <TeamCollaboration />
      <div className="team-card-actions">
        <span>
          {projects.length === 1
            ? t('1 个项目使用此团队')
            : `${projects.length} ${t('个项目使用此团队')}`}
        </span>
        <TeamDetail
          team={team}
          versions={state.teams.filter((item) => item.id === team.id)}
          roles={roles}
          actions={actions}
        />
      </div>
    </article>
  )
}

const TeamCollaboration = () => {
  const { t } = useI18n()
  return (
    <div className="team-collaboration">
      <h3>{t('默认协作流程')}</h3>
      <ol>
        {['制定子任务与依赖', '成员独立执行', '逐项人工验收'].map((label) => (
          <li key={label}>{t(label)}</li>
        ))}
      </ol>
      <p className="field-note">
        {t('每次计划明确设置子任务依赖；上游交付须人工验收后才交接下游。')}
      </p>
    </div>
  )
}
