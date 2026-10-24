import type { Task, Run, HumanRequest } from '@weftpilot/agent-team-kernel/protocol'

export type TaskView = 'all' | 'running' | 'pending' | 'done'
type Activity = Pick<Run, 'taskId' | 'attempt' | 'status' | 'processState'>
const active = new Set<Run['status']>(['queued', 'preparing', 'running', 'stopping'])

/** 只将权威快照投影为筛选分组；等待决定或进程不确定不冒充正在执行。 */
export const taskGroups = (state: {
  tasks: Task[]
  runs: Activity[]
  humanRequests: Pick<HumanRequest, 'taskId' | 'status'>[]
}): Record<TaskView, Task[]> => {
  const groups: Record<TaskView, Task[]> = { all: [], running: [], pending: [], done: [] }
  const runs = latestRuns(state.runs)
  const pending = new Set(
    state.humanRequests.filter((item) => item.status === 'pending').map((item) => item.taskId),
  )
  const tasks = state.tasks.filter((item) => item.purpose !== 'role_trial')
  const views = new Map(tasks.map((task) => [task.id, taskView(task, runs.get(task.id), pending)]))
  for (const task of tasks) {
    groups.all.push(task)
    const view =
      task.purpose === 'team_parent' && task.status === 'in_progress'
        ? teamView(task.id, tasks, views)
        : views.get(task.id)!
    if (view !== 'all') groups[view].push(task)
  }
  return groups
}

/** 父任务没有独立Run；人工处理优先于活动子任务，全停止/失败时不谎报正在执行。 */
const teamView = (id: string, tasks: Task[], views: Map<string, TaskView>): TaskView => {
  const children = tasks
    .filter((task) => task.parentTaskId === id)
    .map((task) => views.get(task.id))
  if (children.includes('pending')) return 'pending'
  if (children.includes('running')) return 'running'
  return 'all'
}

const taskView = (task: Task, run: Activity | undefined, pending: Set<string>): TaskView => {
  if (task.status === 'done') return 'done'
  if (task.status === 'in_review' || pending.has(task.id) || run?.processState === 'uncertain')
    return 'pending'
  if (task.status === 'in_progress' && run && active.has(run.status)) return 'running'
  return 'all'
}

const latestRuns = (runs: Activity[]): Map<string, Activity> => {
  const latest = new Map<string, Activity>()
  for (const run of runs) {
    const previous = latest.get(run.taskId)
    if (!previous || previous.attempt < run.attempt) latest.set(run.taskId, run)
  }
  return latest
}
