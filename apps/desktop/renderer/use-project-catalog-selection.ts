import { useLayoutEffect, useRef, useState } from 'react'
import type { Project } from '@weftpilot/agent-team-kernel/protocol'

/** 仅显式创建/返回聚焦确切卡片；轮询及其他渠道新增项目不改变选择。 */
export const useProjectCatalogSelection = (projects: Project[], initialProjectId = '') => {
  const root = useRef<HTMLDivElement>(null)
  const [selected, select] = useState(initialProjectId)
  const [focusTarget, setFocusTarget] = useState('')
  useLayoutEffect(() => {
    if (selected || !focusTarget || !projects.some((item) => item.id === focusTarget)) return
    const card = root.current?.querySelector<HTMLButtonElement>(
      `[data-project-id="${focusTarget}"] button`,
    )
    if (!card) return
    card.scrollIntoView({ block: 'nearest' })
    card.focus()
    setFocusTarget('')
  }, [focusTarget, projects, selected])
  const back = () => {
    // 列表提交挂载后、绘制前还焦，不把一次RAF当作React已经完成提交。
    setFocusTarget(selected)
    select('')
  }
  return { root, selected, select, created: setFocusTarget, back }
}
