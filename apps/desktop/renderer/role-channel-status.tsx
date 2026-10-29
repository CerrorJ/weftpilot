import type { RoleVersion, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { useRoleFeishu } from './use-role-feishu'
import { useI18n } from './preferences'

type Channel = ReturnType<typeof useRoleFeishu>
const labels = {
  disconnected: '未连接',
  connecting: '正在连接',
  connected: '长连接已建立',
  reconnecting: '正在重连',
  failed: '连接失败',
} as const

export const RoleChannelStatus = ({
  role,
  state,
}: {
  role: RoleVersion
  state: WorkspaceSnapshot
}) => {
  const { t } = useI18n()
  const channel = useRoleFeishu(role)
  const stale = !!channel.status && channel.status.roleVersion !== role.version
  const historical = state.runs.some(
    (run) => run.roleSnapshot.id === role.id && run.roleSnapshot.feishuBinding?.enabled,
  )
  return (
    <section className="role-channel-status">
      <RoleChannelReadout role={role} channel={channel} stale={stale} />
      {(role.feishuBinding?.enabled || historical) && (
        <button
          type="button"
          disabled={channel.busy || stale}
          onClick={() => void channel.perform('connect')}
        >
          {t('连接角色渠道')}
        </button>
      )}
      <button
        type="button"
        disabled={channel.busy || !channel.status?.connections.length}
        onClick={() => void channel.perform('disconnect')}
      >
        {t('断开角色渠道')}
      </button>
      <p className="field-note">
        {t('历史执行保留原绑定；断开不删除任务，也不撤销在途网络请求或平台应用。')}
      </p>
    </section>
  )
}

const RoleChannelReadout = ({
  role,
  channel,
  stale,
}: {
  role: RoleVersion
  channel: Channel
  stale: boolean
}) => {
  const { t } = useI18n()
  return (
    <>
      <h4>{t('角色飞书渠道')}</h4>
      <p>
        {role.feishuBinding ? (
          <code>{role.feishuBinding.appId}</code>
        ) : (
          t(role.feishuBinding === null ? '暂不接入飞书' : '保留旧工作空间渠道')
        )}
      </p>
      <p className="field-note">
        {t('保存配置不代表平台已授权；能力、权限、事件、发布和真实回调需分别核验。')}
      </p>
      {channel.error && (
        <p role="alert" className="error">
          {t(channel.error)}
        </p>
      )}
      {stale && <p role="alert">{t('配置已有新版本，请关闭后选择当前版本再连接。')}</p>}
      <RoleChannelConnections status={channel.status} />
    </>
  )
}

const RoleChannelConnections = ({ status }: { status: Channel['status'] }) => {
  const { t } = useI18n()
  if (!status) return <p aria-live="polite">{t('正在查询')}</p>
  if (!status.connections.length) return <p aria-live="polite">{t('未连接')}</p>
  return (
    <div aria-live="polite">
      {status.connections.map((connection) => (
        <div className="role-channel-connection" key={connection.appId}>
          <code>{connection.appId}</code>
          <strong>{t(labels[connection.state])}</strong>
          <span>
            {t('待同步执行')}：{connection.pendingNotifications}
          </span>
          {connection.errorCode && <p className="error">{t(connection.errorCode)}</p>}
        </div>
      ))}
    </div>
  )
}
