import { useState } from 'react'
import type { ModelProfile } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
import { latestVersions } from './object-versions'

export const ModelSetup = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const profiles = latestVersions(actions.state?.models ?? [])
  const profile = profiles.find((item) => item.id === selected)
  return (
    <section className="setup-section">
      <h2>{t('模型配置')}</h2>
      <p>
        {t(
          '模型配置追加版本，角色保存确切配置快照。当前可使用本机 CLI 账户；自定义服务凭证接入仍在开发。',
        )}
      </p>
      <label>
        {t('编辑模型配置')}
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          <option value="">{t('新建模型配置')}</option>
          {profiles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · v{item.version}
            </option>
          ))}
        </select>
      </label>
      <ModelForm key={`${selected}:${profile?.version ?? 0}`} profile={profile} actions={actions} />
    </section>
  )
}
const ModelForm = ({
  profile,
  actions,
}: {
  profile: ModelProfile | undefined
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const fields = profile ?? { name: '', cli: 'codex', model: '', reasoningEffort: '' }
  if (profile && profile.provider !== 'cli-managed')
    return <p>{t('此自定义配置尚需安全凭证接入，当前不会用于执行。')}</p>
  return (
    <form onSubmit={(event) => submitModel(event, profile, actions)}>
      <TextField label={t('配置名称')} name="name" value={fields.name} />
      <label>
        {t('兼容 CLI')}
        <select name="cli" defaultValue={fields.cli}>
          <option value="codex">Codex</option>
          <option value="claude">Claude Code</option>
        </select>
      </label>
      <TextField
        label={t('模型标识（可选）')}
        name="model"
        value={fields.model}
        optional
        placeholder={t('留空使用 CLI 默认模型')}
      />
      <label>
        {t('推理强度')}
        <select name="effort" defaultValue={fields.reasoningEffort}>
          {['', 'low', 'medium', 'high', 'xhigh', 'max'].map((value) => (
            <option key={value} value={value}>
              {value || t('CLI 默认')}
            </option>
          ))}
        </select>
      </label>
      <p className="field-note">{t('模型和推理强度是否可用，以本机真实试运行结果为准。')}</p>
      <button className="primary" disabled={actions.busy}>
        {profile ? t('保存新版本') : t('创建模型配置')}
      </button>
    </form>
  )
}
const submitModel = (
  event: React.FormEvent<HTMLFormElement>,
  profile: ModelProfile | undefined,
  actions: WorkspaceActions,
) => {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  void actions.execute({
    type: 'model.save',
    ...(profile ? { id: profile.id } : {}),
    expectedVersion: profile?.version ?? 0,
    name: formText(form, 'name'),
    cli: formText(form, 'cli') === 'claude' ? 'claude' : 'codex',
    provider: 'cli-managed',
    model: formText(form, 'model'),
    baseUrl: '',
    credentialRef: null,
    reasoningEffort: formText(form, 'effort') as ModelProfile['reasoningEffort'],
  })
}
