import { useState } from 'react'
import type { ModelProfile } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField } from './form-fields'
import { latestVersions } from './object-versions'
import { ModelProviderFields } from './model-provider-fields'
import { modelDraft } from './model-draft'

export const ModelSetup = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const profiles = latestVersions(actions.state?.models ?? [])
  const profile = profiles.find((item) => item.id === selected)
  return (
    <section className="setup-section">
      <h2>{t('模型配置')}</h2>
      <p>
        {t('模型配置追加版本，角色固定所选版本。可使用 CLI 账户或自定义接口；凭据由系统加密保存。')}
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
  return (
    <form onSubmit={(event) => submitModel(event, profile, actions)}>
      <TextField label={t('配置名称')} name="name" value={fields.name} />
      <ModelProviderFields profile={profile} />
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
  const element = event.currentTarget
  const form = new FormData(element)
  void actions.saveModel(modelDraft(form, profile)).then((result) => {
    if (result) {
      const field = element.elements.namedItem('secret')
      if (field instanceof HTMLInputElement) field.value = ''
    }
  })
}
