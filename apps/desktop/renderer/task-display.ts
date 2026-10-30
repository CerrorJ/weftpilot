import type { Run, Task } from '@weftpilot/agent-team-kernel/protocol'
import { taskLabels, runLabel } from './task-status'
export { latestTaskRun } from '../../../packages/kernel-client/task-projection'

export const taskStatusText = (
  task: Task,
  run: Pick<Run, 'status' | 'processState'> | undefined,
): string => {
  if (task.status === 'done' || task.status === 'in_review') return taskLabels[task.status]
  if (run) return runLabel(run)
  if (task.purpose === 'team_parent' && task.status === 'in_progress') return '等待子任务'
  return task.status === 'in_progress' ? '等待执行状态' : taskLabels[task.status]
}
