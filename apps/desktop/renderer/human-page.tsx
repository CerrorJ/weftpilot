import { useState } from 'react'
import { useI18n } from './preferences'
import type { WorkspaceActions } from './use-workspace'
import { HumanRequestCard } from './human-request-card'

export const HumanPage = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const [history, setHistory] = useState(false)
  const requests = (actions.state?.humanRequests ?? []).filter(
    (request) => history || request.status === 'pending',
  )
  return (
    <>
      <HumanPageHeader actions={actions} />
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      <label className="check-label">
        <input
          type="checkbox"
          checked={history}
          onChange={(event) => setHistory(event.target.checked)}
        />
        {t('包含已处理记录')}
      </label>
      {!actions.state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : !requests.length ? (
        <section className="empty-state">
          <h2>{t('当前没有待处理请求')}</h2>
          <p>{t('AI 需要你的决定时，请求会出现在这里。')}</p>
        </section>
      ) : (
        <div className="human-request-list">
          {[...requests].reverse().map((request) => (
            <HumanRequestCard
              key={`${request.id}:${request.version}`}
              request={request}
              actions={actions}
            />
          ))}
        </div>
      )}
    </>
  )
}

const HumanPageHeader = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  return (
    <header>
      <div>
        <h1>{t('待处理')}</h1>
        <p>{t('澄清、方案和单次操作在同一处处理；交付验收仍在任务中进行。')}</p>
      </div>
      <button
        disabled={actions.busy}
        onClick={() => {
          void actions.refresh()
        }}
      >
        {t('刷新状态')}
      </button>
    </header>
  )
}
