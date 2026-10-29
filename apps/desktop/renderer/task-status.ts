import type { Run, Task } from '@weftpilot/agent-team-kernel/protocol'

export const taskLabels: Record<Task['status'], string> = {
  ready: '待执行',
  in_progress: '执行中',
  in_review: '待验收',
  done: '已验收',
}

/** 进程状态未知优先呈现；不能用任务阶段掩盖未确认结束的执行。 */
export const runLabel = (run: Pick<Run, 'status' | 'processState'>): string => {
  if (run.processState === 'uncertain') return '状态待确认'
  const labels: Record<Run['status'], string> = {
    queued: '排队中',
    preparing: '准备目录',
    running: '执行中',
    waiting_input: '等待澄清',
    waiting_approval: '等待确认',
    stopping: '停止中',
    stopped: '已停止',
    succeeded: '执行成功',
    failed: '执行失败',
    cancelled: '已取消',
    interrupted: '已中断',
  }
  return labels[run.status]
}
