import type { Task } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

/** 只统计明确的子任务验收，不把事件数、CLI输出或执行成功当作完成百分比。 */
export const TaskProgress = ({ tasks }: { tasks: Task[] }) => {
  const { t } = useI18n()
  if (!tasks.length) return <span className="unknown-steps">—</span>
  const completed = tasks.filter((task) => task.status === 'done').length
  return (
    <div className="known-steps">
      <progress aria-label={t('子任务验收')} max={tasks.length} value={completed} />
      <span>
        {completed}/{tasks.length}
      </span>
    </div>
  )
}
