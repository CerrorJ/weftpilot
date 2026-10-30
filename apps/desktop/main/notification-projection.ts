import type {
  Task,
  Run,
  HumanRequest,
  Delivery,
  Acceptance,
} from '@weftpilot/agent-team-kernel/protocol'
import { latestTaskRun } from '../../../packages/kernel-client/task-projection'

export interface NotificationCandidate {
  key: string
  taskId: string
  kind: 'human' | 'review' | 'failure'
}
type NotificationTask = Pick<Task, 'id' | 'purpose' | 'status'>
type NotificationRun = Pick<Run, 'id' | 'taskId' | 'attempt' | 'status'>
export interface NotificationSnapshot {
  tasks: NotificationTask[]
  runs: NotificationRun[]
  humanRequests: Pick<HumanRequest, 'id' | 'taskId' | 'runId' | 'status'>[]
  deliveries: Pick<Delivery, 'id' | 'taskId' | 'runId'>[]
  acceptances: Pick<Acceptance, 'deliveryId'>[]
}

/** 只从已校验的内核快照读取当前待办；旧Run/旧审批不能变成新执行的通知。 */
export const notificationCandidates = (state: NotificationSnapshot): NotificationCandidate[] => {
  const candidates: NotificationCandidate[] = []
  for (const task of state.tasks) {
    if (task.purpose === 'role_trial' || task.status === 'done') continue
    const run = latestTaskRun(state.runs, task.id)
    if (!run) continue
    candidates.push(...humanCandidates(state, task, run), ...reviewCandidates(state, task, run))
    if (task.status !== 'in_review' && run.status === 'failed') {
      candidates.push({ key: `failure:${run.id}`, taskId: task.id, kind: 'failure' })
    }
  }
  return candidates
}

const humanCandidates = (
  state: NotificationSnapshot,
  task: NotificationTask,
  run: NotificationRun,
): NotificationCandidate[] =>
  state.humanRequests
    .filter(
      (request) =>
        request.taskId === task.id && request.runId === run.id && request.status === 'pending',
    )
    .map((request) => ({ key: `human:${request.id}`, taskId: task.id, kind: 'human' }))

const reviewCandidates = (
  state: NotificationSnapshot,
  task: NotificationTask,
  run: NotificationRun,
): NotificationCandidate[] => {
  if (task.status !== 'in_review') return []
  return state.deliveries
    .filter(
      (delivery) =>
        delivery.taskId === task.id &&
        delivery.runId === run.id &&
        !state.acceptances.some((entry) => entry.deliveryId === delivery.id),
    )
    .map((delivery) => ({ key: `review:${delivery.id}`, taskId: task.id, kind: 'review' }))
}
