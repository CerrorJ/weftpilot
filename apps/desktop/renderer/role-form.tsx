import { useMemo, useState } from 'react'
import type { ModelProfile, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
import { RoleSkills, selectedSkills } from './role-skills'
import {
  readRoleDraft,
  writeRoleDraft,
  clearRoleDraft,
  roleDraftKey,
  initialRoleDraft,
} from './role-draft'
import { RoleRuntime } from './role-runtime'
interface RoleContext {
  role: RoleVersion | undefined
  models: ModelProfile[]
  actions: WorkspaceActions
}

export const RoleForm = ({ role, models, actions }: RoleContext) => {
  const { t } = useI18n()
  const [revision, setRevision] = useState(0)
  const key = roleDraftKey(role)
  const draft = useMemo(() => readRoleDraft(key) ?? initialRoleDraft(role), [key, revision, role])
  return (
    <form
      key={revision}
      onChange={(event) => writeRoleDraft(key, event.currentTarget)}
      onSubmit={(event) =>
        submitRole(event, { role, models, actions }, () => {
          clearRoleDraft(key)
          setRevision((value) => value + 1)
        })
      }
    >
      <TextField name="name" label={t('角色名称')} value={draft.name} />
      <TextField name="responsibility" label={t('职责')} value={draft.responsibility} multiline />
      <RoleRuntime role={role} models={models} draft={draft} />
      <RolePermission value={draft.permission} />
      <RoleSkills skills={actions.state?.skills ?? []} selected={draft.skills} />
      <p className="field-note">
        {t('Codex 使用受控沙箱；Claude 当前仅开放受限文件工具。试运行失败或状态待确认时不能启用。')}
      </p>
      <button className="primary" disabled={actions.busy}>
        {role ? t('保存新版本') : t('创建角色')}
      </button>
    </form>
  )
}

const submitRole = (
  event: React.FormEvent<HTMLFormElement>,
  { role, actions }: RoleContext,
  saved: () => void,
) => {
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
      skills: selectedSkills(form),
    })
    .then((result) => {
      if (result) saved()
    })
}

const selectedModel = (value: string) => {
  if (!value) return null
  const [id, version] = value.split('@')
  return { id: id!, version: Number(version) }
}

const RolePermission = ({ value }: { value: string }) => {
  const { t } = useI18n()
  return (
    <label>
      {t('工具权限')}
      <select name="permission" defaultValue={value}>
        <option value="read-only">{t('只读建议')}</option>
        <option value="workspace-write">{t('隔离工作目录内写入')}</option>
      </select>
    </label>
  )
}
