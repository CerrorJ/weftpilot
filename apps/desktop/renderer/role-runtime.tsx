import { useState } from 'react'
import type { ModelProfile, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { RoleDraft } from './role-draft'
import { useI18n } from './preferences'
import { TextField } from './form-fields'

interface RuntimeProps {
  role: RoleVersion | undefined
  models: ModelProfile[]
  draft: RoleDraft
}

export const RoleRuntime = (props: RuntimeProps) => {
  const [cli, setCli] = useState(props.draft.cli)
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
      <RoleModelFields {...props} cli={cli} />
    </>
  )
}

const RoleModelFields = ({ role, models, draft, cli }: RuntimeProps & { cli: string }) => {
  const { t } = useI18n()
  return (
    <>
      <label>
        {t('模型配置')}
        <select key={cli} name="profile" defaultValue={draft.cli === cli ? draft.profile : ''}>
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
        value={draft.model}
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
