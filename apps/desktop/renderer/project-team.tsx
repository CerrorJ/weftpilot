import type {
  Project,
  WorkspaceSnapshot,
  TeamVersion,
  RoleVersion,
} from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { latestVersions } from './object-versions'
import { useI18n } from './preferences'
import { TeamTaskCreate } from './team-task-create'
import { useRef } from 'react'

export const ProjectTeam = ({
  project,
  state,
  actions,
  openTask,
}: {
  project: Project
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  openTask: (id: string) => void
}) => {
  const { t } = useI18n()
  const surface = useRef<HTMLElement>(null)
  const team = latestVersions(state.teams).find((item) => item.id === project.defaultTeamId)
  const roles = latestVersions(state.roles)
  return (
    <section ref={surface} tabIndex={-1} className="project-team" aria-label={t('项目团队')}>
      <div className="project-section-heading">
        <h2>{t('项目团队')}</h2>
        {team && <span className="badge">v{team.version}</span>}
      </div>
      {team ? (
        <>
          <h3>{team.name}</h3>
          <ProjectTeamMembers team={team} roles={roles} />
        </>
      ) : (
        <p className="empty-state">
          {t(
            project.defaultTeamId
              ? '原团队不可用'
              : '在项目设置中关联默认团队，然后创建真实团队计划。',
          )}
        </p>
      )}
      {/* 宿主持续挂载；清除默认团队不能销毁已打开的版本化草稿。 */}
      <TeamTaskCreate
        state={state}
        actions={actions}
        project={project}
        onCreated={openTask}
        hideTrigger={!team}
        onClosed={() => {
          if (!team) surface.current?.focus()
        }}
      />
      <p className="field-note">{t('此处展示团队当前版本；已有计划和执行保留各自的固定快照。')}</p>
    </section>
  )
}

const ProjectTeamMembers = ({ team, roles }: { team: TeamVersion; roles: RoleVersion[] }) => {
  const { t } = useI18n()
  return (
    <ul className="project-team-members">
      {team.roleIds.map((id) => {
        const role = roles.find((item) => item.id === id)
        return (
          <li key={id}>
            <strong>{role?.name ?? t('角色不可用')}</strong>
            <span>{t(id === team.coordinatorRoleId ? '协调角色' : '团队成员')}</span>
            <small>
              {role?.cli ?? '—'} · {role?.model || t('CLI默认模型')}
            </small>
          </li>
        )
      })}
    </ul>
  )
}
