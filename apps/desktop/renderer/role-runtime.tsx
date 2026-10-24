import { useState } from 'react'
import type { ModelProfile, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { RoleDraft } from './role-draft'
import { useI18n } from './preferences'
import { TextField } from './form-fields'
import { latestVersions } from './object-versions'

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
      <RoleModelFields key={cli} {...props} cli={cli} />
    </>
  )
}

const RoleModelFields = ({ role, models, draft, cli }: RuntimeProps & { cli: string }) => {
  const { t } = useI18n()
  const [profile, setProfile] = useState(draft.cli === cli ? draft.profile : '')
  const options = roleModelOptions(role, models, profile).filter((item) => item.cli === cli)
  return (
    <>
      <RoleModelSelector profile={profile} select={setProfile} options={options} />
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

const RoleModelSelector = ({
  profile,
  select,
  options,
}: {
  profile: string
  select: (value: string) => void
  options: ModelProfile[]
}) => {
  const { t } = useI18n()
  const missing = profile && !options.some((item) => `${item.id}@${item.version}` === profile)
  return (
    <label>
      {t('模型配置')}
      <select name="profile" value={profile} onChange={(event) => select(event.target.value)}>
        <option value="">{t('使用 CLI 账户与手动模型')}</option>
        {missing && <option value={profile}>{t('固定模型版本不可用，请重新选择')}</option>}
        {options.map((item) => (
          <option key={`${item.id}@${item.version}`} value={`${item.id}@${item.version}`}>
            {item.name} · v{item.version}
          </option>
        ))}
      </select>
    </label>
  )
}

/** 基线与草稿的确切引用都保留；模型新增版本不能让正在编辑的选择回退到CLI账户。 */
const roleModelOptions = (
  role: RoleVersion | undefined,
  models: ModelProfile[],
  profile: string,
): ModelProfile[] => {
  const pinned = role?.modelProfileSnapshot
  const selected = models.find((item) => `${item.id}@${item.version}` === profile)
  const candidates = [
    ...latestVersions(models),
    ...(pinned ? [pinned] : []),
    ...(selected ? [selected] : []),
  ]
  return [...new Map(candidates.map((item) => [`${item.id}@${item.version}`, item])).values()]
}
