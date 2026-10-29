import type { RoleVersion, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { RoleManagement } from './role-management'
import { RoleCopy } from './role-copy'
import { roleCardStatus, roleCardSkills, roleHasActiveTrial } from './role-card-view'

interface Context {
  role: RoleVersion
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  edit: () => void
  copied: (id: string) => void
}

export const RoleCard = ({ role, state, actions, edit, copied }: Context) => {
  const { t } = useI18n()
  const profile = role.modelProfileSnapshot
  const modelLabel = profile
    ? `${profile.name} · v${profile.version}`
    : role.model || t('CLI 默认模型')
  return (
    <article className="role-card" data-role-id={role.id} aria-label={role.name}>
      <button
        className="role-card-main"
        onClick={edit}
        aria-label={`${t('编辑角色配置')} · ${role.name}`}
      >
        <span className="role-card-top">
          <span className="role-avatar" aria-hidden="true">
            {Array.from(role.name)[0]}
          </span>
          <span className="role-card-identity">
            <strong>{role.name}</strong>
            <span className="code">
              {role.slug || role.id.slice(0, 8)} · v{role.version}
            </span>
          </span>
          <EditMark />
        </span>
        <span className="role-card-description">{role.responsibility}</span>
        <span className="role-card-runtime">
          <span>{role.cli}</span>
          <span>{modelLabel}</span>
        </span>
        <RoleSkillTags state={state} role={role} />
      </button>
      <RoleCardLifecycle role={role} state={state} actions={actions} copied={copied} />
    </article>
  )
}

const RoleCardLifecycle = ({ role, state, actions, copied }: Omit<Context, 'edit'>) => {
  const { t } = useI18n()
  return (
    <>
      <div className="role-card-footer">
        <span className="badge">{t(roleCardStatus(state, role))}</span>
        <span className="muted">{t(roleChannelLabel(role))}</span>
      </div>
      <p className="role-card-permission">
        {t(role.permission === 'read-only' ? '只读建议' : '受控执行')} · {t('并发上限')}{' '}
        {role.maxConcurrency ?? 1}
      </p>
      {roleHasActiveTrial(state, role.id) && (
        <p className="role-card-note">{t('有尚未结束的试运行，请在运行设置中核对。')}</p>
      )}
      <div className="role-card-actions">
        <RoleManagement role={role} state={state} actions={actions} />
        <RoleCopy role={role} actions={actions} copied={copied} />
      </div>
    </>
  )
}

const RoleSkillTags = ({ state, role }: Pick<Context, 'state' | 'role'>) => {
  const { t } = useI18n()
  const skills = roleCardSkills(state, role)
  return (
    <span className="role-card-skills">
      {skills.length ? (
        skills.map((skill) => (
          <span
            key={skill.id}
            className={skill.available ? 'role-skill-tag' : 'role-skill-tag unavailable'}
          >
            {skill.name}
            {!skill.available && ` · ${t('不可用')}`}
          </span>
        ))
      ) : (
        <span className="role-skill-tag">{t('尚未绑定技能')}</span>
      )}
    </span>
  )
}

/** 卡片只投影配置维度；连接健康要在运行设置中实时查询，不能由绑定存在推断。 */
const roleChannelLabel = (role: RoleVersion): string => {
  if (role.feishuBinding === undefined) return '保留旧工作空间渠道'
  if (role.feishuBinding === null) return '暂不接入飞书'
  return role.feishuBinding.enabled ? '飞书绑定已配置' : '飞书绑定未启用'
}

const EditMark = () => (
  <svg
    className="role-card-edit-mark"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="m14 5 5 5M4 20l4-1 12-12-4-4L4 15v5Z" />
  </svg>
)
