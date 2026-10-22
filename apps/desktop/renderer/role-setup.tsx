import { useI18n } from './preferences'
import { useState } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { TextField, formText } from './form-fields'
interface RoleContext {
  role: RoleVersion | undefined
  actions: WorkspaceActions
}
export const RoleSetup = ({
  roles,
  actions,
}: {
  roles: RoleVersion[]
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const role = roles.find((item) => item.id === selected)
  return (
    <section className="setup-section" aria-labelledby="roles-heading">
      <h2 id="roles-heading">{t('执行角色')}</h2>
      <p>
        {t(
          '配置变更生成新版本，已有 Run 保留原快照。当前使用 Codex 本机账户；模型认证会在真实执行中验证。',
        )}
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
      <RoleForm key={`${selected}:${role?.version ?? 0}`} role={role} actions={actions} />
    </section>
  )
}
const RoleForm = ({ role, actions }: RoleContext) => {
  const { t } = useI18n()
  return (
    <form onSubmit={(event) => submitRole(event, { role, actions })}>
      <TextField name="name" label={t('角色名称')} value={role?.name ?? ''} />
      <TextField
        name="responsibility"
        label={t('职责')}
        value={role?.responsibility ?? ''}
        multiline
      />
      <TextField
        name="model"
        label={t('模型（可选）')}
        value={role?.model ?? ''}
        optional
        placeholder={t('留空使用 CLI 默认模型')}
      />
      <label>
        {t('工具权限')}
        <select name="permission" defaultValue={role?.permission ?? 'read-only'}>
          <option value="read-only">{t('只读建议')}</option>
          <option value="workspace-write">{t('隔离工作目录内写入')}</option>
        </select>
      </label>
      <p className="field-note">
        {t(
          '不会绕过 CLI 沙箱；Windows 使用 MXC，不支持时执行会明确失败。M1 不加载用户 CLI 配置或项目自定义扩展。',
        )}
      </p>
      <button className="primary" disabled={actions.busy}>
        {role ? t('保存新版本') : t('创建角色')}
      </button>
    </form>
  )
}

const submitRole = (event: React.FormEvent<HTMLFormElement>, { role, actions }: RoleContext) => {
  event.preventDefault()
  const element = event.currentTarget
  const form = new FormData(element)
  void actions
    .execute({
      type: 'role.save',
      ...(role ? { id: role.id } : {}),
      expectedVersion: role?.version ?? 0,
      name: formText(form, 'name'),
      responsibility: formText(form, 'responsibility'),
      cli: 'codex',
      model: formText(form, 'model'),
      permission: form.get('permission') === 'workspace-write' ? 'workspace-write' : 'read-only',
    })
    .then((result) => {
      if (result && !role) element.reset()
    })
}
