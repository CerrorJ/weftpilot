import type { Run, Task } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { taskStatusText } from './task-display'

export const TaskStatusBadge = ({ task, run }: { task: Task; run: Run | undefined }) => {
  const { t } = useI18n()
  const attention =
    !['done', 'in_review'].includes(task.status) &&
    (run?.processState === 'uncertain' || run?.status === 'failed' || run?.status === 'interrupted')
  return (
    <span className={`task-status ${task.status}`} data-attention={attention}>
      {t(taskStatusText(task, run))}
    </span>
  )
}
