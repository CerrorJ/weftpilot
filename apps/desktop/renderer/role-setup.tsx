import { useState } from 'react'
import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { latestVersions } from './object-versions'
import { RoleForm } from './role-form'
import { RoleHealth } from './role-health'
import { readSelectedRole, rememberSelectedRole } from './role-draft'

export const RoleSetup = ({
  state,
  actions,
  visitSkills,
  resume,
  resumed,
}: {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  visitSkills: () => void
  resume: boolean
  resumed: () => void
}) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState(readSelectedRole)
  const roles = latestVersions(state.roles)
  const role = roles.find((item) => item.id === selected)
  return (
    <section className="setup-section" aria-labelledby="roles-heading">
      <h2 id="roles-heading">{t('执行角色')}</h2>
      <p>
        {t('配置变更生成新版本，已有 Run 保留原快照。每个新版本必须通过真实试运行，再由你启用。')}
      </p>
      <RoleSelector selected={selected} roles={roles} select={setSelected} />
      <RoleForm
        key={selected}
        role={role}
        models={state.models}
        actions={actions}
        visitSkills={visitSkills}
        resume={resume}
        resumed={resumed}
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

const RoleSelector = ({
  selected,
  roles,
  select,
}: {
  selected: string
  roles: WorkspaceSnapshot['roles']
  select: (id: string) => void
}) => {
  const { t } = useI18n()
  return (
    <label>
      {t('编辑角色')}
      <select
        value={selected}
        onChange={(event) => {
          select(event.target.value)
          rememberSelectedRole(event.target.value)
        }}
      >
        <option value="">{t('新建角色')}</option>
        {roles.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · v{item.version}
          </option>
        ))}
      </select>
    </label>
  )
}
