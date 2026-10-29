import { useId, useState } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { RoleDraft } from './role-draft'
import { useI18n } from './preferences'
import { TextField } from './form-fields'
import { workflow } from './desktop-api'

type ChannelMode = RoleDraft['feishuMode']
interface Context {
  draft: RoleDraft
  role: RoleVersion | undefined
}

export const RoleChannel = (context: Context) => {
  const [mode, setMode] = useState<ChannelMode>(context.draft.feishuMode)
  return (
    <>
      <RoleChannelChoices
        mode={mode}
        change={setMode}
        legacy={!!context.role && context.role.feishuBinding === undefined}
      />
      <RoleChannelFields {...context} mode={mode} />
    </>
  )
}

const RoleChannelChoices = ({
  mode,
  change,
  legacy,
}: {
  mode: ChannelMode
  change: (mode: ChannelMode) => void
  legacy: boolean
}) => {
  const { t } = useI18n()
  const prefix = useId()
  const choices: [ChannelMode, string, string][] = [
    ['new', '新建飞书机器人', '在飞书开发者后台创建独立应用，再填写本角色绑定。'],
    ['existing', '关联已有应用', '使用自己有权管理的独立应用，不与原在线服务共用连接。'],
    ['none', '暂不接入飞书', '桌面角色可以独立工作，飞书为可选的消息与通知入口。'],
  ]
  if (legacy)
    choices.push(['inherit', '保留旧工作空间渠道', '仅保留旧版本兼容行为，不视为角色独立授权。'])
  return (
    <fieldset className="role-channel-choices">
      <legend>{t('在这里新建或关联飞书机器人')}</legend>
      {choices.map(([value, title, description]) => (
        <label key={value} className="role-channel-choice">
          <input
            type="radio"
            name="feishuMode"
            value={value}
            checked={mode === value}
            aria-label={t(title)}
            aria-describedby={`${prefix}-${value}`}
            onChange={() => change(value)}
          />
          <span>
            <strong>{t(title)}</strong>
            <small id={`${prefix}-${value}`}>{t(description)}</small>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

const RoleChannelFields = ({ draft, role, mode }: Context & { mode: ChannelMode }) => {
  const { t } = useI18n()
  const [error, setError] = useState('')
  const configured = mode === 'new' || mode === 'existing'
  const openConsole = async () => {
    setError('')
    try {
      await workflow().openFeishuConsole()
    } catch {
      setError('无法打开飞书开发者后台，请稍后重试。')
    }
  }
  return (
    <fieldset className="role-channel-fields" disabled={!configured} hidden={!configured}>
      <legend>{t('本角色应用身份')}</legend>
      {mode === 'new' && <p>{t('当前提供控制台辅助创建；不会自动复制现有机器人或读取其密钥。')}</p>}
      <button type="button" onClick={() => void openConsole()}>
        {t('打开飞书开发者后台')}
      </button>
      {error && <p role="alert">{t(error)}</p>}
      <RoleChannelIdentity draft={draft} role={role} />
      <label className="check-label">
        <input type="checkbox" name="feishuEnabled" defaultChecked={draft.feishuEnabled} />
        {t('允许此角色绑定连接飞书')}
      </label>
      <p className="field-note">
        {t('不同应用的所有者 Open ID 需分别核验，不能直接复制其他机器人身份。')}
      </p>
      <p className="field-note">
        {t('密钥不存入表单草稿；离开配置窗口后需要重新填写。保存不会自动连接。')}
      </p>
    </fieldset>
  )
}

const RoleChannelIdentity = ({ draft, role }: Context) => {
  const { t } = useI18n()
  const [appId, setAppId] = useState(draft.feishuAppId)
  return (
    <>
      <label>
        App ID
        <input
          name="feishuAppId"
          value={appId}
          onChange={(event) => setAppId(event.target.value)}
          required
          maxLength={200}
          pattern="cli_[0-9a-fA-F]{16}"
          autoComplete="off"
        />
      </label>
      <div className="form-pair">
        <TextField
          label={t('租户 Tenant Key')}
          name="feishuTenantKey"
          value={draft.feishuTenantKey}
        />
        <TextField
          label={t('所有者 Open ID')}
          name="feishuOwnerOpenId"
          value={draft.feishuOwnerOpenId}
        />
      </div>
      <TextField label={t('通知会话 Chat ID')} name="feishuChatId" value={draft.feishuChatId} />
      <RoleChannelSecret required={!role?.feishuBinding || appId !== role.feishuBinding.appId} />
    </>
  )
}

const RoleChannelSecret = ({ required }: { required: boolean }) => {
  const { t } = useI18n()
  return (
    <>
      <label>
        App Secret
        <input
          name="roleFeishuSecret"
          type="password"
          autoComplete="new-password"
          maxLength={16384}
          required={required}
        />
      </label>
      <p className="field-note">
        {t('留空沿用本应用密钥；更换 App ID 时必须填写新密钥。保存不会自动连接。')}
      </p>
    </>
  )
}
