import type {
  Acceptance,
  Delivery,
  Run,
  WorkspaceSnapshot,
} from '@weftpilot/agent-team-kernel/protocol'

/** 仅投影权威快照来呈现历史；客户端不据此改变执行或验收状态。 */
export const taskRuns = (state: Pick<WorkspaceSnapshot, 'runs'>, taskId: string): Run[] =>
  state.runs.filter((run) => run.taskId === taskId).sort((a, b) => a.attempt - b.attempt)

export const runDelivery = (
  state: Pick<WorkspaceSnapshot, 'deliveries'>,
  runId: string,
): Delivery | undefined =>
  state.deliveries
    .filter((item) => item.runId === runId)
    .sort((a, b) => a.version - b.version)
    .at(-1)

export const deliveryReviewView = (
  state: Pick<WorkspaceSnapshot, 'tasks' | 'runs' | 'deliveries' | 'acceptances'>,
  run: Run,
) => {
  const task = state.tasks.find((item) => item.id === run.taskId)
  const delivery = runDelivery(state, run.id)
  const acceptance = delivery && state.acceptances.find((item) => item.deliveryId === delivery.id)
  const current = taskRuns(state, run.taskId).at(-1)?.id === run.id
  return {
    delivery,
    acceptance,
    current,
    summaryKind: reviewSummaryKind({ run, acceptance, current }),
    offerDecision:
      current &&
      !acceptance &&
      Boolean(delivery) &&
      task?.status === 'in_review' &&
      run.status === 'succeeded' &&
      run.processState === 'confirmed_ended',
  }
}

/** 只选择摘要文案，不引入独立业务状态；已验收不能继续提示“待人工验收”。 */
const reviewSummaryKind = (input: {
  run: Run
  acceptance: Acceptance | undefined
  current: boolean
}) => {
  if (input.acceptance) return input.acceptance.decision
  if (input.run.status !== 'succeeded') return 'partial' as const
  return input.current ? ('pending' as const) : ('historical' as const)
}

/** 多行验收文本按原文呈现；合并超量行，避免无界DOM，绝不丢弃剩余标准。 */
export const reviewCriteriaLines = (text: string): string[] => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length <= 50) return lines
  return [...lines.slice(0, 49), lines.slice(49).join('\n')]
}
