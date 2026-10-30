import type { Run } from '@weftpilot/agent-team-kernel/protocol'

/** 客户端只读选择最新attempt，不依赖快照数组顺序，也不创建领域状态。 */
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
