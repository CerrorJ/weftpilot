import { useRef, useState, type RefObject } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { clearRoleDraft } from './role-draft'
import { saveRoleConfiguration } from './role-submission'

/** 保存只接受内核回执，随后查找本次确切版本，不误用另一渠道刚更新的配置。 */
export const useRoleSave = (input: {
  base: RoleVersion | undefined
  baseMissing: boolean
  draftKey: RefObject<string>
  revision: number
  actions: WorkspaceActions
}) => {
  const [saved, setSaved] = useState<{ id: string; version: number }>()
  const pending = useRef(false)
  const revision = useRef(input.revision)
  revision.current = input.revision
  const savedRole = input.actions.state?.roles.find(
    (item) => item.id === saved?.id && item.version === saved.version,
  )
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending.current || saved || input.actions.busy || input.baseMissing) return
    pending.current = true
    const element = event.currentTarget
    const basis = {
      revision: input.revision,
      key: input.draftKey.current,
      version: (input.base?.version ?? 0) + 1,
    }
    try {
      const result = await saveRoleConfiguration({
        form: element,
        role: input.base,
        actions: input.actions,
      })
      // 旧保存可已提交，但迟到回执不能消费明确重载后的新草稿。
      if (!result || !element.isConnected || revision.current !== basis.revision) return
      clearRoleDraft(basis.key)
      setSaved({ id: result.id, version: basis.version })
    } finally {
      pending.current = false
    }
  }
  return { saved, savedRole, save, edited: () => setSaved(undefined) }
}
