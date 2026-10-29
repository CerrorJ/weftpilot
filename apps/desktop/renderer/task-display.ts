import type { Run, Task } from '@weftpilot/agent-team-kernel/protocol'
import { taskLabels, runLabel } from './task-status'

/** 只读展示始终取最大attempt，不能因轮询数组顺序退回旧Run。 */
export const latestTaskRun = <T extends Pick<Run, 'taskId' | 'attempt'>>(
  runs: T[],
  taskId: string,
): T | undefined =>
  runs
    .filter((run) => run.taskId === taskId)
    .reduce<T | undefined>(
      (latest, run) => (!latest || run.attempt > latest.attempt ? run : latest),
      undefined,
    )

export const taskStatusText = (
  task: Task,
  run: Pick<Run, 'status' | 'processState'> | undefined,
): string => {
  if (task.status === 'done' || task.status === 'in_review') return taskLabels[task.status]
  if (run) return runLabel(run)
  if (task.purpose === 'team_parent' && task.status === 'in_progress') return '等待子任务'
  return task.status === 'in_progress' ? '等待执行状态' : taskLabels[task.status]
}
