import { useState } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { latestVersions } from './object-versions'
import { useI18n } from './preferences'
import { RoleChannelStatus } from './role-channel-status'
import { FeishuPage } from './feishu-page'

export const SettingsRoleConnections = ({
  actions,
  configureRole,
}: {
  actions: WorkspaceActions
  configureRole: (id: string) => void
}) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const state = actions.state
  const roles = state ? latestVersions(state.roles) : []
  return (
    <section className="settings-role-connections" aria-label={t('角色飞书连接')}>
      <h2>{t('角色飞书连接')}</h2>
      <p>{t('配置在角色中按版本保存。展开一位角色后查询实际连接，不将保存当作平台已就绪。')}</p>
      {!state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : !roles.length ? (
        <p>{t('还没有角色')}</p>
      ) : (
        <div className="settings-role-list">
          {roles.map((role) => (
            <article className="settings-role-row" key={role.id} data-settings-role-id={role.id}>
              <RoleConnectionHeading role={role} configure={() => configureRole(role.id)} />
              <button
                aria-expanded={selected === role.id}
                onClick={() => setSelected(selected === role.id ? '' : role.id)}
              >
                {t(selected === role.id ? '收起连接状态' : '查看连接状态')}
              </button>
              {selected === role.id && (
                <RoleChannelStatus key={`${role.id}@${role.version}`} role={role} state={state} />
              )}
            </article>
          ))}
        </div>
      )}
      <details className="legacy-feishu">
        <summary>{t('旧工作空间渠道（兼容）')}</summary>
        <p className="field-note">{t('仅继承旧渠道的角色使用此配置；独立角色绑定不被覆盖。')}</p>
        <FeishuPage actions={actions} />
      </details>
    </section>
  )
}

const RoleConnectionHeading = ({
  role,
  configure,
}: {
  role: RoleVersion
  configure: () => void
}) => {
  const { t } = useI18n()
  const binding = role.feishuBinding
  const saved =
    binding === null
      ? '暂不接入飞书'
      : binding === undefined
        ? '保留旧工作空间渠道'
        : binding.enabled
          ? '已保存，连接待查询'
          : '已保存，未许可连接'
  return (
    <div className="settings-role-heading">
      <div>
        <h3>
          {role.name} <small>v{role.version}</small>
        </h3>
        <p>{t(saved)}</p>
      </div>
      <button onClick={configure}>{t('配置角色')}</button>
    </div>
  )
}
