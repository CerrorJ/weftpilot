import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { useFeishu } from './use-feishu'
import { FeishuConnectionState } from './feishu-connection-state'
import { FeishuSetup } from './feishu-setup'
import './feishu.css'

export const FeishuPage = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const channel = useFeishu()
  const binding = actions.state?.feishuBinding ?? null
  return (
    <div className="feishu-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">FEISHU</p>
          <h1>{t('飞书连接')}</h1>
          <p>{t('桌面与飞书处理同一请求，决定只提交一次。')}</p>
        </div>
      </header>
      {(actions.error || channel.error) && (
        <p role="alert" className="error">
          {t(actions.error || channel.error)}
        </p>
      )}
      <FeishuConnectionState
        channel={channel}
        enabled={binding?.enabled ?? false}
        version={binding?.version ?? null}
      />
      <ConsoleGuide open={() => void channel.perform('console')} />
      <FeishuSetup binding={binding} actions={actions} />
    </div>
  )
}

const ConsoleGuide = ({ open }: { open: () => void }) => {
  const { t } = useI18n()
  return (
    <section className="setup-section">
      <h2>{t('控制台辅助创建')}</h2>
      <ol className="connection-steps">
        <li>{t('在开发者后台创建企业自建应用并启用机器人。')}</li>
        <li>{t('为机器人开通发消息及更新消息卡片所需权限，配置可用范围并发布测试版本。')}</li>
        <li>{t('事件与回调选择长连接，订阅新版卡片回调 card.action.trigger。')}</li>
        <li>
          {t(
            '将机器人加入通知会话，核对 App ID、Tenant Key、所有者 Open ID 和 Chat ID 后填写绑定。',
          )}
        </li>
        <li>{t('连接后在独立测试任务发起人工请求，分别验证飞书决定、桌面状态与旧卡片拒绝。')}</li>
      </ol>
      <button onClick={open}>{t('打开飞书开发者后台')}</button>
      <p className="field-note">
        {t('自动创建应用的官方接口尚未核验。当前提供控制台辅助流程，不代表已创建或验证应用。')}
      </p>
    </section>
  )
}
