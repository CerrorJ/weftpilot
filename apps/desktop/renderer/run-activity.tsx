import { useEffect, useState } from 'react'
import { activitySchema, type Activity } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { workflow } from './desktop-api'

const useRunActivity = (runId: string, cursor: number) => {
  const [result, setResult] = useState<{ runId: string; items: Activity[] }>()
  const [error, setError] = useState('')
  useEffect(() => {
    let current = true
    void workflow()
      .activity(runId)
      .then((value) => {
        const items = activitySchema.array().parse(value)
        if (current) {
          setResult({ runId, items })
          setError('')
        }
      })
      .catch(() => {
        if (current) setError('日志读取失败，请刷新重试')
      })
    return () => {
      current = false
    }
  }, [runId, cursor])
  return { items: result?.runId === runId ? result.items : [], error }
}

export const RunActivity = ({ runId, cursor }: { runId: string; cursor: number }) => {
  const { t, language } = useI18n()
  const { items, error } = useRunActivity(runId, cursor)
  return (
    <section className="activity">
      <h3>{t('执行日志')}</h3>
      <p>{t('显示本次 Run 最近 100 条工具与事件类型；等待模型时不显示虚构进度。')}</p>
      {error && <p role="alert">{t(error)}</p>}
      <ol>
        {items.map((item) => (
          <li key={item.sequence}>
            <time>{new Date(item.occurredAt).toLocaleTimeString(language)}</time> {item.label}
          </li>
        ))}
      </ol>
    </section>
  )
}
