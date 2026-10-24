import { useEffect, useRef } from 'react'

/** 仅显式关闭恢复来源焦点；筛选或导航卸载时，不能抢走用户新选择的控件。 */
export const useDrawerFocus = (taskId: string, close: () => void) => {
  const panel = useRef<HTMLElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const active = document.activeElement
    if (
      active instanceof HTMLElement &&
      active !== document.body &&
      !panel.current?.contains(active)
    ) {
      trigger.current = active
    }
    if (!trigger.current?.isConnected) {
      trigger.current = document.querySelector<HTMLButtonElement>(`[data-task-id="${taskId}"]`)
    }
    button.current?.focus()
  }, [taskId])
  return {
    panel,
    button,
    dismiss: () => {
      close()
      if (trigger.current?.isConnected) trigger.current.focus()
    },
  }
}
