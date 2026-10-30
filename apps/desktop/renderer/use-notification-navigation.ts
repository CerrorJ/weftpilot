import { useEffect, useRef } from 'react'

/** 通知点击仅打开确切任务，不携带决定、shell或任意URL。 */
export const useNotificationNavigation = (openTask: (id: string) => void): void => {
  const current = useRef(openTask)
  current.current = openTask
  useEffect(() => window.weftpilot?.onOpenTask((id) => current.current(id)), [])
}
