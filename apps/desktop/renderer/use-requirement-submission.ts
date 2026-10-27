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

/** 仅严格空串表示清除；枚举不可trim或转字符串，异常值留给命名主进程/内核拒绝。 */
const readMetadata = (form: FormData): Pick<RequirementVersion, 'priority' | 'stage'> => {
  const priority = form.get('priority')
  const stage = form.get('stage')
  return {
    priority: (priority === '' ? null : priority) as NonNullable<
      RequirementVersion['priority']
    > | null,
    stage: (stage === '' ? null : stage) as NonNullable<RequirementVersion['stage']> | null,
  }
}
