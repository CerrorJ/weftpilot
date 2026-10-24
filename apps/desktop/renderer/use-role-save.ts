import { useState, type RefObject } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { clearRoleDraft } from './role-draft'
import { saveRoleConfiguration } from './role-submission'

/** 保存只接受内核回执，随后查找本次确切版本，不误用另一渠道刚更新的配置。 */
export const useRoleSave = (input: {
  base: RoleVersion | undefined
  baseMissing: boolean
  draftKey: RefObject<string>
  actions: WorkspaceActions
}) => {
  const [saved, setSaved] = useState<{ id: string; version: number }>()
  const savedRole = input.actions.state?.roles.find(
    (item) => item.id === saved?.id && item.version === saved.version,
  )
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saved || input.actions.busy || input.baseMissing) return
    const result = await saveRoleConfiguration({
      form: event.currentTarget,
      role: input.base,
      actions: input.actions,
    })
    if (!result) return
    clearRoleDraft(input.draftKey.current)
    setSaved({ id: result.id, version: (input.base?.version ?? 0) + 1 })
  }
  return { saved, savedRole, save, edited: () => setSaved(undefined) }
}
