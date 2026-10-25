import { useState } from 'react'
import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { latestVersions } from './object-versions'
import { RoleForm } from './role-form'
import { RoleCard } from './role-card'
import { PageHeading } from './page-heading'
import { readSelectedRole, rememberSelectedRole } from './role-draft'
import { useCreatedRoleFocus } from './use-created-role-focus'
import { newRoleDraftTarget, readRoleDraftEntries, type RoleDraftEntry } from './role-draft-entries'
import { RoleDraftPicker } from './role-draft-picker'
import { restoreRoleCatalogFocus } from './role-catalog-focus'
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
  const copied = useCreatedRoleFocus(roles)
  const role = roles.find((item) => item.id === selected)
  const edit = (id: string) => {
    setSelected(id)
    rememberSelectedRole(id)
    setOpening(true)
  }
  return (
    <>
      <RoleCatalogHeading
        busy={actions.busy}
        create={() => edit(newRoleDraftTarget())}
        drafts={readRoleDraftEntries(roles)}
        select={edit}
      />
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      <section className="role-catalog" aria-label={t('角色列表')}>
        <RoleForm
          key={selected}
          role={role}
          newDraftId={selected.startsWith('new.') ? selected : 'new'}
          models={state.models}
          actions={actions}
          visitSkills={visitSkills}
          resume={opening || resume}
          resumed={() => {
            setOpening(false)
            resumed()
            restoreRoleCatalogFocus()
          }}
          hideTrigger
        />
        <RoleCardList roles={roles} state={state} actions={actions} edit={edit} copied={copied} />
      </section>
    </>
  )
}

const RoleCatalogHeading = ({
  busy,
  create,
  drafts,
  select,
}: {
  busy: boolean
  create: () => void
  drafts: RoleDraftEntry[]
  select: (target: string) => void
}) => {
  const { t } = useI18n()
  return (
    <PageHeading
      title="角色管理"
      description={roleCatalogDescription}
      eyebrow="ROLES / CAPABILITIES"
    >
      <div className="role-catalog-actions">
        <RoleDraftPicker entries={drafts} busy={busy} select={select} />
        <button className="primary role-create-action" onClick={create} disabled={busy}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('创建角色')}
        </button>
      </div>
    </PageHeading>
  )
}

const RoleCardList = ({
  roles,
  state,
  actions,
  edit,
  copied,
}: {
  roles: WorkspaceSnapshot['roles']
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  edit: (id: string) => void
  copied: (id: string) => void
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
            copied={copied}
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
