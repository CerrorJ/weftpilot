import { useState } from 'react'
import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { latestVersions } from './object-versions'
import { RoleForm } from './role-form'
import { RoleCard } from './role-card'
import { PageHeading } from './page-heading'
import { readSelectedRole, rememberSelectedRole } from './role-draft'
import './role-cards.css'

export const roleCatalogDescription = '从职责、能力到权限，让每位成员都具备明确的工作边界。'
interface Context {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  visitSkills: () => void
  resume: boolean
  resumed: () => void
}

export const RoleSetup = ({ state, actions, visitSkills, resume, resumed }: Context) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState(readSelectedRole)
  const [opening, setOpening] = useState(false)
  const roles = latestVersions(state.roles)
  const role = roles.find((item) => item.id === selected)
  const select = (id: string) => {
    setSelected(id)
    rememberSelectedRole(id)
  }
  const edit = (id: string) => {
    select(id)
    setOpening(true)
  }
  return (
    <>
      <PageHeading title="角色管理" description={roleCatalogDescription}>
        <button className="primary" onClick={() => edit('')} disabled={actions.busy}>
          {t('创建角色')}
        </button>
      </PageHeading>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      <section className="role-catalog" aria-label={t('角色列表')}>
        <div className="role-catalog-toolbar">
          <RoleSelector selected={selected} roles={roles} select={select} />
          {role && <button onClick={() => setOpening(true)}>{t('编辑角色配置')}</button>}
        </div>
        <RoleForm
          key={selected}
          role={role}
          models={state.models}
          actions={actions}
          visitSkills={visitSkills}
          resume={opening || resume}
          resumed={() => {
            setOpening(false)
            resumed()
          }}
          hideTrigger
        />
        <RoleCardList roles={roles} state={state} actions={actions} edit={edit} />
      </section>
    </>
  )
}

const RoleCardList = ({
  roles,
  state,
  actions,
  edit,
}: {
  roles: WorkspaceSnapshot['roles']
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  edit: (id: string) => void
}) => {
  const { t } = useI18n()
  return (
    <>
      <div className="role-card-grid">
        {roles.map((item) => (
          <RoleCard
            key={item.id}
            role={item}
            state={state}
            actions={actions}
            edit={() => edit(item.id)}
          />
        ))}
      </div>
      {!roles.length && (
        <div className="empty-state">
          <h2>{t('还没有角色')}</h2>
          <p>{t('先创建清晰的职责与权限，再通过真实试运行启用。')}</p>
        </div>
      )}
      <p className="role-catalog-note">
        {t('配置变更生成新版本，已有 Run 保留原快照。每个新版本必须通过真实试运行，再由你启用。')}
      </p>
      <p className="muted">
        {t('版本与登录请在CLI步骤分别检查，模型需真实试运行；飞书角色路由仍待完善。')}
      </p>
    </>
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
      <select value={selected} onChange={(event) => select(event.target.value)}>
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
