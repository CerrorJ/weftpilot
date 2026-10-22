import type { FeishuBinding } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'

export const FeishuSetup = ({
  binding,
  actions,
}: {
  binding: FeishuBinding | null
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  return (
    <section className="setup-section">
      <h2>{t('绑定专用应用')}</h2>
      <p>
        {t(
          '请使用独立开发应用，避免与原服务同时消费同一应用事件。密钥由系统加密，不进入业务快照。',
        )}
      </p>
      <form
        key={binding?.version ?? 0}
        onSubmit={(event) => submitBinding(event, binding, actions)}
      >
        <FeishuIdentityFields binding={binding} />
        <p className="field-note">
          {t(
            'App ID 以 cli_ 开头，后面为 16 位十六进制字符；Open ID 和 Chat ID 分别以 ou_、oc_ 开头。',
          )}
        </p>
        <label>
          App Secret
          <input
            name="secret"
            type="password"
            autoComplete="new-password"
            maxLength={16384}
            required={!binding}
          />
        </label>
        <p className="field-note">
          {t('留空沿用本应用密钥；更换 App ID 时必须填写新密钥。保存不会自动连接。')}
        </p>
        <label className="channel-enable">
          <input name="enabled" type="checkbox" defaultChecked={binding?.enabled ?? false} />
          {t('允许此绑定连接飞书')}
        </label>
        <button className="primary" disabled={actions.busy}>
          {t('保存飞书绑定')}
        </button>
      </form>
    </section>
  )
}

const FeishuIdentityFields = ({ binding }: { binding: FeishuBinding | null }) => {
  const { t } = useI18n()
  const fields = binding ?? { appId: '', tenantKey: '', ownerOpenId: '', chatId: '' }
  return (
    <>
      <TextField label="App ID" name="appId" value={fields.appId} />
      <TextField label={t('租户 Tenant Key')} name="tenantKey" value={fields.tenantKey} />
      <TextField label={t('所有者 Open ID')} name="ownerOpenId" value={fields.ownerOpenId} />
      <TextField label={t('通知会话 Chat ID')} name="chatId" value={fields.chatId} />
    </>
  )
}

const submitBinding = (
  event: React.FormEvent<HTMLFormElement>,
  binding: FeishuBinding | null,
  actions: WorkspaceActions,
) => {
  event.preventDefault()
  const element = event.currentTarget
  const form = new FormData(element)
  const secret = String(form.get('secret') ?? '')
  void actions
    .saveFeishu({
      expectedVersion: binding?.version ?? 0,
      appId: formText(form, 'appId'),
      tenantKey: formText(form, 'tenantKey'),
      ownerOpenId: formText(form, 'ownerOpenId'),
      chatId: formText(form, 'chatId'),
      enabled: form.has('enabled'),
      credentialRef: binding?.credentialRef ?? '',
      ...(secret ? { secret } : {}),
    })
    .then((result) => {
      if (!result) return
      const field = element.elements.namedItem('secret')
      if (field instanceof HTMLInputElement) field.value = ''
    })
}
