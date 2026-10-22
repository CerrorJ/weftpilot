import { useState } from 'react'
import type { ModelProfile } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

export const ModelProviderFields = ({ profile }: { profile: ModelProfile | undefined }) => {
  const { t } = useI18n()
  const [custom, setCustom] = useState(!!profile && profile.provider !== 'cli-managed')
  return (
    <>
      <label>
        {t('兼容 CLI')}
        <select name="cli" defaultValue={profile?.cli ?? 'codex'}>
          <option value="codex">Codex</option>
          <option value="claude">Claude Code</option>
        </select>
      </label>
      <label>
        {t('认证方式')}
        <select
          name="provider"
          value={custom ? 'custom' : 'cli-managed'}
          onChange={(event) => setCustom(event.target.value === 'custom')}
        >
          <option value="cli-managed">{t('使用 CLI 账户')}</option>
          <option value="custom">{t('自定义接口与密钥')}</option>
        </select>
      </label>
      {custom && <CustomProviderFields profile={profile} />}
    </>
  )
}

const CustomProviderFields = ({ profile }: { profile: ModelProfile | undefined }) => {
  const { t } = useI18n()
  return (
    <>
      <label>
        {t('接口地址')}
        <input
          name="baseUrl"
          required
          maxLength={2048}
          defaultValue={profile?.baseUrl ?? ''}
          placeholder="https://api.example.com/v1"
        />
      </label>
      <label>
        {t('API 密钥')}
        <input
          name="secret"
          type="password"
          autoComplete="new-password"
          maxLength={16384}
          placeholder={profile?.credentialRef ? t('留空保留该接口的已有密钥') : ''}
          required={!profile?.credentialRef}
        />
      </label>
      <p className="field-note">
        {t('修改接口地址需重新填写密钥；旧版本继续使用原密钥。保存后请重新试运行角色。')}
      </p>
    </>
  )
}
