import { useState } from 'react'
import type { ModelProfile, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
interface RoleContext {
  role: RoleVersion | undefined
  models: ModelProfile[]
  actions: WorkspaceActions
}

export const RoleForm = ({ role, models, actions }: RoleContext) => {
  const { t } = useI18n()
  return (
    <form onSubmit={(event) => submitRole(event, { role, models, actions })}>
      <TextField name="name" label={t('角色名称')} value={role?.name ?? ''} />
      <TextField
        name="responsibility"
        label={t('职责')}
        value={role?.responsibility ?? ''}
        multiline
      />
      <RoleRuntime role={role} models={models} />
      <label>
        {t('工具权限')}
        <select name="permission" defaultValue={role?.permission ?? 'read-only'}>
          <option value="read-only">{t('只读建议')}</option>
          <option value="workspace-write">{t('隔离工作目录内写入')}</option>
        </select>
      </label>
      <p className="field-note">
        {t('Codex 使用受控沙箱；Claude 当前仅开放受限文件工具。试运行失败或状态待确认时不能启用。')}
      </p>
      <button className="primary" disabled={actions.busy}>
        {role ? t('保存新版本') : t('创建角色')}
      </button>
    </form>
  )
}

const RoleRuntime = ({ role, models }: Omit<RoleContext, 'actions'>) => {
  const { t } = useI18n()
  const [cli, setCli] = useState(role?.cli ?? 'codex')
  return (
    <>
      <label>
        CLI
        <select
          name="cli"
          value={cli}
          onChange={(event) => setCli(event.target.value as 'codex' | 'claude')}
        >
          <option value="codex">Codex</option>
          <option value="claude">Claude Code</option>
        </select>
      </label>
      <label>
        {t('模型配置')}
        <select key={cli} name="profile" defaultValue={profileForCli(role, cli)}>
          <option value="">{t('使用 CLI 账户与手动模型')}</option>
          {roleModelOptions(role, models)
            .filter((item) => item.cli === cli)
            .map((item) => (
              <option key={`${item.id}@${item.version}`} value={`${item.id}@${item.version}`}>
                {item.name} · v{item.version}
              </option>
            ))}
        </select>
      </label>
      <TextField
        name="model"
        label={t('模型（可选）')}
        value={role?.model ?? ''}
        optional
        placeholder={t('留空使用 CLI 默认模型')}
      />
      {role?.modelProfileSnapshot && (
        <p className="field-note">
          {t('当前固定模型版本：')}
          {role.modelProfileSnapshot.name} · v{role.modelProfileSnapshot.version}
        </p>
      )}
    </>
  )
}

/** 当前角色的历史引用必须仍可选，不能因“只列最新版本”静默退回 CLI 账户。 */
const roleModelOptions = (
  role: RoleVersion | undefined,
  models: ModelProfile[],
): ModelProfile[] => {
  const pinned = role?.modelProfileSnapshot
  if (!pinned || models.some((item) => item.id === pinned.id && item.version === pinned.version))
    return models
  return [...models, pinned]
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
      cli: formText(form, 'cli') === 'claude' ? 'claude' : 'codex',
      modelProfileRef: selectedModel(formText(form, 'profile')),
      model: formText(form, 'model'),
      permission: form.get('permission') === 'workspace-write' ? 'workspace-write' : 'read-only',
    })
    .then((result) => {
      if (result && !role) element.reset()
    })
}

const profileForCli = (role: RoleVersion | undefined, cli: string) =>
  role?.cli === cli && role.modelProfileSnapshot
    ? `${role.modelProfileSnapshot.id}@${role.modelProfileSnapshot.version}`
    : ''

const selectedModel = (value: string) => {
  if (!value) return null
  const [id, version] = value.split('@')
  return { id: id!, version: Number(version) }
}
