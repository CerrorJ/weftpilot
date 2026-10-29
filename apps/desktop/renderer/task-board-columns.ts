import type { Run, Task } from '@weftpilot/agent-team-kernel/protocol'
import { latestTaskRun } from './task-display'

export const boardColumnNames = {
  ready: '未开始',
  working: '执行与待处理',
  review: '待验收',
  ended: '已结束',
} as const
export type BoardColumn = keyof typeof boardColumnNames
type BoardState = {
  tasks: Task[]
  runs: Pick<Run, 'taskId' | 'attempt' | 'status' | 'processState'>[]
}
const runColumns: Record<Run['status'], BoardColumn> = {
  queued: 'ready',
  preparing: 'working',
  running: 'working',
  stopping: 'working',
  waiting_input: 'working',
  waiting_approval: 'working',
  stopped: 'ended',
  succeeded: 'ended',
  failed: 'ended',
  cancelled: 'ended',
  interrupted: 'ended',
}

const taskColumn = (task: Task, state: BoardState): BoardColumn => {
  if (task.status === 'done') return 'ended'
  if (task.status === 'in_review') return 'review'
  const run = latestTaskRun(state.runs, task.id)
  if (run?.processState === 'uncertain') return 'working'
  if (run) return runColumns[run.status]
  return task.status === 'in_progress' ? 'working' : 'ready'
}

/** 看板是同一快照的只读分栏；已结束包含失败/停止，绝不生成业务状态或自动验收。 */
export const taskBoardColumns = (state: BoardState, tasks: Task[]): Record<BoardColumn, Task[]> => {
  const columns: Record<BoardColumn, Task[]> = { ready: [], working: [], review: [], ended: [] }
  for (const task of [...tasks].reverse()) {
    let column = taskColumn(task, state)
    if (task.purpose === 'team_parent' && task.status === 'in_progress')
      column = parentColumn(task.id, state)
    columns[column].push(task)
  }
  return columns
}

const parentColumn = (id: string, state: BoardState): BoardColumn => {
  const children = state.tasks
    .filter((task) => task.parentTaskId === id)
    .map((task) => taskColumn(task, state))
  if (children.some((column) => column === 'working' || column === 'review')) return 'working'
  if (children.length && children.every((column) => column === 'ended')) return 'ended'
  return 'ready'
}
