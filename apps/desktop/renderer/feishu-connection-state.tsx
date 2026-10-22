import { useI18n } from './preferences'
import type { useFeishu } from './use-feishu'

const statusLabels = {
  disconnected: '未连接',
  connecting: '正在连接',
  connected: '长连接已建立',
  reconnecting: '正在重连',
  failed: '连接失败',
} as const

export const FeishuConnectionState = ({
  channel,
  enabled,
  version,
}: {
  channel: ReturnType<typeof useFeishu>
  enabled: boolean
  version: number | null
}) => {
  const { t } = useI18n()
  const status = channel.status
  if (!status) return <p aria-live="polite">{t('正在查询')}</p>
  return (
    <section className="connection-state" aria-live="polite">
      <h2>{t('连接状态')}</h2>
      <strong>{t(statusLabels[status.state])}</strong>
      <p>
        {t('待同步任务')}：{status.pendingNotifications} · {t('绑定版本')}：
        {version ? `v${version}` : '—'}
      </p>
      {status.errorCode && (
        <p role="alert" className="error">
          {t(status.errorCode)}
        </p>
      )}
      <p className="field-note">
        {t('长连接建立不代表卡片权限和所有者身份已验证；请用专用应用完成真实回调核验。')}
      </p>
      <div className="button-row">
        <button
          className="primary"
          disabled={!enabled || channel.busy}
          onClick={() => void channel.perform('connect')}
        >
          {t('连接专用应用')}
        </button>
        <button
          disabled={channel.busy || status.state === 'disconnected'}
          onClick={() => void channel.perform('disconnect')}
        >
          {t('断开连接')}
        </button>
      </div>
    </section>
  )
}
