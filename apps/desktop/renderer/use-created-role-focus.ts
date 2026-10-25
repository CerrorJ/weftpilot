import { useEffect, useState } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'

/** 只响应本窗口明确复制的确切回执；其他渠道新增角色不能抢焦点。 */
export const useCreatedRoleFocus = (roles: RoleVersion[]) => {
  const [pendingId, select] = useState<string>()
  useEffect(() => {
    if (!pendingId || !roles.some((role) => role.id === pendingId)) return
    const card = document.querySelector<HTMLElement>(
      `[data-role-id="${pendingId}"] .role-card-main`,
    )
    if (!card) return
    card.scrollIntoView({ block: 'nearest' })
    card.focus()
    select(undefined)
  }, [pendingId, roles])
  return select
}
