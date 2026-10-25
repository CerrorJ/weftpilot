import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { CreateDialog } from './create-dialog'
import { TextField, formText } from './form-fields'
import { useI18n } from './preferences'

interface Context {
  role: RoleVersion
  actions: WorkspaceActions
  copied: (id: string) => void
}

export const RoleCopy = (props: Context) => (
  <CreateDialog
    title="复制角色配置"
    trigger="复制配置"
    primary={false}
    closeIcon
    disabled={props.actions.busy}
    error={props.actions.error}
  >
    {(close) => <RoleCopyForm {...props} close={close} />}
  </CreateDialog>
)

const RoleCopyForm = ({ role, actions, copied, close }: Context & { close: () => void }) => {
  const { t } = useI18n()
  const [base] = useState(role)
  const [initial] = useState(() => ({
    name: `${Array.from(role.name).slice(0, 90).join('')} ${t('副本')}`,
    slug: `${(role.slug ?? 'role').slice(0, 49).replace(/-+$/, '')}-copy-${crypto.randomUUID().slice(0, 8)}`,
  }))
  const submit = useRoleCopySubmit({ role: base, actions, copied, close })
  return (
    <form className="role-copy-form" onSubmit={(event) => void submit(event)}>
      <p>
        {t('来源角色')} ·{' '}
        <strong>
          {base.name} · v{base.version}
        </strong>
      </p>
      <p className="field-note">
        {t(
          '复制职责、固定模型、Skill引用、权限及并发配置；生成新的未启用角色，不复制任务、试运行证明或飞书应用。',
        )}
      </p>
      <TextField label={t('副本名称')} name="name" value={initial.name} />
      <label>
        {t('副本标识')}
        <input
          name="slug"
          required
          maxLength={64}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          defaultValue={initial.slug}
        />
      </label>
      <p className="field-note">
        {t('来源更新时会拒绝，不会悄悄改用新版本。副本仍需真实试运行后再启用。')}
      </p>
      <div className="role-copy-actions">
        <button type="button" disabled={actions.busy} onClick={close}>
          {t('取消')}
        </button>
        <button className="primary" disabled={actions.busy}>
          {t('复制为未启用角色')}
        </button>
      </div>
    </form>
  )
}

const useRoleCopySubmit = (context: Context & { close: () => void }) => {
  const pending = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending.current || context.actions.busy) return
    pending.current = true
    const form = new FormData(event.currentTarget)
    try {
      const result = await context.actions.execute({
        type: 'role.copy',
        sourceRoleId: context.role.id,
        expectedSourceVersion: context.role.version,
        name: formText(form, 'name'),
        slug: formText(form, 'slug'),
      })
      if (result && mounted.current) {
        context.close()
        context.copied(result.id)
      }
    } finally {
      pending.current = false
    }
  }
}
