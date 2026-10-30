import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  notificationStatusSchema,
  type NotificationPreferences,
  type NotificationStatus,
} from '../../../packages/system-bridge/notification-contract'

interface NotificationContext {
  generation: RefObject<number>
  epoch: RefObject<number>
  operating: RefObject<boolean>
  setStatus: (status: NotificationStatus) => void
  setDraft: (preferences: NotificationPreferences) => void
  setBusy: (busy: boolean) => void
  setError: (error: string) => void
}

const bridge = () => {
  if (!window.weftpilot?.notifications) throw new Error('NOTIFICATION_UNAVAILABLE')
  return window.weftpilot.notifications
}
const message = (reason: unknown) => {
  const value = reason instanceof Error ? reason.message : ''
  const code = value.match(
    /\bNOTIFICATION_(?:PREFERENCES_UNAVAILABLE|PREFERENCES_CONFLICT|UNSUPPORTED|TEST_RATE_LIMITED|UNAVAILABLE)\b/,
  )
  return code?.[0] ?? 'NOTIFICATION_UNAVAILABLE'
}

export const useNotificationSettings = () => {
  const [status, setStatus] = useState<NotificationStatus>()
  const [draft, setDraft] = useState<NotificationPreferences>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const generation = useRef(0)
  const epoch = useRef(0)
  const operating = useRef(false)
  const context = {
    generation,
    epoch,
    operating,
    setStatus,
    setBusy,
    setError,
    setDraft: (value: NotificationPreferences) => setDraft((current) => current ?? value),
  }
  useNotificationPolling(context)
  return {
    status,
    draft,
    error,
    busy,
    setDraft,
    perform: (operation: 'save' | 'reload' | 'test') =>
      performNotification({ ...context, setDraft }, operation, draft),
  }
}

/** 轮询只更新只读状态，不能覆盖正在填写的偏好；操作和卸载后丢弃迟到查询。 */
const useNotificationPolling = (context: NotificationContext) => {
  const { generation, epoch, operating, setStatus, setBusy, setError } = context
  const initialize = useRef(context.setDraft)
  useEffect(() => {
    const mounted = ++generation.current
    let querying = false
    const refresh = async () => {
      if (querying || operating.current) return
      querying = true
      const operation = epoch.current
      try {
        const result = notificationStatusSchema.parse(await bridge().status())
        if (generation.current !== mounted || epoch.current !== operation) return
        setStatus(result)
        initialize.current(result.preferences)
      } catch (reason) {
        if (generation.current === mounted && epoch.current === operation) setError(message(reason))
      } finally {
        querying = false
      }
    }
    setBusy(false)
    void refresh()
    const timer = setInterval(() => void refresh(), 2000)
    return () => {
      generation.current++
      clearInterval(timer)
    }
  }, [generation, epoch, operating, setStatus, setBusy, setError])
}

const performNotification = async (
  context: NotificationContext,
  operation: 'save' | 'reload' | 'test',
  draft: NotificationPreferences | undefined,
) => {
  if (context.operating.current) return
  context.operating.current = true
  context.epoch.current++
  context.setBusy(true)
  context.setError('')
  const mounted = context.generation.current
  try {
    let result: unknown
    if (operation === 'save') {
      if (!draft) throw new Error('NOTIFICATION_UNAVAILABLE')
      const { version, ...options } = draft
      result = await bridge().save({ ...options, expectedVersion: version })
    } else result = await (operation === 'test' ? bridge().test() : bridge().status())
    const status = notificationStatusSchema.parse(result)
    if (context.generation.current !== mounted) return
    context.setStatus(status)
    if (operation !== 'test') context.setDraft(status.preferences)
  } catch (reason) {
    if (context.generation.current === mounted) context.setError(message(reason))
  } finally {
    context.operating.current = false
    if (context.generation.current === mounted) context.setBusy(false)
  }
}
