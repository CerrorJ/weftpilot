import { useEffect, useRef, useState } from 'react'
import type { TeamVersion } from '@weftpilot/agent-team-kernel/protocol'

/** 只在确切创建回执对应卡片出现时归焦；普通后台更新不抢当前键盘位置。 */
export const useTeamCatalogFocus = (teams: TeamVersion[]) => {
  const root = useRef<HTMLDivElement>(null)
  const [created, setCreated] = useState('')
  useEffect(() => {
    if (!created) return
    const target = root.current?.querySelector<HTMLButtonElement>(
      `[data-team-id="${created}"] .team-card-actions > button`,
    )
    if (!target) return
    target.focus()
    setCreated('')
  }, [created, teams])
  return { root, created: setCreated }
}
