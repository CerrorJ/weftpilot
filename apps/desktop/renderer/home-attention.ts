import type { Task, Run, HumanRequest } from '@weftpilot/agent-team-kernel/protocol'
import { taskGroups } from './task-views'
import { latestTaskRun } from './task-display'

/** 待决定/验收/进程未知复用任务筛选；仅最新失败补充提醒，旧失败不能污染新Run。 */
export const homeAttentionTasks = (state: {
  tasks: Task[]
  runs: Pick<Run, 'taskId' | 'attempt' | 'status' | 'processState'>[]
  humanRequests: Pick<HumanRequest, 'taskId' | 'status'>[]
}): Task[] => {
  const groups = taskGroups(state)
  const pending = new Set(groups.pending.map((task) => task.id))
  return groups.all.filter((task) => {
    if (task.status === 'done') return false
    if (pending.has(task.id)) return true
    const run = latestTaskRun(state.runs, task.id)
    return run?.status === 'failed' || run?.status === 'interrupted'
  })
}
