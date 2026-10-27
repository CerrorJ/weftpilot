import { useRef } from 'react'
import type { RequirementVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { formText } from './form-fields'

export const useRequirementSubmission = ({
  actions,
  base,
  saved,
}: {
  actions: WorkspaceActions
  base: RequirementVersion | undefined
  saved: ((id: string) => void) | undefined
}) => {
  const pending = useRef(false)
  return async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending.current) return
    const element = event.currentTarget
    const form = new FormData(element)
    pending.current = true
    try {
      const result = await actions.execute({
        type: 'requirement.save',
        ...(base ? { id: base.id } : {}),
        expectedVersion: base?.version ?? 0,
        projectId: base?.projectId ?? formText(form, 'project'),
        title: formText(form, 'title'),
        body: formText(form, 'body'),
        acceptanceCriteria: formText(form, 'criteria'),
        ...readMetadata(form),
      })
      if (result && element.isConnected) saved?.(result.id)
    } finally {
      pending.current = false
    }
  }
}

/** 表单枚举仍由命名主进程/内核严格校验；非法值原样提交拒绝，不静默改成清除。 */
const readMetadata = (form: FormData): Pick<RequirementVersion, 'priority' | 'stage'> => ({
  priority: (formText(form, 'priority') || null) as NonNullable<
    RequirementVersion['priority']
  > | null,
  stage: (formText(form, 'stage') || null) as NonNullable<RequirementVersion['stage']> | null,
})
