import { useState } from 'react'
import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { latestVersions } from './object-versions'
import { RoleForm } from './role-form'
import { RoleHealth } from './role-health'

export const RoleSetup = ({
  state,
  actions,
}: {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const roles = latestVersions(state.roles)
  const role = roles.find((item) => item.id === selected)
  return (
    <section className="setup-section" aria-labelledby="roles-heading">
      <h2 id="roles-heading">{t('执行角色')}</h2>
      <p>
        {t('配置变更生成新版本，已有 Run 保留原快照。每个新版本必须通过真实试运行，再由你启用。')}
      </p>
      <label>
        {t('编辑角色')}
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          <option value="">{t('新建角色')}</option>
          {roles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · v{item.version}
            </option>
          ))}
        </select>
      </label>
      <RoleForm
        key={`${selected}:${role?.version ?? 0}`}
        role={role}
        models={latestVersions(state.models)}
        actions={actions}
      />
      <div className="object-list">
        {roles.map((item) => (
          <RoleHealth
            key={`${item.id}:${item.version}`}
            role={item}
            state={state}
            actions={actions}
          />
        ))}
      </div>
    </section>
  )
}
