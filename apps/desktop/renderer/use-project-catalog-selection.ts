import { useEffect, useRef, useState } from 'react'
import type { Project } from '@weftpilot/agent-team-kernel/protocol'

/** 仅确切本窗口创建回执聚焦新卡片；轮询及其他渠道新增项目不改变选择。 */
export const useProjectCatalogSelection = (projects: Project[]) => {
  const root = useRef<HTMLDivElement>(null)
  const [selected, select] = useState('')
  const [created, setCreated] = useState('')
  useEffect(() => {
    if (!created || !projects.some((item) => item.id === created)) return
    const card = root.current?.querySelector<HTMLButtonElement>(
      `[data-project-id="${created}"] button`,
    )
    if (!card) return
    card.scrollIntoView({ block: 'nearest' })
    card.focus()
    setCreated('')
  }, [created, projects])
  const back = () => {
    select('')
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLButtonElement>(`[data-project-id="${selected}"] button`)
        ?.focus(),
    )
  }
  return { root, selected, select, created: setCreated, back }
}
